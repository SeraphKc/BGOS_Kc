import React from 'react';
import bdosLogo from '../../assets/icon.ico';

interface BDOSIconProps {
    className?: string;
    size?: number;
}

const BDOSIcon: React.FC<BDOSIconProps> = ({ className = '', size = 24 }) => {
    return (
        <div 
            className={`flex items-center justify-center ${className}`}
            style={{ width: size, height: size }}
        >
            <img 
                src={bdosLogo}
                alt="BDOS"
                width={size}
                height={size}
                className="object-contain"
            />
        </div>
    );
};

export default BDOSIcon; 