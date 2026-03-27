import { Redis } from "@upstash/redis";
import type { DashboardState, HistoryEntry } from "./types";

function getClient() {
  return new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  });
}

const STATE_KEY = "dashboard:state";
const HISTORY_KEY_PREFIX = "dashboard:history:";
const MAX_HISTORY_ENTRIES = 120; // 30 days × 4 refreshes/day

export async function getDashboardState(): Promise<DashboardState | null> {
  const kv = getClient();
  return kv.get<DashboardState>(STATE_KEY);
}

export async function saveDashboardState(state: DashboardState): Promise<void> {
  const kv = getClient();
  await kv.set(STATE_KEY, state);
}

export async function getIndicatorHistory(id: string): Promise<HistoryEntry[]> {
  const kv = getClient();
  const history = await kv.get<HistoryEntry[]>(`${HISTORY_KEY_PREFIX}${id}`);
  return history ?? [];
}

export async function appendHistory(
  id: string,
  entry: HistoryEntry
): Promise<HistoryEntry[]> {
  const kv = getClient();
  const history = await getIndicatorHistory(id);
  history.push(entry);
  const trimmed = history.slice(-MAX_HISTORY_ENTRIES);
  await kv.set(`${HISTORY_KEY_PREFIX}${id}`, trimmed);
  return trimmed;
}

export async function getPreviousOverallStatus(): Promise<string | null> {
  const state = await getDashboardState();
  return state?.overall ?? null;
}
