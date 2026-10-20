-- Reject malformed revisions so callers cannot bypass conflict detection.
create or replace function public.save_player_state(p_state jsonb,p_expected_revision bigint default 0) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); result public.player_state;
begin
  if uid is null then raise exception 'sign_in_required'; end if;
  if p_expected_revision is null or p_expected_revision<0 then raise exception 'invalid_revision'; end if;
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

create index leaderboard_best_rank_idx on public.leaderboard_best(score desc,achieved_at,user_id);
