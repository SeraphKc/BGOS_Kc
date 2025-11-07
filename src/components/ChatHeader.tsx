import React from 'react';
import {Assistant} from "../types/model/Assistant";

interface ChatHeaderProps {
    assistant?: Assistant;
    onToggleArtifacts: () => void;
    showArtifacts: boolean;
    hasArtifacts: boolean;
    artifactsCount?: number;
    hideArtifactsButton?: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ assistant, onToggleArtifacts, showArtifacts, hasArtifacts, artifactsCount = 0, hideArtifactsButton = false }) => {
    return (
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-700 bg-background/95 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-4">
                <div className="assistant-avatar w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-gray-900">
                    {assistant?.name.charAt(0) || 'A'}
                </div>
                <div>
                    <div className="text-white font-semibold text-lg">
                        {assistant?.name || 'Ava'}
                    </div>
                    <div className="text-gray-400 text-sm">
                        {assistant?.subtitle || 'Ava assistant'}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3">
                
                {!hideArtifactsButton && hasArtifacts && (
                    <button
                        onClick={onToggleArtifacts}
                        className={`${showArtifacts ? 'bg-primary text-gray-900' : 'bg-background text-white'} border-none rounded-xl px-4 py-2 text-sm font-semibold cursor-pointer transition-all duration-200 ease-in-out flex items-center gap-2 hover:scale-105`}
                    >
                        {showArtifacts ? 'Hide' : 'Show'} Artifacts
                        {artifactsCount > 0 && (
                            <span className={`${showArtifacts ? 'bg-gray-900 text-primary' : 'bg-primary text-gray-900'} rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold`}>
                                {artifactsCount}
                            </span>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default ChatHeader; 