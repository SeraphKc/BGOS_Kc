import React from 'react';
import spinnerImage from '../assets/images/spinner.png';

const LoadingSpinner: React.FC<{ overlay?: boolean; overlaySize?: number }> = ({ overlay = false, overlaySize }) => {
    const size = overlay ? (overlaySize || 32) : 32;
    const spinner = (
        <img
            src={spinnerImage}
            alt="Loading..."
            style={{
                width: size,
                height: size,
                animation: 'spin 1s linear infinite',
                display: 'block',
            }}
        />
    );
    if (overlay) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
            }}>
                {spinner}
            </div>
        );
    }
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            padding: '16px 0',
        }}>
            {spinner}
        </div>
    );
};

export default LoadingSpinner; 