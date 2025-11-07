import React from 'react';

interface StarIconProps {
    size?: number;
    color?: string;
    className?: string;
}

const StarIcon: React.FC<StarIconProps> = ({
    size = 16,
    color = 'currentColor',
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
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        </svg>
    );
};

export default StarIcon;
