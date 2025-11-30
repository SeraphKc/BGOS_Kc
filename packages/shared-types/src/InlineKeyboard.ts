/**
 * Telegram-style Inline Keyboard System
 * Allows N8N workflows to send messages with interactive buttons
 */

/**
 * Button types supported by the inline keyboard system
 */
export type InlineButtonType = 'callback' | 'url' | 'copy' | 'input';

/**
 * Individual inline keyboard button
 * Similar to Telegram's InlineKeyboardButton
 */
export type InlineKeyboardButton = {
    /** Button label text displayed to user */
    text: string;

    /** Button type determines behavior */
    type: InlineButtonType;

    /** Data sent to webhook when button clicked (for 'callback' type) */
    callback_data?: string;

    /** URL to open (for 'url' type) */
    url?: string;

    /** Text to copy to clipboard (for 'copy' type) */
    copy_text?: string;

    /** Placeholder text for input field (for 'input' type) */
    input_placeholder?: string;

    /** Optional unique ID for button state tracking */
    id?: string;
};

/**
 * Row of buttons - buttons in same row appear horizontally
 */
export type InlineKeyboardRow = InlineKeyboardButton[];

/**
 * 2D array of buttons - each inner array is a row
 * Similar to Telegram's InlineKeyboardMarkup
 */
export type InlineKeyboardMarkup = {
    inline_keyboard: InlineKeyboardRow[];
};

/**
 * Callback query sent when user clicks an inline button
 * Similar to Telegram's CallbackQuery
 */
export type CallbackQuery = {
    /** Unique ID for this callback query */
    id: string;

    /** ID of the message containing the button */
    messageId: string;

    /** ID of the chat containing the message */
    chatId: string;

    /** ID of the user who clicked the button */
    userId: string;

    /** The callback_data from the clicked button */
    callback_data: string;

    /** Original message text for context */
    original_message_text?: string;

    /** User input if this was an input-type button */
    user_input?: string;

    /** Timestamp of button click */
    timestamp: string;
};

/**
 * Response from webhook after processing callback query
 * Similar to Telegram's answerCallbackQuery + editMessageText
 */
export type CallbackResponse = {
    /** Whether callback was processed successfully */
    success: boolean;

    /** Whether to show a notification/alert to user */
    show_alert?: boolean;

    /** Alert/notification text */
    alert_text?: string;

    /** New text to replace original message (editMessageText) */
    new_text?: string;

    /** New inline keyboard to replace original (or null to remove) */
    new_reply_markup?: InlineKeyboardMarkup | null;

    /** Optional error message */
    error?: string;
};

/**
 * State for inline input expansion
 */
export type InlineInputState = {
    /** Message ID where input is expanded */
    messageId: string;

    /** The button that triggered input */
    button: InlineKeyboardButton;

    /** Current input value */
    value: string;

    /** Whether input is submitting */
    isSubmitting: boolean;
};
