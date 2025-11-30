import React, { useState } from 'react';
import { useShake } from '../hooks/useShake';
import DialogSuccessState from './DialogSuccessState';

interface AssignScheduledChatDialogProps {
    userId: string;
    selectedChatId: string;
    onClose: () => void;
    onConfirm?: (subject: string, period: number, code: string) => void;
}

const AssignScheduledChatDialog: React.FC<AssignScheduledChatDialogProps> = ({
    userId,
    selectedChatId,
    onClose,
    onConfirm
}) => {
    const [subject, setSubject] = useState('');
    const [period, setPeriod] = useState('');
    const [code, setCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { isShaking, triggerShake } = useShake();

    const handleConfirm = async () => {
        if (!subject.trim() || !period.trim() || !code.trim()) return;

        const periodNumber = parseInt(period);
        if (isNaN(periodNumber) || periodNumber < 1 || periodNumber > 10000) return;

        setIsSubmitting(true);
        setError(null);

        try {
            onConfirm?.(subject.trim(), periodNumber, code.trim());
            setShowSuccess(true);
        } catch (err) {
            console.error('Failed to assign scheduled chat:', err);
            setError('Failed to create scheduled task. Please try again.');
            triggerShake();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSuccessComplete = () => {
        setShowSuccess(false);
        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    const handlePeriodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Allow only numbers
        if (value === '' || /^\d+$/.test(value)) {
            setPeriod(value);
        }
    };

    const isFormValid = subject.trim() && period.trim() && code.trim() && 
        !isNaN(parseInt(period)) && 
        parseInt(period) >= 1 && 
        parseInt(period) <= 10000;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={!showSuccess ? handleCancel : undefined}
            />

            {/* Dialog */}
            <div
                className={`relative max-w-md w-full mx-4 rounded-lg border shadow-lg ${isShaking ? 'shake' : ''}`}
                style={{
                    backgroundColor: '#262624',
                    borderColor: '#3c3c3a',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}
            >
                <div className="p-6">
                    {showSuccess ? (
                        <DialogSuccessState
                            message="Scheduled task created"
                            onComplete={handleSuccessComplete}
                        />
                    ) : (
                        <>
                            {/* Title */}
                            <h3 className="text-lg font-semibold mb-4 text-white">
                                Enter a subject
                            </h3>

                            {/* Input fields */}
                            <div className="mb-6 space-y-4">
                                <div>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="Enter subject..."
                                        className="w-full px-3 py-2 rounded-lg text-sm transition-colors duration-200 focus:outline-none"
                                        style={{
                                            backgroundColor: '#3c3c3a',
                                            color: '#ffffff',
                                            border: '1px solid #3c3c3a'
                                        }}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                handleConfirm();
                                            }
                                        }}
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        value={period}
                                        onChange={handlePeriodChange}
                                        placeholder="Period in hours..."
                                        className="w-full px-3 py-2 rounded-lg text-sm transition-colors duration-200 focus:outline-none"
                                        style={{
                                            backgroundColor: '#3c3c3a',
                                            color: '#ffffff',
                                            border: '1px solid #3c3c3a'
                                        }}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                handleConfirm();
                                            }
                                        }}
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="Assistant code..."
                                        className="w-full px-3 py-2 rounded-lg text-sm transition-colors duration-200 focus:outline-none"
                                        style={{
                                            backgroundColor: '#3c3c3a',
                                            color: '#ffffff',
                                            border: '1px solid #3c3c3a'
                                        }}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                handleConfirm();
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Error message */}
                            {error && (
                                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                                    <p className="text-sm text-red-400">{error}</p>
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={handleCancel}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        backgroundColor: '#3c3c3a',
                                        color: '#ffffff',
                                        border: '1px solid #3c3c3a'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={isSubmitting || !isFormValid}
                                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        backgroundColor: isFormValid ? '#FFD900' : '#666',
                                        color: isFormValid ? '#262624' : '#ffffff',
                                        border: `1px solid ${isFormValid ? '#FFD900' : '#666'}`,
                                        cursor: isFormValid ? 'pointer' : 'not-allowed'
                                    }}
                                >
                                    {isSubmitting ? 'Confirming...' : 'Confirm'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AssignScheduledChatDialog;
