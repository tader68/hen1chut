-- Supabase Free: authenticated writes are only permitted through the RPCs below.
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 2 and 20 and nickname !~ '[<>@[:cntrl:]]'),
  avatar jsonb not null default '{}'::jsonb check (jsonb_typeof(avatar)='object' and octet_length(avatar::text)<1500),
  created_at timestamptz not null default now()
);
create unique index profiles_nickname_unique on public.profiles(lower(nickname));
create table public.player_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb check (jsonb_typeof(state)='object' and octet_length(state::text)<=30000),
  revision bigint not null default 1,
  updated_at timestamptz not null default now()
);
create table public.ranked_rounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null default (clock_timestamp()+interval '30 seconds'),
  finished_at timestamptz,
  hits integer not null default 0 check (hits between 0 and 240),
  sequence integer not null default 0,
  bucket integer not null default -1,
  bucket_hits integer not null default 0 check (bucket_hits between 0 and 8)
);
create index ranked_rounds_user_time on public.ranked_rounds(user_id,started_at desc);
create table public.leaderboard_best (
  user_id uuid primary key references auth.users(id) on delete cascade,
  score integer not null check (score between 0 and 240),
  achieved_at timestamptz not null
);
create table public.leaderboard_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  score integer not null check (score between 0 and 240),
  achieved_at timestamptz not null,
  primary key(user_id,day)
);
create index leaderboard_daily_day on public.leaderboard_daily(day desc,score desc);
-- Only a verified payment webhook/service_role may grant paid cosmetics.
create table public.entitlements (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null check (char_length(item_key) between 1 and 80),
  granted_at timestamptz not null default now(),
  primary key(user_id,item_key)
);
alter table public.profiles enable row level security;
alter table public.player_state enable row level security;
alter table public.ranked_rounds enable row level security;
alter table public.leaderboard_best enable row level security;
alter table public.leaderboard_daily enable row level security;
alter table public.entitlements enable row level security;
revoke all on public.profiles,public.player_state,public.ranked_rounds,public.leaderboard_best,public.leaderboard_daily,public.entitlements from anon,authenticated;
grant select on public.profiles,public.player_state,public.ranked_rounds,public.entitlements to authenticated;
create policy profiles_owner on public.profiles for select to authenticated using (user_id=(select auth.uid()));
create policy state_owner on public.player_state for select to authenticated using (user_id=(select auth.uid()));
create policy rounds_owner on public.ranked_rounds for select to authenticated using (user_id=(select auth.uid()));
create policy entitlements_owner on public.entitlements for select to authenticated using (user_id=(select auth.uid()));

create function public.upsert_profile(p_nickname text,p_avatar jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); nickname_value text:=btrim(p_nickname);
begin
  if uid is null then raise exception 'sign_in_required'; end if;
  if nickname_value is null or char_length(nickname_value) not between 2 and 20 or nickname_value ~ '[<>@[:cntrl:]]' then raise exception 'invalid_nickname'; end if;
  if p_avatar is null or jsonb_typeof(p_avatar)<>'object' or octet_length(p_avatar::text)>1500 then raise exception 'invalid_avatar'; end if;
  insert into public.profiles(user_id,nickname,avatar) values(uid,nickname_value,
    jsonb_build_object('kind',p_avatar->'kind','color',p_avatar->'color','outfit',p_avatar->'outfit','body',p_avatar->'body','hat',p_avatar->'hat','glasses',p_avatar->'glasses'))
    on conflict(user_id) do update set nickname=excluded.nickname,avatar=excluded.avatar;
  return (select to_jsonb(p) from public.profiles p where p.user_id=uid);
end $$;

create function public.save_player_state(p_state jsonb,p_expected_revision bigint default 0) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); result public.player_state;
begin
  if uid is null then raise exception 'sign_in_required'; end if;
  if p_state is null or jsonb_typeof(p_state)<>'object' or octet_length(p_state::text)>30000 then raise exception 'invalid_state'; end if;
  -- Row-level lock prevents concurrent tabs from overwriting each other silently.
  perform 1 from public.profiles where user_id=uid for update;
  if not found then raise exception 'profile_required'; end if;
  select * into result from public.player_state where user_id=uid;
  if coalesce(result.revision,0)<>p_expected_revision then
    return jsonb_build_object('conflict',true,'revision',result.revision,'state',result.state);
  end if;
  if jsonb_typeof(p_state->'character')='object' then
    update public.profiles set avatar=jsonb_build_object('kind',p_state->'character'->'kind','color',p_state->'character'->'color','outfit',p_state->'character'->'outfit','body',p_state->'character'->'body','hat',p_state->'character'->'hat','glasses',p_state->'character'->'glasses') where user_id=uid;
  end if;
  insert into public.player_state(user_id,state,revision) values(uid,p_state,1)
    on conflict(user_id) do update set state=excluded.state,revision=public.player_state.revision+1,updated_at=now() returning * into result;
  return jsonb_build_object('conflict',false,'revision',result.revision,'updated_at',result.updated_at);
end $$;

create function public.start_ranked_round() returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); previous public.ranked_rounds; result public.ranked_rounds; time_now timestamptz:=clock_timestamp();
begin
  if uid is null then raise exception 'sign_in_required'; end if;
  perform 1 from public.profiles where user_id=uid for update;
  if not found then raise exception 'profile_required'; end if;
  select * into previous from public.ranked_rounds where user_id=uid order by started_at desc limit 1;
  if previous.finished_at is null and previous.expires_at>time_now then
    return to_jsonb(previous)||jsonb_build_object('server_now',time_now,'resumed',true);
  end if;
  if previous.id is not null and previous.finished_at is null and previous.expires_at<=time_now then perform public.finish_ranked_round(previous.id); end if;
  if previous.started_at>time_now-interval '35 seconds' then raise exception 'round_cooldown'; end if;
  if (select count(*) from public.ranked_rounds where user_id=uid and started_at>time_now-interval '1 hour')>=30 then raise exception 'hourly_round_limit'; end if;
  delete from public.ranked_rounds where user_id=uid and started_at<time_now-interval '7 days';
  delete from public.leaderboard_daily where user_id=uid and day<(time_now at time zone 'Asia/Ho_Chi_Minh')::date-30;
  insert into public.ranked_rounds(user_id,started_at,expires_at) values(uid,time_now,time_now+interval '30 seconds') returning * into result;
  return to_jsonb(result)||jsonb_build_object('server_now',time_now,'resumed',false);
end $$;

create function public.record_ranked_hits(p_round_id uuid,p_sequence integer,p_count integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result public.ranked_rounds; time_now timestamptz:=clock_timestamp(); current_bucket integer; credited integer;
begin
  if auth.uid() is null then raise exception 'sign_in_required'; end if;
  select * into result from public.ranked_rounds where id=p_round_id and user_id=auth.uid() for update;
  if not found then raise exception 'round_not_found'; end if;
  if result.finished_at is not null or time_now>=result.expires_at then raise exception 'round_closed'; end if;
  if p_sequence is null or p_count is null or p_count not between 1 and 8 then raise exception 'invalid_batch'; end if;
  if p_sequence<=result.sequence then return jsonb_build_object('hits',result.hits,'sequence',result.sequence,'credited',0); end if;
  if p_sequence<>result.sequence+1 then raise exception 'sequence_gap'; end if;
  current_bucket:=floor(extract(epoch from time_now-result.started_at));
  if current_bucket<0 or current_bucket>=30 then raise exception 'round_closed'; end if;
  if current_bucket<>result.bucket then result.bucket_hits:=0; end if;
  credited:=least(p_count,8-result.bucket_hits,240-result.hits);
  update public.ranked_rounds set hits=hits+credited,sequence=p_sequence,bucket=current_bucket,bucket_hits=result.bucket_hits+credited where id=result.id returning * into result;
  return jsonb_build_object('hits',result.hits,'sequence',result.sequence,'credited',credited);
end $$;

create function public.finish_ranked_round(p_round_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result public.ranked_rounds; time_now timestamptz:=clock_timestamp(); day_value date;
begin
  if auth.uid() is null then raise exception 'sign_in_required'; end if;
  select * into result from public.ranked_rounds where id=p_round_id and user_id=auth.uid() for update;
  if not found then raise exception 'round_not_found'; end if;
  if time_now<result.expires_at then raise exception 'round_not_finished'; end if;
  if result.finished_at is not null then return to_jsonb(result); end if;
  update public.ranked_rounds set finished_at=time_now where id=result.id returning * into result;
  insert into public.leaderboard_best(user_id,score,achieved_at) values(result.user_id,result.hits,result.expires_at)
    on conflict(user_id) do update set score=excluded.score,achieved_at=excluded.achieved_at where excluded.score>public.leaderboard_best.score;
  day_value:=(result.started_at at time zone 'Asia/Ho_Chi_Minh')::date;
  insert into public.leaderboard_daily(user_id,day,score,achieved_at) values(result.user_id,day_value,result.hits,result.expires_at)
    on conflict(user_id,day) do update set score=excluded.score,achieved_at=excluded.achieved_at where excluded.score>public.leaderboard_daily.score;
  return to_jsonb(result);
end $$;

create function public.get_leaderboard(p_scope text default 'all',p_limit integer default 20)
returns table(rank bigint,nickname text,score integer,avatar jsonb,is_me boolean)
language plpgsql security definer set search_path='' as $$
begin
  if p_scope is null or p_scope not in ('all','week') then raise exception 'invalid_scope'; end if;
  if p_scope='all' then
    return query select row_number() over(order by b.score desc,b.achieved_at,b.user_id),p.nickname,b.score,p.avatar,coalesce(b.user_id=auth.uid(),false)
      from public.leaderboard_best b join public.profiles p on p.user_id=b.user_id order by b.score desc,b.achieved_at,b.user_id limit least(50,greatest(1,p_limit));
  else
    return query with scores as (select distinct on(d.user_id) d.user_id,d.score,d.achieved_at from public.leaderboard_daily d
      where d.day>=(clock_timestamp() at time zone 'Asia/Ho_Chi_Minh')::date-6 order by d.user_id,d.score desc,d.achieved_at)
      select row_number() over(order by b.score desc,b.achieved_at,b.user_id),p.nickname,b.score,p.avatar,coalesce(b.user_id=auth.uid(),false)
      from scores b join public.profiles p on p.user_id=b.user_id order by b.score desc,b.achieved_at,b.user_id limit least(50,greatest(1,p_limit));
  end if;
end $$;
revoke all on function public.upsert_profile(text,jsonb),public.save_player_state(jsonb,bigint),public.start_ranked_round(),public.record_ranked_hits(uuid,integer,integer),public.finish_ranked_round(uuid),public.get_leaderboard(text,integer) from public,anon,authenticated;
grant execute on function public.upsert_profile(text,jsonb),public.save_player_state(jsonb,bigint),public.start_ranked_round(),public.record_ranked_hits(uuid,integer,integer),public.finish_ranked_round(uuid) to authenticated;
grant execute on function public.get_leaderboard(text,integer) to anon,authenticated;
