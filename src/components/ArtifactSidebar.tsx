import React from 'react';
import { motion } from 'framer-motion';
import { ChatHistory } from '../types/model/ChatHistory';
import { CodeHighlighter } from '../utils/CodeHighlighter';
import { ChartGenerator } from '../utils/ChartGenerator';
import { base64ToUint8Array } from '../utils/Base64Converter';
import { ArticleParser } from '../utils/ArticleParser';
import CodeDisplay from './CodeDisplay';
import ArticleDisplay from './ArticleDisplay';
import eyeIcon from '../assets/icons/eye.svg';
import codeWhiteIcon from '../assets/icons/code-white.svg';
import closeIcon from '../assets/icons/close.svg';
import { useNotification } from '../hooks/useNotification';

interface ArtifactSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    selectedArtifact?: ChatHistory | null;
}

const ArtifactSidebar: React.FC<ArtifactSidebarProps> = ({ isOpen, onClose, selectedArtifact }) => {
    const [activeTab, setActiveTab] = React.useState<'artifact' | 'code'>('artifact');
    const [selectedImageIndex, setSelectedImageIndex] = React.useState<number>(0);

    // Устанавливаем правильный таб по умолчанию в зависимости от типа контента
    React.useEffect(() => {
        if (selectedArtifact?.isCode || selectedArtifact?.artifact_code) {
            setActiveTab('code');
        } else {
            setActiveTab('artifact');
        }
        // Сбрасываем выбранное изображение при смене артефакта
        setSelectedImageIndex(0);
    }, [selectedArtifact]);

    const { showNotification } = useNotification();
    
    if (!isOpen) return null;

    const handleCopyCode = async () => {
        const codeToCopy = selectedArtifact?.artifact_code;
        if (codeToCopy) {
            try {
                await navigator.clipboard.writeText(codeToCopy);
                showNotification({
                    type: 'success',
                    title: 'Code copied',
                    message: 'Code has been copied to clipboard.',
                    autoClose: true,
                    duration: 3000
                });
            } catch (error) {
                console.error('Failed to copy code:', error);
                showNotification({
                    type: 'error',
                    title: 'Copy failed',
                    message: 'Failed to copy code. Please try again.',
                    autoClose: true,
                    duration: 5000
                });
            }
        } else {
            console.warn('No code available to copy');
            showNotification({
                type: 'error',
                title: 'No code',
                message: 'No code available to copy.',
                autoClose: true,
                duration: 3000
            });
        }
    };

    const handleCopyArtifact = async () => {
        if (selectedArtifact?.files && selectedArtifact.files.some(file => file.isImage)) {
            const imageFiles = selectedArtifact.files.filter(file => file.isImage);
            // Используем выбранное изображение или первое по умолчанию
            const imageFile = imageFiles[selectedImageIndex] || imageFiles[0];
            if (imageFile) {
                try {
                    const blob = new Blob([base64ToUint8Array(imageFile.fileData)], {
                        type: imageFile.fileMimeType || 'image/png'
                    });
                    
                    console.log('Blob created:', blob.size, 'bytes');

                    if (navigator.clipboard && navigator.clipboard.write) {
                        try {
                            await navigator.clipboard.write([
                                new ClipboardItem({ [blob.type]: blob })
                            ]);
                            console.log('Successfully copied to clipboard via Clipboard API');
                            const imageFiles = selectedArtifact.files.filter(file => file.isImage);
                            const isMultipleImages = selectedArtifact.is_multi_response && imageFiles.length > 1;
                            const imageNumber = isMultipleImages ? ` (image ${selectedImageIndex + 1})` : '';
                            
                            showNotification({
                                type: 'success',
                                title: 'Image copied',
                                message: `Image${imageNumber} has been copied to clipboard.`,
                                autoClose: true,
                                duration: 3000
                            });
                            return;
                        } catch (clipboardError) {
                            console.warn('Clipboard API failed, trying fallback:', clipboardError);
                        }
                    }

                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = imageFile.fileName || 'artifact';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    console.log('Fallback: file download initiated');
                    const imageFiles = selectedArtifact.files.filter(file => file.isImage);
                    const isMultipleImages = selectedArtifact.is_multi_response && imageFiles.length > 1;
                    const imageNumber = isMultipleImages ? ` (image ${selectedImageIndex + 1})` : '';
                    
                    showNotification({
                        type: 'success',
                        title: 'Image downloaded',
                        message: `Image${imageNumber} has been successfully downloaded.`,
                        autoClose: true,
                        duration: 3000
                    });
                    
                } catch (error) {
                    console.error('Failed to copy artifact:', error);
                    showNotification({
                        type: 'error',
                        title: 'Copy failed',
                        message: 'Failed to copy image. Please try again.',
                        autoClose: true,
                        duration: 5000
                    });
                }
            }
        } else if (selectedArtifact?.files && selectedArtifact.files.some(file => file.isVideo)) {
            const videoFiles = selectedArtifact.files.filter(file => file.isVideo);
            
            if (videoFiles.length > 0) {
                const file = videoFiles[0]; // Copy first video
                try {
                    const blob = new Blob([base64ToUint8Array(file.fileData)], {
                        type: file.fileMimeType || 'video/mp4'
                    });
                    
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = file.fileName || 'video';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    showNotification({
                        type: 'success',
                        title: 'Video downloaded',
                        message: 'Video has been successfully downloaded.',
                        autoClose: true,
                        duration: 3000
                    });
                    
                } catch (error) {
                    console.error('Failed to download video:', error);
                    showNotification({
                        type: 'error',
                        title: 'Download failed',
                        message: 'Failed to download video. Please try again.',
                        autoClose: true,
                        duration: 5000
                    });
                }
            } else {
                showNotification({
                    type: 'error',
                    title: 'No video',
                    message: 'No video available to download.',
                    autoClose: true,
                    duration: 3000
                });
            }
        } else {
            console.warn('No file data available for copying');
            showNotification({
                type: 'error',
                title: 'No image',
                message: 'No image available to copy.',
                autoClose: true,
                duration: 3000
            });
        }
    };

    // Функция для определения заголовка и подзаголовка на основе типа контента
    const getContentInfo = () => {
        if (!selectedArtifact) {
            return {
                title: 'Generated Content',
                subtitle: 'Preview your generated content'
            };
        }

        // Если это статья
        if (selectedArtifact.isArticle && selectedArtifact.article_text) {
            const title = ArticleParser.extractArticleTitle(selectedArtifact.article_text);
            return {
                title: title,
                subtitle: 'AI-generated article'
            };
        }

        // Если это изображение (артефакт)
        if (selectedArtifact.files && selectedArtifact.files.some(file => file.isImage)) {
            if (selectedArtifact.is_multi_response && selectedArtifact.files) {
                return {
                    title: 'Generated Images',
                    subtitle: 'Multiple AI-generated images'
                };
            }
            return {
                title: 'Generated Image',
                subtitle: 'AI-generated image preview'
            };
        }

        // Если это видео (артефакт)
        if (selectedArtifact.files && selectedArtifact.files.some(file => file.isVideo)) {
            // Для сообщений от пользователя используем "Attached Video", для ассистента - "Generated Content"
            const isUserMessage = selectedArtifact.sender === 'user';
            return {
                title: isUserMessage ? 'Attached Video' : 'Generated Content',
                subtitle: isUserMessage ? 'User uploaded video' : 'AI-generated video preview'
            };
        }

        // Если это код
        if (selectedArtifact.artifact_code) {
            const code = selectedArtifact.artifact_code;

            // Определяем тип контента по содержимому кода
            if (code.includes('data:image') || code.includes('base64') || code.includes('png') || code.includes('jpg') || code.includes('jpeg')) {
                return {
                    title: 'Generated Image',
                    subtitle: 'AI-generated image preview'
                };
            }

            if (code.includes('Q1') && code.includes('Q2') && code.includes('Q3') && code.includes('Q4')) {
                if (code.includes('Q5') || code.includes('Q6') || code.includes('Q7')) {
                    return {
                        title: 'Extended Sales by Quarter',
                        subtitle: 'Real-time data visualization'
                    };
                }
                return {
                    title: 'Sales by Quarter',
                    subtitle: 'Real-time data visualization'
                };
            }

            if (code.includes('Channel Performance') || 
                (code.includes('Yesterday revenue') && code.includes('Orders') && code.includes('Average orders') && code.includes('Additional revenue'))) {
                return {
                    title: 'Channel Performance',
                    subtitle: 'Real-time sales and data'
                };
            }

            if (code.includes('<html') || code.includes('<div') || code.includes('<svg') || 
                code.includes('<!DOCTYPE') || code.includes('<body>') || code.includes('<head>')) {
                return {
                    title: 'Generated Dashboard',
                    subtitle: 'Interactive data visualization'
                };
            }

            return {
                title: 'Generated Content',
                subtitle: 'AI-generated content preview'
            };
        }

        return {
            title: 'Generated Content',
            subtitle: 'Preview your generated content'
        };
    };

    // Функция для рендеринга HTML кода как предварительного просмотра
    const renderArtifactPreview = () => {
        if (!selectedArtifact?.artifact_code) {
            return (
                <div className="text-gray-400 text-center p-8">
                    No artifact code available
                </div>
            );
        }

        const code = selectedArtifact.artifact_code;

        // Если это изображение (base64 или URL)
        if (code.includes('data:image') || code.includes('base64') || code.includes('png') || code.includes('jpg') || code.includes('jpeg')) {
            return (
                <div className="w-full h-full flex items-center justify-center p-4">
                    <img 
                        src={code} 
                        alt="Generated content" 
                        className="max-w-full max-h-full object-contain rounded-lg"
                        style={{ maxHeight: 'calc(100vh - 300px)' }}
                    />
                </div>
            );
        }

        // Если это HTML код, рендерим его как предварительный просмотр
        if (code.includes('<html') || code.includes('<div') || code.includes('<svg') || 
            code.includes('<!DOCTYPE') || code.includes('<body>') || code.includes('<head>')) {
            
            // Пытаемся извлечь данные диаграммы из кода
            const chartData = ChartGenerator.extractChartData(code);
            
            let htmlToRender = code;
            
            // Check for KPI cards first (Channel Performance dashboard)
            if (code.includes('Channel Performance') || 
                (code.includes('Yesterday revenue') && code.includes('Orders') && code.includes('Average orders') && code.includes('Additional revenue')) ||
                (code.includes('KPI Cards') && code.includes('revenue') && code.includes('Orders'))) {
                // Extract KPI metrics from the code
                const metrics = ChartGenerator.extractKPIMetrics(code);
                if (metrics.length > 0) {
                    htmlToRender = ChartGenerator.generateKPICardsHTML(metrics);
                }
            } else if (code.includes('Q1') && code.includes('Q2') && code.includes('Q3') && code.includes('Q4') && 
                (code.includes('Q5') || code.includes('Q6') || code.includes('Q7'))) {
                // Если это расширенная диаграмма продаж по кварталам (Q1-Q7), используем специальный генератор
                htmlToRender = ChartGenerator.generateExtendedSalesChartHTML();
            } else if (chartData) {
                // Если это обычная диаграмма, используем стандартный генератор
                htmlToRender = ChartGenerator.generateChartHTML(chartData);
            } else if (!code.includes('<!DOCTYPE') && !code.includes('<html>')) {
                // Если это не полный HTML документ, оборачиваем в базовую структуру в стиле Channel Performance
                htmlToRender = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <style>
                            body { 
                                margin: 0; 
                                padding: 0; 
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                                background: #21211f;
                                color: #ffffff;
                            }
                            .chart-container { 
                                width: 100%; 
                                height: 100vh;
                                background: #21211f;
                                padding: 20px;
                                box-sizing: border-box;
                            }
                            .chart { 
                                display: flex; 
                                justify-content: space-around; 
                                align-items: end; 
                                height: 300px; 
                                margin-top: 20px; 
                                background: #262624;
                                border-radius: 12px;
                                padding: 20px;
                            }
                            .bar { 
                                width: 60px; 
                                position: relative; 
                                border-radius: 4px 4px 0 0; 
                                transition: all 0.3s ease; 
                                cursor: pointer;
                                background: #fbbf24;
                            }
                            .bar:hover { 
                                transform: scale(1.05); 
                                opacity: 0.8;
                                box-shadow: 0 4px 8px rgba(251, 191, 36, 0.3);
                            }
                            .label { 
                                position: absolute; 
                                bottom: -25px; 
                                left: 50%; 
                                transform: translateX(-50%); 
                                font-size: 12px; 
                                color: #9ca3af; 
                            }
                            .value { 
                                position: absolute; 
                                top: -25px; 
                                left: 50%; 
                                transform: translateX(-50%); 
                                font-size: 12px; 
                                font-weight: bold; 
                                color: #ffffff; 
                            }
                            h1, h2, h3 { color: #ffffff; }
                            p { line-height: 1.6; color: #9ca3af; }
                        </style>
                    </head>
                    <body>
                        <div class="chart-container">
                            ${code}
                        </div>
                    </body>
                    </html>
                `;
            }

            return (
                <div className="w-full h-full">
                    <iframe
                        srcDoc={htmlToRender}
                        className="w-full h-full border-0"
                        style={{ 
                            backgroundColor: 'transparent',
                            minHeight: 'calc(100vh - 300px)'
                        }}
                        title="Generated content preview"
                    />
                </div>
            );
        }

        // Для других типов кода показываем заглушку
        return (
            <div className="text-gray-400 text-center p-8">
                <h3 className="text-white font-bold mb-2">Content Preview</h3>
                <p>Preview not available for this content type</p>
                <p className="text-sm mt-2">Use the Code tab to view the source code.</p>
            </div>
        );
    };

    // Функция для рендеринга изображений (артефактов)
    const renderImageArtifact = () => {
        if (!selectedArtifact) {
            return <div className="text-gray-400 text-center">No artifact selected</div>;
        }

        if (selectedArtifact.files && selectedArtifact.files.some(file => file.isImage)) {
            // Для множественных картинок показываем все сразу
            if (selectedArtifact.is_multi_response && selectedArtifact.files) {
                const imageFiles = selectedArtifact.files.filter(file => file.isImage);
                return (
                    <div className="flex flex-col gap-4">
                        {imageFiles.map((file, index) => (
                            <div 
                                key={`${file.fileName}-${index}`} 
                                className={`text-center cursor-pointer transition-all duration-200 ${
                                    selectedImageIndex === index ? 'scale-105 shadow-lg' : 'hover:scale-102'
                                }`}
                                onClick={() => setSelectedImageIndex(index)}
                                title={`Click to select image ${index + 1} for copying`}
                            >
                                <img 
                                    src={`data:${file.fileMimeType || 'image/png'};base64,${file.fileData}`} 
                                    alt={file.fileName || 'artifact'} 
                                    className="max-w-full max-h-[80vh] rounded-xl mb-2 object-contain"
                                    style={{ maxHeight: 'calc(100vh - 300px)' }}
                                    onLoad={() => console.log('Multi-artifact image loaded successfully:', file.fileName)}
                                    onError={(e) => console.error('Multi-artifact image failed to load:', file.fileName, e)}
                                />
                                {file.fileName && (
                                    <div className="text-sm text-gray-400 mt-2">
                                        {file.fileName} {selectedImageIndex === index ? '• Selected' : ''}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                );
            }
            
            // Для одной картинки
            const imageFiles = selectedArtifact.files.filter(file => file.isImage);
            const imageFile = imageFiles[0];
            if (imageFile) {
                return (
                    <div className="text-center">
                        <img 
                            src={`data:image/${imageFile.fileMimeType || 'png'};base64,${imageFile.fileData}`} 
                            alt="artifact" 
                            className="max-w-full max-h-[80vh] rounded-xl mb-2 object-contain"
                            style={{ maxHeight: 'calc(100vh - 300px)' }}
                            onLoad={() => console.log('Artifact image loaded successfully:', imageFile.fileName)}
                            onError={(e) => console.error('Artifact image failed to load:', imageFile.fileName, e)}
                        />
                    </div>
                );
            }
        }



        return (
            <div className="text-sm text-white">
                {selectedArtifact.text || 'No content available'}
            </div>
        );
    };

    // Функция для рендеринга видео (артефактов)
    const renderVideoArtifact = () => {
        if (!selectedArtifact) {
            return <div className="text-gray-400 text-center">No artifact selected</div>;
        }

        if (selectedArtifact.files && selectedArtifact.files.some(file => file.isVideo)) {
            const videoFiles = selectedArtifact.files.filter(file => file.isVideo);

            if (videoFiles.length === 0) {
                return <div className="text-gray-400 text-center">No video files found</div>;
            }

            if (videoFiles.length === 1) {
                const file = videoFiles[0];
                return (
                    <div className="text-center">
                        <video 
                            src={`data:${file.fileMimeType || 'video/mp4'};base64,${file.fileData}`}
                            controls
                            className="max-w-full max-h-[80vh] rounded-xl mb-2 object-contain"
                            style={{ maxHeight: 'calc(100vh - 300px)' }}
                            onError={(e) => {
                                console.error('Artifact video failed to load:', file.fileName, e);
                            }}
                        >
                            Your browser does not support the video tag.
                        </video>
                    </div>
                );
            }

            // Multiple videos
            return (
                <div className="flex flex-col gap-4">
                    {videoFiles.map((file, index) => (
                        <div key={`${file.fileName}-${index}`} className="text-center">
                            <video 
                                src={`data:${file.fileMimeType || 'video/mp4'};base64,${file.fileData}`}
                                controls
                                className="max-w-full max-h-[80vh] rounded-xl mb-2 object-contain"
                                style={{ maxHeight: 'calc(100vh - 300px)' }}
                                onError={(e) => {
                                    console.error('Multi-artifact video failed to load:', file.fileName, e);
                                }}
                            >
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    ))}
                </div>
            );
        }

        return (
            <div className="text-sm text-white">
                {selectedArtifact.text || 'No content available'}
            </div>
        );
    };

    // Функция для рендеринга дефолтного контента (метрики и график)
    const renderDefaultContent = () => {
        const metrics = [
            { label: 'Yesterday revenue', value: '$ 1000', change: '+10% last week', isPositive: true },
            { label: 'Orders', value: '$ 1000', change: '+10% last week', isPositive: true },
            { label: 'Average orders', value: '$ 1000', change: '-80% last week', isPositive: false },
            { label: 'Additional revenue', value: '$ 1000', change: '+10% last week', isPositive: true }
        ];

        const chartData = [
            { date: '06.01', value: 1500 },
            { date: '05.01', value: 2000 },
            { date: '04.01', value: 40000 },
            { date: '03.01', value: 8000 },
            { date: '02.01', value: 12000 },
            { date: '01.01', value: 15000 },
        ];

        const maxValue = 40000;

        return (
            <>
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-6 mb-8 w-full">
                    {metrics.map((metric, index) => (
                        <div 
                            key={index} 
                            className="p-6 flex flex-col justify-center items-center text-center w-full"
                            style={{ 
                                backgroundColor: '#30302E',
                                borderRadius: '20px',
                                height: '140px',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            <div className="text-white font-bold mb-2" style={{ fontSize: '32px', fontFamily: 'Styrene-B' }}>{metric.value}</div>
<div className="text-gray-400 mb-3" style={{ fontSize: '16px', fontFamily: 'Styrene-B' }}>{metric.label}</div>
                            <div 
                                className="px-3 py-1 rounded-lg text-sm font-medium"
                                style={{ 
                                    fontSize: '14px',
                                    color: '#ffffff',
                                    backgroundColor: metric.isPositive ? '#4CAF50' : '#F44336',
                                    fontFamily: 'Styrene-B'
                                }}
                            >
                                {metric.change}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Chart */}
                <div 
                    className="p-6 mb-6"
                    style={{ 
                        borderRadius: '32px',
                        height: '340px',
                    }}
                >
                    <div className="h-full flex relative" style={{ gap: '20px' }}>
                        {/* Y-axis labels */}
                        <div className="flex flex-col justify-between text-xs mr-4" style={{ width: '40px', color: '#a7a7a5', alignItems: 'flex-end' }}>
                            <span className='text-sm'>40 000</span>
                            <span className='text-sm'>20 000</span>
                            <span className='text-sm'>10 000</span>
                            <span className='text-sm'>5 000</span>
                            <span className='text-sm'>1 000</span>
                            <span className='text-sm'>0</span>    
                        </div>
                        
                        {/* Chart area */}
                        <div className="flex-1 flex items-end justify-between relative" style={{ height: '100%', gap: '20px', alignItems: 'baseline' }}>
                            {chartData.map((data, index) => (
                                <div key={index} className="flex flex-col items-center" style={{ height: '100%', width: '60px' }}>
                                    <div 
                                        className="w-full rounded-t transition-all duration-300 hover:opacity-80"
                                        style={{ 
                                            height: `${(data.value / maxValue) * 100}%`,
                                            minHeight: '4px',
                                            maxHeight: '100%',
                                            borderRadius: '4px 4px 0 0',
                                            backgroundColor: '#fbbf24'
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* X-axis labels */}
                    <div className="flex justify-between text-gray-400 text-xs mt-4 ml-16">
                        {chartData.map((data, index) => (
                            <span key={index} className="flex-1 text-center" style={{ width: '60px' }}>{data.date}</span>
                        ))}
                    </div>
                </div>
            </>
        );
    };

    const contentInfo = getContentInfo();

    // Определяем, какой контент показывать
    const renderContent = () => {
        // Если это статья, показываем её
        if (selectedArtifact?.isArticle && selectedArtifact?.article_text) {
            return (
                <div className="h-full overflow-y-auto">
                    <div className="p-6">
                        <ArticleDisplay 
                            articleText={selectedArtifact.article_text}
                        />
                    </div>
                </div>
            );
        }
        
        if (selectedArtifact?.files && selectedArtifact.files.some(file => file.isImage)) {
            return renderImageArtifact();
        }
        
        if (selectedArtifact?.files && selectedArtifact.files.some(file => file.isVideo)) {
            return renderVideoArtifact();
        }
        
        if (selectedArtifact?.isCode && selectedArtifact?.artifact_code) {
            return renderArtifactPreview();
        }
        
        // Дефолтный контент (метрики и график)
        return renderDefaultContent();
    };

    // Определяем, какую кнопку Copy показывать
    const shouldShowCopyButton = () => {
        // Не показываем кнопку копирования для статей
        if (selectedArtifact?.isArticle) {
            return false;
        }
        return selectedArtifact?.artifact_code || 
               (selectedArtifact?.files && selectedArtifact.files.some(file => file.isImage)) ||
               (selectedArtifact?.files && selectedArtifact.files.some(file => file.isVideo));
    };

    const handleCopy = () => {
        if (selectedArtifact?.files && selectedArtifact.files.some(file => file.isImage)) {
            handleCopyArtifact();
        } else if (selectedArtifact?.artifact_code) {
            handleCopyCode();
        } else if (selectedArtifact?.files && selectedArtifact.files.some(file => file.isVideo)) {
            handleCopyArtifact();
        }
    };

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex-1 flex flex-col"
            style={{ 
                backgroundColor: 'rgb(48, 48, 46)',
                borderLeft: '1px solid #373735',
                borderRadius: '32px 0 0 0',
                height: 'calc(100vh - 48px)',
                maxHeight: 'calc(100vh - 48px)',
                overflowX: 'hidden',
                position: 'relative',
                zIndex: 10
            }}
        >
            {/* Control Top Bar */}
                                    <div className="flex items-center justify-between p-4 " style={{ backgroundColor: 'rgb(48, 48, 46)' }}>
                <div className="flex items-center">
                    {/* Switcher - Artifact to Code Display - Hide for articles */}
                    {!selectedArtifact?.isArticle && (
                        <div className="flex overflow-hidden" style={{ backgroundColor: '#262624', borderRadius: '8px', border: '1px solid #3c3c3a' }}>
                            <button 
                                className="p-2 flex items-center justify-center transition-colors focus:outline-none"
                                onClick={() => setActiveTab('artifact')}
                                style={{ 
                                    backgroundColor: activeTab === 'artifact' ? '#3c3837' : '#262624',
                                    padding: '8px 12px 8px 12px'
                                }}
                            >
                                <img src={eyeIcon} alt="Artifact" style={{ width: '24px', height: '24px' }} />
                            </button>
                            <button 
                                className="p-2 flex items-center justify-center transition-colors focus:outline-none"
                                onClick={() => setActiveTab('code')}
                                style={{ 
                                    backgroundColor: activeTab === 'code' ? '#3c3837' : '#262624',
                                    padding: '8px 12px 8px 12px'
                                }}
                            >
                                <img src={codeWhiteIcon} alt="Code" style={{ width: '24px', height: '24px' }} />
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {shouldShowCopyButton() && (
                        <button 
                            onClick={handleCopy}
                            className="text-white font-bold focus:outline-none"
                            style={{ 
                                backgroundColor: '#3c3837',
                                fontSize: '16px',
                                borderRadius: '8px',
                                padding: '8px 16px'
                            }}
                            title={selectedArtifact?.files && selectedArtifact.files.some(file => file.isImage) ? 
                                   (selectedArtifact.is_multi_response && selectedArtifact.files.filter(file => file.isImage).length > 1) ?
                                   `Copy image ${selectedImageIndex + 1} to clipboard` : 'Copy image to clipboard' : 
                                   selectedArtifact?.files && selectedArtifact.files.some(file => file.isVideo) ? 'Download video' : 'Copy code to clipboard'}
                        >
                            {selectedArtifact?.files && selectedArtifact.files.some(file => file.isVideo) ? 'Download' : 'Copy'}
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-300 transition-colors focus:outline-none"
                        style={{ padding: '8px 12px 8px 12px' }}
                    >
                       <img src={closeIcon} alt="Close" style={{ width: '24px', height: '24px' }} />
                    </button>
                </div>
            </div>

         

            {/* Content Area */}
            <div className="w-full flex flex-col" style={{ 
                flex: 1,
                backgroundColor: 'rgb(48, 48, 46)',
                height: 'calc(100% - 80px)',
                overflow: 'hidden'
            }}>
                <div className="w-[96%] flex flex-col overflow-hidden gap-5 mt-4" style={{ 
                    borderRadius: '32px', 
                    backgroundColor: 'rgb(48, 48, 46)', 
                    margin: '16px',
                    flex: 1,
                    height: '100%'
                }}>
                {activeTab === 'artifact' ? (
                    <div className="w-full flex-1 flex flex-col overflow-hidden">
                           {/* Title and Subtitle Section - Only visible in artifact tab, hide for articles */}
            {activeTab === 'artifact' && !selectedArtifact?.isArticle && (
                <div className="w-full text-center py-6 border-b flex-shrink-0" style={{ 
                    borderColor: '#3c3c3a', 
                    height: '101px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    backgroundColor: 'rgb(48, 48, 46)'
                }}>
                    <h2 className="text-white font-bold mb-1" style={{ fontSize: '24px', fontFamily: 'Styrene-B' }}>
                        {contentInfo.title}
                    </h2>
                    <p className="text-gray-400" style={{ fontSize: '14px', color: "#a7a7a5", fontFamily: 'Styrene-B' }}>
                        {contentInfo.subtitle}
                    </p>
                </div>
            )}
                        <div className="flex-1 overflow-hidden px-6 pb-6">
                            {renderContent()}
                        </div>
                    </div>
                ) : (
                    /* Code View */
                    <div className="w-full h-full flex flex-col">
                        {/* Code Content */}
                        <div className="flex-1 overflow-hidden" style={{ backgroundColor: 'rgb(48, 48, 46)', borderRadius: '16px' }}>
                            {selectedArtifact?.artifact_code ? (
                                <div className="h-full overflow-auto">
                                    <CodeDisplay 
                                        code={selectedArtifact.artifact_code}
                                        language={CodeHighlighter.detectLanguage(selectedArtifact.artifact_code)}
                                        showLineNumbers={true}
                                    />
                                </div>
                            ) : (
                                <div className="text-gray-400 text-center p-8">
                                    <h3 className="text-white font-bold mb-2">No Code Available</h3>
                                    <p>This content doesn't have associated code to display.</p>
                                    <p className="text-sm mt-2">Switch to the Artifact tab to view the content.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                </div>
            </div>
        </motion.div>
    );
};

export default ArtifactSidebar; 