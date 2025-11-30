import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useResizeObserver from '@react-hook/resize-observer';

interface AnimateHeightProps {
    isOpen: boolean;
    children: React.ReactNode;
    duration?: number;
}

const AnimateHeight: React.FC<AnimateHeightProps> = ({
    isOpen,
    children,
    duration = 0.3
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState<number>(0);

    // Measure content height when open
    useResizeObserver(containerRef, (entry) => {
        if (isOpen) {
            setHeight(entry.contentRect.height);
        }
    });

    // Set initial height when opening
    useEffect(() => {
        if (isOpen && containerRef.current) {
            setHeight(containerRef.current.getBoundingClientRect().height);
        } else if (!isOpen) {
            setHeight(0);
        }
    }, [isOpen]);

    return (
        <motion.div
            animate={{ height }}
            initial={{ height: 0 }}
            transition={{
                duration,
                ease: [0.04, 0.62, 0.23, 0.98] // Custom easing for smooth feel
            }}
            style={{ overflow: 'hidden' }}
        >
            <div ref={containerRef}>
                {children}
            </div>
        </motion.div>
    );
};

export default AnimateHeight;
