import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import AnimatedCheckmark from './AnimatedCheckmark';

interface DialogSuccessStateProps {
    message?: string;
    onComplete: () => void;
    delay?: number;
}

const DialogSuccessState: React.FC<DialogSuccessStateProps> = ({
    message,
    onComplete,
    delay = 600
}) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, delay);
        return () => clearTimeout(timer);
    }, [onComplete, delay]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-8"
        >
            <AnimatedCheckmark
                size={48}
                showBackground
                color="#FFD700"
            />
            {message && (
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-4 text-sm text-gray-300"
                >
                    {message}
                </motion.p>
            )}
        </motion.div>
    );
};

export default DialogSuccessState;
