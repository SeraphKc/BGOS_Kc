/**
 * Formats a timestamp into a relative time string like "Last message 2 hours ago"
 * Since we don't have lastMessageDate, we'll use the chat ID as a proxy
 */

export function getRelativeTimeFromChatId(chatId: string): string {
    // For now, we'll return a placeholder since we're using chat ID as date proxy
    // In a real implementation, this would parse a timestamp from the ID or use actual date field

    // Extract numeric portion from chat ID if possible
    const numericPart = chatId.replace(/\D/g, '');
    if (numericPart) {
        const idNumber = parseInt(numericPart, 10);
        const now = Date.now();

        // Create a mock timestamp based on ID (assuming lower IDs are older)
        // This is a placeholder - real implementation would use actual message dates
        const mockTimestamp = now - (idNumber % 10000) * 60000; // Mock: subtract minutes based on ID

        return getRelativeTime(mockTimestamp);
    }

    return 'Recently';
}

export function getRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    if (weeks < 4) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}
