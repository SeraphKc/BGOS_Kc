import React from 'react';
import { CodeHighlighter } from '../utils/CodeHighlighter';

interface CodeDisplayProps {
    code: string;
    language?: string;
    showLineNumbers?: boolean;
    className?: string;
}

const CodeDisplay: React.FC<CodeDisplayProps> = ({ 
    code, 
    language, 
    showLineNumbers = true, 
    className = '' 
}) => {
    console.log('CodeDisplay render:', {
        hasCode: !!code,
        codeLength: code?.length,
        language,
        codePreview: code?.substring(0, 100) + '...'
    });

    if (!code) {
        return (
            <div className={`text-gray-400 text-center p-8 ${className}`}>
                <h3 className="text-white font-bold mb-2">No Code Available</h3>
                <p>No code content to display</p>
            </div>
        );
    }

    const lines = code.split('\n');
    const highlightedCode = CodeHighlighter.highlightCode(code, language);
    const highlightedLines = highlightedCode.split('\n');

    return (
        <div className={`font-mono text-sm leading-relaxed text-white ${className}`}>
            {showLineNumbers ? (
                <div className="flex">
                    {/* Номера строк */}
                    <div className="text-gray-500 pr-4 select-none text-right" style={{ minWidth: '3rem' }}>
                        {lines.map((_, index) => (
                            <div key={index} className="py-0.5">
                                {index + 1}
                            </div>
                        ))}
                    </div>
                    {/* Код с подсветкой */}
                    <div className="flex-1">
                        {highlightedLines.map((line, index) => (
                            <div key={index} className="py-0.5">
                                <span dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }} />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div dangerouslySetInnerHTML={{ __html: highlightedCode }} />
            )}
        </div>
    );
};

export default CodeDisplay; 