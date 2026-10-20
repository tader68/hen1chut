import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { beforeAll, afterAll, afterEach, describe, it, expect } from "vitest";
const A = "00000000-0000-4000-8000-000000000001",
  B = "00000000-0000-4000-8000-000000000002";
let db: PGlite;
async function asUser(id: string, fn: () => Promise<unknown>) {
  await db.exec(
    `set role authenticated;select set_config('request.jwt.claim.sub','${id}',false)`,
  );
  try {
    return await fn();
  } finally {
    await db.exec("reset role;reset request.jwt.claim.sub");
  }
}
async function profile(id: string, name: string) {
  return asUser(id, () =>
    db.query("select public.upsert_profile($1,$2)", [
      "" + name,
      JSON.stringify({ kind: "blob", name: "must stay private" }),
    ]),
  );
}
async function queryValue<T>(sql: string, args: unknown[] = []): Promise<T> {
  const r = await db.query<{ value: T }>(sql, args);
  return r.rows[0].value;
}
beforeAll(async () => {
  db = new PGlite();
  await db.waitReady;
  await db.exec(
    `create role anon nologin; create role authenticated nologin; create schema auth; create table auth.users(id uuid primary key); insert into auth.users values ('${A}'),('${B}'); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth,public to authenticated,anon;`,
  );
  for (const file of [
    "202610210001_core.sql",
    "202610210002_state_revision.sql",
  ])
    await db.exec(
      await readFile(
        new URL(`../../supabase/migrations/${file}`, import.meta.url),
        "utf8",
      ),
    );
}, 30000);
afterEach(async () => {
  await db.exec(
    "reset role;reset request.jwt.claim.sub;truncate public.profiles,public.player_state,public.ranked_rounds,public.leaderboard_best,public.leaderboard_daily,public.entitlements",
  );
});
afterAll(async () => {
  await db.close();
});
describe("database privacy and profiles", () => {
  it("rejects null or negative revisions without changing stored state", async () => {
    await profile(A, "One");
    for (const revision of [null, -1])
      await expect(
        asUser(A, () =>
          db.query("select public.save_player_state($1,$2)", [
            JSON.stringify({ session: { hits: 99 } }),
            revision,
          ]),
        ),
      ).rejects.toThrow("invalid_revision");
    expect(
      (await db.query("select * from public.player_state")).rows,
    ).toHaveLength(0);
  });
  it("requires authentication and strips private names out of public avatars", async () => {
    await expect(
      db.query("select public.upsert_profile($1)", ["Guest"]),
    ).rejects.toThrow("sign_in_required");
    await profile(A, "Đạt chill");
    const avatar = await queryValue<Record<string, unknown>>(
      "select avatar as value from public.profiles where user_id=$1",
      [A],
    );
    expect(avatar).not.toHaveProperty("name");
    await expect(profile(B, "đạt chill")).rejects.toThrow();
  });
  it("prevents another account from reading private state or changing scores directly", async () => {
    await profile(A, "One");
    await profile(B, "Two");
    await asUser(A, () =>
      db.query("select public.save_player_state($1,0)", [
        JSON.stringify({
          character: { name: "Private target" },
          session: { hits: 15 },
        }),
      ]),
    );
    const rows = await asUser(
      B,
      async () => (await db.query("select * from public.player_state")).rows,
    );
    expect(rows).toEqual([]);
    await expect(
      asUser(B, () =>
        db.query("insert into public.leaderboard_best values ($1,240,now())", [
          B,
        ]),
      ),
    ).rejects.toThrow("permission denied");
    await expect(
      asUser(B, () =>
        db.query(
          "insert into public.entitlements(user_id,item_key) values ($1,$2)",
          [B, "paid-skin"],
        ),
      ),
    ).rejects.toThrow("permission denied");
  });
  it("detects conflicts between two devices without overwriting the first save", async () => {
    await profile(A, "One");
    const first = (await asUser(A, () =>
      queryValue<{ revision: number }>(
        "select public.save_player_state($1,0) as value",
        [JSON.stringify({ session: { hits: 12 } })],
      ),
    )) as { revision: number };
    expect(first.revision).toBe(1);
    const conflict = (await asUser(A, () =>
      queryValue<{ conflict: boolean; state: unknown }>(
        "select public.save_player_state($1,0) as value",
        [JSON.stringify({ session: { hits: 99 } })],
      ),
    )) as { conflict: boolean; state: unknown };
    expect(conflict.conflict).toBe(true);
    expect(conflict.state).toEqual({ session: { hits: 12 } });
    const next = (await asUser(A, () =>
      queryValue<{ revision: number }>(
        "select public.save_player_state($1,1) as value",
        [JSON.stringify({ session: { hits: 14 } })],
      ),
    )) as { revision: number };
    expect(next.revision).toBe(2);
  });
});
describe("server-calculated global scores", () => {
  it("resumes one active round and ignores replayed sequences", async () => {
    await profile(A, "One");
    const round = (await asUser(A, () =>
      queryValue<{ id: string }>("select public.start_ranked_round() as value"),
    )) as { id: string };
    const again = (await asUser(A, () =>
      queryValue<{ id: string }>("select public.start_ranked_round() as value"),
    )) as { id: string };
    expect(again.id).toBe(round.id);
    const hit = (await asUser(A, () =>
      queryValue<{ hits: number }>(
        "select public.record_ranked_hits($1,1,5) as value",
        [round.id],
      ),
    )) as { hits: number };
    expect(hit.hits).toBe(5);
    const replay = (await asUser(A, () =>
      queryValue<{ hits: number }>(
        "select public.record_ranked_hits($1,1,8) as value",
        [round.id],
      ),
    )) as { hits: number };
    expect(replay.hits).toBe(5);
    const cap = (await asUser(A, () =>
      queryValue<{ hits: number }>(
        "select public.record_ranked_hits($1,2,8) as value",
        [round.id],
      ),
    )) as { hits: number };
    expect(cap.hits).toBe(8);
    await expect(
      asUser(A, () =>
        db.query("select public.record_ranked_hits($1,4,1)", [round.id]),
      ),
    ).rejects.toThrow("sequence_gap");
    await expect(
      asUser(B, () =>
        db.query("select public.record_ranked_hits($1,3,1)", [round.id]),
      ),
    ).rejects.toThrow("round_not_found");
  });
  it("does not publish a score until the round ends, cannot add hits after the deadline", async () => {
    await profile(A, "One");
    const round = (await asUser(A, () =>
      queryValue<{ id: string }>("select public.start_ranked_round() as value"),
    )) as { id: string };
    await asUser(A, () =>
      db.query("select public.record_ranked_hits($1,1,4)", [round.id]),
    );
    await expect(
      asUser(A, () =>
        db.query("select public.finish_ranked_round($1)", [round.id]),
      ),
    ).rejects.toThrow("round_not_finished");
    expect(
      (await db.query("select * from public.get_leaderboard()")).rows,
    ).toEqual([]);
    await db.query(
      "update public.ranked_rounds set started_at=clock_timestamp()-interval '31 seconds',expires_at=clock_timestamp()-interval '1 second' where id=$1",
      [round.id],
    );
    await expect(
      asUser(A, () =>
        db.query("select public.record_ranked_hits($1,2,8)", [round.id]),
      ),
    ).rejects.toThrow("round_closed");
    await asUser(A, () =>
      db.query("select public.finish_ranked_round($1)", [round.id]),
    );
    await asUser(A, () =>
      db.query("select public.finish_ranked_round($1)", [round.id]),
    );
    await db.exec("set role anon");
    const rows = (
      await db.query<{ score: number; avatar: Record<string, unknown> }>(
        "select * from public.get_leaderboard()",
      )
    ).rows;
    await db.exec("reset role");
    expect(rows).toHaveLength(1);
    expect(rows[0].score).toBe(4);
    expect(rows[0]).not.toHaveProperty("email");
    expect(rows[0].avatar).not.toHaveProperty("name");
  });
});
