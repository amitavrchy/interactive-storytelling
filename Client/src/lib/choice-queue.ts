import { api, apiConfigured } from "./api";
import { CHOICE_ID, type Ending } from "./story-content";
import { z } from "zod";
import axios from "axios";
type Vote = { requestId: string; optionKey: Ending };
const key = "lighthouse-vote-outbox";
let running = false;
let volatileVotes: Vote[] | null = null;
const voteSchema = z.object({
  requestId: z.uuid(),
  optionKey: z.enum(["beacon", "rescue"]),
});

function readVotes(): Vote[] {
  let stored: unknown = [];
  try {
    stored = JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    /* Recover from a damaged queue or unavailable storage. */
  }
  const votes = volatileVotes ?? (Array.isArray(stored) ? stored : []);
  const valid = votes.flatMap((vote) => {
    const result = voteSchema.safeParse(vote);
    return result.success ? [result.data] : [];
  });
  return [
    ...new Map(valid.map((vote) => [vote.requestId, vote])).values(),
  ].slice(-20);
}

function writeVotes(votes: Vote[]) {
  try {
    localStorage.setItem(key, JSON.stringify(votes));
    volatileVotes = null;
  } catch {
    volatileVotes = votes;
  }
}

function requestId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  // getRandomValues is also available on HTTP LAN previews, unlike randomUUID.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = [...bytes]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function flushVotes() {
  if (!apiConfigured || running) return;
  running = true;
  let drained = false;
  try {
    for (const vote of readVotes()) {
      try {
        await api.post(`/choices/${CHOICE_ID}/vote`, vote);
      } catch (error) {
        if (
          !axios.isAxiosError(error) ||
          ![400, 409].includes(error.response?.status || 0)
        )
          throw error;
      }
      writeVotes(
        readVotes().filter((pending) => pending.requestId !== vote.requestId),
      );
    }
    drained = true;
  } catch {
    /* Keep the outbox for the next online event or story visit. */
  } finally {
    running = false;
    if (drained && readVotes().length) void flushVotes();
  }
}
export function recordChoice(optionKey: Ending) {
  if (!apiConfigured) return;
  writeVotes(
    [...readVotes(), { requestId: requestId(), optionKey }].slice(-20),
  );
  void flushVotes();
}
