const express = require("express");
const { prisma } = require("../db");
const { cleanText, pageQuery, paged } = require("../lib/http");
const { asyncRoute, requireLogin } = require("../middleware/security");

const router = express.Router();

function present(row) {
    return {
        id: row.id,
        content: row.content,
        reply: row.reply,
        status: row.status,
        createdAt: row.createdAt,
        author: row.user.username
    };
}

router.get("/", asyncRoute(async function (req, res) {
    const paging = pageQuery(req.query, 5);
    const where = { status: "APPROVED" };
    const total = await prisma.message.count({ where: where });
    const rows = await prisma.message.findMany({
        where: where,
        include: { user: true },
        orderBy: { createdAt: "desc" },
        skip: paging.skip,
        take: paging.pageSize
    });
    res.json(paged(rows.map(present), total, paging.page, paging.pageSize));
}));

router.post("/", requireLogin, asyncRoute(async function (req, res) {
    const content = cleanText(req.body.content, 300);
    if (content.length < 2) return res.status(400).json({ error: "留言至少 2 个字。" });
    const row = await prisma.message.create({
        data: { userId: req.user.id, content: content },
        include: { user: true }
    });
    res.status(201).json({
        message: present(row),
        notice: "已提交，管理员通过后才会出现在留言板上。"
    });
}));

module.exports = router;
