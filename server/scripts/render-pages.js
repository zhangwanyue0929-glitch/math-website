/**
 * 按 js/content-data.js 生成人物、分期和典籍的二级页面。
 * 生成结果提交到仓库，GitHub Pages 不运行 Node 也能打开。
 * 用法：在 server 目录执行 npm run render-pages
 */
const fs = require("fs");
const path = require("path");
const content = require("../../js/content-data");

const root = path.join(__dirname, "..", "..");

function escapeHtml(value) {
    return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function paragraphs(text) {
    return String(text || "").split(/\n+/).filter(function (part) {
        return part.trim();
    }).map(function (part) {
        return "<p>" + escapeHtml(part.trim()) + "</p>";
    }).join("");
}

function points(text) {
    return String(text || "").split(/\n/).filter(function (part) {
        return part.trim();
    }).map(function (part) {
        return "<li>" + escapeHtml(part.trim()) + "</li>";
    }).join("");
}

function diagram(type) {
    if (type === "gougu") {
        return "<svg class=\"math-svg\" viewBox=\"0 0 320 220\" role=\"img\" aria-label=\"勾三股四弦五示意\">"
            + "<polyline points=\"40,180 40,60 200,180 40,180\" fill=\"rgba(139,58,50,0.08)\" stroke=\"#8b3a32\" stroke-width=\"3\"/>"
            + "<text x=\"18\" y=\"126\" fill=\"#8b3a32\" font-size=\"16\">勾</text>"
            + "<text x=\"108\" y=\"204\" fill=\"#8b3a32\" font-size=\"16\">股</text>"
            + "<text x=\"124\" y=\"112\" fill=\"#8b3a32\" font-size=\"16\">弦</text>"
            + "</svg>";
    }
    if (type === "circle") {
        return "<svg class=\"math-svg\" viewBox=\"0 0 320 320\" role=\"img\" aria-label=\"圆内接正六边形\">"
            + "<circle cx=\"160\" cy=\"160\" r=\"120\" fill=\"none\" stroke=\"#c6a15b\" stroke-width=\"2\"/>"
            + "<polygon points=\"160,40 264,100 264,220 160,280 56,220 56,100\" fill=\"rgba(139,58,50,0.1)\" stroke=\"#8b3a32\" stroke-width=\"2\"/>"
            + "</svg>";
    }
    if (type === "pascal") {
        return "<svg class=\"math-svg\" viewBox=\"0 0 320 180\" role=\"img\" aria-label=\"四行三角数表\">"
            + "<text x=\"160\" y=\"36\" text-anchor=\"middle\" fill=\"#8b3a32\" font-size=\"18\">1</text>"
            + "<text x=\"130\" y=\"72\" text-anchor=\"middle\" fill=\"#8b3a32\" font-size=\"18\">1</text>"
            + "<text x=\"190\" y=\"72\" text-anchor=\"middle\" fill=\"#8b3a32\" font-size=\"18\">1</text>"
            + "<text x=\"100\" y=\"108\" text-anchor=\"middle\" fill=\"#8b3a32\" font-size=\"18\">1</text>"
            + "<text x=\"160\" y=\"108\" text-anchor=\"middle\" fill=\"#8b3a32\" font-size=\"18\">2</text>"
            + "<text x=\"220\" y=\"108\" text-anchor=\"middle\" fill=\"#8b3a32\" font-size=\"18\">1</text>"
            + "<text x=\"70\" y=\"144\" text-anchor=\"middle\" fill=\"#8b3a32\" font-size=\"18\">1</text>"
            + "<text x=\"130\" y=\"144\" text-anchor=\"middle\" fill=\"#8b3a32\" font-size=\"18\">3</text>"
            + "<text x=\"190\" y=\"144\" text-anchor=\"middle\" fill=\"#8b3a32\" font-size=\"18\">3</text>"
            + "<text x=\"250\" y=\"144\" text-anchor=\"middle\" fill=\"#8b3a32\" font-size=\"18\">1</text>"
            + "</svg>";
    }
    if (type === "grid") {
        return "<svg class=\"math-svg\" viewBox=\"0 0 320 180\" role=\"img\" aria-label=\"大衍求一术的四个位置\">"
            + "<rect x=\"40\" y=\"24\" width=\"110\" height=\"60\" fill=\"#fbf6e8\" stroke=\"#8b3a32\"/>"
            + "<rect x=\"170\" y=\"24\" width=\"110\" height=\"60\" fill=\"#fbf6e8\" stroke=\"#8b3a32\"/>"
            + "<rect x=\"40\" y=\"96\" width=\"110\" height=\"60\" fill=\"#fbf6e8\" stroke=\"#8b3a32\"/>"
            + "<rect x=\"170\" y=\"96\" width=\"110\" height=\"60\" fill=\"#fbf6e8\" stroke=\"#8b3a32\"/>"
            + "<text x=\"95\" y=\"60\" text-anchor=\"middle\" fill=\"#8b3a32\" font-size=\"16\">左上 · 天元</text>"
            + "<text x=\"225\" y=\"60\" text-anchor=\"middle\" fill=\"#8b3a32\" font-size=\"16\">右上 · 奇</text>"
            + "<text x=\"95\" y=\"132\" text-anchor=\"middle\" fill=\"#8b3a32\" font-size=\"16\">左下</text>"
            + "<text x=\"225\" y=\"132\" text-anchor=\"middle\" fill=\"#8b3a32\" font-size=\"16\">右下 · 定</text>"
            + "</svg>";
    }
    if (type === "four") {
        return "<svg class=\"math-svg\" viewBox=\"0 0 320 220\" role=\"img\" aria-label=\"天元地元人元物元\">"
            + "<circle cx=\"160\" cy=\"110\" r=\"28\" fill=\"none\" stroke=\"#c6a15b\" stroke-width=\"2\"/>"
            + "<text x=\"160\" y=\"46\" text-anchor=\"middle\" fill=\"#8b3a32\" font-size=\"18\">天元</text>"
            + "<text x=\"160\" y=\"196\" text-anchor=\"middle\" fill=\"#8b3a32\" font-size=\"18\">地元</text>"
            + "<text x=\"52\" y=\"116\" text-anchor=\"middle\" fill=\"#8b3a32\" font-size=\"18\">人元</text>"
            + "<text x=\"268\" y=\"116\" text-anchor=\"middle\" fill=\"#8b3a32\" font-size=\"18\">物元</text>"
            + "</svg>";
    }
    if (type === "rods") {
        return "<svg class=\"math-svg\" viewBox=\"0 0 320 120\" role=\"img\" aria-label=\"算筹纵横示意\">"
            + "<rect x=\"36\" y=\"28\" width=\"70\" height=\"8\" fill=\"#8b3a32\"/>"
            + "<rect x=\"36\" y=\"44\" width=\"70\" height=\"8\" fill=\"#8b3a32\"/>"
            + "<rect x=\"150\" y=\"24\" width=\"8\" height=\"64\" fill=\"#8b3a32\"/>"
            + "<rect x=\"166\" y=\"24\" width=\"8\" height=\"64\" fill=\"#8b3a32\"/>"
            + "<rect x=\"182\" y=\"24\" width=\"8\" height=\"64\" fill=\"#8b3a32\"/>"
            + "<text x=\"70\" y=\"96\" text-anchor=\"middle\" fill=\"#5c4636\" font-size=\"14\">横式</text>"
            + "<text x=\"170\" y=\"108\" text-anchor=\"middle\" fill=\"#5c4636\" font-size=\"14\">纵式</text>"
            + "</svg>";
    }
    if (type === "island") {
        return "<svg class=\"math-svg\" viewBox=\"0 0 320 180\" role=\"img\" aria-label=\"两表测岛示意\">"
            + "<polygon points=\"250,28 286,78 214,78\" fill=\"rgba(139,58,50,0.15)\" stroke=\"#8b3a32\"/>"
            + "<line x1=\"70\" y1=\"150\" x2=\"300\" y2=\"150\" stroke=\"#c6a15b\"/>"
            + "<line x1=\"90\" y1=\"150\" x2=\"90\" y2=\"78\" stroke=\"#8b3a32\" stroke-width=\"3\"/>"
            + "<line x1=\"170\" y1=\"150\" x2=\"170\" y2=\"78\" stroke=\"#8b3a32\" stroke-width=\"3\"/>"
            + "<text x=\"90\" y=\"170\" text-anchor=\"middle\" fill=\"#5c4636\" font-size=\"14\">前表</text>"
            + "<text x=\"170\" y=\"170\" text-anchor=\"middle\" fill=\"#5c4636\" font-size=\"14\">后表</text>"
            + "<text x=\"250\" y=\"98\" text-anchor=\"middle\" fill=\"#8b3a32\" font-size=\"14\">岛</text>"
            + "</svg>";
    }
    if (type === "abacus") {
        return "<svg class=\"math-svg\" viewBox=\"0 0 320 140\" role=\"img\" aria-label=\"上二下五示意\">"
            + "<rect x=\"20\" y=\"16\" width=\"280\" height=\"108\" fill=\"none\" stroke=\"#8b3a32\" stroke-width=\"3\"/>"
            + "<line x1=\"20\" y1=\"58\" x2=\"300\" y2=\"58\" stroke=\"#c6a15b\" stroke-width=\"4\"/>"
            + "<circle cx=\"80\" cy=\"38\" r=\"10\" fill=\"#8b3a32\"/><circle cx=\"110\" cy=\"38\" r=\"10\" fill=\"#e7d3a8\" stroke=\"#8b3a32\"/>"
            + "<circle cx=\"80\" cy=\"84\" r=\"10\" fill=\"#8b3a32\"/><circle cx=\"110\" cy=\"84\" r=\"10\" fill=\"#8b3a32\"/>"
            + "<circle cx=\"140\" cy=\"84\" r=\"10\" fill=\"#e7d3a8\" stroke=\"#8b3a32\"/>"
            + "</svg>";
    }
    return "";
}

function nav(active) {
    function item(href, label, minor) {
        const cls = (href === active ? "active" : "") + (minor ? " nav-minor" : "");
        return "<a" + (cls.trim() ? " class=\"" + cls.trim() + "\"" : "") + " href=\"" + href + "\">" + label + "</a>";
    }
    return "<header class=\"navbar\">"
        + "<a class=\"logo\" href=\"index.html\">算经千年</a>"
        + "<button class=\"nav-toggle\" type=\"button\" aria-label=\"打开菜单\" aria-expanded=\"false\"><span></span><span></span><span></span></button>"
        + "<nav aria-label=\"主导航\">"
        + item("index.html", "首页")
        + item("history.html", "发展史")
        + item("mathematicians.html", "数学家")
        + item("classics.html", "数学经典")
        + item("abacus.html", "算盘互动")
        + item("puzzle.html", "华容道")
        + item("board.html", "留言", true)
        + item("survey.html", "调查", true)
        + "<a class=\"nav-minor\" href=\"login.html\" data-nav-account>登录</a>"
        + "</nav></header>";
}

function pageOf(item) {
    if (item.kind === "MATHEMATICIAN") {
        return { file: "person-" + item.slug + ".html", active: "mathematicians.html", parent: "mathematicians.html", parentLabel: "数学家" };
    }
    if (item.kind === "ERA") {
        return { file: "era-" + item.slug + ".html", active: "history.html", parent: "history.html", parentLabel: "发展史" };
    }
    if (item.kind === "CLASSIC") {
        return { file: "classic-" + item.slug + ".html", active: "classics.html", parent: "classics.html", parentLabel: "数学经典" };
    }
    return null;
}

function render(item) {
    const meta = pageOf(item);
    const picture = diagram(item.diagram);
    const figure = item.imageUrl
        ? "<figure class=\"portrait\"><img data-field-src=\"imageUrl\" src=\"" + escapeHtml(item.imageUrl) + "\" alt=\"" + escapeHtml(item.title) + "\"><figcaption data-field=\"imageCaption\">" + escapeHtml(item.imageCaption) + "</figcaption></figure>"
        : "";
    const demoLink = item.demoHref
        ? "<a class=\"btn btn-ghost\" data-field-href=\"demoHref\" href=\"" + escapeHtml(item.demoHref) + "\">打开相关页面</a>"
        : "";
    return "<!DOCTYPE html>\n<html lang=\"zh-CN\">\n<head>\n"
        + "    <meta charset=\"UTF-8\">\n"
        + "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n"
        + "    <link rel=\"icon\" href=\"favicon.svg\" type=\"image/svg+xml\">\n"
        + "    <title>" + escapeHtml(item.title) + " - 算经千年</title>\n"
        + "    <link rel=\"stylesheet\" href=\"css/global.css\">\n"
        + "    <link rel=\"stylesheet\" href=\"css/navbar.css\">\n"
        + "    <link rel=\"stylesheet\" href=\"css/site.css\">\n"
        + "</head>\n<body>\n"
        + nav(meta.active) + "\n"
        + "<main class=\"article-page page-pattern\">\n"
        + "    <p class=\"crumb\"><a href=\"index.html\">首页</a> / <a href=\"" + meta.parent + "\">" + meta.parentLabel + "</a> / <span>" + escapeHtml(item.title) + "</span></p>\n"
        + "    <p id=\"entryStatus\" class=\"entry-status\" role=\"status\"></p>\n"
        + "    <article class=\"sheet\" data-entry data-kind=\"" + item.kind.toLowerCase() + "\" data-slug=\"" + item.slug + "\">\n"
        + "        <header class=\"sheet-head\">\n"
        + "            <p class=\"eyebrow\" data-field=\"subtitle\">" + escapeHtml(item.subtitle) + "</p>\n"
        + "            <h1 data-field=\"title\">" + escapeHtml(item.title) + "</h1>\n"
        + "            <p class=\"summary\" data-field=\"summary\">" + escapeHtml(item.summary) + "</p>\n"
        + "            <div class=\"sheet-actions\"><button class=\"btn\" id=\"favBtn\" type=\"button\">收藏此页</button>" + demoLink + "</div>\n"
        + "        </header>\n"
        + "        <div class=\"sheet-grid\">\n"
        + "            <div class=\"sheet-side\">" + figure
        + (picture ? "<div class=\"diagram-wrap\"><p>辅助演示图</p>" + picture + "</div>" : "")
        + "</div>\n"
        + "            <div class=\"sheet-body\">\n"
        + "                <section class=\"block block-source\"><h2>史料原文</h2><p class=\"source-note\" data-field=\"sourceNote\">" + escapeHtml(item.sourceNote) + "</p><blockquote data-field=\"sourceText\">" + escapeHtml(item.sourceText) + "</blockquote></section>\n"
        + "                <section class=\"block block-modern\"><h2>现代释义</h2><div data-field=\"modernText\" data-multiline=\"1\">" + paragraphs(item.modernText) + "</div></section>\n"
        + "                <section class=\"block block-demo\"><h2>辅助演示</h2><p data-field=\"demoNote\">" + escapeHtml(item.demoNote) + "</p></section>\n"
        + "                <ul class=\"point-list\" data-field-list=\"points\">" + points(item.points) + "</ul>\n"
        + "            </div>\n"
        + "        </div>\n"
        + "    </article>\n"
        + "    <footer class=\"site-foot\"><a href=\"catalog.html\">馆藏目录</a><a href=\"board.html\">留言板</a><a href=\"survey.html\">参观调查</a></footer>\n"
        + "</main>\n"
        + "<script src=\"js/api.js\"></script>\n"
        + "<script src=\"js/ui.js\"></script>\n"
        + "<script src=\"js/nav.js\"></script>\n"
        + "<script src=\"js/entry.js\"></script>\n"
        + "<script src=\"js/particle.js\"></script>\n"
        + "</body>\n</html>\n";
}

let count = 0;
content.items.forEach(function (item) {
    const meta = pageOf(item);
    if (!meta) return;
    fs.writeFileSync(path.join(root, meta.file), render(item));
    count += 1;
});
console.log("已生成 " + count + " 个二级页面。");
