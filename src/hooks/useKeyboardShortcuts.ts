import { useEffect } from 'react';

export interface KeyboardShortcutHandlers {
    onFocusSearch?: () => void;
    onNewChat?: () => void;
    onOpenSettings?: () => void;
    onOpenChatHistory?: () => void;
    onEscape?: () => void;
    onSelectStarredAgent?: (index: number) => void;
}

/**
 * Global keyboard shortcuts hook for AVA Assistant
 * Handles Cmd (Mac) and Ctrl (Windows/Linux) modifiers
 * Prevents shortcuts when user is typing in inputs/textareas
 */
export const useKeyboardShortcuts = (handlers: KeyboardShortcutHandlers) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Don't trigger shortcuts when user is typing
            const target = event.target as HTMLElement;
            const isTyping =
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable;

            // Detect if Cmd (Mac) or Ctrl (Windows/Linux) is pressed
            const cmdOrCtrl = event.metaKey || event.ctrlKey;

            // ESC key - always handle (even when typing to close modals)
            if (event.key === 'Escape' && handlers.onEscape) {
                event.preventDefault();
                handlers.onEscape();
                return;
            }

            // Don't handle other shortcuts when typing
            if (isTyping && event.key !== 'Escape') {
                return;
            }

            // Ctrl/Cmd + K: Focus search bar
            if (cmdOrCtrl && event.key === 'k') {
                event.preventDefault();
                handlers.onFocusSearch?.();
                return;
            }

            // Ctrl/Cmd + N: New chat
            if (cmdOrCtrl && event.key === 'n') {
                event.preventDefault();
                handlers.onNewChat?.();
                return;
            }

            // Ctrl/Cmd + ,: Open Settings
            if (cmdOrCtrl && event.key === ',') {
                event.preventDefault();
                handlers.onOpenSettings?.();
                return;
            }

            // Ctrl/Cmd + Shift + H: Open Chat History
            if (cmdOrCtrl && event.shiftKey && event.key === 'H') {
                event.preventDefault();
                handlers.onOpenChatHistory?.();
                return;
            }

            // Ctrl/Cmd + 1-9: Select starred agent by index
            if (cmdOrCtrl && !event.shiftKey) {
                const num = parseInt(event.key);
                if (num >= 1 && num <= 9) {
                    event.preventDefault();
                    // Convert 1-indexed to 0-indexed
                    handlers.onSelectStarredAgent?.(num - 1);
                    return;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handlers]);
};
