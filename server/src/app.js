/**
 * Express 应用。
 * 页面和接口由同一个服务提供，会话 Cookie 不用跨站。
 * GitHub Pages 只上传仓库里的 html/css/js，不运行这个文件。
 */
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const session = require("express-session");
const { prisma } = require("./db");
const { PrismaSessionStore } = require("./session-store");
const { csrfProtection, issueCsrf } = require("./middleware/security");

const ROOT = path.join(__dirname, "..", "..");

function createApp() {
    const app = express();
    app.disable("x-powered-by");
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                // 算盘拨珠、华容道拖动都要改元素的位置样式。
                // 脚本仍只允许本站文件，不能靠内联脚本插入代码。
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:"],
                connectSrc: ["'self'"],
                objectSrc: ["'none'"],
                baseUri: ["'self'"],
                frameAncestors: ["'none'"],
                formAction: ["'self'"]
            }
        },
        // 页面和图片都在同一站点，不需要跨源隔离。
        crossOriginEmbedderPolicy: false
    }));
    app.use(express.json({ limit: "200kb" }));
    app.use(express.urlencoded({ extended: false, limit: "200kb" }));
    app.use(session({
        name: "suanjing.sid",
        secret: process.env.SESSION_SECRET,
        store: new PrismaSessionStore(),
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.COOKIE_SECURE === "true",
            maxAge: 7 * 24 * 3600 * 1000
        }
    }));

    app.use("/api", function (req, res, next) {
        res.set("Cache-Control", "no-store");
        next();
    });

    app.get("/api/health", async function (req, res) {
        try {
            await prisma.$queryRaw`SELECT 1`;
            res.json({ ok: true, service: "suanjing" });
        } catch (error) {
            res.status(503).json({ ok: false });
        }
    });

    app.get("/api/csrf", function (req, res) {
        res.json({ csrfToken: issueCsrf(req) });
    });

    app.use("/api", csrfProtection);
    app.use("/api/auth", require("./routes/auth"));
    app.use("/api/content", require("./routes/content"));
    app.use("/api/messages", require("./routes/messages"));
    app.use("/api/survey", require("./routes/survey"));
    app.use("/api/favourites", require("./routes/favourites"));
    app.use("/api/records", require("./routes/records"));
    app.use("/api/me", require("./routes/me"));
    app.use("/api/admin", require("./routes/admin"));

    app.use("/api", function (req, res) {
        res.status(404).json({ error: "接口不存在。" });
    });

    // 上传文件只从 /media 读取，不把整个 server 目录暴露出去。
    app.use("/media", express.static(path.join(__dirname, "..", "uploads"), {
        dotfiles: "deny",
        fallthrough: false,
        index: false
    }));

    app.use(function (req, res, next) {
        let urlPath = req.path;
        try {
            urlPath = decodeURIComponent(req.path);
        } catch (error) {
            return res.status(400).end();
        }
        if (urlPath.indexOf("..") !== -1
            || urlPath === "/server"
            || urlPath.indexOf("/server/") === 0
            || /(^|\/)\.(git|env)/.test(urlPath)) {
            return res.status(404).end();
        }
        next();
    });

    app.use(express.static(ROOT, {
        dotfiles: "ignore",
        index: "index.html"
    }));

    app.use(function (error, req, res, next) {
        if (error && error.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ error: "图片不能超过 2MB。" });
        }
        console.error(error);
        if (res.headersSent) return next(error);
        const wantsJson = req.path.indexOf("/api/") === 0 || (req.get("accept") || "").indexOf("application/json") !== -1;
        if (wantsJson) return res.status(500).json({ error: "服务器暂时无法完成这个操作。" });
        res.status(500).type("text/plain; charset=utf-8").send("服务器暂时无法完成这个操作。");
    });

    return app;
}

module.exports = { createApp };
