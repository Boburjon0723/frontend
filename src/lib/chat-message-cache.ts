import { apiFetch } from '@/lib/api';
import { getUser } from '@/lib/auth-storage';

export const CHAT_MESSAGE_CACHE_LIMIT = 100;

/** ChatWindow ichidagi xabar shakli (cache JSON) */
export type CachedChatMessage = Record<string, unknown>;

export function readChatMessageCache(chatId: string | number | undefined): CachedChatMessage[] {
    if (chatId == null || typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(`chat_cache_${chatId}`);
        if (!raw) return [];
        const cached = JSON.parse(raw) as unknown;
        if (!Array.isArray(cached) || !cached.length) return [];
        return cached.filter((x): x is CachedChatMessage => x !== null && typeof x === 'object');
    } catch {
        return [];
    }
}

export function writeChatMessageCache(chatId: string | number, messages: CachedChatMessage[]): void {
    if (typeof window === 'undefined' || chatId == null) return;
    try {
        const slice = messages.slice(-CHAT_MESSAGE_CACHE_LIMIT);
        localStorage.setItem(`chat_cache_${chatId}`, JSON.stringify(slice));
    } catch {
        /* ignore */
    }
}

export function mapApiMessagesToLocal(history: unknown[]): CachedChatMessage[] {
    const user = (getUser() || {}) as { id?: string };
    return history.map((raw) => {
        const m = raw as Record<string, unknown>;
        return {
            id: m.id,
            text: m.content,
            sender: String(m.sender_id) === String(user.id) ? 'me' : 'them',
            time: new Date(String(m.created_at)).toLocaleTimeString('uz-UZ', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            }),
            type: m.type || 'text',
            metadata: m.metadata,
            is_read: m.is_read,
        };
    });
}

/** Ro'yxatdan chat tanlashda — animatsiya boshlanishidan oldin cache issiq bo'lishi uchun */
export async function prefetchChatMessagesCache(chatId: string | number): Promise<void> {
    try {
        const res = await apiFetch(`/api/chats/${chatId}/messages`);
        if (!res.ok) return;
        const history = await res.json();
        if (!Array.isArray(history)) return;
        const mapped = mapApiMessagesToLocal(history as unknown[]);
        writeChatMessageCache(chatId, mapped);
    } catch {
        /* tarmoq xatosi — ChatWindow o'zi keyin yuklaydi */
    }
}
