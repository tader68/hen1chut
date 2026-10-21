-- Keep privilege-bearing implementations outside PostgREST's exposed schemas.
-- Public RPCs are explicit invoker entry points. Ownership checks and grants stay enforced.
create schema hen1chut_private;
revoke all on schema hen1chut_private from public,anon,authenticated;
grant usage on schema hen1chut_private to anon,authenticated;
alter default privileges in schema hen1chut_private revoke execute on functions from public;

alter function public.upsert_profile(text,jsonb) set schema hen1chut_private;
alter function public.save_player_state(jsonb,bigint) set schema hen1chut_private;
alter function public.start_ranked_round() set schema hen1chut_private;
alter function public.record_ranked_hits(uuid,integer,integer) set schema hen1chut_private;
alter function public.finish_ranked_round(uuid) set schema hen1chut_private;
alter function public.get_leaderboard(text,integer) set schema hen1chut_private;

create function public.upsert_profile(p_nickname text,p_avatar jsonb default '{}'::jsonb) returns jsonb
language sql security invoker set search_path='' as $$
  select hen1chut_private.upsert_profile(p_nickname,p_avatar);
$$;

create function public.save_player_state(p_state jsonb,p_expected_revision bigint default 0) returns jsonb
language sql security invoker set search_path='' as $$
  select hen1chut_private.save_player_state(p_state,p_expected_revision);
$$;

create function public.start_ranked_round() returns jsonb
language sql security invoker set search_path='' as $$
  select hen1chut_private.start_ranked_round();
$$;

create function public.record_ranked_hits(p_round_id uuid,p_sequence integer,p_count integer) returns jsonb
language sql security invoker set search_path='' as $$
  select hen1chut_private.record_ranked_hits(p_round_id,p_sequence,p_count);
$$;

create function public.finish_ranked_round(p_round_id uuid) returns jsonb
language sql security invoker set search_path='' as $$
  select hen1chut_private.finish_ranked_round(p_round_id);
$$;

create function public.get_leaderboard(p_scope text default 'all',p_limit integer default 20) returns table(rank bigint,nickname text,score integer,avatar jsonb,is_me boolean)
language sql security invoker set search_path='' as $$
  select * from hen1chut_private.get_leaderboard(p_scope,p_limit);
$$;

revoke all on function public.upsert_profile(text,jsonb),public.save_player_state(jsonb,bigint),public.start_ranked_round(),public.record_ranked_hits(uuid,integer,integer),public.finish_ranked_round(uuid),public.get_leaderboard(text,integer) from public,anon,authenticated;
grant execute on function public.upsert_profile(text,jsonb),public.save_player_state(jsonb,bigint),public.start_ranked_round(),public.record_ranked_hits(uuid,integer,integer),public.finish_ranked_round(uuid) to authenticated;
grant execute on function public.get_leaderboard(text,integer) to anon,authenticated;
notify pgrst,'reload schema';
