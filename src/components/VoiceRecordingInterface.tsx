import React, { useEffect, useRef, useState } from 'react';
import AssistantSelector from './AssistantSelector';
import checkIcon from '../assets/icons/check.svg';
import closeRedIcon from '../assets/icons/close-red.svg';
import addWhiteIcon from '../assets/icons/add-white.svg';
import arrowDownIcon from '../assets/icons/arrow-down.svg';
import { COLORS } from '../utils/colors';

interface VoiceRecordingInterfaceProps {
    audioLevel: number;
    assistantName: string;
    onAssistantChange: (assistantId: string) => void;
    assistants: Array<{ id: string; name: string }>;
    currentAssistantId?: string;
    onConfirm: () => void;
    onCancel: () => void;
    onAddAttachment?: () => void;
    recordingDuration?: number; // Duration in seconds
}

export const VoiceRecordingInterface: React.FC<VoiceRecordingInterfaceProps> = ({
    audioLevel,
    assistantName,
    onAssistantChange,
    assistants,
    currentAssistantId,
    onConfirm,
    onCancel,
    onAddAttachment,
    recordingDuration = 0
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | undefined>(undefined);
    const [recordingTime, setRecordingTime] = useState(0);

    // Format time as M:SS
    const formatTime = (time: number): string => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Update recording time
    useEffect(() => {
        setRecordingTime(recordingDuration);
    }, [recordingDuration]);

    // Generate animated waveform visualization (like Telegram)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size with device pixel ratio for crisp rendering
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw animated waveform with vertical bars
        const barWidth = 2; // 2px width
        const gap = 1; // 1px gap
        const totalBarWidth = barWidth + gap;
        const barCount = Math.floor(width / totalBarWidth);
        const maxBarHeight = 20; // 20px max height
        const minBarHeight = 2; // 2px min height

        // Enable crisp line rendering
        ctx.imageSmoothingEnabled = false;

        // Add animation timestamp for pulsing effect
        const timestamp = Date.now() * 0.005;

        for (let i = 0; i < barCount; i++) {
            // Create an animated wave pattern that responds to audio level
            const baseHeight = Math.sin(i * 0.3 + timestamp) * 0.4 + 0.6;
            const randomVariation = Math.sin(i * 0.1 + timestamp * 2) * 0.2;
            const dynamicHeight = (baseHeight + randomVariation) * audioLevel;
            const barHeight = Math.max(minBarHeight, dynamicHeight * maxBarHeight);

            // Ensure pixel-perfect positioning
            const x = Math.round(i * totalBarWidth + barWidth / 2);
            const y = Math.round(height / 2 - barHeight / 2);

            // Color transition from gray dots to yellow bars - right to left progression
            const progress = i / barCount;
            const isActive = progress > (1 - audioLevel * 0.8); // Show yellow bars from right side

            if (isActive) {
                // Yellow vertical bars for active recording with pulsing effect
                const pulseIntensity = 0.8 + 0.2 * Math.sin(timestamp + i * 0.2);
                ctx.fillStyle = `rgba(255, 217, 0, ${pulseIntensity})`; // Pulsing yellow
                ctx.fillRect(Math.round(x - barWidth / 2), y, barWidth, Math.round(barHeight));
            } else {
                // Gray dots for inactive/silent areas
                ctx.fillStyle = '#9CA3AF';
                ctx.fillRect(Math.round(x - 1), Math.round(height / 2 - 1), 2, 2);
            }
        }

        // Continue animation
        animationRef.current = requestAnimationFrame(() => {
            // Trigger re-render for animation
            if (canvasRef.current) {
                // Force re-render by updating a state or calling the effect again
            }
        });
    }, [audioLevel]);

    // Cleanup animation on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    return (
        <div className="w-full flex flex-col h-full">
            {/* Recording Status and Timer */}
            <div className="flex items-center justify-center mb-2">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full" 
                     style={{ backgroundColor: COLORS.DARK_3, border: `1px solid ${COLORS.PRIMARY_1}` }}>
                    {/* Recording indicator dot */}
                    <div className="w-2 h-2 rounded-full animate-pulse" 
                         style={{ backgroundColor: COLORS.PRIMARY_1 }}></div>
                    <span className="text-sm font-medium" style={{ color: COLORS.WHITE_1 }}>
                        Recording {formatTime(recordingTime)}
                    </span>
                </div>
            </div>

            {/* Waveform Display - Takes up most of the space */}
            <div className="flex-1 flex items-center justify-center mb-4">
                    <canvas
                        ref={canvasRef}
                        width={360}
                        height={42}
                        className="w-full h-[42px]"
                    />
            </div>

            {/* Controls Row - Fixed at bottom */}
            <div className="flex items-center justify-between">
                {/* Left side - Add button */}
                <div className="flex items-center">
                    <button
                        onClick={onAddAttachment || (() => {})}
                        className="w-8 h-8 rounded-lg border border-gray-500 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity duration-200"
                        style={{ backgroundColor: COLORS.DARK_3 }}
                    >
                        <img 
                            src={addWhiteIcon} 
                            alt="Add" 
                            className="w-4 h-4 object-contain"
                        />
                    </button>
                </div>

                {/* Right side - Assistant selector and action buttons */}
                <div className="flex items-center gap-4">
                    {/* Assistant selector */}
                    <AssistantSelector
                        assistants={assistants}
                        selectedAssistant={assistants.find(a => a.id === currentAssistantId)}
                        onSelectAssistant={onAssistantChange}
                    />

                    {/* Action buttons */}
                    <div className="flex items-center gap-3">
                        {/* Cancel button */}
                        <button
                            onClick={onCancel}
                            className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity duration-200"
                            style={{ backgroundColor: COLORS.DARK_3 }}
                        >
                            <img 
                                src={closeRedIcon} 
                                alt="Cancel" 
                                className="w-5 h-5 object-contain"
                            />
                        </button>

                        {/* Confirm button */}
                        <button
                            onClick={onConfirm}
                            className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-200 hover:scale-105"
                            style={{ backgroundColor: COLORS.PRIMARY_1 }}
                        >
                            <img 
                                src={checkIcon} 
                                alt="Confirm" 
                                className="w-5 h-5 object-contain"
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}; 