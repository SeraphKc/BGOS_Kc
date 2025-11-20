/**
 * Formats a timestamp into a relative time string like "Last message 2 hours ago"
 * Uses the chat's lastMessageDate or createdAt field
 */
export function getRelativeTimeFromChat(chat) {
    // Try to use lastMessageDate first, then fall back to createdAt
    const dateString = chat.lastMessageDate || chat.createdAt;
    if (dateString) {
        const timestamp = new Date(dateString).getTime();
        if (!isNaN(timestamp)) {
            return getRelativeTime(timestamp);
        }
    }
    // Fallback: use chat ID as a very rough proxy (for backward compatibility)
    return getRelativeTimeFromChatId(chat.id);
}
export function getRelativeTimeFromChatId(chatId) {
    // This is a fallback for legacy chats without timestamps
    // New chats will have timestamps via pushChat reducer
    return 'Recently';
}
/**
 * Compare two chats by their timestamp (most recent first)
 * Used for sorting chat lists
 */
export function compareChatsByDate(a, b) {
    const aDate = a.lastMessageDate || a.createdAt;
    const bDate = b.lastMessageDate || b.createdAt;
    if (aDate && bDate) {
        return new Date(bDate).getTime() - new Date(aDate).getTime();
    }
    // Fallback to ID comparison if no dates available
    if (aDate)
        return -1;
    if (bDate)
        return 1;
    return b.id.localeCompare(a.id);
}
export function getRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    if (seconds < 60)
        return 'Just now';
    if (minutes < 60)
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    if (hours < 24)
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    if (days < 7)
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    if (weeks < 4)
        return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    if (months < 12)
        return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}
