import React, { useState } from 'react';
import { Settings, Globe, HelpCircle, TrendingUp, Info, LogOut, ChevronRight } from 'lucide-react';
import ContextMenuPortal from './ContextMenuPortal';

interface AccountMenuProps {
    isOpen: boolean;
    onClose: () => void;
    userEmail: string;
    triggerRef: React.RefObject<HTMLDivElement>;
    onOpenSettings: () => void;
    onLogout: () => void;
}

const AccountMenu: React.FC<AccountMenuProps> = ({
    isOpen,
    onClose,
    userEmail,
    triggerRef,
    onOpenSettings,
    onLogout
}) => {
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null);

    const handleLogout = () => {
        onLogout();
        onClose();
    };

    const handlePlaceholderClick = (item: string) => {
        console.log(`${item} clicked - placeholder functionality`);
    };

    if (!isOpen) return null;

    return (
        <ContextMenuPortal
            isOpen={isOpen}
            triggerRef={triggerRef}
            onClose={onClose}
        >
                <div
                    className="rounded-lg border shadow-lg"
                    style={{
                        backgroundColor: 'rgb(48, 48, 46)',
                        borderColor: '#3c3c3a',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                        minWidth: '280px'
                    }}
                >
                    <div className="py-1">
                        {/* User Email */}
                        <div
                            className="px-4 py-3"
                            style={{
                                color: '#9a9a98',
                                fontSize: '12px',
                                fontFamily: 'Styrene-B',
                                borderBottom: '1px solid #3c3c3a'
                            }}
                        >
                            {userEmail}
                        </div>

                        {/* Settings */}
                        <button
                            onClick={onOpenSettings}
                            onMouseEnter={() => setHoveredItem('settings')}
                            onMouseLeave={() => setHoveredItem(null)}
                            className="w-full px-4 py-3 text-left transition-colors duration-200 focus:outline-none flex items-center justify-between"
                            style={{
                                backgroundColor: hoveredItem === 'settings' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                                color: hoveredItem === 'settings' ? '#ffffff' : '#a7a7a5',
                                fontSize: '13px',
                                fontFamily: 'Styrene-B'
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <Settings size={18} />
                                <span>Settings</span>
                            </div>
                            <span style={{ color: '#6b6b68', fontSize: '12px' }}>Ctrl+,</span>
                        </button>

                        {/* Language */}
                        <button
                            onClick={() => handlePlaceholderClick('Language')}
                            onMouseEnter={() => {
                                setHoveredItem('language');
                                setExpandedSubmenu('language');
                            }}
                            onMouseLeave={() => {
                                setHoveredItem(null);
                                setExpandedSubmenu(null);
                            }}
                            className="w-full px-4 py-3 text-left transition-colors duration-200 focus:outline-none flex items-center justify-between"
                            style={{
                                backgroundColor: hoveredItem === 'language' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                                color: hoveredItem === 'language' ? '#ffffff' : '#a7a7a5',
                                fontSize: '13px',
                                fontFamily: 'Styrene-B'
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <Globe size={18} />
                                <span>Language</span>
                            </div>
                            <ChevronRight size={16} style={{ color: hoveredItem === 'language' ? '#ffffff' : '#6b6b68' }} />
                        </button>

                        {/* Get help */}
                        <button
                            onClick={() => handlePlaceholderClick('Get help')}
                            onMouseEnter={() => setHoveredItem('help')}
                            onMouseLeave={() => setHoveredItem(null)}
                            className="w-full px-4 py-3 text-left transition-colors duration-200 focus:outline-none flex items-center gap-3"
                            style={{
                                backgroundColor: hoveredItem === 'help' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                                color: hoveredItem === 'help' ? '#ffffff' : '#a7a7a5',
                                fontSize: '13px',
                                fontFamily: 'Styrene-B'
                            }}
                        >
                            <HelpCircle size={18} />
                            <span>Get help</span>
                        </button>

                        {/* Upgrade plan */}
                        <button
                            onClick={() => handlePlaceholderClick('Upgrade plan')}
                            onMouseEnter={() => setHoveredItem('upgrade')}
                            onMouseLeave={() => setHoveredItem(null)}
                            className="w-full px-4 py-3 text-left transition-colors duration-200 focus:outline-none flex items-center gap-3"
                            style={{
                                backgroundColor: hoveredItem === 'upgrade' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                                color: hoveredItem === 'upgrade' ? '#ffffff' : '#a7a7a5',
                                fontSize: '13px',
                                fontFamily: 'Styrene-B'
                            }}
                        >
                            <TrendingUp size={18} />
                            <span>Upgrade plan</span>
                        </button>

                        {/* Learn more */}
                        <button
                            onClick={() => handlePlaceholderClick('Learn more')}
                            onMouseEnter={() => {
                                setHoveredItem('learn');
                                setExpandedSubmenu('learn');
                            }}
                            onMouseLeave={() => {
                                setHoveredItem(null);
                                setExpandedSubmenu(null);
                            }}
                            className="w-full px-4 py-3 text-left transition-colors duration-200 focus:outline-none flex items-center justify-between"
                            style={{
                                backgroundColor: hoveredItem === 'learn' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                                color: hoveredItem === 'learn' ? '#ffffff' : '#a7a7a5',
                                fontSize: '13px',
                                fontFamily: 'Styrene-B'
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <Info size={18} />
                                <span>Learn more</span>
                            </div>
                            <ChevronRight size={16} style={{ color: hoveredItem === 'learn' ? '#ffffff' : '#6b6b68' }} />
                        </button>

                        {/* Separator */}
                        <div className="border-t mx-2" style={{ borderColor: '#3c3c3a', margin: '4px 8px' }}></div>

                        {/* Log out */}
                        <button
                            onClick={handleLogout}
                            onMouseEnter={() => setHoveredItem('logout')}
                            onMouseLeave={() => setHoveredItem(null)}
                            className="w-full px-4 py-3 text-left transition-colors duration-200 focus:outline-none flex items-center gap-3"
                            style={{
                                backgroundColor: hoveredItem === 'logout' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                                color: hoveredItem === 'logout' ? '#ffffff' : '#a7a7a5',
                                fontSize: '13px',
                                fontFamily: 'Styrene-B'
                            }}
                        >
                            <LogOut size={18} />
                            <span>Log out</span>
                        </button>
                    </div>
                </div>
        </ContextMenuPortal>
    );
};

export default AccountMenu;
