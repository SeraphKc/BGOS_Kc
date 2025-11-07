export const getDurationFromBase64 = async (
    base64Data: string, 
    mimeType: string
): Promise<number> => {
    try {
        // Проверяем поддержку Web Audio API
        if (typeof window.AudioContext === 'undefined' && typeof (window as any).webkitAudioContext === 'undefined') {
            console.warn('Web Audio API not supported');
            return 0;
        }

        // Создаем AudioContext
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Декодируем Base64 в ArrayBuffer
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Декодируем аудио данные
        const audioBuffer = await audioContext.decodeAudioData(bytes.buffer);
        
        // Получаем длительность
        const duration = audioBuffer.duration;
        
        // Закрываем контекст для освобождения памяти
        audioContext.close();
        
        return duration;
    } catch (error) {
        console.error('Failed to get duration from Base64:', error);
        return 0;
    }
};
