const express = require("express");
const { prisma } = require("../db");
const { kindFromParam, isSlug, pageQuery, paged, publicContent } = require("../lib/http");
const { asyncRoute, requireLogin } = require("../middleware/security");

const router = express.Router();

router.get("/check", requireLogin, asyncRoute(async function (req, res) {
    const kind = kindFromParam(req.query.kind);
    if (!kind || !isSlug(req.query.slug)) return res.json({ favoured: false });
    const item = await prisma.contentItem.findUnique({
        where: { kind_slug: { kind: kind, slug: req.query.slug } }
    });
    if (!item) return res.json({ favoured: false });
    const row = await prisma.favourite.findUnique({
        where: { userId_contentId: { userId: req.user.id, contentId: item.id } }
    });
    res.json({ favoured: Boolean(row) });
}));

router.post("/", requireLogin, asyncRoute(async function (req, res) {
    const kind = kindFromParam(req.body.kind);
    if (!kind || !isSlug(req.body.slug)) return res.status(404).json({ error: "没有这条展项。" });
    const item = await prisma.contentItem.findUnique({
        where: { kind_slug: { kind: kind, slug: req.body.slug } }
    });
    if (!item || !item.published) return res.status(404).json({ error: "没有这条展项。" });
    const where = { userId_contentId: { userId: req.user.id, contentId: item.id } };
    const existing = await prisma.favourite.findUnique({ where: where });
    if (existing) {
        await prisma.favourite.delete({ where: where });
        return res.json({ favoured: false });
    }
    await prisma.favourite.create({ data: { userId: req.user.id, contentId: item.id } });
    res.json({ favoured: true });
}));

router.get("/", requireLogin, asyncRoute(async function (req, res) {
    const paging = pageQuery(req.query, 6);
    const where = { userId: req.user.id };
    const total = await prisma.favourite.count({ where: where });
    const rows = await prisma.favourite.findMany({
        where: where,
        include: { content: true },
        orderBy: { createdAt: "desc" },
        skip: paging.skip,
        take: paging.pageSize
    });
    res.json(paged(rows.map(function (row) {
        return Object.assign({ favouredAt: row.createdAt }, publicContent(row.content));
    }), total, paging.page, paging.pageSize));
}));

module.exports = router;
