import i18next from 'i18next';
import { resources } from './translations';

type SupportedLanguage = 'it' | 'en';

const defaultLanguage: SupportedLanguage = 'it';
const supportedLanguages: SupportedLanguage[] = ['it', 'en'];
const storageKey = 'eclipse-language';
let currentTitleKey = 'app.title';

function normalizeLanguage(language: string | null): SupportedLanguage {
    if (!language) return defaultLanguage;

    const shortCode = language.toLowerCase().split('-')[0].split('_')[0];
    return supportedLanguages.indexOf(shortCode as SupportedLanguage) >= 0
        ? shortCode as SupportedLanguage
        : defaultLanguage;
}

function getUrlLanguage(): string | null {
    const match = window.location.search.match(/[?&]lang=([^&]+)/);
    return match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : null;
}

function getStoredLanguage(): string | null {
    try {
        return window.localStorage.getItem(storageKey);
    } catch (error) {
        return null;
    }
}

function persistLanguage(language: SupportedLanguage): void {
    try {
        window.localStorage.setItem(storageKey, language);
    } catch (error) {
        // The selector still works for the current page if storage is unavailable.
    }
}

function updateUrlLanguage(language: SupportedLanguage): void {
    try {
        if (!window.history || !window.history.replaceState) return;

        const search = window.location.search.replace(/^\?/, '');
        const parts = search ? search.split('&') : [];
        const nextParts: string[] = [];
        let foundLanguage = false;

        for (let i = 0; i < parts.length; i++) {
            if (!parts[i]) continue;

            const name = decodeURIComponent(parts[i].split('=')[0]);
            if (name === 'lang') {
                nextParts.push('lang=' + encodeURIComponent(language));
                foundLanguage = true;
            } else {
                nextParts.push(parts[i]);
            }
        }

        if (!foundLanguage) nextParts.push('lang=' + encodeURIComponent(language));

        window.history.replaceState(null, document.title, window.location.pathname + '?' + nextParts.join('&') + window.location.hash);
    } catch (error) {
        // The stored language still keeps the selected locale for future visits.
    }
}

function getInitialLanguage(): SupportedLanguage {
    return normalizeLanguage(
        getUrlLanguage() ||
        getStoredLanguage() ||
        document.documentElement.getAttribute('lang')
    );
}

function translateTextElements(): void {
    const elements = document.querySelectorAll('[data-i18n]');

    for (let i = 0; i < elements.length; i++) {
        const key = elements[i].getAttribute('data-i18n');
        if (key) elements[i].textContent = translate(key);
    }
}

function translateHtmlElements(): void {
    const elements = document.querySelectorAll('[data-i18n-html]');

    for (let i = 0; i < elements.length; i++) {
        const key = elements[i].getAttribute('data-i18n-html');
        if (key) elements[i].innerHTML = translate(key);
    }
}

function translateAttributeElements(): void {
    const elements = document.querySelectorAll('[data-i18n-attrs]');

    for (let i = 0; i < elements.length; i++) {
        const attributes = elements[i].getAttribute('data-i18n-attrs');
        if (!attributes) continue;

        const pairs = attributes.split(';');
        for (let j = 0; j < pairs.length; j++) {
            const pair = pairs[j].split(':');
            if (pair.length !== 2) continue;

            const attributeName = pair[0].trim();
            const key = pair[1].trim();
            if (attributeName && key) elements[i].setAttribute(attributeName, translate(key));
        }
    }
}

function updateLanguageSelectors(): void {
    const selectors = document.querySelectorAll('#languageSelector') as NodeListOf<HTMLSelectElement>;

    for (let i = 0; i < selectors.length; i++) {
        selectors[i].value = normalizeLanguage(i18next.language);
    }
}

function updateHelpLinks(): void {
    const links = document.querySelectorAll('[data-i18n-help-link]');

    for (let i = 0; i < links.length; i++) {
        links[i].setAttribute('href', 'help.html?lang=' + encodeURIComponent(normalizeLanguage(i18next.language)));
    }
}

export function translate(key: string): string {
    return String(i18next.t(key));
}

export function applyDomTranslations(): void {
    const language = normalizeLanguage(i18next.language);
    document.documentElement.setAttribute('lang', language);
    document.title = translate(currentTitleKey);

    translateTextElements();
    translateHtmlElements();
    translateAttributeElements();
    updateLanguageSelectors();
    updateHelpLinks();
}

export function bindLanguageSelectors(): void {
    const selectors = document.querySelectorAll('#languageSelector') as NodeListOf<HTMLSelectElement>;

    for (let i = 0; i < selectors.length; i++) {
        selectors[i].onchange = function() {
            const nextLanguage = normalizeLanguage(selectors[i].value);
            persistLanguage(nextLanguage);
            updateUrlLanguage(nextLanguage);
            i18next.changeLanguage(nextLanguage, function() {
                applyDomTranslations();
            });
        };
    }
}

export function setupPageI18n(titleKey?: string): void {
    currentTitleKey = titleKey || 'app.title';

    i18next.init({
        lng: getInitialLanguage(),
        fallbackLng: defaultLanguage,
        supportedLngs: supportedLanguages,
        resources: resources,
        interpolation: {
            escapeValue: false,
        },
    }, function() {
        applyDomTranslations();
        bindLanguageSelectors();
    });
}
