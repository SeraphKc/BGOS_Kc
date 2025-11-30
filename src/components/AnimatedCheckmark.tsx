import React, { useEffect, useRef } from 'react';

interface AnimatedCheckmarkProps {
    size?: number;
    showBackground?: boolean;
    color?: string;
    onComplete?: () => void;
}

const AnimatedCheckmark: React.FC<AnimatedCheckmarkProps> = ({
    size = 16,
    showBackground = false,
    color = '#FFD700',
    onComplete
}) => {
    const hasCalledComplete = useRef(false);

    useEffect(() => {
        if (onComplete && !hasCalledComplete.current) {
            const timer = setTimeout(() => {
                hasCalledComplete.current = true;
                onComplete();
            }, 400); // Match animation duration
            return () => clearTimeout(timer);
        }
    }, [onComplete]);

    const checkmarkSize = showBackground ? size * 0.5 : size;
    const strokeWidth = showBackground ? 2 : 1.5;

    if (showBackground) {
        return (
            <div
                style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    backgroundColor: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <svg
                    width={checkmarkSize}
                    height={checkmarkSize * 0.78}
                    viewBox="0 0 18 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ overflow: 'visible' }}
                >
                    <path
                        d="M1 7L6.32706 13L17 1"
                        stroke="#1a1a1a"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                            strokeDasharray: '24',
                            strokeDashoffset: '24',
                            animation: 'drawCheck 0.4s ease-out forwards'
                        }}
                    />
                    <style>
                        {`
                            @keyframes drawCheck {
                                to {
                                    stroke-dashoffset: 0;
                                }
                            }
                        `}
                    </style>
                </svg>
            </div>
        );
    }

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 18 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ overflow: 'visible' }}
        >
            <path
                d="M1 7L6.32706 13L17 1"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                    strokeDasharray: '24',
                    strokeDashoffset: '24',
                    animation: 'drawCheck 0.4s ease-out forwards'
                }}
            />
            <style>
                {`
                    @keyframes drawCheck {
                        to {
                            stroke-dashoffset: 0;
                        }
                    }
                `}
            </style>
        </svg>
    );
};

export default AnimatedCheckmark;
