-- DRAFT: not tested or applied. Do not deploy from this directory.
-- Manual payment approval remains closed pending validation and merchant setup.
-- Owner decision: VND 10,000 for both outfits; verify bank transfers manually.
update public.commerce_products set price_vnd=10000 where sku='bo-khac-he';
alter table public.commerce_orders add column customer_reference text,
  add column requested_at timestamptz, add column reviewed_at timestamptz,
  add column buyer_message text;
create table hen1chut_private.commerce_operators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default clock_timestamp()
);
create table hen1chut_private.manual_payment_receipts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid unique references public.commerce_orders(id) on delete set null,
  bank_gateway text not null,
  account_number text not null,
  bank_reference text not null,
  amount_vnd integer not null check (amount_vnd>0),
  bank_paid_at timestamptz not null,
  reviewer_id uuid references auth.users(id) on delete set null,
  exception_note text,
  verified_at timestamptz not null default clock_timestamp(),
  unique(bank_gateway,account_number,bank_reference)
);
create index manual_payment_reviewer on hen1chut_private.manual_payment_receipts(reviewer_id) where reviewer_id is not null;
alter table hen1chut_private.commerce_operators enable row level security;
alter table hen1chut_private.manual_payment_receipts enable row level security;
revoke all on hen1chut_private.commerce_operators,hen1chut_private.manual_payment_receipts from public,anon,authenticated;
-- Automatic settlement is deliberately unavailable while manual approval is used.
revoke execute on function public.settle_checkout_payment(text,text,integer,timestamptz,text,text,text),hen1chut_private.settle_checkout_payment(text,text,integer,timestamptz,text,text,text) from service_role;

create function hen1chut_private.is_commerce_operator() returns boolean
language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and exists(select 1 from hen1chut_private.commerce_operators where user_id=(select auth.uid()));
$$;
create function public.is_commerce_operator() returns boolean
language sql stable security invoker set search_path='' as $$ select hen1chut_private.is_commerce_operator(); $$;

create function hen1chut_private.request_manual_review(p_order_id uuid,p_customer_reference text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); result public.commerce_orders;
begin
  if uid is null then raise exception 'sign_in_required'; end if;
  if char_length(coalesce(p_customer_reference,''))>100 then raise exception 'reference_too_long'; end if;
  select * into result from public.commerce_orders where id=p_order_id and user_id=uid for update;
  if not found then raise exception 'order_not_found'; end if;
  if result.status='cancelled' then raise exception 'order_closed'; end if;
  if result.status not in ('paid','review') then
    update public.commerce_orders set status='review',review_reason='customer_reported',customer_reference=nullif(btrim(p_customer_reference),''),requested_at=clock_timestamp(),buyer_message=null where id=result.id returning * into result;
  end if;
  return to_jsonb(result);
end $$;
create function public.request_manual_review(p_order_id uuid,p_customer_reference text default null) returns jsonb
language sql security invoker set search_path='' as $$ select hen1chut_private.request_manual_review(p_order_id,p_customer_reference); $$;

create function hen1chut_private.list_manual_orders(p_status text default 'review',p_code text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
  if not hen1chut_private.is_commerce_operator() then raise exception 'operator_required'; end if;
  if p_status not in ('review','pending','paid','closed') then raise exception 'invalid_status'; end if;
  if p_code is not null and upper(btrim(p_code)) !~ '^H1C[A-F0-9]{12}$' then raise exception 'invalid_payment_code'; end if;
  return coalesce((select jsonb_agg(x.order_data) from (
    select to_jsonb(o)||jsonb_build_object('nickname',p.nickname) as order_data
    from public.commerce_orders o join public.profiles p on p.user_id=o.user_id
    where (p_code is not null and o.payment_code=upper(btrim(p_code)))
       or (p_code is null and (o.status=p_status or (p_status='closed' and o.status in ('expired','cancelled'))))
    order by case when p_status='paid' then o.paid_at end desc, o.created_at asc limit 50
  ) x),'[]'::jsonb);
end $$;
create function public.list_manual_orders(p_status text default 'review',p_code text default null) returns jsonb
language sql security invoker set search_path='' as $$ select hen1chut_private.list_manual_orders(p_status,p_code); $$;

create function hen1chut_private.approve_manual_order(p_order_id uuid,p_bank_reference text,p_received_amount integer,p_paid_at timestamptz,p_accept_exception boolean default false,p_exception_note text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result public.commerce_orders; reference text:=upper(btrim(p_bank_reference)); receipt hen1chut_private.manual_payment_receipts;
begin
  if not hen1chut_private.is_commerce_operator() then raise exception 'operator_required'; end if;
  if reference is null or reference !~ '^[A-Z0-9][A-Z0-9._/-]{3,99}$' or p_received_amount is null or p_paid_at is null or p_paid_at>clock_timestamp()+interval '5 minutes' then raise exception 'invalid_receipt'; end if;
  if char_length(coalesce(p_exception_note,''))>1000 then raise exception 'note_too_long'; end if;
  select * into result from public.commerce_orders where id=p_order_id;
  if not found then raise exception 'order_not_found'; end if;
  perform pg_advisory_xact_lock(hashtextextended(result.user_id::text,0));
  select * into result from public.commerce_orders where id=p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if result.status='paid' then
    select * into receipt from hen1chut_private.manual_payment_receipts where order_id=result.id;
    if found and receipt.bank_reference=reference and receipt.amount_vnd=p_received_amount and receipt.bank_paid_at=p_paid_at then return jsonb_build_object('status','paid','duplicate',true); end if;
    raise exception 'order_already_paid';
  end if;
  if p_received_amount<>result.price_vnd then raise exception 'amount_mismatch'; end if;
  if p_paid_at<result.created_at-interval '1 minute' then raise exception 'payment_before_order'; end if;
  if (p_paid_at>result.expires_at or result.status='cancelled') and (not coalesce(p_accept_exception,false) or char_length(btrim(coalesce(p_exception_note,'')))<10) then raise exception 'exception_confirmation_required'; end if;
  if not exists(select 1 from unnest(result.item_keys) k where not exists(select 1 from public.entitlements e where e.user_id=result.user_id and e.item_key=k)) then raise exception 'already_owned'; end if;
  if exists(select 1 from hen1chut_private.manual_payment_receipts where bank_gateway=lower(result.bank_gateway) and account_number=result.account_number and bank_reference=reference) then raise exception 'receipt_already_used'; end if;
  insert into hen1chut_private.manual_payment_receipts(order_id,bank_gateway,account_number,bank_reference,amount_vnd,bank_paid_at,reviewer_id,exception_note)
    values(result.id,lower(result.bank_gateway),result.account_number,reference,p_received_amount,p_paid_at,auth.uid(),nullif(btrim(p_exception_note),''));
  insert into public.entitlements(user_id,item_key) select result.user_id,k from unnest(result.item_keys) k on conflict do nothing;
  update public.commerce_orders set status='paid',paid_at=p_paid_at,reviewed_at=clock_timestamp(),review_reason=null,buyer_message=null where id=result.id;
  update public.commerce_orders set status='cancelled',review_reason='already_owned' where user_id=result.user_id and sku=result.sku and id<>result.id and status='pending';
  return jsonb_build_object('status','paid','duplicate',false);
end $$;
create function public.approve_manual_order(p_order_id uuid,p_bank_reference text,p_received_amount integer,p_paid_at timestamptz,p_accept_exception boolean default false,p_exception_note text default null) returns jsonb
language sql security invoker set search_path='' as $$ select hen1chut_private.approve_manual_order(p_order_id,p_bank_reference,p_received_amount,p_paid_at,p_accept_exception,p_exception_note); $$;

create function hen1chut_private.followup_manual_order(p_order_id uuid,p_message text,p_close boolean default false) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result public.commerce_orders;
begin
  if not hen1chut_private.is_commerce_operator() then raise exception 'operator_required'; end if;
  if p_message is null or char_length(btrim(p_message)) not between 5 and 1000 then raise exception 'message_required'; end if;
  select * into result from public.commerce_orders where id=p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if result.status='paid' then raise exception 'order_already_paid'; end if;
  update public.commerce_orders set status=case when p_close then 'cancelled' else 'review' end,buyer_message=btrim(p_message),review_reason='operator_followup',reviewed_at=clock_timestamp() where id=result.id returning * into result;
  return to_jsonb(result);
end $$;
create function public.followup_manual_order(p_order_id uuid,p_message text,p_close boolean default false) returns jsonb
language sql security invoker set search_path='' as $$ select hen1chut_private.followup_manual_order(p_order_id,p_message,p_close); $$;

revoke all on function public.is_commerce_operator(),public.request_manual_review(uuid,text),public.list_manual_orders(text,text),public.approve_manual_order(uuid,text,integer,timestamptz,boolean,text),public.followup_manual_order(uuid,text,boolean),hen1chut_private.is_commerce_operator(),hen1chut_private.request_manual_review(uuid,text),hen1chut_private.list_manual_orders(text,text),hen1chut_private.approve_manual_order(uuid,text,integer,timestamptz,boolean,text),hen1chut_private.followup_manual_order(uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.is_commerce_operator(),public.request_manual_review(uuid,text),public.list_manual_orders(text,text),public.approve_manual_order(uuid,text,integer,timestamptz,boolean,text),public.followup_manual_order(uuid,text,boolean),hen1chut_private.is_commerce_operator(),hen1chut_private.request_manual_review(uuid,text),hen1chut_private.list_manual_orders(text,text),hen1chut_private.approve_manual_order(uuid,text,integer,timestamptz,boolean,text),hen1chut_private.followup_manual_order(uuid,text,boolean) to authenticated;
notify pgrst,'reload schema';
