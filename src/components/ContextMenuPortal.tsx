import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ContextMenuPortalProps {
    isOpen: boolean;
    triggerRef: React.RefObject<HTMLElement>;
    onClose: () => void;
    children: React.ReactNode;
}

const ContextMenuPortal: React.FC<ContextMenuPortalProps> = ({
    isOpen,
    triggerRef,
    onClose,
    children
}) => {
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen || !triggerRef.current) return;

        const updatePosition = () => {
            if (!triggerRef.current || !menuRef.current) return;

            const triggerRect = triggerRef.current.getBoundingClientRect();
            const menuRect = menuRef.current.getBoundingClientRect();
            const menuHeight = menuRect.height || 400; // Use actual height or estimate
            const menuWidth = menuRect.width || 280; // Use actual width or estimate

            // Smart positioning: determine if menu should appear above or below
            const spaceBelow = window.innerHeight - triggerRect.bottom;
            const spaceAbove = triggerRect.top;
            const shouldShowAbove = spaceBelow < menuHeight && spaceAbove > spaceBelow;

            // Calculate vertical position
            let top: number;
            if (shouldShowAbove) {
                // Position above trigger
                top = triggerRect.top - menuHeight - 4;
            } else {
                // Position below trigger
                top = triggerRect.bottom + 4;
            }

            // Calculate horizontal position (align with left edge of trigger for left-side elements)
            let left = triggerRect.left;

            // Ensure menu doesn't overflow right edge of screen
            if (left + menuWidth > window.innerWidth) {
                left = triggerRect.right - menuWidth;
            }

            // Ensure menu doesn't overflow left edge of screen
            if (left < 0) {
                left = 4;
            }

            setPosition({ top, left });
        };

        updatePosition();

        // Update position on scroll or resize
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);

        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen, triggerRef]);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose, triggerRef]);

    if (!isOpen) return null;

    return createPortal(
        <>
            {/* Backdrop to block interactions with elements behind */}
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9999,
                    pointerEvents: 'none',
                    backgroundColor: 'transparent'
                }}
            />
            {/* Menu content */}
            <div
                ref={menuRef}
                style={{
                    position: 'fixed',
                    top: `${position.top}px`,
                    left: `${position.left}px`,
                    zIndex: 10000
                }}
            >
                {children}
            </div>
        </>,
        document.body
    );
};

export default ContextMenuPortal;
