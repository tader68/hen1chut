-- Products remain hidden and checkout closed until the merchant is configured.
create table public.commerce_products (
  sku text primary key,
  name text not null,
  description text not null,
  price_vnd integer not null check (price_vnd between 1000 and 10000000),
  item_keys text[] not null check (cardinality(item_keys) between 1 and 20),
  published boolean not null default false,
  active boolean not null default false
);
insert into public.commerce_products(sku,name,description,price_vnd,item_keys)
values ('bo-khac-he','Bự khác hệ','Rồng con và Giáp máy. Mua một lần, dùng cho cả 4 nhân vật, gắn với tài khoản Google.',29000,array['outfit:dragon','outfit:mecha']);

create table public.commerce_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sku text not null references public.commerce_products(sku),
  price_vnd integer not null check (price_vnd>0),
  item_keys text[] not null,
  bank_code text not null,
  bank_gateway text not null,
  account_number text not null,
  account_name text not null,
  support_email text not null,
  payment_code text not null unique default ('H1C'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
  status text not null default 'pending' check (status in ('pending','paid','expired','review','cancelled')),
  review_reason text,
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null default (clock_timestamp()+interval '15 minutes'),
  paid_at timestamptz,
  check (payment_code ~ '^H1C[A-F0-9]{12}$')
);
create index commerce_orders_owner_time on public.commerce_orders(user_id,created_at desc);
create unique index commerce_orders_one_pending on public.commerce_orders(user_id,sku) where status='pending';
create table hen1chut_private.payment_receipts (
  transaction_id text primary key,
  order_id uuid references public.commerce_orders(id) on delete set null,
  payment_code text not null,
  amount_vnd integer not null,
  bank_paid_at timestamptz not null,
  body_hash text not null check (body_hash ~ '^[a-f0-9]{64}$'),
  result text not null default 'received',
  received_at timestamptz not null default clock_timestamp()
);
create index payment_receipts_order on hen1chut_private.payment_receipts(order_id) where order_id is not null;
alter table public.commerce_products enable row level security;
alter table public.commerce_orders enable row level security;
alter table hen1chut_private.payment_receipts enable row level security;
revoke all on public.commerce_products,public.commerce_orders,hen1chut_private.payment_receipts from public,anon,authenticated;
grant select on public.commerce_products to anon,authenticated;
grant select on public.commerce_orders to authenticated;
create policy products_published on public.commerce_products for select to anon,authenticated using (published);
create policy orders_owner on public.commerce_orders for select to authenticated using (user_id=(select auth.uid()));

-- The Edge Function supplies the verified user ID and server-side bank settings.
grant usage on schema hen1chut_private to service_role;
create function hen1chut_private.create_checkout_order(p_user_id uuid,p_sku text,p_bank_code text,p_bank_gateway text,p_account_number text,p_account_name text,p_support_email text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare product public.commerce_products; result public.commerce_orders;
begin
  if p_user_id is null or not exists(select 1 from public.profiles where user_id=p_user_id) then raise exception 'profile_required'; end if;
  if p_bank_code is null or p_bank_code !~ '^[A-Za-z0-9]{2,32}$' or p_bank_gateway is null or char_length(p_bank_gateway) not between 2 and 60 or p_account_number is null or p_account_number !~ '^[0-9]{6,30}$' or p_account_name is null or char_length(p_account_name) not between 2 and 100 or p_support_email is null or p_support_email !~ '^[^ @]+@[^ @]+\.[^ @]+$' then raise exception 'merchant_unavailable'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
  select * into product from public.commerce_products where sku=p_sku and published and active;
  if not found then raise exception 'checkout_unavailable'; end if;
  if not exists(select 1 from unnest(product.item_keys) k where not exists(select 1 from public.entitlements e where e.user_id=p_user_id and e.item_key=k)) then raise exception 'already_owned'; end if;
  update public.commerce_orders set status='expired' where user_id=p_user_id and status='pending' and expires_at<=clock_timestamp();
  select * into result from public.commerce_orders where user_id=p_user_id and sku=p_sku and status in ('pending','review') order by created_at desc limit 1;
  if found then return to_jsonb(result); end if;
  if (select count(*) from public.commerce_orders where user_id=p_user_id and created_at>clock_timestamp()-interval '1 hour')>=5 then raise exception 'order_rate_limit'; end if;
  insert into public.commerce_orders(user_id,sku,price_vnd,item_keys,bank_code,bank_gateway,account_number,account_name,support_email)
    values(p_user_id,product.sku,product.price_vnd,product.item_keys,p_bank_code,p_bank_gateway,p_account_number,p_account_name,p_support_email) returning * into result;
  return to_jsonb(result);
end $$;
create function public.create_checkout_order(p_user_id uuid,p_sku text,p_bank_code text,p_bank_gateway text,p_account_number text,p_account_name text,p_support_email text) returns jsonb
language sql security invoker set search_path='' as $$ select hen1chut_private.create_checkout_order(p_user_id,p_sku,p_bank_code,p_bank_gateway,p_account_number,p_account_name,p_support_email); $$;

-- Receipt, paid state and ownership commit atomically. A delayed webhook can settle
-- a payment made before expiry, even if the order has since been marked expired.
create function hen1chut_private.settle_checkout_payment(p_transaction_id text,p_payment_code text,p_amount_vnd integer,p_bank_paid_at timestamptz,p_body_hash text,p_bank_gateway text,p_account_number text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result public.commerce_orders; receipt hen1chut_private.payment_receipts; outcome text; inserted text;
begin
  if p_transaction_id is null or p_transaction_id !~ '^[0-9]{1,24}$' or p_payment_code is null or p_payment_code !~ '^H1C[A-F0-9]{12}$' or p_amount_vnd is null or p_amount_vnd<=0 or p_bank_paid_at is null or p_bank_paid_at>clock_timestamp()+interval '5 minutes' or p_body_hash is null or p_body_hash !~ '^[a-f0-9]{64}$' or p_bank_gateway is null or p_account_number is null then raise exception 'invalid_payment'; end if;
  insert into hen1chut_private.payment_receipts(transaction_id,payment_code,amount_vnd,bank_paid_at,body_hash)
    values(p_transaction_id,p_payment_code,p_amount_vnd,p_bank_paid_at,p_body_hash) on conflict do nothing returning transaction_id into inserted;
  if inserted is null then
    select * into receipt from hen1chut_private.payment_receipts where transaction_id=p_transaction_id;
    if receipt.payment_code<>p_payment_code or receipt.amount_vnd<>p_amount_vnd or receipt.bank_paid_at<>p_bank_paid_at then raise exception 'transaction_conflict'; end if;
    return jsonb_build_object('result',receipt.result,'duplicate',true);
  end if;
  -- Serialize settlement with creation for this buyer, including old/expired orders.
  select * into result from public.commerce_orders where payment_code=p_payment_code;
  if found then perform pg_advisory_xact_lock(hashtextextended(result.user_id::text,0)); end if;
  select * into result from public.commerce_orders where payment_code=p_payment_code for update;
  if not found then outcome:='unmatched';
  elsif result.status in ('paid','cancelled') then outcome:='duplicate_payment';
  elsif result.status='review' then outcome:='manual_review';
  elsif lower(p_bank_gateway)<>lower(result.bank_gateway) or p_account_number<>result.account_number then outcome:='recipient_mismatch';
  elsif p_amount_vnd<>result.price_vnd then outcome:='amount_mismatch';
  elsif p_bank_paid_at<result.created_at-interval '1 minute' or p_bank_paid_at>result.expires_at then outcome:='outside_payment_window';
  else outcome:='paid';
  end if;
  update hen1chut_private.payment_receipts set order_id=result.id,result=outcome where transaction_id=p_transaction_id;
  if outcome='paid' then
    insert into public.entitlements(user_id,item_key) select result.user_id,k from unnest(result.item_keys) k on conflict do nothing;
    update public.commerce_orders set status='paid',paid_at=p_bank_paid_at,review_reason=null where id=result.id;
    update public.commerce_orders set status='cancelled',review_reason='already_owned' where user_id=result.user_id and sku=result.sku and id<>result.id and status='pending';
  elsif result.id is not null and result.status not in ('paid','cancelled') then
    update public.commerce_orders set status='review',review_reason=outcome where id=result.id;
  end if;
  return jsonb_build_object('result',outcome,'duplicate',false);
end $$;
create function public.settle_checkout_payment(p_transaction_id text,p_payment_code text,p_amount_vnd integer,p_bank_paid_at timestamptz,p_body_hash text,p_bank_gateway text,p_account_number text) returns jsonb
language sql security invoker set search_path='' as $$ select hen1chut_private.settle_checkout_payment(p_transaction_id,p_payment_code,p_amount_vnd,p_bank_paid_at,p_body_hash,p_bank_gateway,p_account_number); $$;
revoke all on function public.create_checkout_order(uuid,text,text,text,text,text,text),public.settle_checkout_payment(text,text,integer,timestamptz,text,text,text),hen1chut_private.create_checkout_order(uuid,text,text,text,text,text,text),hen1chut_private.settle_checkout_payment(text,text,integer,timestamptz,text,text,text) from public,anon,authenticated;
grant execute on function public.create_checkout_order(uuid,text,text,text,text,text,text),public.settle_checkout_payment(text,text,integer,timestamptz,text,text,text),hen1chut_private.create_checkout_order(uuid,text,text,text,text,text,text),hen1chut_private.settle_checkout_payment(text,text,integer,timestamptz,text,text,text) to service_role;

-- Ownership does not depend on whether a product is currently listed for sale.
create function hen1chut_private.check_cosmetic_access(p_user_id uuid,p_avatar jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare outfit text:=p_avatar->>'outfit';
begin
  if outfit in ('dragon','mecha') and not exists(select 1 from public.entitlements where user_id=p_user_id and item_key='outfit:'||outfit) then raise exception 'cosmetic_not_owned'; end if;
end $$;
create function hen1chut_private.guard_paid_cosmetics() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if tg_table_name='profiles' then perform hen1chut_private.check_cosmetic_access(new.user_id,new.avatar);
  else perform hen1chut_private.check_cosmetic_access(new.user_id,new.state->'character'); end if;
  return new;
end $$;
revoke all on function hen1chut_private.check_cosmetic_access(uuid,jsonb),hen1chut_private.guard_paid_cosmetics() from public,anon,authenticated;
create trigger profiles_cosmetics before insert or update on public.profiles for each row execute function hen1chut_private.guard_paid_cosmetics();
create trigger state_cosmetics before insert or update on public.player_state for each row execute function hen1chut_private.guard_paid_cosmetics();
notify pgrst,'reload schema';
