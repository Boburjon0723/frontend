/** E'londan boshlangan shaxsiy suhbat (backend `chats.metadata`) */

export function getChatMetadata(chat: any): Record<string, any> {
  const m = chat?.metadata;
  if (!m) return {};
  if (typeof m === 'object') return m as Record<string, any>;
  try {
    return JSON.parse(String(m)) as Record<string, any>;
  } catch {
    return {};
  }
}

export function isExpertListingChat(chat: any): boolean {
  const meta = getChatMetadata(chat);
  return meta.source === 'expert_listing' && !!meta.expert_id && !!meta.snapshot;
}
