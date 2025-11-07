export interface ParsedArticle {
    title?: string;
    headers: string[];
    paragraphs: string[];
    lists: string[][];
    quotes: string[];
}

export class ArticleParser {
    static parseArticleText(articleText: string): ParsedArticle {
        const result: ParsedArticle = {
            headers: [],
            paragraphs: [],
            lists: [],
            quotes: []
        };

        if (!articleText) return result;

        // Парсим title
        const titleMatch = articleText.match(/<title>(.*?)<\/title>/);
        if (titleMatch) {
            result.title = titleMatch[1].trim();
        }

        // Парсим headers
        const headerMatches = articleText.match(/<header>(.*?)<\/header>/g);
        if (headerMatches) {
            result.headers = headerMatches.map(match => 
                match.replace(/<\/?header>/g, '').trim()
            );
        }

        // Парсим paragraphs
        const paragraphMatches = articleText.match(/<paragraph>(.*?)<\/paragraph>/g);
        if (paragraphMatches) {
            result.paragraphs = paragraphMatches.map(match => 
                match.replace(/<\/?paragraph>/g, '').trim()
            );
        }

        // Парсим lists
        const listMatches = articleText.match(/<list>(.*?)<\/list>/g);
        if (listMatches) {
            result.lists = listMatches.map(match => {
                const listContent = match.replace(/<\/?list>/g, '').trim();
                return listContent.split('\n')
                    .map(item => item.trim())
                    .filter(item => item.startsWith('-') || item.startsWith('•'))
                    .map(item => item.replace(/^[-•]\s*/, '').trim())
                    .filter(item => item.length > 0);
            });
        }

        // Парсим quotes
        const quoteMatches = articleText.match(/<quote>(.*?)<\/quote>/g);
        if (quoteMatches) {
            result.quotes = quoteMatches.map(match => 
                match.replace(/<\/?quote>/g, '').trim()
            );
        }

        return result;
    }

    static extractArticleTitle(articleText: string): string {
        const titleMatch = articleText.match(/<title>(.*?)<\/title>/);
        return titleMatch ? titleMatch[1].trim() : 'Статья';
    }

    static hasArticleContent(articleText: string): boolean {
        return !!(articleText && (
            articleText.includes('<title>') ||
            articleText.includes('<header>') ||
            articleText.includes('<paragraph>')
        ));
    }
} 