/**
 * 注册、登录、退出和密保找回。
 * 登录成功后更换会话编号，避免沿用登录前那个匿名会话。
 * 找回密码不发邮件：实验室不一定有邮箱服务器，密保问题可以在答辩时当场走完。
 */
const express = require("express");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const { prisma } = require("../db");
const { hashText, checkText, DUMMY_HASH } = require("../lib/passwords");
const { cleanText, isEmail, isUsername, isPassword, publicUser } = require("../lib/http");
const { asyncRoute } = require("../middleware/security");

const router = express.Router();

// 只限制会猜密码的接口。每个页面都会读取登录状态，不能算进这里。
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "尝试过于频繁，请稍后再试。" }
});

function newCsrf(req) {
    req.session.csrfToken = crypto.randomBytes(24).toString("hex");
    return req.session.csrfToken;
}

function startSession(req, res, user) {
    const snapshot = publicUser(user);
    req.session.regenerate(function (error) {
        if (error) {
            res.status(500).json({ error: "会话建立失败。" });
            return;
        }
        req.session.userId = user.id;
        const csrfToken = newCsrf(req);
        req.session.save(function (saveError) {
            if (saveError) {
                res.status(500).json({ error: "会话保存失败。" });
                return;
            }
            res.json({ user: snapshot, csrfToken: csrfToken });
        });
    });
}

router.get("/me", asyncRoute(async function (req, res) {
    if (!req.session.userId) return res.json({ user: null });
    const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
    if (!user || user.disabled) return res.json({ user: null });
    res.json({ user: publicUser(user) });
}));

router.post("/register", authLimiter, asyncRoute(async function (req, res) {
    const username = cleanText(req.body.username, 16);
    const email = cleanText(req.body.email, 120).toLowerCase();
    const password = String(req.body.password || "");
    const question = cleanText(req.body.securityQuestion, 40);
    const answer = cleanText(req.body.securityAnswer, 20);
    if (!isUsername(username)) {
        return res.status(400).json({ error: "用户名需为 2 到 16 位汉字、字母或数字。" });
    }
    if (!isEmail(email)) return res.status(400).json({ error: "邮箱格式不正确。" });
    if (!isPassword(password)) {
        return res.status(400).json({ error: "密码至少 8 位，并同时包含字母和数字。" });
    }
    if (question.length < 4) return res.status(400).json({ error: "密保问题至少 4 个字。" });
    if (answer.length < 2) return res.status(400).json({ error: "密保答案至少 2 个字。" });

    const taken = await prisma.user.findFirst({
        where: { OR: [{ username: username }, { email: email }] }
    });
    if (taken) return res.status(409).json({ error: "用户名或邮箱已被使用。" });

    const user = await prisma.user.create({
        data: {
            username: username,
            email: email,
            passwordHash: await hashText(password),
            securityQuestion: question,
            securityAnswerHash: await hashText(answer.toLowerCase())
        }
    });
    startSession(req, res, user);
}));

router.post("/login", authLimiter, asyncRoute(async function (req, res) {
    const username = cleanText(req.body.username, 16);
    const password = String(req.body.password || "");
    const user = await prisma.user.findUnique({ where: { username: username } });
    const matched = await checkText(password, user ? user.passwordHash : DUMMY_HASH);
    if (!user || !matched) {
        return res.status(401).json({ error: "用户名或密码不正确。" });
    }
    if (user.disabled) return res.status(403).json({ error: "这个账号已停用。" });
    startSession(req, res, user);
}));

router.post("/logout", function (req, res) {
    req.session.destroy(function () {
        res.json({ user: null, csrfToken: "" });
    });
});

router.post("/forgot/question", authLimiter, asyncRoute(async function (req, res) {
    const username = cleanText(req.body.username, 16);
    const user = await prisma.user.findUnique({ where: { username: username } });
    if (!user || user.disabled) {
        return res.status(404).json({ error: "没有找到这个用户名。" });
    }
    res.json({ question: user.securityQuestion });
}));

router.post("/forgot/reset", authLimiter, asyncRoute(async function (req, res) {
    const fails = req.session.forgotFails || 0;
    if (fails >= 5) {
        return res.status(429).json({ error: "密保答案错误次数过多，请稍后再试。" });
    }
    const username = cleanText(req.body.username, 16);
    const answer = cleanText(req.body.answer, 20).toLowerCase();
    const password = String(req.body.newPassword || "");
    if (!isPassword(password)) {
        return res.status(400).json({ error: "新密码至少 8 位，并同时包含字母和数字。" });
    }
    const user = await prisma.user.findUnique({ where: { username: username } });
    const matched = await checkText(answer, user ? user.securityAnswerHash : DUMMY_HASH);
    if (!user || user.disabled || !matched) {
        req.session.forgotFails = fails + 1;
        return res.status(400).json({ error: "用户名或密保答案不正确。" });
    }
    await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await hashText(password) }
    });
    req.session.forgotFails = 0;
    res.json({ ok: true });
}));

module.exports = router;
