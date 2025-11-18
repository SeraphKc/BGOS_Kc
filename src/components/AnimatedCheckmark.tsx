import React from 'react';

interface AnimatedCheckmarkProps {
    size?: number;
}

const AnimatedCheckmark: React.FC<AnimatedCheckmarkProps> = ({ size = 16 }) => {
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
                stroke="#F4D03F"
                strokeWidth="1.5"
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
