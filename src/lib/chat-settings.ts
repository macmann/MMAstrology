export const CHAT_HISTORY_CONTEXT_PROMPT_KEY = "chat-history-context-enabled";

export const DEFAULT_CHAT_HISTORY_CONTEXT_ENABLED = true;

export function parseChatHistoryContextSetting(value: string | null | undefined) {
  if (value === undefined || value === null) {
    return DEFAULT_CHAT_HISTORY_CONTEXT_ENABLED;
  }

  return value.trim().toLowerCase() !== "false";
}

export function serializeChatHistoryContextSetting(enabled: boolean) {
  return enabled ? "true" : "false";
}
