import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import hamburgerIcon from '../assets/icons/hamburger-menu.svg';
import logo from '../assets/icons/logo-icon-only.svg';
import minimizeIcon from '../assets/icons/minimize-window.svg';
import maximizeIcon from '../assets/icons/maximize-window.svg';
import restoreIcon from '../assets/icons/restore-window.svg';
import closeIcon from '../assets/icons/close-window.svg';

interface TitleBarProps {
    sidebarCollapsed?: boolean;
}

const TitleBar: React.FC<TitleBarProps> = ({ sidebarCollapsed = false }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);

    // Check if window is maximized on mount
    useEffect(() => {
        const checkMaximized = async () => {
            if (window.electron?.isMaximized) {
                const maximized = await window.electron.isMaximized();
                setIsMaximized(maximized);
            }
        };
        checkMaximized();
    }, []);

    const handleMinimize = () => {
        if (window.electron?.minimizeWindow) {
            window.electron.minimizeWindow();
        }
    };

    const handleMaximize = () => {
        if (window.electron?.maximizeWindow) {
            window.electron.maximizeWindow();
            setIsMaximized(!isMaximized);
        }
    };

    const handleClose = () => {
        if (window.electron?.closeWindow) {
            window.electron.closeWindow();
        }
    };

    const handleMenuItemClick = (action: string) => {
        setIsMenuOpen(false);

        switch (action) {
            case 'exit':
                handleClose();
                break;
            case 'undo':
                document.execCommand('undo');
                break;
            case 'redo':
                document.execCommand('redo');
                break;
            case 'cut':
                document.execCommand('cut');
                break;
            case 'copy':
                document.execCommand('copy');
                break;
            case 'paste':
                document.execCommand('paste');
                break;
            case 'reload':
                window.location.reload();
                break;
            case 'forceReload':
                window.location.reload();
                break;
            case 'toggleDevTools':
                // This would require IPC to main process
                console.log('Toggle DevTools');
                break;
            case 'resetZoom':
                document.body.style.zoom = '100%';
                break;
            case 'zoomIn':
                const currentZoomIn = parseFloat(document.body.style.zoom || '100');
                document.body.style.zoom = `${currentZoomIn + 10}%`;
                break;
            case 'zoomOut':
                const currentZoomOut = parseFloat(document.body.style.zoom || '100');
                document.body.style.zoom = `${currentZoomOut - 10}%`;
                break;
            case 'toggleFullscreen':
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen();
                } else {
                    document.exitFullscreen();
                }
                break;
        }
    };

    const sidebarWidth = sidebarCollapsed ? 80 : 282;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: sidebarWidth,
                right: 0,
                height: '48px',
                backgroundColor: 'rgb(31, 30, 28)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.10)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                gap: '12px',
                zIndex: 100,
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                WebkitAppRegion: 'drag' as any, // Allow dragging the window
                transition: 'left 0.3s ease-in-out',
            }}
        >
            {/* Hamburger Menu Button */}
            <motion.button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    WebkitAppRegion: 'no-drag' as any, // Allow clicking the button
                }}
            >
                <img src={hamburgerIcon} alt="Menu" style={{ width: '20px', height: '20px', filter: 'invert(1)' }} />
            </motion.button>

            {/* Logo */}
            <img src={logo} alt="BGOS" style={{ height: '32px' }} />

            {/* Spacer to push window controls to the right */}
            <div style={{ flex: 1 }} />

            {/* Window Control Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                {/* Minimize Button */}
                <motion.button
                    onClick={handleMinimize}
                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '46px',
                        height: '48px',
                        WebkitAppRegion: 'no-drag' as any,
                    }}
                >
                    <img src={minimizeIcon} alt="Minimize" style={{ width: '12px', height: '12px', filter: 'invert(1)' }} />
                </motion.button>

                {/* Maximize/Restore Button */}
                <motion.button
                    onClick={handleMaximize}
                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '46px',
                        height: '48px',
                        WebkitAppRegion: 'no-drag' as any,
                    }}
                >
                    <img
                        src={isMaximized ? restoreIcon : maximizeIcon}
                        alt={isMaximized ? "Restore" : "Maximize"}
                        style={{ width: '12px', height: '12px', filter: 'invert(1)' }}
                    />
                </motion.button>

                {/* Close Button */}
                <motion.button
                    onClick={handleClose}
                    whileHover={{ backgroundColor: 'rgba(232, 17, 35, 0.9)' }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '46px',
                        height: '48px',
                        WebkitAppRegion: 'no-drag' as any,
                    }}
                >
                    <img src={closeIcon} alt="Close" style={{ width: '12px', height: '12px', filter: 'invert(1)' }} />
                </motion.button>
            </div>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            onClick={() => setIsMenuOpen(false)}
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                zIndex: 999,
                            }}
                        />

                        {/* Menu Dropdown */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                            style={{
                                position: 'fixed',
                                top: '48px',
                                left: `${sidebarWidth + 16}px`,
                                backgroundColor: 'rgb(38, 37, 35)',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                padding: '8px 0',
                                minWidth: '220px',
                                zIndex: 1000,
                                WebkitAppRegion: 'no-drag' as any,
                            }}
                        >
                            {/* File Section */}
                            <div style={{ padding: '4px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                <div style={{
                                    padding: '8px 16px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    File
                                </div>
                                <MenuItem label="Exit" shortcut="Ctrl+Q" onClick={() => handleMenuItemClick('exit')} />
                            </div>

                            {/* Edit Section */}
                            <div style={{ padding: '4px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                <div style={{
                                    padding: '8px 16px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Edit
                                </div>
                                <MenuItem label="Undo" shortcut="Ctrl+Z" onClick={() => handleMenuItemClick('undo')} />
                                <MenuItem label="Redo" shortcut="Ctrl+Y" onClick={() => handleMenuItemClick('redo')} />
                                <div style={{ margin: '4px 0', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }} />
                                <MenuItem label="Cut" shortcut="Ctrl+X" onClick={() => handleMenuItemClick('cut')} />
                                <MenuItem label="Copy" shortcut="Ctrl+C" onClick={() => handleMenuItemClick('copy')} />
                                <MenuItem label="Paste" shortcut="Ctrl+V" onClick={() => handleMenuItemClick('paste')} />
                            </div>

                            {/* View Section */}
                            <div style={{ padding: '4px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                <div style={{
                                    padding: '8px 16px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    View
                                </div>
                                <MenuItem label="Reload" shortcut="Ctrl+R" onClick={() => handleMenuItemClick('reload')} />
                                <MenuItem label="Force Reload" shortcut="Ctrl+Shift+R" onClick={() => handleMenuItemClick('forceReload')} />
                                <MenuItem label="Toggle DevTools" shortcut="F12" onClick={() => handleMenuItemClick('toggleDevTools')} />
                                <div style={{ margin: '4px 0', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }} />
                                <MenuItem label="Reset Zoom" onClick={() => handleMenuItemClick('resetZoom')} />
                                <MenuItem label="Zoom In" shortcut="Ctrl++" onClick={() => handleMenuItemClick('zoomIn')} />
                                <MenuItem label="Zoom Out" shortcut="Ctrl+-" onClick={() => handleMenuItemClick('zoomOut')} />
                                <div style={{ margin: '4px 0', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }} />
                                <MenuItem label="Toggle Fullscreen" shortcut="F11" onClick={() => handleMenuItemClick('toggleFullscreen')} />
                            </div>

                            {/* Developer Section */}
                            <div style={{ padding: '4px 0' }}>
                                <div style={{
                                    padding: '8px 16px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Developer
                                </div>
                                <MenuItem label="Toggle DevTools" shortcut="F12" onClick={() => handleMenuItemClick('toggleDevTools')} />
                                <MenuItem label="Element Inspector" shortcut="Ctrl+Shift+C" onClick={() => handleMenuItemClick('toggleDevTools')} />
                                <div style={{ margin: '4px 0', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }} />
                                <MenuItem label="Reload" shortcut="Ctrl+R" onClick={() => handleMenuItemClick('reload')} />
                                <MenuItem label="Hard Reload" shortcut="Ctrl+Shift+R" onClick={() => handleMenuItemClick('forceReload')} />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

// MenuItem Component
interface MenuItemProps {
    label: string;
    shortcut?: string;
    onClick: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ label, shortcut, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                padding: '8px 16px',
                cursor: 'pointer',
                backgroundColor: isHovered ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                color: 'white',
                fontSize: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'background-color 0.15s ease',
            }}
        >
            <span>{label}</span>
            {shortcut && (
                <span style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    marginLeft: '32px'
                }}>
                    {shortcut}
                </span>
            )}
        </div>
    );
};

export default TitleBar;
