import React from 'react';

const ChatLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen w-screen bg-dark-bg">
      {children}
    </div>
  );
};

export default ChatLayout; 