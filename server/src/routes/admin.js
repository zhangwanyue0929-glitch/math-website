/**
 * 管理员接口：用户、留言审核、展项文字和图片、问卷题目。
 * 普通用户的路由进不来。至少保留一名未停用的管理员，避免把自己锁在门外。
 */
const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const { prisma } = require("../db");
const {
    cleanText, pageQuery, paged, publicUser, publicContent,
    kindFromParam, isSlug, safeAssetUrl, safePageUrl
} = require("../lib/http");
const { asyncRoute, requireAdmin } = require("../middleware/security");

const router = express.Router();
router.use(requireAdmin);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024, files: 1 }
});

function imageExt(buffer) {
    if (buffer.length > 8 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg";
    if (buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return "png";
    if (buffer.length > 6 && buffer.slice(0, 3).toString() === "GIF") return "gif";
    if (buffer.length > 12 && buffer.slice(0, 4).toString() === "RIFF" && buffer.slice(8, 12).toString() === "WEBP") return "webp";
    return "";
}

function readContentBody(body, partial) {
    const data = {};
    if (!partial || body.kind !== undefined || body.slug !== undefined) {
        const kind = kindFromParam(body.kind);
        if (!kind) return { error: "展项类别不正确。" };
        if (!isSlug(body.slug)) return { error: "编号只能用小写字母、数字和短横线。" };
        data.kind = kind;
        data.slug = body.slug;
    }
    function take(key, max, required) {
        if (partial && body[key] === undefined) return;
        const value = cleanText(body[key], max);
        if (required && !value) return key;
        data[key] = value;
        return "";
    }
    const missing = take("title", 40, !partial) || take("subtitle", 80, false)
        || take("summary", 500, !partial) || take("sourceNote", 200, false)
        || take("sourceText", 2000, !partial) || take("modernText", 4000, !partial)
        || take("demoNote", 1000, !partial) || take("imageCaption", 120, false)
        || take("points", 800, false) || take("diagram", 20, false);
    if (missing) return { error: "请把展项标题和三段说明填写完整。" };
    if (!partial || body.imageUrl !== undefined) {
        const imageUrl = safeAssetUrl(body.imageUrl);
        if (imageUrl === null) return { error: "图片地址只能填写馆内 assets 或 media 下的图片。" };
        data.imageUrl = imageUrl;
    }
    if (!partial || body.demoHref !== undefined) {
        const demoHref = safePageUrl(body.demoHref);
        if (demoHref === null) return { error: "演示链接必须是站内 html 页面。" };
        data.demoHref = demoHref;
    }
    if (!partial || body.pageUrl !== undefined) {
        const pageUrl = safePageUrl(body.pageUrl);
        if (pageUrl === null) return { error: "页面地址必须是站内 html 页面。" };
        data.pageUrl = pageUrl;
    }
    if (!partial || body.sortOrder !== undefined) {
        const sortOrder = parseInt(body.sortOrder, 10);
        data.sortOrder = Number.isFinite(sortOrder) ? sortOrder : 0;
    }
    if (!partial || body.published !== undefined) {
        data.published = Boolean(body.published);
    }
    if (data.diagram && !/^[a-z]{0,20}$/.test(data.diagram)) data.diagram = "";
    return { data: data };
}

router.get("/users", asyncRoute(async function (req, res) {
    const paging = pageQuery(req.query, 8);
    const q = cleanText(req.query.q, 32);
    const where = q ? { username: { contains: q } } : {};
    const total = await prisma.user.count({ where: where });
    const rows = await prisma.user.findMany({
        where: where,
        orderBy: { createdAt: "desc" },
        skip: paging.skip,
        take: paging.pageSize
    });
    res.json(paged(rows.map(publicUser), total, paging.page, paging.pageSize));
}));

router.patch("/users/:id", asyncRoute(async function (req, res) {
    const id = parseInt(req.params.id, 10);
    const user = await prisma.user.findUnique({ where: { id: id } });
    if (!user) return res.status(404).json({ error: "没有这个用户。" });
    const data = {};
    if (req.body.role !== undefined) {
        if (req.body.role !== "USER" && req.body.role !== "ADMIN") {
            return res.status(400).json({ error: "角色只能是用户或管理员。" });
        }
        data.role = req.body.role;
    }
    if (req.body.disabled !== undefined) data.disabled = Boolean(req.body.disabled);
    const removesAdmin = user.role === "ADMIN" && (data.role === "USER" || data.disabled === true);
    if (removesAdmin) {
        const admins = await prisma.user.count({ where: { role: "ADMIN", disabled: false } });
        if (admins <= 1) return res.status(400).json({ error: "至少保留一名可用的管理员。" });
    }
    const saved = await prisma.user.update({ where: { id: id }, data: data });
    res.json({ user: publicUser(saved) });
}));

router.get("/messages", asyncRoute(async function (req, res) {
    const paging = pageQuery(req.query, 6);
    const status = req.query.status;
    const where = {};
    if (status) {
        if (["PENDING", "APPROVED", "REJECTED"].indexOf(status) === -1) {
            return res.status(400).json({ error: "留言状态不正确。" });
        }
        where.status = status;
    }
    const total = await prisma.message.count({ where: where });
    const rows = await prisma.message.findMany({
        where: where,
        include: { user: true },
        orderBy: { createdAt: "desc" },
        skip: paging.skip,
        take: paging.pageSize
    });
    res.json(paged(rows.map(function (row) {
        return {
            id: row.id,
            content: row.content,
            reply: row.reply,
            status: row.status,
            createdAt: row.createdAt,
            author: row.user.username
        };
    }), total, paging.page, paging.pageSize));
}));

router.post("/messages/:id/moderate", asyncRoute(async function (req, res) {
    const id = parseInt(req.params.id, 10);
    const status = req.body.status;
    if (["APPROVED", "REJECTED", "PENDING"].indexOf(status) === -1) {
        return res.status(400).json({ error: "审核状态不正确。" });
    }
    const reply = cleanText(req.body.reply, 300);
    const existing = await prisma.message.findUnique({ where: { id: id } });
    if (!existing) return res.status(404).json({ error: "没有这条留言。" });
    const saved = await prisma.message.update({
        where: { id: id },
        data: { status: status, reply: reply, reviewedAt: new Date() },
        include: { user: true }
    });
    res.json({
        message: {
            id: saved.id,
            content: saved.content,
            reply: saved.reply,
            status: saved.status,
            createdAt: saved.createdAt,
            author: saved.user.username
        }
    });
}));

router.get("/content", asyncRoute(async function (req, res) {
    const paging = pageQuery(req.query, 6);
    const where = {};
    const kind = kindFromParam(req.query.kind);
    if (req.query.kind && !kind) return res.status(400).json({ error: "展项类别不正确。" });
    if (kind) where.kind = kind;
    const q = cleanText(req.query.q, 40);
    if (q) where.title = { contains: q };
    const total = await prisma.contentItem.count({ where: where });
    const rows = await prisma.contentItem.findMany({
        where: where,
        orderBy: [{ kind: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
        skip: paging.skip,
        take: paging.pageSize
    });
    res.json(paged(rows.map(publicContent), total, paging.page, paging.pageSize));
}));

router.post("/content", asyncRoute(async function (req, res) {
    const parsed = readContentBody(req.body, false);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    try {
        const item = await prisma.contentItem.create({ data: parsed.data });
        res.status(201).json({ item: publicContent(item) });
    } catch (error) {
        if (error.code === "P2002") return res.status(409).json({ error: "同一类别下已有这个编号。" });
        throw error;
    }
}));

router.put("/content/:id", asyncRoute(async function (req, res) {
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.contentItem.findUnique({ where: { id: id } });
    if (!existing) return res.status(404).json({ error: "没有这条展项。" });
    const parsed = readContentBody(req.body, false);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    try {
        const item = await prisma.contentItem.update({ where: { id: id }, data: parsed.data });
        res.json({ item: publicContent(item) });
    } catch (error) {
        if (error.code === "P2002") return res.status(409).json({ error: "同一类别下已有这个编号。" });
        throw error;
    }
}));

router.post("/upload", upload.single("file"), asyncRoute(async function (req, res) {
    if (!req.file) return res.status(400).json({ error: "请选择图片文件。" });
    const ext = imageExt(req.file.buffer);
    if (!ext) return res.status(400).json({ error: "只接受 jpg、png、gif 或 webp。" });
    const name = Date.now().toString(36) + "-" + crypto.randomBytes(4).toString("hex") + "." + ext;
    const dir = path.join(__dirname, "..", "..", "uploads");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, name), req.file.buffer);
    res.status(201).json({ url: "media/" + name });
}));

router.get("/survey", asyncRoute(async function (req, res) {
    const questions = await prisma.surveyQuestion.findMany({
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        include: { answers: true }
    });
    res.json({
        questions: questions.map(function (question) {
            const options = JSON.parse(question.options);
            const counts = {};
            options.forEach(function (option) { counts[option] = 0; });
            question.answers.forEach(function (answer) {
                if (counts[answer.choice] === undefined) counts[answer.choice] = 0;
                counts[answer.choice] += 1;
            });
            return {
                id: question.id,
                prompt: question.prompt,
                options: options,
                counts: counts,
                total: question.answers.length,
                active: question.active
            };
        })
    });
}));

router.put("/survey/:id", asyncRoute(async function (req, res) {
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.surveyQuestion.findUnique({ where: { id: id } });
    if (!existing) return res.status(404).json({ error: "没有这道题。" });
    const prompt = cleanText(req.body.prompt, 120);
    const options = String(req.body.options || "").split(/\n/).map(function (line) {
        return cleanText(line, 40);
    }).filter(Boolean);
    if (prompt.length < 4) return res.status(400).json({ error: "题目至少 4 个字。" });
    if (options.length < 2 || options.length > 6) {
        return res.status(400).json({ error: "每题需要 2 到 6 个选项，一行一个。" });
    }
    const saved = await prisma.surveyQuestion.update({
        where: { id: id },
        data: { prompt: prompt, options: JSON.stringify(options) }
    });
    res.json({ question: { id: saved.id, prompt: saved.prompt, options: options } });
}));

module.exports = router;
