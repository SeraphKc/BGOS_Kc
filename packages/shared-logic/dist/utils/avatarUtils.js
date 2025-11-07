// Muted color palette for avatar backgrounds
export const avatarColors = [
    '#7C6F5D', // Muted brown
    '#6B8E7F', // Sage green
    '#8B7E8F', // Dusty purple
    '#7B8FA3', // Steel blue
    '#A37B6F', // Terra cotta
    '#6F8BA3', // Muted teal
    '#9F8170', // Taupe
    '#7A8C7E', // Moss green
    '#8F7A7A', // Dusty rose
    '#7A8F8F', // Muted cyan
    '#8F8A7A', // Khaki
    '#7A7F8F', // Slate
];
/**
 * Generate initials from a name
 * Examples:
 * - "Ava" -> "AV"
 * - "Personal Assistant" -> "PA"
 * - "Sales Bot" -> "SB"
 */
export function getInitials(name) {
    if (!name)
        return '?';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
        // Single word: take first two characters
        const word = words[0];
        return word.length >= 2 ? word.substring(0, 2).toUpperCase() : word.toUpperCase();
    }
    // Multiple words: take first letter of first two words
    return (words[0][0] + words[1][0]).toUpperCase();
}
/**
 * Get a consistent color for a given name (hash-based)
 */
export function getAvatarColor(name) {
    if (!name)
        return avatarColors[0];
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % avatarColors.length;
    return avatarColors[index];
}
