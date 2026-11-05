/**
 * 输入检查集中在这里。
 * 查询都走 Prisma 的参数化语句，这里再限制长度和字符，避免脏数据进库。
 * 用户写的文字去掉标签，页面只用 textContent 显示，两层一起防 XSS。
 */

const KINDS = {
    mathematician: "MATHEMATICIAN",
    classic: "CLASSIC",
    era: "ERA",
    exhibit: "EXHIBIT"
};

function cleanText(value, max) {
    return String(value == null ? "" : value)
        .replace(/\u0000/g, "")
        .replace(/<[^>]*>/g, "")
        .replace(/[ \t]+\n/g, "\n")
        .trim()
        .slice(0, max);
}

function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 120;
}

function isUsername(value) {
    return /^[\u4e00-\u9fa5A-Za-z0-9_]{2,16}$/.test(value);
}

function isPassword(value) {
    return typeof value === "string" && /^(?=.*[A-Za-z])(?=.*\d)\S{8,64}$/.test(value);
}

function kindFromParam(value) {
    return KINDS[String(value || "").toLowerCase()] || null;
}

function isSlug(value) {
    return /^[a-z0-9-]{1,40}$/.test(String(value || ""));
}

function safeAssetUrl(value) {
    const url = cleanText(value, 255);
    if (!url) return "";
    if (url.indexOf("..") !== -1) return null;
    if (!/^(assets|media)\/[A-Za-z0-9._/-]+\.(jpg|jpeg|png|gif|webp|svg)$/.test(url)) return null;
    return url;
}

function safePageUrl(value) {
    const url = cleanText(value, 160);
    if (!url) return "";
    if (!/^[a-z0-9][a-z0-9-]*\.html([?#][a-z0-9=&_\-]+)?$/.test(url)) return null;
    return url;
}

function pageQuery(query, fallbackSize) {
    let page = parseInt(query.page, 10);
    let pageSize = parseInt(query.pageSize, 10);
    if (!page || page < 1) page = 1;
    if (!pageSize || pageSize < 1) pageSize = fallbackSize;
    if (pageSize > 20) pageSize = 20;
    return { page: page, pageSize: pageSize, skip: (page - 1) * pageSize };
}

function paged(items, total, page, pageSize) {
    return {
        items: items,
        page: page,
        pageSize: pageSize,
        total: total,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
    };
}

function publicUser(user) {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        disabled: user.disabled,
        createdAt: user.createdAt
    };
}

function publicContent(item) {
    return {
        id: item.id,
        kind: item.kind,
        slug: item.slug,
        title: item.title,
        subtitle: item.subtitle,
        summary: item.summary,
        sourceNote: item.sourceNote,
        sourceText: item.sourceText,
        modernText: item.modernText,
        demoNote: item.demoNote,
        imageUrl: item.imageUrl,
        imageCaption: item.imageCaption,
        demoHref: item.demoHref,
        pageUrl: item.pageUrl,
        points: item.points,
        diagram: item.diagram,
        sortOrder: item.sortOrder,
        published: item.published,
        updatedAt: item.updatedAt
    };
}

module.exports = {
    KINDS: KINDS,
    cleanText: cleanText,
    isEmail: isEmail,
    isUsername: isUsername,
    isPassword: isPassword,
    kindFromParam: kindFromParam,
    isSlug: isSlug,
    safeAssetUrl: safeAssetUrl,
    safePageUrl: safePageUrl,
    pageQuery: pageQuery,
    paged: paged,
    publicUser: publicUser,
    publicContent: publicContent
};
