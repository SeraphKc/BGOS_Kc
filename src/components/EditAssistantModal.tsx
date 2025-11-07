import React, {useRef, useEffect, useState} from 'react';
import {updateAssistant} from '../services/AssistantCRUDService';
import { Assistant } from '../types/model/Assistant';
import { useNotification } from '../hooks/useNotification';
import { validateImageFile } from '../utils/imageUtils';
import { avatarColors, getInitials } from '../utils/avatarUtils';
import { Upload, ZoomIn, ZoomOut, Check, X } from 'lucide-react';

interface EditAssistantModalProps {
    onClose: () => void;
    userId: string;
    assistant: Assistant;
    onUpdate: (updatedAssistant: Assistant) => void;
}

const EditAssistantModal: React.FC<EditAssistantModalProps> = ({onClose, userId, assistant, onUpdate}) => {
    const { showNotification } = useNotification();
    const modalRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Avatar state: either image base64 or color
    const [avatarImage, setAvatarImage] = useState<string | null>(() => {
        console.log('EditAssistantModal - assistant:', assistant);
        console.log('EditAssistantModal - avatarUrl:', assistant.avatarUrl);
        console.log('EditAssistantModal - avatarUrl type:', typeof assistant.avatarUrl);
        console.log('EditAssistantModal - avatarColors:', avatarColors);

        // Only set avatarImage if avatarUrl exists, is not empty, is not a color, and looks like an actual image (base64 or URL)
        const url = assistant.avatarUrl;
        if (url &&
            typeof url === 'string' &&
            url.trim() !== '' &&
            !avatarColors.includes(url) &&
            (url.startsWith('data:image/') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:'))) {
            console.log('EditAssistantModal - Setting avatarImage to:', url);
            return url;
        }
        console.log('EditAssistantModal - Setting avatarImage to null (url did not pass validation)');
        return null;
    });
    const [avatarColor, setAvatarColor] = useState<string>(() => {
        // If avatarUrl is a valid color from our palette, use it
        if (assistant.avatarUrl && avatarColors.includes(assistant.avatarUrl)) {
            console.log('EditAssistantModal - Setting avatarColor to:', assistant.avatarUrl);
            return assistant.avatarUrl;
        }
        // Otherwise default to first color
        console.log('EditAssistantModal - Setting avatarColor to default:', avatarColors[0]);
        return avatarColors[0];
    });

    // Image cropping state
    const [cropMode, setCropMode] = useState(false);
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const cropCanvasRef = useRef<HTMLCanvasElement>(null);

    // Shake animation state
    const [shake, setShake] = useState(false);

    const [fields, setFields] = useState({
        name: assistant.name || '',
        token: '',
        speechToken: assistant.s2sToken || '',
        webhook: assistant.webhookUrl || '',
        description: assistant.subtitle || '',
        code: assistant.code || '',
    });

    // Проверяем валидность формы
    const isFormValid = fields.name.trim() !== '' &&
                       fields.webhook.trim() !== '' &&
                       fields.code.trim() !== '';
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === modalRef.current) {
            // Trigger shake animation instead of closing
            setShake(true);
            setTimeout(() => setShake(false), 500);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFields({...fields, [e.target.name]: e.target.value});
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
        const validationError = validateImageFile(file);
        if (validationError) {
            showNotification({
                type: 'error',
                title: 'Upload failed',
                message: validationError.message,
                autoClose: true,
                duration: 3000
            });
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        // Load image for cropping
        const reader = new FileReader();
        reader.onload = (evt) => {
            setTempImage(evt.target?.result as string);
            setCropMode(true);
            setZoom(1);
            setPosition({ x: 0, y: 0 });
        };
        reader.readAsDataURL(file);
    };

    const handleCropCancel = () => {
        setCropMode(false);
        setTempImage(null);
        setZoom(1);
        setPosition({ x: 0, y: 0 });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCropConfirm = () => {
        if (!tempImage || !cropCanvasRef.current) return;

        setUploadingImage(true);

        const img = new Image();
        img.onload = () => {
            const canvas = cropCanvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Set canvas to target size
            const targetSize = 200;
            canvas.width = targetSize;
            canvas.height = targetSize;

            // Calculate the visible area in the 300px preview circle
            // The preview shows the image scaled to fit height (100%) at the current zoom
            const previewSize = 300; // Size of the circular preview

            // Calculate how the image is displayed in the preview
            // The image height fills the container (100%), width scales proportionally
            const displayHeight = previewSize;
            const displayWidth = (img.width / img.height) * displayHeight;

            // Calculate the crop size in image coordinates
            // We're cropping a square area from the center of the visible preview
            const visibleWidth = displayWidth / zoom;
            const cropSizeInImageCoords = (previewSize / visibleWidth) * img.width;

            // Calculate the source coordinates based on position offset
            // Position is in pixels relative to preview center
            const centerX = img.width / 2;
            const centerY = img.height / 2;

            // Convert position offset to image coordinates
            const offsetXInImage = -(position.x / previewSize) * cropSizeInImageCoords;
            const offsetYInImage = -(position.y / previewSize) * cropSizeInImageCoords;

            const sx = centerX - (cropSizeInImageCoords / 2) + offsetXInImage;
            const sy = centerY - (cropSizeInImageCoords / 2) + offsetYInImage;

            // Draw cropped and scaled image
            ctx.drawImage(
                img,
                sx, sy, cropSizeInImageCoords, cropSizeInImageCoords,
                0, 0, targetSize, targetSize
            );

            // Convert to base64
            const base64 = canvas.toDataURL('image/jpeg', 0.9);
            setAvatarImage(base64);

            // Reset crop mode
            setCropMode(false);
            setTempImage(null);
            setZoom(1);
            setPosition({ x: 0, y: 0 });
            setUploadingImage(false);

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            showNotification({
                type: 'success',
                title: 'Image uploaded',
                message: 'Profile image uploaded successfully',
                autoClose: true,
                duration: 2000
            });
        };

        img.onerror = () => {
            showNotification({
                type: 'error',
                title: 'Upload failed',
                message: 'Failed to process image',
                autoClose: true,
                duration: 3000
            });
            setUploadingImage(false);
        };

        img.src = tempImage;
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleRemoveImage = () => {
        setAvatarImage(null);
    };

    const handleSaveAssistant = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        let operationSuccess: boolean = false;
        try {
            const assistantData = {
                name: fields.name,
                subtitle: fields.description,
                avatarUrl: avatarImage || avatarColor, // TODO: Backend - store image, use avatarColor as fallback
                webhookUrl: fields.webhook,
                s2sToken: fields.speechToken,
                code: fields.code,
            };
            const updateSuccess = await updateAssistant(userId, assistant.id, assistantData);
        
            if (updateSuccess) {
                const editedAssistant = {
                    ...assistantData,
                    id: assistant.id,
                    userId: userId,
                    code: assistant.code,
                };
                
                onUpdate(editedAssistant);
                operationSuccess = true;
                onClose();
            } else {
                console.log('Failed to update assistant');
            }
        } catch (error) {
            console.error('Failed to update assistant:', error);
            operationSuccess = false;
        } finally {
            setLoading(false);
        }
        if (operationSuccess) {
            showNotification({
                type: 'success',
                title: 'Assistant updated',
                message: `Assistant "${fields.name}" has been successfully updated.`,
                autoClose: true,
                duration: 3000
            });
        } else {
            showNotification({
                type: 'error',
                title: 'Failed to update assistant',
                message: 'Failed to update assistant. Please try again.',
                autoClose: true,
                duration: 3000
            });
        }
    };

    return (
        <>
            <style>
                {`
                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                        20%, 40%, 60%, 80% { transform: translateX(5px); }
                    }
                    .shake {
                        animation: shake 0.5s;
                    }
                `}
            </style>
            <div
                ref={modalRef}
                onClick={handleBackdropClick}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0,0,0,0.5)',
                    zIndex: 15000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <div
                    className={shake ? 'shake' : ''}
                    style={{
                    width: '45vw',
                    minWidth: 340,
                    maxWidth: 520,
                    height: '75vh',
                    minHeight: 600,
                    maxHeight: 800,
                    background: '#232323',
                    borderRadius: '32px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    position: 'relative',
                    padding: '24px 0 24px 0',
                    overflow: 'hidden',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Заголовок и подсказка */}
                <div style={{
                    width: '85%',
                    margin: '0 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                }}>
                    <h2 style={{color: '#fff', fontSize: 20.5, fontWeight: 700, marginBottom: 4, textAlign: 'left'}}>Edit
                        Assistant</h2>
                    <div style={{
                        color: '#fff',
                        fontSize: 11.52,
                        fontWeight: 400,
                        marginBottom: 10,
                        textAlign: 'left',
                        maxWidth: 400
                    }}>
                        Customize your Assistant
                    </div>
                </div>
                {/* Avatar Preview */}
                <div style={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 12}}>
                    <div
                        onClick={() => !uploadingImage && fileInputRef.current?.click()}
                        style={{
                            width: 100,
                            height: 100,
                            borderRadius: '50%',
                            backgroundColor: avatarImage ? 'transparent' : avatarColor,
                            backgroundImage: avatarImage ? `url(${avatarImage})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            cursor: uploadingImage ? 'default' : 'pointer',
                            position: 'relative',
                            marginBottom: 12,
                            border: '3px solid rgba(255,255,255,0.1)',
                        }}
                    >
                        {!avatarImage && (
                            <span style={{
                                color: 'white',
                                fontSize: '32px',
                                fontWeight: 600,
                                fontFamily: 'Styrene-B'
                            }}>
                                {getInitials(fields.name || 'A')}
                            </span>
                        )}
                        {uploadingImage && (
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(0,0,0,0.6)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '12px'
                            }}>
                                Loading...
                            </div>
                        )}
                    </div>

                    {/* Upload & Remove Buttons */}
                    <div style={{display: 'flex', gap: 8, marginBottom: 12}}>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImage}
                            style={{
                                padding: '6px 12px',
                                borderRadius: 8,
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: 'rgba(255,255,255,0.05)',
                                color: '#fff',
                                fontSize: 11,
                                cursor: uploadingImage ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <Upload size={14} />
                            Upload Image
                        </button>
                        {avatarImage && (
                            <button
                                type="button"
                                onClick={handleRemoveImage}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: 8,
                                    border: '1px solid rgba(255,100,100,0.3)',
                                    background: 'rgba(255,100,100,0.1)',
                                    color: '#ff6b6b',
                                    fontSize: 11,
                                    cursor: 'pointer',
                                }}
                            >
                                Remove
                            </button>
                        )}
                    </div>

                    {/* Hidden File Input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handleImageUpload}
                        style={{display: 'none'}}
                    />

                    {/* Color Picker */}
                    {console.log('Render - avatarImage:', avatarImage, 'should show picker:', !avatarImage)}
                    {!avatarImage ? (
                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12}}>
                            <div style={{color: '#fff', fontSize: 12}}>Select a color:</div>
                            <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, maxWidth: 280}}>
                                {avatarColors.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setAvatarColor(color)}
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: '50%',
                                            background: color,
                                            border: avatarColor === color ? '3px solid #ffe01b' : '2px solid rgba(255,255,255,0.1)',
                                            cursor: 'pointer',
                                            padding: 0,
                                            transition: 'transform 0.2s, border 0.2s',
                                            transform: avatarColor === color ? 'scale(1.1)' : 'scale(1)',
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div style={{color: '#fff', fontSize: 12}}>Image uploaded - color picker hidden</div>
                    )}
                </div>
                {/* Поля ввода */}
                <form
                    style={{
                        width: '85%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        flex: 1,
                        justifyContent: 'space-between',
                        margin: '0 auto'
                    }}
                    onSubmit={handleSaveAssistant}
                >
                    <input
                        name="name"
                        value={fields.name}
                        onChange={handleChange}
                        placeholder="How do you want to call your assistant?"
                        style={{
                            width: '100%',
                            padding: '10.24px',
                            borderRadius: 11.52,
                            border: 'none',
                            background: '#2a2a28',
                            color: '#fff',
                            fontSize: 11.52,
                            marginBottom: 0,
                            outline: 'none',
                        }}
                        disabled={loading}
                    />
                    <input
                        name="token"
                        value={fields.token}
                        onChange={handleChange}
                        placeholder="Bearer Token"
                        style={{
                            width: '100%',
                            padding: '10.24px',
                            borderRadius: 11.52,
                            border: 'none',
                            background: '#2a2a28',
                            color: '#fff',
                            fontSize: 11.52,
                            marginBottom: 0,
                            outline: 'none',
                        }}
                        disabled={loading}
                    />
                    <input
                        name="speechToken"
                        value={fields.speechToken}
                        onChange={handleChange}
                        placeholder="Speech-to-speech Token"
                        style={{
                            width: '100%',
                            padding: '10.24px',
                            borderRadius: 11.52,
                            border: 'none',
                            background: '#2a2a28',
                            color: '#fff',
                            fontSize: 11.52,
                            marginBottom: 0,
                            outline: 'none',
                        }}
                        disabled={loading}
                    />
                    <input
                        name="webhook"
                        value={fields.webhook}
                        onChange={handleChange}
                        placeholder="Webhook URL"
                        style={{
                            width: '100%',
                            padding: '10.24px',
                            borderRadius: 11.52,
                            border: 'none',
                            background: '#2a2a28',
                            color: '#fff',
                            fontSize: 11.52,
                            marginBottom: 0,
                            outline: 'none',
                        }}
                        disabled={loading}
                    />
                    <input
                        name="description"
                        value={fields.description}
                        onChange={handleChange}
                        placeholder="Description"
                        style={{
                            width: '100%',
                            padding: '10.24px',
                            borderRadius: 11.52,
                            border: 'none',
                            background: '#2a2a28',
                            color: '#fff',
                            fontSize: 11.52,
                            marginBottom: 0,
                            outline: 'none',
                        }}
                        disabled={loading}
                    />
                    <input
                        name="code"
                        value={fields.code}
                        onChange={handleChange}
                        placeholder="Code"
                        style={{
                            width: '100%',
                            padding: '10.24px',
                            borderRadius: 11.52,
                            border: 'none',
                            background: '#2a2a28',
                            color: '#fff',
                            fontSize: 11.52,
                            marginBottom: 0,
                            outline: 'none',
                        }}
                        disabled={loading}
                    />
                    <div style={{display: 'flex', justifyContent: 'flex-end', gap: 9.6, marginTop: 'auto', paddingTop: 10}}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '7.68px 23.04px',
                                borderRadius: 15.36,
                                border: '2px solid #fff',
                                background: 'transparent',
                                color: '#fff',
                                fontWeight: 600,
                                fontSize: 11.52,
                                cursor: 'pointer',
                                marginRight: 4.8,
                            }}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                padding: '7.68px 23.04px',
                                borderRadius: 15.36,
                                border: 'none',
                                background: isFormValid ? '#ffe01b' : '#666',
                                color: '#232323',
                                fontWeight: 700,
                                fontSize: 11.52,
                                cursor: isFormValid ? 'pointer' : 'not-allowed',
                                opacity: isFormValid ? 1 : 0.6,
                            }}
                            disabled={loading || !isFormValid}
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        {/* Crop Modal Overlay */}
        {cropMode && tempImage && (
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0,0,0,0.9)',
                    zIndex: 16000,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                        Adjust Your Image
                    </h3>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                        Zoom and drag to position
                    </p>
                </div>

                {/* Crop Preview */}
                <div
                    style={{
                        position: 'relative',
                        width: 300,
                        height: 300,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '3px solid rgba(255,255,255,0.3)',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        marginBottom: 24
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <img
                        src={tempImage}
                        alt="crop preview"
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${zoom})`,
                            maxWidth: 'none',
                            height: '100%',
                            width: 'auto',
                            userSelect: 'none',
                            pointerEvents: 'none'
                        }}
                        draggable={false}
                    />
                </div>

                {/* Zoom Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                    <button
                        onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: 'rgba(255,255,255,0.1)',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <ZoomOut size={18} />
                    </button>
                    <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.1"
                        value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        style={{
                            width: 200,
                            accentColor: '#ffe01b'
                        }}
                    />
                    <button
                        onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: 'rgba(255,255,255,0.1)',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <ZoomIn size={18} />
                    </button>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={handleCropCancel}
                        disabled={uploadingImage}
                        style={{
                            padding: '10px 24px',
                            borderRadius: 12,
                            border: '2px solid rgba(255,255,255,0.3)',
                            background: 'transparent',
                            color: '#fff',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: uploadingImage ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            opacity: uploadingImage ? 0.5 : 1
                        }}
                    >
                        <X size={16} />
                        Cancel
                    </button>
                    <button
                        onClick={handleCropConfirm}
                        disabled={uploadingImage}
                        style={{
                            padding: '10px 24px',
                            borderRadius: 12,
                            border: 'none',
                            background: uploadingImage ? '#666' : '#ffe01b',
                            color: '#232323',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: uploadingImage ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                        }}
                    >
                        <Check size={16} />
                        {uploadingImage ? 'Processing...' : 'Confirm'}
                    </button>
                </div>

                {/* Hidden canvas for processing */}
                <canvas ref={cropCanvasRef} style={{ display: 'none' }} />
            </div>
        )}
        </>
    );
};

export default EditAssistantModal; 