const express = require("express");
const { prisma } = require("../db");
const { kindFromParam, isSlug, pageQuery, paged, publicContent } = require("../lib/http");
const { asyncRoute, requireLogin } = require("../middleware/security");

const router = express.Router();

router.post("/", requireLogin, asyncRoute(async function (req, res) {
    const kind = kindFromParam(req.body.kind);
    if (!kind || !isSlug(req.body.slug)) return res.status(404).json({ error: "没有这条展项。" });
    const item = await prisma.contentItem.findUnique({
        where: { kind_slug: { kind: kind, slug: req.body.slug } }
    });
    if (!item || !item.published) return res.status(404).json({ error: "没有这条展项。" });
    const recent = await prisma.visitRecord.findFirst({
        where: {
            userId: req.user.id,
            contentId: item.id,
            createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) }
        }
    });
    if (!recent) {
        await prisma.visitRecord.create({ data: { userId: req.user.id, contentId: item.id } });
    }
    res.status(201).json({ ok: true });
}));

router.get("/", requireLogin, asyncRoute(async function (req, res) {
    const paging = pageQuery(req.query, 8);
    const where = { userId: req.user.id };
    const total = await prisma.visitRecord.count({ where: where });
    const rows = await prisma.visitRecord.findMany({
        where: where,
        include: { content: true },
        orderBy: { createdAt: "desc" },
        skip: paging.skip,
        take: paging.pageSize
    });
    res.json(paged(rows.map(function (row) {
        return Object.assign({ visitedAt: row.createdAt }, publicContent(row.content));
    }), total, paging.page, paging.pageSize));
}));

module.exports = router;
