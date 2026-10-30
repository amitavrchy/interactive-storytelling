import { api, apiConfigured } from "./api";
import { CHOICE_ID, type Ending } from "./story-content";
type Vote = { requestId: string; optionKey: Ending };
const key = "lighthouse-vote-outbox";
let running = false;
export async function flushVotes() {
  if (!apiConfigured || running) return;
  running = true;
  try {
    const votes: Vote[] = JSON.parse(localStorage.getItem(key) || "[]");
    for (const vote of votes) {
      await api.post(`/choices/${CHOICE_ID}/vote`, vote);
      const pending: Vote[] = JSON.parse(localStorage.getItem(key) || "[]");
      localStorage.setItem(key, JSON.stringify(pending.filter(v => v.requestId !== vote.requestId)));
    }
  } catch { /* Keep the outbox for the next online event or story visit. */ }
  finally { running = false; }
}
export function recordChoice(optionKey: Ending) {
  if (!apiConfigured) return;
  try {
    const votes: Vote[] = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify([...votes, { requestId: crypto.randomUUID(), optionKey }].slice(-20)));
    void flushVotes();
  } catch { /* Reading remains available if storage is blocked. */ }
}
