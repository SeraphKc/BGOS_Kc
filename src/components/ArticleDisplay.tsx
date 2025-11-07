import React from 'react';
import { ParsedArticle, ArticleParser } from '../utils/ArticleParser';

interface ArticleDisplayProps {
    articleText: string;
    className?: string;
}

const ArticleDisplay: React.FC<ArticleDisplayProps> = ({ 
    articleText, 
    className = '' 
}) => {
    const parsedArticle = ArticleParser.parseArticleText(articleText);

    if (!ArticleParser.hasArticleContent(articleText)) {
        return (
            <div className={`text-gray-400 text-center p-8 ${className}`}>
                <h3 className="text-white font-bold mb-2">Статья недоступна</h3>
                <p>Содержимое статьи не найдено</p>
            </div>
        );
    }

    return (
        <div className={`text-white ${className}`}>
            {/* Заголовок статьи */}
            {parsedArticle.title && (
                <h1 className="text-3xl font-bold mb-6 text-center text-white" style={{ fontFamily: 'Georgia' }}>
                    {parsedArticle.title}
                </h1>
            )}

            <div className="space-y-6">
                {/* Параграфы и заголовки */}
                {parsedArticle.paragraphs.map((paragraph, index) => (
                    <div key={`paragraph-${index}`}>
                        {/* Если есть соответствующий заголовок, показываем его */}
                        {parsedArticle.headers[index] && (
                            <h2 className="text-xl font-semibold mb-3 text-white" style={{ fontFamily: 'Georgia' }}>
                                {parsedArticle.headers[index]}
                            </h2>
                        )}
                        <p className="text-gray-200 leading-relaxed" style={{ fontFamily: 'Georgia', fontSize: '16px' }}>
                            {paragraph}
                        </p>
                    </div>
                ))}

                {/* Списки */}
                {parsedArticle.lists.map((list, listIndex) => (
                    <div key={`list-${listIndex}`} className="bg-gray-800 p-4 rounded-lg">
                        <ul className="space-y-2">
                            {list.map((item, itemIndex) => (
                                <li key={`list-item-${listIndex}-${itemIndex}`} className="flex items-start">
                                    <span className="text-blue-400 mr-2 mt-1">•</span>
                                    <span className="text-gray-200" style={{ fontFamily: 'Georgia', fontSize: '16px' }}>
                                        {item}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}

                {/* Цитаты */}
                {parsedArticle.quotes.map((quote, index) => (
                    <div key={`quote-${index}`} className="border-l-4 border-blue-400 pl-4 py-2 bg-gray-800 rounded-r-lg">
                        <blockquote className="text-gray-200 italic" style={{ fontFamily: 'Georgia', fontSize: '16px' }}>
                            "{quote}"
                        </blockquote>
                    </div>
                ))}

                {/* Оставшиеся заголовки без параграфов */}
                {parsedArticle.headers.slice(parsedArticle.paragraphs.length).map((header, index) => (
                    <h2 key={`header-${parsedArticle.paragraphs.length + index}`} className="text-xl font-semibold mb-3 text-white" style={{ fontFamily: 'Georgia' }}>
                        {header}
                    </h2>
                ))}
            </div>
        </div>
    );
};

export default ArticleDisplay; 