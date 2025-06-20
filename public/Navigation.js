
function getCurrentLang() {
    return new URLSearchParams(window.location.search).get('lang') || 'FR';
}

function switchLang() {
    const currentLang = getCurrentLang();
    const newLang = currentLang === 'FR' ? 'EN' : 'FR';
    
    const url = new URL(window.location.href);
    url.searchParams.set('lang', newLang);

    window.location.href = url.toString();
}

function navigateWithLang(path) {
    const lang = getCurrentLang();
    const url = new URL(path, window.location.origin);
    url.searchParams.set('lang', lang);
    window.location.href = url.toString();
}
