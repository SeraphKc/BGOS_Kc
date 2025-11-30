import { useState, useCallback } from 'react';

interface UseShakeReturn {
    isShaking: boolean;
    triggerShake: () => void;
    shakeClassName: string;
}

export function useShake(duration: number = 500): UseShakeReturn {
    const [isShaking, setIsShaking] = useState(false);

    const triggerShake = useCallback(() => {
        setIsShaking(true);
        setTimeout(() => {
            setIsShaking(false);
        }, duration);
    }, [duration]);

    return {
        isShaking,
        triggerShake,
        shakeClassName: isShaking ? 'shake' : '',
    };
}

export default useShake;
