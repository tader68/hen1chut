import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import { normalizeCharacter, type Character } from "../character/model";
import { normalizePlayerState, type PlayerState } from "./player-state";
export type { PlayerState } from "./player-state";
export interface Profile {
  user_id: string;
  nickname: string;
  avatar: Partial<Character>;
}
export interface LeaderboardEntry {
  rank: number;
  nickname: string;
  score: number;
  avatar: Character;
  is_me: boolean;
}
export interface RankedRound {
  id: string;
  hits: number;
  sequence: number;
  started_at: string;
  expires_at: string;
  server_now: string;
  resumed: boolean;
}
export class CloudError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export function cloudError(error: unknown): string {
  const code =
    error && typeof error === "object" && "message" in error
      ? String(error.message)
      : "";
  if (
    code.includes("duplicate key") ||
    code.includes("profiles_nickname_unique")
  )
    return "Nickname này đã có người dùng. Thử thêm chút cá tính nhé.";
  if (code.includes("round_cooldown"))
    return "Nghỉ vài giây rồi bắt đầu vòng mới nhé.";
  if (code.includes("hourly_round_limit"))
    return "Bạn đã chơi khá nhiều vòng. Nghỉ một chút rồi quay lại nhé.";
  if (code.includes("invalid_nickname"))
    return "Nickname cần 2–20 ký tự, không chứa email hoặc dấu < >.";
  if (code.includes("sign_in_required") || code.includes("JWT"))
    return "Phiên đăng nhập đã hết hạn. Đăng nhập Google lại nhé.";
  return "Chưa kết nối được. Tiến trình vẫn lưu trên máy, thử lại khi có mạng nhé.";
}
export class Cloud {
  readonly client: SupabaseClient;
  revision = 0;
  constructor(
    private url: string,
    private key: string,
  ) {
    this.client = createClient(url, key, {
      auth: {
        flowType: "pkce",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  async googleAvailable(): Promise<boolean | null> {
    try {
      const response = await fetch(`${this.url}/auth/v1/settings`, {
        headers: { apikey: this.key },
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) return null;
      const settings = await response.json();
      return settings.external?.google === true;
    } catch {
      return null;
    }
  }
  async user(): Promise<User | null> {
    const { data, error } = await this.client.auth.getUser();
    if (error) {
      if (error.name === "AuthSessionMissingError") return null;
      throw error;
    }
    return data.user;
  }
  async signIn(): Promise<void> {
    const redirect = new URL(import.meta.env.BASE_URL, location.href);
    redirect.hash = "";
    redirect.search = "";
    const { error } = await this.client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirect.toString(),
        scopes: "openid email profile",
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) throw error;
  }
  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }
  async profile(userId: string): Promise<Profile | null> {
    const { data, error } = await this.client
      .from("profiles")
      .select("user_id,nickname,avatar")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }
  async saveProfile(nickname: string, character: Character): Promise<Profile> {
    const { data, error } = await this.client.rpc("upsert_profile", {
      p_nickname: nickname,
      p_avatar: character,
    });
    if (error) throw error;
    return data;
  }
  async state(userId: string): Promise<PlayerState | null> {
    const { data, error } = await this.client
      .from("player_state")
      .select("state,revision")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    this.revision = data?.revision || 0;
    return normalizePlayerState(data?.state);
  }
  async saveState(
    state: PlayerState,
  ): Promise<{ conflict: boolean; revision: number; state?: unknown }> {
    const { data, error } = await this.client.rpc("save_player_state", {
      p_state: state,
      p_expected_revision: this.revision,
    });
    if (error) throw error;
    if (!data.conflict) this.revision = data.revision;
    return data;
  }
  async leaderboard(scope: "all" | "week"): Promise<LeaderboardEntry[]> {
    const { data, error } = await this.client.rpc("get_leaderboard", {
      p_scope: scope,
      p_limit: 20,
    });
    if (error) throw error;
    return (data || []).map((entry: LeaderboardEntry) => ({
      ...entry,
      avatar: normalizeCharacter(entry.avatar),
    }));
  }
  async startRound(): Promise<RankedRound> {
    const { data, error } = await this.client.rpc("start_ranked_round");
    if (error) throw error;
    return data;
  }
  async recordHits(
    id: string,
    sequence: number,
    count: number,
  ): Promise<{ hits: number; sequence: number; credited: number }> {
    const { data, error } = await this.client.rpc("record_ranked_hits", {
      p_round_id: id,
      p_sequence: sequence,
      p_count: count,
    });
    if (error) throw error;
    return data;
  }
  async finishRound(id: string): Promise<{ hits: number }> {
    const { data, error } = await this.client.rpc("finish_ranked_round", {
      p_round_id: id,
    });
    if (error) throw error;
    return data;
  }
}
