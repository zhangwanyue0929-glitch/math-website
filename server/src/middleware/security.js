const crypto = require("crypto");
const { prisma } = require("../db");

function issueCsrf(req) {
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(24).toString("hex");
    }
    return req.session.csrfToken;
}

/**
 * 同步令牌写在会话里，前端放在请求头，不放在 Cookie 里再读出来。
 * 这样别的网站即使诱使浏览器带上会话 Cookie，也带不走这个头。
 * GET 不改数据，不检查。
 */
function csrfProtection(req, res, next) {
    if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return next();
    const sent = req.get("X-CSRF-Token") || "";
    if (!req.session || !req.session.csrfToken || sent !== req.session.csrfToken) {
        return res.status(403).json({ error: "页面已过期，请刷新后再提交。" });
    }
    next();
}

async function requireLogin(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: "请先登录。" });
    }
    try {
        const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
        if (!user || user.disabled) {
            return res.status(401).json({ error: "账号不可用，请重新登录。" });
        }
        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
}

function requireAdmin(req, res, next) {
    requireLogin(req, res, function (error) {
        if (error) return next(error);
        if (!req.user || req.user.role !== "ADMIN") {
            return res.status(403).json({ error: "需要管理员权限。" });
        }
        next();
    });
}

function asyncRoute(handler) {
    return function (req, res, next) {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
}

module.exports = {
    issueCsrf: issueCsrf,
    csrfProtection: csrfProtection,
    requireLogin: requireLogin,
    requireAdmin: requireAdmin,
    asyncRoute: asyncRoute
};
