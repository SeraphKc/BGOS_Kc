import React, {useEffect, useState, useRef, useMemo} from 'react';
import {useDispatch} from 'react-redux';
import {Assistant} from "../types/model/Assistant";
import {Chat} from "../types/model/Chat";
import {getAssistantIcon} from './icons/AssistantIcon';
import expandIcon from '../assets/icons/expand.svg';
import collapseIcon from '../assets/icons/collapse.svg';
import arrowDownIcon from '../assets/icons/arrow-down.svg';
import addIcon from '../assets/icons/add.svg';
import addWhiteIcon from '../assets/icons/add-white.svg';
import newChatIcon from '../assets/icons/new-chat.svg';
import { MessagesSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { getInitials, getAvatarColor, avatarColors } from '../utils/avatarUtils';
import { compareChatsByDate } from '../utils/dateFormatter';
import {useAppSelector} from '../utils/hooks';
import {selectSidebarCollapsed} from '../utils/selectors';
import {setSidebarCollapsed} from '../slices/UISlice';
import { toggleStarAssistant } from '../slices/AssistantSlice';
import { toggleStarChat } from '../slices/ChatSlice';
import { logout } from '../slices/UserSlice';
import EditAssistantModal from './EditAssistantModal';
import ChatItemMenu from './ChatItemMenu';
import AssistantItemMenu from './AssistantItemMenu';
import RenameDialog from './RenameDialog';
import DeleteChatConfirmationDialog from './DeleteChatConfirmationDialog';
import AssistantDeleteConfirmDialog from './AssistantDeleteConfirmDialog';
import AssignScheduledChatDialog from './AssignScheduledChatDialog';
import { assignScheduledChat } from '../services/ChatCRUDService';
import LoadingSpinner from './LoadingSpinner';
import logo2 from '../assets/icons/logo2.svg';
import ChatHistoryModal from './ChatHistoryModal';
import AccountMenu from './AccountMenu';

type ChatsByAssistant = Record<string, Chat[]>;

interface SidebarProps {
    assistants: Assistant[];
    chats: ChatsByAssistant;
    selectedAssistant: string;
    onSelectAssistant: (assistantId: string) => void;
    selectedChatId: string | null;
    onSelectChat: (chatId: string) => void;
    userId: string;
    onOpenNewAssistantModal: () => void;
    onAssistantUpdate: (updatedAssistant: Assistant) => void;
    onChatRename: (chatId: string, newTitle: string) => void;
    onChatDelete: (chatId: string) => void;
    onAssistantDeleted: (assistantId: string) => void;
    resetChatState: () => void;
    isLoadingAssistants?: boolean;
    onLogout: () => void;
    onOpenSettings: () => void;
}


const Sidebar: React.FC<SidebarProps> = ({
    assistants,
    chats,
    selectedAssistant,
    onSelectAssistant,
    selectedChatId,
    onSelectChat,
    userId,
    onOpenNewAssistantModal,
    onAssistantUpdate,
    onChatRename,
    onChatDelete,
    onAssistantDeleted,
    resetChatState,
    isLoadingAssistants = false,
    onLogout,
    onOpenSettings,
}) => {
    const dispatch = useDispatch();
    const [openAssistant, setOpenAssistant] = useState<string | null>(selectedAssistant);
    const collapsed = useAppSelector(selectSidebarCollapsed);
    const currentUser = useAppSelector((state) => state.user.currentUser);
    const clickTimerRef = React.useRef<NodeJS.Timeout | null>(null);
    const userProfileButtonRef = useRef<HTMLDivElement>(null);

    // Hover states for agents, chats, and recents
    const [hoveredAssistantId, setHoveredAssistantId] = useState<string | null>(null);
    const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
    const [hoveredRecentChatId, setHoveredRecentChatId] = useState<string | null>(null);
    const [isNewChatHovered, setIsNewChatHovered] = useState(false);
    const [isChatsButtonHovered, setIsChatsButtonHovered] = useState(false);
    const [isNewAssistantHovered, setIsNewAssistantHovered] = useState(false);
    const [isUserProfileHovered, setIsUserProfileHovered] = useState(false);

    // Search state
    // TODO: Search functionality - Removed UI but preserved logic for future use
    // const [searchQuery, setSearchQuery] = useState('');

    // Chat menu states
    const [showRenameDialog, setShowRenameDialog] = useState(false);
    const [showDeleteChatDialog, setShowDeleteChatDialog] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAssistantDeleteDialog, setShowAssistantDeleteDialog] = useState(false);
    const [showAssignDialog, setShowAssignDialog] = useState(false);
    const [showChatHistoryModal, setShowChatHistoryModal] = useState(false);
    const [showAccountMenu, setShowAccountMenu] = useState(false);
    const [selectedChatForAction, setSelectedChatForAction] = useState<Chat | null>(null);
    const [selectedAssistantForAction, setSelectedAssistantForAction] = useState<Assistant | null>(null);

    // Real-time filtering logic
    // TODO: Search functionality - Removed UI but preserved logic for future use
    // const filteredAssistants = useMemo(() => {
    //     if (!searchQuery.trim()) return assistants;
    //
    //     const query = searchQuery.toLowerCase();
    //     return assistants.filter(assistant =>
    //         assistant.name.toLowerCase().includes(query) ||
    //         (assistant.subtitle && assistant.subtitle.toLowerCase().includes(query))
    //     );
    // }, [assistants, searchQuery]);

    // Filter chats based on search query
    // TODO: Search functionality - Removed UI but preserved logic for future use
    // const filteredChats = useMemo(() => {
    //     if (!searchQuery.trim()) return chats;
    //
    //     const query = searchQuery.toLowerCase();
    //     const result: ChatsByAssistant = {};
    //
    //     Object.entries(chats).forEach(([assistantId, chatList]) => {
    //         const filtered = chatList.filter(chat =>
    //             chat.title && chat.title.toLowerCase().includes(query)
    //         );
    //         if (filtered.length > 0) {
    //             result[assistantId] = filtered;
    //         }
    //     });
    //
    //     return result;
    // }, [chats, searchQuery]);

    useEffect(() => {
        setOpenAssistant(selectedAssistant);
    }, [selectedAssistant]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (clickTimerRef.current) {
                clearTimeout(clickTimerRef.current);
            }
        };
    }, []);

    const handleToggleCollapsed = () => {
        const newCollapsed = !collapsed;
        dispatch(setSidebarCollapsed(newCollapsed));

        if (!newCollapsed && selectedAssistant) {
            setOpenAssistant(selectedAssistant);
        }
    };

    const handleAssistantClick = (assistant: Assistant, chatList: Chat[]) => {
        const isOpen = openAssistant === assistant.id;

        if (collapsed) {
            // In collapsed mode: use single vs double click logic
            if (clickTimerRef.current) {
                // This is a double-click
                clearTimeout(clickTimerRef.current);
                clickTimerRef.current = null;

                // Double click: expand sidebar and show this agent's chats
                dispatch(setSidebarCollapsed(false));
                setOpenAssistant(assistant.id);
                onSelectAssistant(assistant.id);
            } else {
                // This is potentially a single click - wait to see if double click follows
                clickTimerRef.current = setTimeout(() => {
                    clickTimerRef.current = null;

                    // Single click: open most recent chat
                    if (chatList.length > 0) {
                        const mostRecentChat = chatList.sort((a, b) => b.id.localeCompare(a.id))[0];
                        onSelectChat(mostRecentChat.id);
                        onSelectAssistant(assistant.id);
                    } else {
                        // No chats, just select the assistant
                        onSelectAssistant(assistant.id);
                    }
                }, 250); // 250ms delay to detect double-click
            }
        } else {
            // In expanded mode: just toggle the chat list
            setOpenAssistant(isOpen ? null : assistant.id);
            onSelectAssistant(assistant.id);
        }
    };

    const handleRenameChat = (chatId: string) => {
        const chat = Object.values(chats).flat().find(c => c.id === chatId);
        if (chat) {
            setSelectedChatForAction(chat);
            setSelectedAssistantForAction(null);
            setShowRenameDialog(true);
        }
    };

    const handleDeleteChat = (chatId: string) => {
        const chat = Object.values(chats).flat().find(c => c.id === chatId);
        if (chat) {
            setSelectedChatForAction(chat);
            setShowDeleteChatDialog(true);
        }
    };

    const handleStarAssistant = (assistantId: string) => {
        dispatch(toggleStarAssistant(assistantId));
    };

    const handleStarChat = (chatId: string) => {
        dispatch(toggleStarChat(chatId));
    };

    const handleEditAssistant = (assistantId: string) => {
        const assistant = assistants.find(a => a.id === assistantId);
        if (assistant) {
            setSelectedAssistantForAction(assistant);
            setShowEditModal(true);
        }
    };

    const handleDeleteAssistant = (assistantId: string) => {
        const assistant = assistants.find(a => a.id === assistantId);
        if (assistant) {
            setSelectedAssistantForAction(assistant);
            setShowAssistantDeleteDialog(true);
        }
    };

    const handleNewChatWithAssistant = (assistantId: string) => {
        resetChatState();
        onSelectAssistant(assistantId);
    };

    const handleAssignForAI = (chatId: string) => {
        const chat = Object.values(chats).flat().find(c => c.id === chatId);
        if (chat) {
            setSelectedChatForAction(chat);
            setShowAssignDialog(true);
        }
    };

    const handleAssignConfirm = async (subject: string, period: number, code: string) => {
        if (selectedChatForAction) {
            try {
                await assignScheduledChat(userId, selectedChatForAction.id, subject, period, code);
                console.log('Chat assigned for AI responses successfully');
            } catch (error) {
                console.error('Failed to assign chat for AI responses:', error);
            }
        }
        setShowAssignDialog(false);
        setSelectedChatForAction(null);
    };

    const handleSaveRename = (newTitle: string) => {
        if (selectedChatForAction) {
            onChatRename(selectedChatForAction.id, newTitle);
        }
        setShowRenameDialog(false);
        setSelectedChatForAction(null);
    };

    const handleConfirmDeleteChat = () => {
        if (selectedChatForAction) {
            onChatDelete(selectedChatForAction.id);
        }
        setShowDeleteChatDialog(false);
        setSelectedChatForAction(null);
    };

    return (
        <>
            <div
                className={`flex flex-col justify-between h-screen fixed left-0 top-0 overflow-hidden transition-all duration-300 ease-in-out ${collapsed ? 'w-20' : 'w-1/5'}`}
                style={{
                    backgroundColor: 'rgb(31, 30, 28)',
                    borderRadius: '16px 0 0 0',
                    zIndex: 50,
                    transform: 'translateX(0)',
                    width: collapsed ? '80px' : '282px',
                    maxHeight: '100vh',
                    borderRight: '1px solid rgba(255, 255, 255, 0.10)',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none'
                }}
            >
                {/* Fixed Header - Compact spacing */}
                <div style={{
                    padding: '24px 16px 0 16px',
                    flexShrink: 0
                }}>
                    {/* BGOS Title and Collapse/Expand Button */}
                    <div className={collapsed ? 'flex justify-center' : 'flex items-center gap-3'} style={{ marginBottom: 32 }}>
                        {!collapsed ? (
                            <>
                                <button
                                    onClick={handleToggleCollapsed}
                                    className="w-8 h-8 rounded-md border-none cursor-pointer z-10 transition-all duration-200 flex items-center justify-center p-0 hover:bg-white/10"
                                    title="Collapse"
                                    style={{ backgroundColor: 'transparent' }}
                                >
                                    <img
                                        src={collapseIcon}
                                        alt="collapse sidebar"
                                        className="w-6 h-6 block"
                                    />
                                </button>
                                <span className="text-white font-normal text-2xl tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
                                    BGOS
                                </span>
                            </>
                        ) : (
                            <motion.button
                                onClick={handleToggleCollapsed}
                                className="w-8 h-8 rounded-md border-none cursor-pointer z-10 flex items-center justify-center p-0"
                                title="Expand"
                                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                                transition={{ duration: 0.2 }}
                                style={{ backgroundColor: 'transparent' }}
                            >
                                <img
                                    src={expandIcon}
                                    alt="expand sidebar"
                                    className="w-6 h-6 block"
                                />
                            </motion.button>
                        )}
                    </div>

                    {/* New Chat Button - Both Modes */}
                    {!collapsed ? (
                        <motion.div
                            className="flex items-center gap-3 cursor-pointer transition-colors duration-200 rounded-lg p-2"
                            onClick={() => resetChatState()}
                            onMouseEnter={() => setIsNewChatHovered(true)}
                            onMouseLeave={() => setIsNewChatHovered(false)}
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            style={{
                                marginBottom: 24,
                                backgroundColor: isNewChatHovered ? 'rgba(255, 255, 0, 0.1)' : 'transparent'
                            }}
                        >
                            <motion.img
                                src={newChatIcon}
                                alt="new chat"
                                className="w-6 h-6 flex-shrink-0"
                                animate={{ rotate: 0 }}
                                whileTap={{ rotate: 45 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                            />
                            <span className="font-normal text-base" style={{
                                fontFamily: 'inherit',
                                color: isNewChatHovered ? '#ffffff' : 'rgb(166, 165, 157)'
                            }}>
                                New chat
                            </span>
                        </motion.div>
                    ) : (
                        <div className="flex justify-center" style={{ marginBottom: 24 }}>
                            <motion.button
                                onClick={() => resetChatState()}
                                className="rounded-full border-none cursor-pointer flex items-center justify-center p-0"
                                title="New chat"
                                onMouseEnter={() => setIsNewChatHovered(true)}
                                onMouseLeave={() => setIsNewChatHovered(false)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                style={{
                                    backgroundColor: isNewChatHovered ? 'rgba(255, 255, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                    width: '40px',
                                    height: '40px'
                                }}
                            >
                                <motion.img
                                    src={newChatIcon}
                                    alt="new chat"
                                    className="w-6 h-6 block"
                                    animate={{ rotate: 0 }}
                                    whileTap={{ rotate: 45 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                />
                            </motion.button>
                        </div>
                    )}

                    {/* Navigation Sections */}
                    {!collapsed && (
                        <div>
                            {/* Chats Section */}
                            <motion.div
                                className="flex items-center gap-2 cursor-pointer transition-colors duration-200 rounded-lg p-2"
                                onClick={() => setShowChatHistoryModal(true)}
                                onMouseEnter={() => setIsChatsButtonHovered(true)}
                                onMouseLeave={() => setIsChatsButtonHovered(false)}
                                whileHover={{ x: 2 }}
                                transition={{ duration: 0.2 }}
                                style={{
                                    marginBottom: 4,
                                    backgroundColor: isChatsButtonHovered ? 'rgba(255, 255, 255, 0.05)' : 'transparent'
                                }}
                            >
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <MessagesSquare size={16} style={{ color: isChatsButtonHovered ? '#ffffff' : 'rgb(166, 165, 157)' }} strokeWidth={1.5} />
                                </motion.div>
                                <span className="text-sm font-normal" style={{
                                    fontFamily: 'inherit',
                                    color: isChatsButtonHovered ? '#ffffff' : 'rgb(166, 165, 157)'
                                }}>
                                    Chats
                                </span>
                            </motion.div>

                            {/* Agents Section Header */}
                            <div className="p-2" style={{ marginTop: 8, marginBottom: 8 }}>
                                <span className="text-sm font-normal" style={{ fontFamily: 'inherit', color: 'rgb(166, 165, 157)' }}>
                                    Agents
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Scrollable Assistants List */}
                <div className="flex flex-1 overflow-y-auto" style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    minHeight: 0,
                    padding: collapsed ? "0" : "0 16px",
                    paddingTop: "0",
                    marginBottom: 8
                }}>
                    <div className='flex flex-col items-center' style={{
                        padding: collapsed ? '0 8px' : '0'
                    }}>

                        {/* Assistants List */}
                        <div className={`flex flex-col ${collapsed ? 'items-center gap-2' : 'gap-1'}`}>
                            {isLoadingAssistants && assistants.length === 0 && (
                                <div className="flex items-center justify-center py-4">
                                    <LoadingSpinner overlaySize={20} />
                                </div>
                            )}
                            {assistants
                                .slice()
                                .sort((a, b) => {
                                    // Sort starred first by starOrder, then unstarred
                                    if (a.isStarred && !b.isStarred) return -1;
                                    if (!a.isStarred && b.isStarred) return 1;
                                    if (a.isStarred && b.isStarred) {
                                        return (a.starOrder || 0) - (b.starOrder || 0);
                                    }
                                    // Unstarred items keep their original order
                                    return 0;
                                })
                                .map((a) => {
                                const isOpen = openAssistant === a.id;
                                const chatList = chats[a.id] || [];
                                const unreadSum = chatList.reduce((sum, c) => sum + c.unread, 0);
                                const isHovered = hoveredAssistantId === a.id;
                                const isSelected = a.id === selectedAssistant;

                                return (
                                    <div key={a.id} className="">
                                        <motion.div
                                            className="flex items-center cursor-pointer relative transition-colors duration-200"
                                            style={{
                                                backgroundColor: isSelected ? '#141512' : (isHovered ? 'rgba(255, 255, 255, 0.05)' : 'transparent'),
                                                borderRadius: '6px',
                                                display: 'flex',
                                                padding: '8px 9px 8px 12px',
                                                alignItems: 'center',
                                                alignContent: 'center',
                                                gap: '12px',
                                                width: !collapsed ? '248px' : 'unset',
                                                userSelect: 'none',
                                                WebkitUserSelect: 'none',
                                                MozUserSelect: 'none',
                                                msUserSelect: 'none'
                                            }}
                                            onClick={() => handleAssistantClick(a, chatList)}
                                            onMouseEnter={() => setHoveredAssistantId(a.id)}
                                            onMouseLeave={() => setHoveredAssistantId(null)}
                                            whileHover={{ x: 2 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div
                                                className="rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                                                style={{
                                                    backgroundColor: (() => {
                                                        const url = a.avatarUrl;
                                                        const isValidImage = url &&
                                                            typeof url === 'string' &&
                                                            url.trim() !== '' &&
                                                            !avatarColors.includes(url) &&
                                                            (url.startsWith('data:image/') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:'));

                                                        if (isValidImage) return 'transparent';
                                                        if (url && avatarColors.includes(url)) return url;
                                                        return getAvatarColor(a.name);
                                                    })(),
                                                    backgroundImage: (() => {
                                                        const url = a.avatarUrl;
                                                        const isValidImage = url &&
                                                            typeof url === 'string' &&
                                                            url.trim() !== '' &&
                                                            !avatarColors.includes(url) &&
                                                            (url.startsWith('data:image/') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:'));

                                                        return isValidImage ? `url(${url})` : 'none';
                                                    })(),
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    width: collapsed ? '40px' : '24px',
                                                    height: collapsed ? '40px' : '24px'
                                                }}
                                            >
                                                {(() => {
                                                    const url = a.avatarUrl;
                                                    const isValidImage = url &&
                                                        typeof url === 'string' &&
                                                        url.trim() !== '' &&
                                                        !avatarColors.includes(url) &&
                                                        (url.startsWith('data:image/') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:'));

                                                    return !isValidImage && (
                                                        <span
                                                            className="font-medium"
                                                            style={{
                                                                fontFamily: 'Styrene-B',
                                                                color: 'white',
                                                                fontSize: collapsed ? '16px' : '11px'
                                                            }}
                                                        >
                                                            {getInitials(a.name)}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                            {!collapsed && (
                                                <>
                                                    <div className="flex-1 ">
                                                        <div className="font-bold" style={{ fontSize: '13px', fontFamily: 'Styrene-B', color: isHovered ? '#ffffff' : 'rgb(166, 165, 157)' }}>{a.name}</div>
                                                        <div className="font-medium" style={{ fontSize: '11px', fontFamily: 'Styrene-B', color: isHovered ? '#ffffff' : 'rgb(166, 165, 157)' }}>{a.subtitle}</div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {unreadSum > 0 && (
                                                            <div className="bg-primary text-background rounded-full min-w-6 h-6 flex items-center justify-center font-bold text-sm">
                                                                {unreadSum}
                                                            </div>
                                                        )}
                                                        <AssistantItemMenu
                                                            assistant={a}
                                                            isSelected={a.id === selectedAssistant}
                                                            isHovered={isHovered}
                                                            onNewChat={handleNewChatWithAssistant}
                                                            onStar={handleStarAssistant}
                                                            onEdit={handleEditAssistant}
                                                            onDelete={handleDeleteAssistant}
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </motion.div>
                                        {isOpen && !collapsed && (
                                                <div className='flex flex-col gap-1' style={{ margin: '8px 0', width: !collapsed ? '248px' : 'unset' }}>
                                                    {chatList
                                                        .slice()
                                                        .sort((a, b) => {
                                                            // Sort starred first by starOrder, then unstarred by most recent
                                                            if (a.isStarred && !b.isStarred) return -1;
                                                            if (!a.isStarred && b.isStarred) return 1;
                                                            if (a.isStarred && b.isStarred) {
                                                                return (a.starOrder || 0) - (b.starOrder || 0);
                                                            }
                                                            // Unstarred chats sorted by timestamp (most recent first)
                                                            return compareChatsByDate(a, b);
                                                        })
                                                        .map(chat => {
                                                            const isChatHovered = hoveredChatId === chat.id;
                                                            const isChatSelected = chat.id === selectedChatId;

                                                            return (
                                                                <motion.div
                                                                    key={chat.id}
                                                                    className="group flex items-center cursor-pointer transition-colors duration-200 w-full"
                                                                    style={{
                                                                        gap: 0,
                                                                        height: '32px',
                                                                        fontSize: '12px',
                                                                        backgroundColor: isChatSelected ? '#141512' : (isChatHovered ? 'rgba(255, 255, 255, 0.05)' : 'transparent'),
                                                                        borderRadius: '6px',
                                                                        padding: '0 8px'
                                                                    }}
                                                                    onMouseEnter={() => setHoveredChatId(chat.id)}
                                                                    onMouseLeave={() => setHoveredChatId(null)}
                                                                    onClick={() => onSelectChat(chat.id)}
                                                                    whileHover={{ x: 2 }}
                                                                    transition={{ duration: 0.2 }}
                                                                >
                                                                    <div className="flex-1 min-w-0">
                                                                        <div
                                                                            className='truncate'
                                                                            style={{
                                                                                fontSize: '12px',
                                                                                color: isChatHovered ? '#ffffff' : 'rgb(166, 165, 157)',
                                                                                fontWeight: '400',
                                                                                fontFamily: 'Styrene-B',
                                                                                position: 'relative',
                                                                                overflow: 'hidden',
                                                                                textOverflow: 'ellipsis',
                                                                                whiteSpace: 'nowrap',
                                                                                paddingRight: '5px'
                                                                            }}
                                                                        >
                                                                            {chat.title}

                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        {chat.unread > 0 && (
                                                                            <div className="bg-primary text-background rounded-full min-w-5 h-5 flex items-center justify-center font-bold text-xs">
                                                                                {chat.unread}
                                                                            </div>
                                                                        )}
                                                                                                                                         <ChatItemMenu
                                                                             chat={chat}
                                                                             isSelected={chat.id === selectedChatId}
                                                                             onRename={handleRenameChat}
                                                                             onDelete={handleDeleteChat}
                                                                             onAssignForAI={handleAssignForAI}
                                                                             onStar={handleStarChat}
                                                                         />
                                                                    </div>
                                                                </motion.div>
                                                            );
                                                        })}
                                                </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Recents Section - Inside scrollable area */}
                        {!collapsed && (
                            <div style={{ marginTop: 16 }}>
                                <div className="p-2" style={{ marginTop: 8, marginBottom: 8 }}>
                                    <span className="text-sm font-normal" style={{ fontFamily: 'inherit', color: 'rgb(166, 165, 157)' }}>
                                        Recents
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1" style={{ margin: '8px 0', width: !collapsed ? '248px' : 'unset' }}>
                                    {(() => {
                                        // Get all chats from all assistants
                                        const allChats: (Chat & { assistantId: string })[] = [];
                                        Object.entries(chats).forEach(([assistantId, chatList]) => {
                                            chatList.forEach(chat => {
                                                allChats.push({
                                                    ...chat,
                                                    assistantId
                                                });
                                            });
                                        });

                                        // Sort by timestamp (most recent first) and take top 20
                                        const recentChats = allChats
                                            .sort((a, b) => compareChatsByDate(a, b))
                                            .slice(0, 20);

                                        if (recentChats.length === 0) {
                                            return (
                                                <div style={{ color: 'rgba(166, 165, 157, 0.5)', fontSize: 12, padding: '8px' }}>
                                                    No recent chats
                                                </div>
                                            );
                                        }

                                        return recentChats.map(chat => {
                                            const isHovered = hoveredRecentChatId === chat.id;
                                            const isSelected = chat.id === selectedChatId;

                                            return (
                                                <motion.div
                                                    key={chat.id}
                                                    className="group flex items-center cursor-pointer transition-colors duration-200 w-full"
                                                    style={{
                                                        gap: 0,
                                                        height: '32px',
                                                        fontSize: '12px',
                                                        backgroundColor: isSelected ? '#141512' : (isHovered ? 'rgba(255, 255, 255, 0.05)' : 'transparent'),
                                                        borderRadius: '6px',
                                                        padding: '0 8px'
                                                    }}
                                                    onClick={() => {
                                                        onSelectChat(chat.id);
                                                        onSelectAssistant(chat.assistantId);
                                                    }}
                                                    onMouseEnter={() => setHoveredRecentChatId(chat.id)}
                                                    onMouseLeave={() => setHoveredRecentChatId(null)}
                                                    whileHover={{ x: 2 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div
                                                            className="truncate"
                                                            style={{
                                                                fontSize: '12px',
                                                                color: isHovered ? '#ffffff' : 'rgb(166, 165, 157)',
                                                                fontWeight: '400',
                                                                fontFamily: 'Styrene-B',
                                                                position: 'relative',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                                paddingRight: '5px'
                                                            }}
                                                        >
                                                            {chat.title || 'Untitled'}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <ChatItemMenu
                                                            chat={chat}
                                                            isSelected={isSelected}
                                                            onRename={handleRenameChat}
                                                            onDelete={handleDeleteChat}
                                                            onAssignForAI={handleAssignForAI}
                                                            onStar={handleStarChat}
                                                        />
                                                    </div>
                                                </motion.div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Fixed Bottom Section */}

                <div className="" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: collapsed ? 'center' : 'stretch',
                    flexShrink: 0
                }}>

                    {/* New Assistant Button */}
                    {!collapsed && (
                        <div className="px-4">
                            <motion.div
                                className="flex items-center gap-3 cursor-pointer transition-colors duration-200 rounded-lg p-2"
                                onClick={onOpenNewAssistantModal}
                                onMouseEnter={() => setIsNewAssistantHovered(true)}
                                onMouseLeave={() => setIsNewAssistantHovered(false)}
                                whileHover={{ x: 2 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                style={{
                                    backgroundColor: isNewAssistantHovered ? 'rgba(255, 255, 0, 0.1)' : 'transparent'
                                }}
                            >
                                <motion.img
                                    src={addIcon}
                                    alt="add"
                                    className="w-6 h-6 flex-shrink-0"
                                    animate={{ rotate: 0 }}
                                    whileTap={{ rotate: 45 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                />
                                <span className="font-normal text-base" style={{
                                    fontFamily: 'inherit',
                                    color: isNewAssistantHovered ? '#ffffff' : 'rgb(166, 165, 157)'
                                }}>
                                    New Assistant
                                </span>
                            </motion.div>
                        </div>
                    )}



                    {/* Separator */}
                    {!collapsed && <div className="border-t mb-4" style={{ borderColor: 'rgba(255, 255, 255, 0.10)' }}></div>}

                    {/* User Profile Section */}
                    <motion.div
                        ref={userProfileButtonRef}
                        className="flex items-center gap-3 cursor-pointer transition-colors duration-200 rounded-lg"
                        style={{
                            padding: collapsed ? '16px 8px' : '16px',
                            backgroundColor: isUserProfileHovered ? 'rgba(255, 255, 255, 0.05)' : 'transparent'
                        }}
                        onClick={() => !collapsed && setShowAccountMenu(!showAccountMenu)}
                        onMouseEnter={() => setIsUserProfileHovered(true)}
                        onMouseLeave={() => setIsUserProfileHovered(false)}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg" style={{
                            backgroundColor: currentUser?.name ? getAvatarColor(currentUser.name) : '#2A2A2A',
                            color: '#ffffff',
                            fontFamily: 'Montserrat'
                        }}>
                            {currentUser?.name ? getInitials(currentUser.name) : (currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'U')}
                        </div>
                        {!collapsed && (
                            <>
                                <div className="flex-1">
                                    <div className="font-bold" style={{
                                        fontSize: '14px',
                                        fontFamily: 'Styrene-B',
                                        color: isUserProfileHovered ? '#ffffff' : 'rgb(166, 165, 157)'
                                    }}>
                                        {currentUser?.name || currentUser?.email || 'User'}
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        fontFamily: 'Styrene-B',
                                        color: isUserProfileHovered ? '#ffffff' : 'rgb(166, 165, 157)'
                                    }}>
                                        Free Plan
                                    </div>
                                </div>
                                <div className="cursor-pointer">
                                    {showAccountMenu ? (
                                        <ChevronUp size={20} style={{ color: isUserProfileHovered ? '#ffffff' : 'rgb(166, 165, 157)' }} />
                                    ) : (
                                        <ChevronDown size={20} style={{ color: isUserProfileHovered ? '#ffffff' : 'rgb(166, 165, 157)' }} />
                                    )}
                                </div>
                            </>
                        )}
                    </motion.div>

                    {/* Account Menu */}
                    {!collapsed && (
                        <AccountMenu
                            isOpen={showAccountMenu}
                            onClose={() => setShowAccountMenu(false)}
                            userEmail={currentUser?.email || 'User'}
                            triggerRef={userProfileButtonRef}
                            onOpenSettings={() => {
                                setShowAccountMenu(false);
                                onOpenSettings();
                            }}
                            onLogout={() => {
                                // Clear Redux user state
                                dispatch(logout());
                                setShowAccountMenu(false);
                                // Call parent logout handler to reset app state
                                onLogout();
                            }}
                        />
                    )}
                </div>
            </div>



            {/* Dialogs */}
            <RenameDialog
                isOpen={showRenameDialog}
                currentTitle={selectedChatForAction?.title || ''}
                chatId={selectedChatForAction?.id || ''}
                userId={userId}
                onSave={handleSaveRename}
                onCancel={() => {
                    setShowRenameDialog(false);
                    setSelectedChatForAction(null);
                }}
            />

            <DeleteChatConfirmationDialog
                isOpen={showDeleteChatDialog}
                chatId={selectedChatForAction?.id || ''}
                userId={userId}
                onConfirm={handleConfirmDeleteChat}
                onCancel={() => {
                    setShowDeleteChatDialog(false);
                    setSelectedChatForAction(null);
                }}
            />

            {showAssistantDeleteDialog && selectedAssistantForAction && (
                <AssistantDeleteConfirmDialog
                    userId={userId}
                    currentAssistant={selectedAssistantForAction}
                    onClose={() => {
                        setShowAssistantDeleteDialog(false);
                        setSelectedAssistantForAction(null);
                    }}
                    onAssistantDeleted={onAssistantDeleted}
                />
            )}

            {/* Edit Assistant Modal */}
            {showEditModal && selectedAssistantForAction && (
                <EditAssistantModal
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedAssistantForAction(null);
                    }}
                    userId={userId}
                    assistant={selectedAssistantForAction}
                    onUpdate={onAssistantUpdate}
                />
            )}

            {/* Assign Scheduled Chat Dialog */}
            {showAssignDialog && selectedChatForAction && (
                <AssignScheduledChatDialog
                    userId={userId}
                    selectedChatId={selectedChatForAction.id}
                    onClose={() => {
                        setShowAssignDialog(false);
                        setSelectedChatForAction(null);
                    }}
                    onConfirm={handleAssignConfirm}
                />
            )}

            {/* Chat History Modal */}
            <ChatHistoryModal
                isOpen={showChatHistoryModal}
                onClose={() => setShowChatHistoryModal(false)}
                onSelectChat={onSelectChat}
                onSelectAssistant={onSelectAssistant}
                resetChatState={resetChatState}
            />
        </>
    );
};

export default Sidebar;