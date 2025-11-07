import React from 'react';

interface StarFilledIconProps {
    size?: number;
    color?: string;
    className?: string;
}

const StarFilledIcon: React.FC<StarFilledIconProps> = ({
    size = 16,
    color = '#FFD700', // Yellow/gold color
    className = ''
}) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M8 1.5L9.876 6.072L14.5 6.643L11.248 9.796L12.037 14.5L8 12.072L3.963 14.5L4.752 9.796L1.5 6.643L6.124 6.072L8 1.5Z"
                fill={color}
                stroke={color}
                strokeWidth="0.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default StarFilledIcon;
