import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import AnimatedCheckmark from './AnimatedCheckmark';

interface FloatingCheckmarkProps {
    position: { x: number; y: number };
    onComplete: () => void;
}

const FloatingCheckmark: React.FC<FloatingCheckmarkProps> = ({
    position,
    onComplete
}) => {
    const [phase, setPhase] = useState<'enter' | 'visible' | 'exit'>('enter');

    useEffect(() => {
        // Enter phase (fade in)
        const enterTimer = setTimeout(() => {
            setPhase('visible');
        }, 50);

        // Exit phase (fade out) - starts after checkmark animation completes
        const exitTimer = setTimeout(() => {
            setPhase('exit');
        }, 500);

        // Complete - remove from DOM
        const completeTimer = setTimeout(() => {
            onComplete();
        }, 800);

        return () => {
            clearTimeout(enterTimer);
            clearTimeout(exitTimer);
            clearTimeout(completeTimer);
        };
    }, [onComplete]);

    const opacity = phase === 'enter' ? 0 : phase === 'visible' ? 1 : 0;
    const scale = phase === 'enter' ? 0.8 : phase === 'visible' ? 1 : 1.1;

    return createPortal(
        <div
            style={{
                position: 'fixed',
                left: position.x - 16,
                top: position.y - 16,
                zIndex: 9999,
                pointerEvents: 'none',
                opacity,
                transform: `scale(${scale})`,
                transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
            }}
        >
            <div
                style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: '#FFD700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(255, 215, 0, 0.4)',
                }}
            >
                <AnimatedCheckmark
                    size={16}
                    color="#1a1a1a"
                />
            </div>
        </div>,
        document.body
    );
};

export default FloatingCheckmark;
