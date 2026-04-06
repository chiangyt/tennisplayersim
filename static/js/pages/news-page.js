function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
}

function getSummary(content) {
    const text = (content || "").trim();
    if (text.length <= 60) return text;
    return text.slice(0, 60) + "...";
}

export function renderList(news) {
    let newsItems = '';
    if (Array.isArray(news) && news.length > 0) {
        newsItems = news.map((item, index) => `
            <article class="log-item">
                <a class="news-link" href="#/news_detail/${item._source_id != null ? item._source_id : index}" style="color: inherit; text-decoration: none; display: block;">
                    <h6 class="news-title" style="font-size: 16px; font-weight: 900; margin: 0 0 6px 0; color: #1a1a1a;">${escapeHtml(item.title || "未命名新闻")}</h6>
                    <div class="news-meta" style="font-size: 12px; color: #666; margin-bottom: 6px;">${escapeHtml(item.date || "")}</div>
                    <p class="news-summary" style="margin: 0; color: #333; font-weight: 700; line-height: 1.5; font-size: 14px;">${escapeHtml(getSummary(item.content))}</p>
                </a>
            </article>
        `).join('');
    } else {
        newsItems = '<div class="log-item">暂无新闻</div>';
    }

    return `
    <style>
        .news-page-wrapper {
            flex: 1;
            height: 100%;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: #fdfaf6;
        }
        .news-page-wrapper .news-meta {
            font-size: 12px;
            color: #666;
            margin-bottom: 6px;
        }
        .news-page-wrapper .news-title {
            font-size: 16px;
            font-weight: 900;
            margin: 0 0 6px 0;
            color: #1a1a1a;
        }
        .news-page-wrapper .news-summary {
            margin: 0;
            color: #333;
            font-weight: 700;
            line-height: 1.5;
            font-size: 14px;
        }
        .news-page-wrapper #newsList {
            flex: 1;
            overflow-y: auto;
            padding-bottom: 80px;
        }
        .news-page-wrapper .news-link {
            color: inherit;
            text-decoration: none;
            display: block;
        }
        .news-page-wrapper #backToTop {
            position: fixed;
            right: 16px;
            bottom: 20px;
            z-index: 1000;
            border: none;
            border-radius: 999px;
            padding: 10px 14px;
            background: #222;
            color: #fff;
            font-weight: 700;
            display: none;
        }
    </style>
    <div class="news-page-wrapper">
        <div class="header-stats d-flex align-items-center">
            <a href="#/phone" class="text-dark me-3" style="text-decoration:none; font-size: 24px; font-weight: 900;">&lt;</a>
            <h5 class="mb-0 fw-bold">今日资讯</h5>
        </div>
        <div id="newsList" class="story-content">
            ${newsItems}
        </div>
        <button id="backToTop" type="button">返回顶部</button>
    </div>`;
}

export function initList() {
    const newsList = document.getElementById('newsList');
    const backToTopBtn = document.getElementById('backToTop');

    if (newsList && backToTopBtn) {
        newsList.addEventListener('scroll', () => {
            backToTopBtn.style.display = newsList.scrollTop > 120 ? 'block' : 'none';
        });

        backToTopBtn.addEventListener('click', () => {
            newsList.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

export function renderDetail(article, articleId) {
    let articleHtml = '';
    if (article) {
        articleHtml = `
            <article class="log-item detail-card" style="margin: 12px 16px 0;">
                <h1 class="title" style="font-size: 22px; font-weight: 900; color: #1a1a1a; line-height: 1.4; margin: 0 0 10px 0;">${escapeHtml(article.title)}</h1>
                <div class="meta" style="font-size: 12px; color: #666; margin-bottom: 6px;">${escapeHtml(article.date)}</div>
                <div class="meta-line" style="font-size: 12px; color: #666; margin-bottom: 12px;">作者：${escapeHtml(article.author || "佚名")} | ${escapeHtml(article.organization || "未知机构")}</div>
                <div class="content" style="color: #222; line-height: 1.8; font-size: 16px; white-space: pre-wrap;">${escapeHtml(article.content)}</div>
            </article>`;
    } else {
        articleHtml = `<div class="log-item detail-card" style="margin: 12px 16px 0;">暂无可显示的新闻内容。</div>`;
    }

    return `
    <style>
        .news-detail-wrapper {
            flex: 1;
            height: 100%;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: #fdfaf6;
        }
        .news-detail-wrapper .detail-wrap {
            flex: 1;
            overflow-y: auto;
            padding-bottom: 80px;
        }
    </style>
    <div class="news-detail-wrapper">
        <div class="header-stats d-flex align-items-center">
            <a href="#/news" class="text-dark me-3" style="text-decoration:none; font-size: 24px; font-weight: 900;">&lt;</a>
            <h5 class="mb-0 fw-bold">新闻详情</h5>
        </div>
        <div class="detail-wrap">
            ${articleHtml}
        </div>
    </div>`;
}
