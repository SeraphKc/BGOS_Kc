import React from 'react';
import { motion } from 'framer-motion';

interface FloatingActionButtonProps {
    onOpenRightSidebar: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onOpenRightSidebar }) => {
    return (
        <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenRightSidebar}
            className="fixed bottom-6 right-6 w-14 h-14 text-gray-900 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out z-40 flex items-center justify-center focus:outline-none"
            style={{ backgroundColor: '#FFD900' }}
            title="Open Right Sidebar"
        >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        </motion.button>
    );
};

export default FloatingActionButton; 