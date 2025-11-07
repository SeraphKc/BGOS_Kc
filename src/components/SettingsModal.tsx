import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../utils/hooks';
import { updateUser, updateUserPreferences } from '../slices/UserSlice';
import { getInitials, getAvatarColor } from '../utils/avatarUtils';
import { ChevronDown } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const workRoleOptions = [
    'Select your work function',
    'Marketing',
    'Product Management',
    'Engineering',
    'Human Resources',
    'Finance',
    'Sales',
    'Operations',
    'Data Science',
    'Design',
    'Legal',
    'Other'
];

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const dispatch = useDispatch();
    const currentUser = useAppSelector((state) => state.user.currentUser);

    // Original values for cancel functionality
    const [originalName, setOriginalName] = useState(currentUser?.name || '');
    const [originalRole, setOriginalRole] = useState(currentUser?.role || '');

    // Current editing values
    const [fullName, setFullName] = useState(currentUser?.name || '');
    const [workRole, setWorkRole] = useState(currentUser?.role || '');
    const [isShaking, setIsShaking] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [hoveredOption, setHoveredOption] = useState<string | null>(null);

    // Update local state when user changes or modal opens
    useEffect(() => {
        if (currentUser && isOpen) {
            setFullName(currentUser.name || '');
            setWorkRole(currentUser.role || '');
            setOriginalName(currentUser.name || '');
            setOriginalRole(currentUser.role || '');
        }
    }, [currentUser, isOpen]);

    // ESC key handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                handleCancel();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const handleSelectRole = (role: string) => {
        if (role !== 'Select your work function') {
            setWorkRole(role);
        }
        setShowDropdown(false);
    };

    const handleSave = () => {
        if (fullName.trim()) {
            dispatch(updateUser({ name: fullName.trim(), role: workRole }));
            setOriginalName(fullName.trim());
            setOriginalRole(workRole);
            onClose();
        }
    };

    const handleCancel = () => {
        setFullName(originalName);
        setWorkRole(originalRole);
        onClose();
    };

    const handleBackdropClick = () => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
            onClick={handleBackdropClick}
        >
            <div
                className="flex flex-col"
                style={{
                    width: '90%',
                    maxWidth: '700px',
                    minHeight: '80vh',
                    maxHeight: '95vh',
                    backgroundColor: '#212121',
                    borderRadius: '12px',
                    border: '1px solid #3c3c3a',
                    overflow: 'hidden',
                    animation: isShaking ? 'shake 0.5s' : 'none'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <style>
                    {`
                        @keyframes shake {
                            0%, 100% { transform: translateX(0); }
                            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                            20%, 40%, 60%, 80% { transform: translateX(5px); }
                        }

                        /* Claude-style thin scrollbar */
                        .settings-scrollable::-webkit-scrollbar {
                            width: 6px;
                        }

                        .settings-scrollable::-webkit-scrollbar-track {
                            background: transparent;
                            margin: 8px 0;
                        }

                        .settings-scrollable::-webkit-scrollbar-thumb {
                            background: rgba(255, 255, 255, 0.1);
                            border-radius: 3px;
                            transition: background 0.2s ease;
                        }

                        .settings-scrollable::-webkit-scrollbar-thumb:hover {
                            background: rgba(255, 255, 255, 0.2);
                        }

                        .settings-scrollable::-webkit-scrollbar-thumb:active {
                            background: rgba(255, 255, 255, 0.3);
                        }

                        /* Firefox scrollbar */
                        .settings-scrollable {
                            scrollbar-width: thin;
                            scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
                        }

                        .settings-dropdown::-webkit-scrollbar {
                            width: 6px;
                        }

                        .settings-dropdown::-webkit-scrollbar-track {
                            background: transparent;
                        }

                        .settings-dropdown::-webkit-scrollbar-thumb {
                            background: rgba(255, 255, 255, 0.1);
                            border-radius: 3px;
                            transition: background 0.2s ease;
                        }

                        .settings-dropdown::-webkit-scrollbar-thumb:hover {
                            background: rgba(255, 255, 255, 0.2);
                        }

                        .settings-dropdown::-webkit-scrollbar-thumb:active {
                            background: rgba(255, 255, 255, 0.3);
                        }

                        .settings-dropdown {
                            scrollbar-width: thin;
                            scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
                        }
                    `}
                </style>

                {/* Header with close button */}
                <div className="flex items-center justify-end px-6 pt-3 pb-1">
                    <button
                        onClick={handleCancel}
                        className="hover:bg-gray-700/20 rounded p-2 transition-colors duration-200"
                        style={{ color: '#a7a7a5' }}
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                {/* Title */}
                <div className="px-6 pb-6">
                    <h1
                        style={{
                            fontSize: '32px',
                            fontFamily: 'serif',
                            color: '#e8e8e6',
                            fontWeight: 400,
                            margin: 0
                        }}
                    >
                        Settings
                    </h1>
                </div>

                {/* Content - Scrollable */}
                <div className="settings-scrollable flex-1 overflow-y-auto px-6" style={{ maxHeight: 'calc(95vh - 200px)' }}>
                    {/* Profile Section */}
                    <div className="mb-8">
                        <label
                            style={{
                                color: '#9a9a98',
                                fontSize: '14px',
                                fontFamily: 'Styrene-B',
                                display: 'block',
                                marginBottom: '12px'
                            }}
                        >
                            Full name
                        </label>
                        <div className="flex items-center gap-3">
                            {/* Avatar Preview */}
                            <div
                                className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
                                style={{
                                    backgroundColor: fullName.trim() ? getAvatarColor(fullName) : '#2A2A2A',
                                    color: '#ffffff',
                                    fontFamily: 'Montserrat'
                                }}
                            >
                                {fullName.trim() ? getInitials(fullName) : '?'}
                            </div>
                            {/* Name Input */}
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Enter your full name"
                                className="flex-1 px-4 py-3 rounded-lg outline-none transition-colors duration-200"
                                style={{
                                    backgroundColor: '#2a2a28',
                                    border: '1px solid #3c3c3a',
                                    color: '#e8e8e6',
                                    fontSize: '14px',
                                    fontFamily: 'Styrene-B'
                                }}
                            />
                        </div>
                    </div>

                    {/* Work Role Section */}
                    <div className="mb-8">
                        <label
                            style={{
                                color: '#9a9a98',
                                fontSize: '14px',
                                fontFamily: 'Styrene-B',
                                display: 'block',
                                marginBottom: '12px'
                            }}
                        >
                            What best describes your work?
                        </label>
                        <div className="relative">
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="w-full px-4 py-3 rounded-lg flex items-center justify-between transition-colors duration-200"
                                style={{
                                    backgroundColor: '#2a2a28',
                                    border: showDropdown ? '1px solid #FFD700' : '1px solid #3c3c3a',
                                    color: workRole ? '#e8e8e6' : '#6b6b68',
                                    fontSize: '14px',
                                    fontFamily: 'Styrene-B',
                                    textAlign: 'left'
                                }}
                            >
                                <span>{workRole || 'Select your work function'}</span>
                                <ChevronDown size={16} style={{ color: '#9a9a98' }} />
                            </button>

                            {/* Dropdown */}
                            {showDropdown && (
                                <div
                                    className="settings-dropdown absolute top-full mt-2 w-full rounded-lg overflow-hidden shadow-lg z-10"
                                    style={{
                                        backgroundColor: '#2a2a28',
                                        border: '1px solid #3c3c3a',
                                        maxHeight: '300px',
                                        overflowY: 'auto'
                                    }}
                                >
                                    {workRoleOptions.map((option, index) => (
                                        <button
                                            key={option}
                                            onClick={() => handleSelectRole(option)}
                                            onMouseEnter={() => index !== 0 && setHoveredOption(option)}
                                            onMouseLeave={() => setHoveredOption(null)}
                                            className="w-full px-4 py-3 text-left transition-colors duration-200"
                                            style={{
                                                backgroundColor: option === workRole
                                                    ? 'rgba(255, 215, 0, 0.2)'
                                                    : (hoveredOption === option ? 'rgba(255, 255, 255, 0.05)' : 'transparent'),
                                                color: index === 0 ? '#6b6b68' : (hoveredOption === option ? '#ffffff' : '#e8e8e6'),
                                                fontSize: '14px',
                                                fontFamily: 'Styrene-B',
                                                borderBottom: index < workRoleOptions.length - 1 ? '1px solid #3c3c3a' : 'none',
                                                cursor: index === 0 ? 'default' : 'pointer'
                                            }}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Appearance Section */}
                    <div className="mb-8">
                        <label
                            style={{
                                color: '#9a9a98',
                                fontSize: '14px',
                                fontFamily: 'Styrene-B',
                                display: 'block',
                                marginBottom: '12px'
                            }}
                        >
                            Appearance
                        </label>

                        <div className="space-y-3">
                            {/* Dark Theme (Active) */}
                            <div
                                className="px-4 py-3 rounded-lg cursor-pointer transition-colors duration-200"
                                style={{
                                    backgroundColor: '#2a2a28',
                                    border: '2px solid #FFD700',
                                    color: '#e8e8e6'
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <span style={{ fontSize: '14px', fontFamily: 'Styrene-B' }}>
                                        Dark
                                    </span>
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: '#FFD700' }}
                                    />
                                </div>
                            </div>

                            {/* Light Theme (Coming Soon) */}
                            <div
                                className="px-4 py-3 rounded-lg relative"
                                style={{
                                    backgroundColor: '#1a1a18',
                                    border: '1px solid #3c3c3a',
                                    color: '#6b6b68',
                                    opacity: 0.5,
                                    cursor: 'not-allowed'
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <span style={{ fontSize: '14px', fontFamily: 'Styrene-B' }}>
                                        Light
                                    </span>
                                    <span
                                        style={{
                                            fontSize: '11px',
                                            fontFamily: 'Styrene-B',
                                            color: '#9a9a98',
                                            backgroundColor: '#3c3c3a',
                                            padding: '2px 8px',
                                            borderRadius: '4px'
                                        }}
                                    >
                                        Coming Soon
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer with Save and Cancel buttons */}
                <div
                    className="flex items-center justify-end gap-3 px-6 py-4"
                    style={{
                        borderTop: '1px solid #3c3c3a',
                        backgroundColor: '#212121'
                    }}
                >
                    <button
                        onClick={handleCancel}
                        className="px-6 py-2 rounded-lg transition-colors duration-200"
                        style={{
                            backgroundColor: 'transparent',
                            border: '1px solid #3c3c3a',
                            color: '#e8e8e6',
                            fontSize: '14px',
                            fontFamily: 'Styrene-B',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 rounded-lg transition-colors duration-200"
                        style={{
                            backgroundColor: '#FFD700',
                            border: 'none',
                            color: '#000000',
                            fontSize: '14px',
                            fontFamily: 'Styrene-B',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#FFC700';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#FFD700';
                        }}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
