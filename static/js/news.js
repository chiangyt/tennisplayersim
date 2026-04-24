export const NAME_POOL = [
    { full: 'Selena Williams', last: 'Williams' },
    { full: 'Vera Williams', last: 'Williams' },
    { full: 'Maria Sharova', last: 'Sharova' },
    { full: 'Naomi Okawa', last: 'Okawa' },
    { full: 'Iga Svetek', last: 'Svetek' },
    { full: 'Arina Sabalova', last: 'Sabalova' },
    { full: 'Coco Goff', last: 'Goff' },
    { full: 'Elena Rybkina', last: 'Rybkina' },
    { full: 'Jessica Perula', last: 'Perula' },
    { full: 'Ons Jabari', last: 'Jabari' },
    { full: 'Caroline Wozny', last: 'Wozny' },
    { full: 'Simona Halev', last: 'Halev' },
    { full: 'Ashley Burton', last: 'Burton' },
    { full: 'Nan Li', last: 'Li' },
    { full: 'Martina Navarro', last: 'Navarro' },
    { full: 'Steffi Kraft', last: 'Kraft' },
    { full: 'Monica Selva', last: 'Selva' },
    { full: 'Justine Heron', last: 'Heron' },
    { full: 'Kim Kleist', last: 'Kleist' },
    { full: 'Petra Kovac', last: 'Kovac' },
    { full: 'Victoria Azarova', last: 'Azarova' },
    { full: 'Angelique Keller', last: 'Keller' },
    { full: 'Bianca Andretti', last: 'Andretti' },
    { full: 'Karolina Pliska', last: 'Pliska' },
    { full: 'Garbine Mugica', last: 'Mugica' },
    { full: 'QianWen Zheng', last: 'Zheng' },
    { full: 'Mira Andova', last: 'Andova' },
    { full: 'Emma Radford', last: 'Radford' },
    { full: 'Martina Hines', last: 'Hines' },
    { full: 'Diana Safina', last: 'Safina' },
];

const JOURNALIST_POOL = [
    { name: '林悦', org: '网球观察家' },
    { name: 'Carlos Mendes', org: '里斯本体育报' },
    { name: '赵可欣', org: '全球体坛资讯' },
    { name: '张薇', org: '竞赛前线' },
    { name: 'Elena Petrov', org: '国际体育先驱报' },
    { name: 'Pierre Simon', org: '巴黎网球周刊' },
    { name: '孙志坚', org: '环球体育周报' },
    { name: 'Molly Hughes', org: '时尚先锋网' },
    { name: '佐藤健', org: '亚洲网球资讯' },
    { name: 'David Smith', org: '纽约竞技周刊' },
    { name: 'Hans Weber', org: '德意志体育日报' },
    { name: 'Diego Ruiz', org: '布宜诺斯艾利斯体育先锋' },
    { name: 'Sarah Campbell', org: '加拿大体育网络' },
    { name: 'Fatima Al-Hassan', org: '中东体育评论' },
    { name: 'James Harrison', org: '全英草地网球评论' },
    { name: 'Marcus Johnson', org: '美国体育实时报' },
    { name: 'Lucia Morales', org: '拉美体育新闻网' },
    { name: 'Marek Nowak', org: '波兰体育日报' },
];

/** Simple seeded RNG (mulberry32) */
function _seededRng(seed) {
    let t = (seed | 0) + 0x6D2B79F5;
    return function () {
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Get a stable seed for this game (created once per save) */
function _getGameSeed() {
    let seed = localStorage.getItem('news_seed');
    if (!seed) {
        seed = String(Date.now());
        localStorage.setItem('news_seed', seed);
    }
    return parseInt(seed, 10);
}

/**
 * Fill {P1}, {P1_LAST}, {P2}, {P2_LAST}, ... placeholders.
 * Supports any number of players — just use {P3}, {P3_LAST} etc in the JSON.
 * All names within one article are guaranteed unique.
 */
export function fillNames(article, articleIndex) {
    const rng = _seededRng(_getGameSeed() + articleIndex * 7919);

    // Detect how many unique player slots are needed (P1, P2, P3...)
    const combined = article.title + article.content;
    let maxSlot = 0;
    const slotRe = /\{P(\d+)(_LAST)?\}/g;
    let m;
    while ((m = slotRe.exec(combined)) !== null) {
        const n = parseInt(m[1], 10);
        if (n > maxSlot) maxSlot = n;
    }
    if (maxSlot === 0) return article;

    // Pick maxSlot unique names from pool via Fisher-Yates partial shuffle
    const indices = Array.from({ length: NAME_POOL.length }, (_, i) => i);
    const picked = [];
    for (let i = 0; i < maxSlot && i < indices.length; i++) {
        const j = i + Math.floor(rng() * (indices.length - i));
        [indices[i], indices[j]] = [indices[j], indices[i]];
        picked.push(NAME_POOL[indices[i]]);
    }

    // Pick a journalist for {AUTHOR} / {ORG}
    const journalistIdx = Math.floor(rng() * JOURNALIST_POOL.length);
    const journalist = JOURNALIST_POOL[journalistIdx];

    let title = article.title;
    let content = article.content;
    let author = article.author;
    let organization = article.organization;
    for (let i = 0; i < picked.length; i++) {
        const tag = `{P${i + 1}}`;
        const tagLast = `{P${i + 1}_LAST}`;
        title = title.replaceAll(tag, picked[i].full).replaceAll(tagLast, picked[i].last);
        content = content.replaceAll(tag, picked[i].full).replaceAll(tagLast, picked[i].last);
    }
    if (author) author = author.replaceAll('{AUTHOR}', journalist.name);
    if (organization) organization = organization.replaceAll('{ORG}', journalist.org);

    return { ...article, title, content, author, organization };
}

/**
 * Filter news by month (ignoring year). Always returns the month's news —
 * read-state only affects the banner on main page (see hasBreakingNews).
 * @param {Array} newsData  - raw news array from JSON
 * @param {number} month    - 1-12
 * @returns {Array} news for the given month, with names filled
 */
export function getNewsForMonth(newsData, year, month) {
    const yearStr = String(year);
    const monthStr = String(month).padStart(2, '0');

    const indexed = newsData.map((item, idx) => ({ ...item, _source_id: idx }));

    // Breaking news: must match exact year+month
    const breakingItems = indexed.filter(item => {
        if (!item.breaking) return false;
        const parts = String(item.date || '').split('-');
        return parts.length === 3 && parts[0] === yearStr && parts[1] === monthStr;
    }).map(item => fillNames(item, item._source_id));

    // Breaking takes priority: if any exists, skip regular news (ensures max 1 per month)
    if (breakingItems.length > 0) return [breakingItems[0]];

    // Regular news: match month only (any year), not breaking, one per month
    const regularPool = indexed.filter(item => {
        if (item.breaking) return false;
        const parts = String(item.date || '').split('-');
        return parts[0] === monthStr;
    });
    return regularPool.length > 0 ? [fillNames(regularPool[0], regularPool[0]._source_id)] : [];
}

export function hasBreakingNews(newsData, year, month, readIds = []) {
    const yearStr = String(year);
    const monthStr = String(month).padStart(2, '0');
    const readSet = new Set(readIds);
    return newsData.some((item, idx) => {
        if (!item.breaking) return false;
        const parts = String(item.date || '').split('-');
        if (parts.length !== 3) return false;
        return parts[0] === yearStr && parts[1] === monthStr && !readSet.has(idx);
    });
}
