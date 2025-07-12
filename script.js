class TranslationTool {
    constructor() {
        this.initElements();
        this.bindEvents();
        this.loadLanguages();
    }

    initElements() {
        this.sourceText = document.getElementById('source-text');
        this.targetText = document.getElementById('target-text');
        this.sourceLang = document.getElementById('source-lang');
        this.targetLang = document.getElementById('target-lang');
        this.translateBtn = document.getElementById('translate-btn');
        this.clearBtn = document.getElementById('clear-btn');
        this.copyBtn = document.getElementById('copy-btn');
        this.swapBtn = document.getElementById('swap-btn');
        this.status = document.getElementById('status');
    }

    bindEvents() {
        this.translateBtn.addEventListener('click', () => this.translate());
        this.clearBtn.addEventListener('click', () => this.clear());
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());
        this.swapBtn.addEventListener('click', () => this.swapLanguages());

        this.sourceText.addEventListener('input', () => this.debounceTranslate());
        this.sourceLang.addEventListener('change', () => this.translate());
        this.targetLang.addEventListener('change', () => this.translate());

        this.sourceText.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.translate();
            }
        });
    }

    loadLanguages() {
        const languages = [
            { code: 'auto', name: 'Auto Detect' },
            { code: 'en', name: 'English' },
            { code: 'es', name: 'Spanish' },
            { code: 'fr', name: 'French' },
            { code: 'de', name: 'German' },
            { code: 'it', name: 'Italian' },
            { code: 'pt', name: 'Portuguese' },
            { code: 'ru', name: 'Russian' },
            { code: 'ja', name: 'Japanese' },
            { code: 'ko', name: 'Korean' },
            { code: 'zh', name: 'Chinese' },
            { code: 'ar', name: 'Arabic' },
            { code: 'hi', name: 'Hindi' },
            { code: 'nl', name: 'Dutch' },
            { code: 'sv', name: 'Swedish' },
            { code: 'da', name: 'Danish' },
            { code: 'no', name: 'Norwegian' },
            { code: 'fi', name: 'Finnish' },
            { code: 'pl', name: 'Polish' },
            { code: 'tr', name: 'Turkish' },
            { code: 'cs', name: 'Czech' },
            { code: 'hu', name: 'Hungarian' },
            { code: 'ro', name: 'Romanian' },
            { code: 'bg', name: 'Bulgarian' },
            { code: 'hr', name: 'Croatian' },
            { code: 'sk', name: 'Slovak' },
            { code: 'sl', name: 'Slovenian' },
            { code: 'et', name: 'Estonian' },
            { code: 'lv', name: 'Latvian' },
            { code: 'lt', name: 'Lithuanian' }
        ];

        const targetLanguages = languages.filter(lang => lang.code !== 'auto');

        this.populateLanguageSelect(this.sourceLang, languages, 'auto');
        this.populateLanguageSelect(this.targetLang, targetLanguages, 'es');
    }

    populateLanguageSelect(selectElement, languages, defaultValue) {
        selectElement.innerHTML = '';
        languages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.code;
            option.textContent = lang.name;
            if (lang.code === defaultValue) {
                option.selected = true;
            }
            selectElement.appendChild(option);
        });
    }

    debounceTranslate() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            if (this.sourceText.value.trim()) {
                this.translate();
            }
        }, 500);
    }

    async translate() {
        const text = this.sourceText.value.trim();

        if (!text) {
            this.targetText.value = '';
            this.showStatus('');
            return;
        }

        const sourceLang = this.sourceLang.value;
        const targetLang = this.targetLang.value;

        if (sourceLang === targetLang && sourceLang !== 'auto') {
            this.targetText.value = text;
            this.showStatus('Source and target languages are the same');
            return;
        }

        this.showStatus('Translating...', 'loading');
        this.translateBtn.disabled = true;

        try {
            const translation = await this.callTranslationAPI(text, sourceLang, targetLang);
            this.targetText.value = translation;
            this.showStatus('Translation completed', 'success');
        } catch (error) {
            console.error('Translation error:', error);
            this.showStatus('Translation failed. Please try again.', 'error');
            this.targetText.value = '';
        } finally {
            this.translateBtn.disabled = false;
        }
    }

    async callTranslationAPI(text, sourceLang, targetLang) {
        const langPair = sourceLang === 'auto'
            ? `autodetect|${targetLang}`
            : `${sourceLang}|${targetLang}`;

        try {
            const response = await fetch(
                `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.responseStatus === 200 && data.responseData) {
                return data.responseData.translatedText;
            } else {
                throw new Error('Translation API returned an error');
            }
        } catch (error) {
            return await this.fallbackTranslation(text, sourceLang, targetLang);
        }
    }

    async fallbackTranslation(text, sourceLang, targetLang) {
        const response = await fetch('https://libretranslate.com/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: text,
                source: sourceLang === 'auto' ? 'auto' : sourceLang,
                target: targetLang,
                format: 'text'
            })
        });

        if (!response.ok) {
            throw new Error(`LibreTranslate error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.translatedText;
    }

    swapLanguages() {
        if (this.sourceLang.value === 'auto') {
            this.showStatus('Cannot swap with auto-detect', 'error');
            return;
        }

        const sourceValue = this.sourceLang.value;
        const targetValue = this.targetLang.value;
        const sourceTextValue = this.sourceText.value;
        const targetTextValue = this.targetText.value;

        this.sourceLang.value = targetValue;
        this.targetLang.value = sourceValue;
        this.sourceText.value = targetTextValue;
        this.targetText.value = sourceTextValue;

        if (this.sourceText.value.trim()) {
            this.translate();
        }
    }

    clear() {
        this.sourceText.value = '';
        this.targetText.value = '';
        this.showStatus('');
        this.sourceText.focus();
    }

    async copyToClipboard() {
        const text = this.targetText.value;

        if (!text) {
            this.showStatus('No translation to copy', 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            this.showStatus('Translation copied to clipboard', 'success');
        } catch (error) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showStatus('Translation copied to clipboard', 'success');
        }
    }

    showStatus(message, type = '') {
        this.status.textContent = message;
        this.status.className = `status ${type}`;

        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                this.showStatus('');
            }, 3000);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TranslationTool();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.getElementById('source-text').blur();
        document.getElementById('target-text').blur();
    }
});
