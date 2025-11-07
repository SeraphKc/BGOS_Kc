import React, {useEffect, useRef, useState} from 'react';
import {Provider} from "react-redux";
import {store} from './config/storeConfig';
import {createRoot} from 'react-dom/client';
import './index.css';

import LoginForm from './components/LoginForm';
import ChatLayout from './components/ChatLayout';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import TitleBar from './components/TitleBar';
import {NotificationProvider, useNotification} from './hooks/useNotification';
import NotificationContainer from './components/NotificationContainer';
import NewAssistantModal from './components/NewAssistantModal';
import SettingsModal from './components/SettingsModal';
import {useKeyboardShortcuts} from './hooks/useKeyboardShortcuts';

import {useAppDispatch, useAppSelector} from './utils/hooks';
import {
    remoteDatabaseApi,
    useAddChatMutation,
    useFetchAssistantsWithChatsQuery,
    useFetchChatHistoryQuery
} from './services/DatabaseSyncService';
import {setAssistants} from './slices/AssistantSlice';
import {setChats} from './slices/ChatSlice';
import {addMessage, setChatHistory} from "./slices/ChatHistorySlice";
import {login} from './slices/UserSlice';
import {ChatHistory} from "./types/model/ChatHistory";
import {Assistant} from "./types/model/Assistant";
import {fetchUnreadMessages, UnreadMessagesMap} from './services/FetchUnreadMessagesService';
import {useUnreadNotifications} from './hooks/useUnreadNotifications';
import {Chat} from "./types/model/Chat";
import {AssistantAndChatDto} from "./types/n8n/AssistantsWithChatsDto";
import {flushSync} from "react-dom";
import {selectSidebarCollapsed} from './utils/selectors';

// Component for in-app unread notifications
const InAppUnreadNotifications: React.FC<{
    selectedChatId: string | null;
    chats: any[];
    assistants: any[];
    onSelectChat: (chatId: string) => void;
}> = ({ selectedChatId, chats, assistants, onSelectChat }) => {
    const { showNotification } = useNotification();
    const previousUnreadState = useRef<any>({});

    // Listen for unread messages changes and show in-app notifications
    useEffect(() => {
        const checkForNewUnreadMessages = () => {
            const newUnreadMessages: any = {};
            
            chats.forEach(chat => {
                if (chat.unread > 0) {
                    newUnreadMessages[chat.id] = chat.unread;
                }
            });

            Object.entries(newUnreadMessages).forEach(([chatId, unreadCount]) => {
                const previousCount = previousUnreadState.current[chatId] || 0;
                
                // Show in-app notification if there are new unread messages and user is in different chat
                if (unreadCount > previousCount && selectedChatId !== chatId) {
                    const chat = chats.find(c => c.id === chatId);
                    const assistant = assistants.find(a => a.id === chat?.assistantId);
                    
                    if (chat && assistant) {
                        showNotification({
                            type: 'unread-messages',
                            title: `New message from ${assistant.name}`,
                            message: `${unreadCount} an unread message in the chat "${chat.title}"`,
                            autoClose: true,
                            duration: 5000,
                            onClick: () => {
                                console.log('In-app notification clicked, opening chat:', chatId);
                                onSelectChat(chatId);
                            }
                        });
                    }
                }
            });

            // Update previous state
            previousUnreadState.current = { ...newUnreadMessages };
        };

        // Check every 2 seconds
        const interval = setInterval(checkForNewUnreadMessages, 2000);
        return () => clearInterval(interval);
    }, [selectedChatId, chats, assistants, showNotification, onSelectChat]);

    return null; // This component doesn't render anything
};

const App: React.FC = () => {

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [selectedAssistantId, setSelectedAssistantId] = useState<string | null>(null);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [showNewAssistantModal, setShowNewAssistantModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const resetUserInteractedRef = useRef(false);

    const dispatch = useAppDispatch();
    const {data: assistantsWithChatsData, isLoading: isLoadingAssistants} = useFetchAssistantsWithChatsQuery(
        {userId, token},
        { skip: !isLoggedIn || !userId || !token }
    );
    const {data: chatHistoryData, isLoading: isLoadingChatHistory, refetch: refetchChatHistory} = useFetchChatHistoryQuery(
        {userId, chatId: selectedChatId, token},
        { skip: !isLoggedIn || !userId || !token || !selectedChatId }
    );
    const [addChat] = useAddChatMutation();
    const assistants = useAppSelector((state) => state.assistants.list);
    const chats = useAppSelector((state) => state.chats.list);
    const chatHistory = useAppSelector((state) => state.chatHistory.list);
    const sidebarCollapsed = useAppSelector(selectSidebarCollapsed);

    useEffect(() => {
        if (assistantsWithChatsData) {
            dispatch(setAssistants(assistantsWithChatsData.assistants));
            dispatch(setChats(assistantsWithChatsData.chats));
        }
    }, [assistantsWithChatsData, dispatch]);

    useEffect(() => {
        if (isChatLoading) {
            dispatch(setChatHistory([]));
        }
    }, [isChatLoading]);

    useEffect(() => {
        if (selectedChatId === null) {
            return;
        }
        
        if (chatHistoryData && chatHistoryData.length > 0) {
            dispatch(setChatHistory(chatHistoryData));
        }

        setIsChatLoading(false);
    }, [chatHistoryData]);

    const handleSelectAssistant = (assistantId: string, skipChatLoading = false) => {
        if (selectedAssistantId !== assistantId && !skipChatLoading) {
            setSelectedAssistantId(assistantId);
            resetChatState();  // Always show new chat when selecting an agent
        }
    };

    const forceSelectAssistant = (assistantId: string) => {
        setSelectedAssistantId(assistantId);
        resetChatState();
    }

    const resetChatState = (): void => {
        setSelectedChatId(null);
        setIsChatLoading(false);
        dispatch(setChatHistory([]));
        resetUserInteractedRef.current = true;
    }

    const handleSelectChat = (chatId: string) => {
        if (selectedChatId !== chatId) {
            flushSync(() => {
                setIsChatLoading(true);
            });

            setSelectedChatId(chatId);

            const chat = chats.find(c => c.id === chatId);
            if (chat && chat.assistantId && chat.assistantId !== selectedAssistantId) {
                setSelectedAssistantId(chat.assistantId);
            }

            if (chat && chat.unread > 0) {
                dispatch(
                    remoteDatabaseApi.util.updateQueryData(
                        'fetchAssistantsWithChats',
                        { userId, token },
                        (draft) => {
                            if (draft) {
                                draft.chats = draft.chats.map((chat) =>
                                    chat.id === chatId
                                        ? { ...chat, unread: 0 }
                                        : chat
                                );
                            }
                        }
                    )
                );
            }
        }
    };

    // Initialize unread notifications hook
    const { processUnreadMessages } = useUnreadNotifications({
        selectedChatId,
        onOpenChat: handleSelectChat
    });

    // Fetch unread messages periodically
    useEffect(() => {
        if (!isLoggedIn) return;
        let timer: NodeJS.Timeout;
        const fetchAndSetUnread = async () => {
            try {
                const result = await fetchUnreadMessages(userId);
                
                if (result && Object.keys(result).length > 0) {
                    dispatch(
                        remoteDatabaseApi.util.updateQueryData(
                            'fetchAssistantsWithChats',
                            { userId, token },
                            (draft) => {
                                if (draft) {
                                    draft.chats = draft.chats.map((chat) =>
                                        result[chat.id] !== undefined
                                            ? { ...chat, unread: result[chat.id] }
                                            : chat
                                    );
                                }
                            }
                        )
                    );

                    const filteredChats: UnreadMessagesMap = chats.reduce((acc, chat) => {
                        const newUnread = result[chat.id];

                        if (newUnread !== undefined && newUnread !== null && newUnread !== chat.unread) {
                            acc[chat.id] = newUnread;
                        }

                        return acc;
                    }, {} as UnreadMessagesMap);
                    
                    // Process unread messages for notifications
                    processUnreadMessages(filteredChats);
                }
            } catch (e) {
                console.error('Failed to fetch unread messages:', e);
            }
        };

        timer = setInterval(fetchAndSetUnread, 1 * 60 * 1000);
        return () => clearInterval(timer);
    }, [isLoggedIn, processUnreadMessages]);

    // Global keyboard shortcuts
    useKeyboardShortcuts({
        onFocusSearch: () => {
            // TODO: Search functionality removed - no-op for now
        },
        onNewChat: () => {
            if (selectedAssistantId) {
                resetChatState();
            }
        },
        onOpenSettings: () => {
            setShowSettingsModal(true);
        },
        onOpenChatHistory: () => {
            // ChatHistory modal is managed in Sidebar, we'll handle this there
        },
        onEscape: () => {
            // Close modals in priority order
            if (showSettingsModal) {
                setShowSettingsModal(false);
            } else if (showNewAssistantModal) {
                setShowNewAssistantModal(false);
            }
        },
        onSelectStarredAgent: (index: number) => {
            // Get starred agents sorted by starOrder
            const starredAgents = assistants
                .filter(a => a.isStarred)
                .sort((a, b) => (a.starOrder || 0) - (b.starOrder || 0));

            // Select agent at index if it exists
            if (starredAgents[index]) {
                handleSelectAssistant(starredAgents[index].id);
            }
        }
    });

    const handleNewChat = async (chatFirstMessage: string): Promise<AssistantAndChatDto> => {
        let newChatFromBackend: Chat;
        try {
            newChatFromBackend = await addChat({userId, chatFirstMessage, token, assistantId: selectedAssistantId}).unwrap();
            if (!newChatFromBackend) {
                throw new Error('No chat id returned from backend');
            }
        } catch (e) {
            console.error('Failed to add chat:', e);
            return null;
        }

        const newChat: Chat = {
            id: newChatFromBackend.id,
            assistantId: newChatFromBackend.assistantId,
            title: newChatFromBackend.title,
            unread: 0
        };

        dispatch(
            remoteDatabaseApi.util.updateQueryData(
                'fetchAssistantsWithChats',
                { userId, token },
                (draft) => {
                    if (draft) {
                        draft.chats.push(newChat);
                    }
                }
            )
        );

        setSelectedAssistantId(newChatFromBackend.assistantId);
        setSelectedChatId(newChatFromBackend.id);
        const assistant = assistants?.find(a => a.id === newChatFromBackend.assistantId) || null;

        return {
            assistant,
            chat: newChat
        };
    };

    const handleChatMessage = async (msg: ChatHistory): Promise<ChatHistory> => {

        // Определяем, есть ли смешанные типы вложений
        let isMixedAttachments = false;
        if (msg.files && msg.files.length > 1) {
            const types = new Set<string>();
            msg.files.forEach(file => {
                if (file.isImage) types.add('image');
                if (file.isVideo) types.add('video');
                if (file.isAudio) types.add('audio');
                if (file.isDocument) types.add('document');
            });
            isMixedAttachments = types.size > 1;
        }

        if (!msg.chatId) {
            msg.chatId = selectedChatId;
        }
        msg.sentDate = new Date().toISOString();
        msg.isMixedAttachments = isMixedAttachments;

        await updateChatHistory(msg);

        return msg;
    };

    const updateChatHistoryLocal = (newMessage: ChatHistory): void => {
        dispatch(setChatHistory([]));
        dispatch(addMessage(newMessage));
    }

    const updateChatHistory = async (newMessage: ChatHistory, isNewChat: boolean = false) => {

        if (isNewChat) {
            refetchChatHistory();
        } else {
            dispatch(
                remoteDatabaseApi.util.updateQueryData(
                    'fetchChatHistory',
                    {userId, chatId: newMessage.chatId, token},
                    (draft) => {
                        if (draft) {
                            draft.push(newMessage);
                        }
                    }
                )
            );
        }
    };

    const handleCreateAssistant = (newAssistant: Assistant) => {
        dispatch(
            remoteDatabaseApi.util.updateQueryData(
                'fetchAssistantsWithChats',
                { userId, token },
                (draft) => {
                    if (draft) {
                        draft.assistants.push(newAssistant);
                    }
                }
            )
        );
        setShowNewAssistantModal(false);
    };

    const handleAssistantDelete = (assistantId: string) => {
        const updatedAssistants = assistants.filter(assistant => assistant.id !== assistantId);

        dispatch(
            remoteDatabaseApi.util.updateQueryData(
                'fetchAssistantsWithChats',
                { userId, token },
                (draft) => {
                    if (draft) {
                        draft.assistants = draft.assistants.filter(
                            (assistant) => assistant.id !== assistantId
                        );
                    }
                }
            )
        );

        if (selectedAssistantId === assistantId && updatedAssistants.length > 0 && updatedAssistants[0]?.id) {
            handleSelectAssistant(updatedAssistants[0].id);
        } else {
            // todo пока не предусмотренно сценария, если пользователь удалит всех ассистентов
        }
    };

    const handleAssistantUpdate = (updatedAssistant: Assistant) => {
        dispatch(
            remoteDatabaseApi.util.updateQueryData(
                'fetchAssistantsWithChats',
                { userId, token },
                (draft) => {
                    if (draft) {
                        draft.assistants = draft.assistants.map((assistant) =>
                            assistant.id === updatedAssistant.id
                                ? updatedAssistant
                                : assistant
                        );
                    }
                }
            )
        );
    };

    const handleChatRename = (chatId: string, newTitle: string) => {
        dispatch(
            remoteDatabaseApi.util.updateQueryData(
                'fetchAssistantsWithChats',
                { userId, token },
                (draft) => {
                    if (draft) {
                        draft.chats = draft.chats.map((chat) =>
                            chat.id === chatId
                                ? { ...chat, title: newTitle }
                                : chat
                        );
                    }
                }
            )
        );
    };

    const handleChatDelete = (chatId: string) => {
        const deletedChat = chats.find(chat => chat.id === chatId);

        dispatch(
            remoteDatabaseApi.util.updateQueryData(
                'fetchAssistantsWithChats',
                { userId, token },
                (draft) => {
                    if (draft) {
                        draft.chats = draft.chats.filter(
                            (chat) => chat.id !== chatId
                        );
                    }
                }
            )
        );
        
        if (selectedChatId === chatId && deletedChat) {
            const assistantChats = chats.filter(chat => 
                chat.assistantId === deletedChat.assistantId && chat.id !== chatId
            );
            
            if (assistantChats.length > 0 && assistantChats[0]?.id) {
                handleSelectChat(assistantChats[0]?.id);
            } else {
                resetChatState()
            }
        }
    };

    const handleOpenNewAssistantModal = () => {
        setShowNewAssistantModal(true);
    };

    const handleLogout = () => {
        // Reset local state
        setIsLoggedIn(false);
        setUserId(null);
        setToken(null);

        // Reset chat state
        resetChatState();

        // Clear any cached data (will be handled by Redux logout action in Sidebar)
        // Redux user state is already cleared by dispatch(logout()) in Sidebar
    };

    if (!isLoggedIn) {
        return <LoginForm onLogin={({userId, token}) => {
            setIsLoggedIn(true);
            setUserId(userId);
            setToken(token);

            // Store user in Redux
            dispatch(login({
                user: {
                    id: userId,
                    email: 'kc@gmail.com', // Hardcoded for now - will come from backend
                    name: 'Karim C',
                    avatar: '',
                    role: '', // Will be set in Settings
                    preferences: {
                        theme: 'dark',
                        language: 'en',
                        notifications: true
                    }
                },
                token
            }));
        }} />;
    }

    return (
        <NotificationProvider>
            <TitleBar sidebarCollapsed={sidebarCollapsed} />
            <ChatLayout>
                <Sidebar
                    assistants={assistants}
                    chats={chats.reduce((acc, chat) => {
                        const key = chat.assistantId;
                        acc[key] = [...(acc[key] || []), chat];
                        return acc;
                    }, {} as Record<string, typeof chats>)}
                    selectedAssistant={selectedAssistantId}
                    onSelectAssistant={handleSelectAssistant}
                    selectedChatId={selectedChatId}
                    onSelectChat={handleSelectChat}
                    userId={userId!}
                    onOpenNewAssistantModal={handleOpenNewAssistantModal}
                    onAssistantUpdate={handleAssistantUpdate}
                    onChatRename={handleChatRename}
                    onChatDelete={handleChatDelete}
                    onAssistantDeleted={handleAssistantDelete}
                    resetChatState={resetChatState}
                    isLoadingAssistants={isLoadingAssistants}
                    onLogout={handleLogout}
                    onOpenSettings={() => setShowSettingsModal(true)}
                />
                <ChatArea
                    currentAssistant={assistants.find(a => a.id === selectedAssistantId)}
                    currentChat={chats?.find(c => c.id === selectedChatId) || null}
                    chatHistory={chatHistory}
                    onChatMessage={handleChatMessage}
                    updateChatHistory={updateChatHistory}
                    updateChatHistoryLocal={updateChatHistoryLocal}
                    onSelectAssistant={handleSelectAssistant}
                    handleNewChat = {handleNewChat}
                    assistants={assistants}
                    userId={userId}
                    isLoading={isChatLoading}
                    isLoadingAssistants={isLoadingAssistants}
                    resetUserInteractedRef={resetUserInteractedRef}
                    forceSelectAssistant={forceSelectAssistant}
                />
            </ChatLayout>
            <NotificationContainer />

            {/* In-app unread notifications */}
            <InAppUnreadNotifications
                selectedChatId={selectedChatId}
                chats={chats}
                assistants={assistants}
                onSelectChat={handleSelectChat}
            />

            {/* New Assistant Modal - rendered at app level */}
            {showNewAssistantModal && (
                <NewAssistantModal
                    onClose={() => setShowNewAssistantModal(false)}
                    userId={userId!}
                    onCreate={handleCreateAssistant}
                />
            )}

            {/* Settings Modal - rendered at app level */}
            <SettingsModal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
            />
        </NotificationProvider>
    );
};

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(
        <Provider store={store}>
            <App />
        </Provider>
    );
}
