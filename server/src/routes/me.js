const express = require("express");
const { prisma } = require("../db");
const { pageQuery, paged } = require("../lib/http");
const { asyncRoute, requireLogin } = require("../middleware/security");

const router = express.Router();

router.get("/messages", requireLogin, asyncRoute(async function (req, res) {
    const paging = pageQuery(req.query, 6);
    const where = { userId: req.user.id };
    const total = await prisma.message.count({ where: where });
    const rows = await prisma.message.findMany({
        where: where,
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
            createdAt: row.createdAt
        };
    }), total, paging.page, paging.pageSize));
}));

module.exports = router;
