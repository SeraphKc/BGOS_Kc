export class CodeHighlighter {
    static highlightHTML(code: string): string {
        return code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/(".*?")/g, '<span style="color: #ff6b6b">$1</span>')
            .replace(/(&lt;\/?[a-zA-Z][^&]*&gt;)/g, '<span style="color: #4ecdc4">$1</span>')
            .replace(/([a-zA-Z-]+)=/g, '<span style="color: #45b7d1">$1</span>=');
    }

    static highlightCSS(code: string): string {
        return code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/([a-zA-Z-]+):/g, '<span style="color: #45b7d1">$1</span>:')
            .replace(/(#[0-9a-fA-F]{3,6})/g, '<span style="color: #ff6b6b">$1</span>')
            .replace(/([0-9]+px|[0-9]+%|[0-9]+em)/g, '<span style="color: #feca57">$1</span>');
    }

    static highlightJavaScript(code: string): string {
        return code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\b(function|const|let|var|if|else|for|while|return|class|import|export)\b/g, '<span style="color: #ff9ff3">$1</span>')
            .replace(/\b(true|false|null|undefined)\b/g, '<span style="color: #feca57">$1</span>')
            .replace(/(["'`])(.*?)\1/g, '<span style="color: #ff6b6b">$1$2$1</span>')
            .replace(/(\/\/.*)/g, '<span style="color: #54a0ff">$1</span>');
    }

    static highlightPython(code: string): string {
        return code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\b(def|import|from|as|if|else|elif|for|while|try|except|finally|with|class|return|True|False|None)\b/g, '<span style="color: #ff9ff3">$1</span>')
            .replace(/\b(requests|BeautifulSoup|html\.parser|User-Agent)\b/g, '<span style="color: #4ecdc4">$1</span>')
            .replace(/(["'`])(.*?)\1/g, '<span style="color: #ff6b6b">$1$2$1</span>')
            .replace(/(#.*)/g, '<span style="color: #54a0ff">$1</span>')
            .replace(/(\d+)/g, '<span style="color: #feca57">$1</span>');
    }

    static highlightCode(code: string, language?: string): string {
        if (!code) return '';
        
        // Определяем язык по содержимому кода
        const detectedLanguage = language || this.detectLanguage(code);
        
        switch (detectedLanguage) {
            case 'html':
                return this.highlightHTML(code);
            case 'css':
                return this.highlightCSS(code);
            case 'javascript':
            case 'js':
                return this.highlightJavaScript(code);
            case 'python':
                return this.highlightPython(code);
            default:
                // Простая подсветка для неизвестных языков
                return code
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
        }
    }

    static detectLanguage(code: string): string {
        const trimmedCode = code.trim();
        
        if (trimmedCode.includes('<html') || trimmedCode.includes('<div') || trimmedCode.includes('<svg')) {
            return 'html';
        }
        
        if (trimmedCode.includes('function') || trimmedCode.includes('const') || trimmedCode.includes('let') || trimmedCode.includes('var')) {
            return 'javascript';
        }
        
        if (trimmedCode.includes('{') && trimmedCode.includes('}') && trimmedCode.includes(':')) {
            return 'css';
        }
        
        if (trimmedCode.includes('import ') || trimmedCode.includes('def ') || trimmedCode.includes('if __name__') || 
            trimmedCode.includes('requests.get') || trimmedCode.includes('BeautifulSoup') || 
            trimmedCode.includes('User-Agent') || trimmedCode.includes('html.parser')) {
            return 'python';
        }
        
        return 'text';
    }
} 