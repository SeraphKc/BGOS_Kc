export declare const avatarColors: string[];
/**
 * Generate initials from a name
 * Examples:
 * - "Ava" -> "AV"
 * - "Personal Assistant" -> "PA"
 * - "Sales Bot" -> "SB"
 */
export declare function getInitials(name: string): string;
/**
 * Get a consistent color for a given name (hash-based)
 */
export declare function getAvatarColor(name: string): string;
