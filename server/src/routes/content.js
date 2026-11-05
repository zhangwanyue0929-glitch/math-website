const express = require("express");
const { prisma } = require("../db");
const { kindFromParam, isSlug, pageQuery, paged, publicContent, cleanText } = require("../lib/http");
const { asyncRoute } = require("../middleware/security");

const router = express.Router();

router.get("/", asyncRoute(async function (req, res) {
    const paging = pageQuery(req.query, 6);
    const where = { published: true };
    const kind = kindFromParam(req.query.kind);
    if (req.query.kind && !kind) return res.status(400).json({ error: "展项类别不正确。" });
    if (kind) where.kind = kind;
    const q = cleanText(req.query.q, 40);
    if (q) where.title = { contains: q };
    const total = await prisma.contentItem.count({ where: where });
    const rows = await prisma.contentItem.findMany({
        where: where,
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        skip: paging.skip,
        take: paging.pageSize
    });
    res.json(paged(rows.map(publicContent), total, paging.page, paging.pageSize));
}));

router.get("/:kind/:slug", asyncRoute(async function (req, res) {
    const kind = kindFromParam(req.params.kind);
    if (!kind || !isSlug(req.params.slug)) return res.status(404).json({ error: "没有这条展项。" });
    const item = await prisma.contentItem.findUnique({
        where: { kind_slug: { kind: kind, slug: req.params.slug } }
    });
    if (!item || !item.published) return res.status(404).json({ error: "没有这条展项。" });
    res.json({ item: publicContent(item) });
}));

module.exports = router;
