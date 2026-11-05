const express = require("express");
const { prisma } = require("../db");
const { cleanText } = require("../lib/http");
const { asyncRoute, requireLogin } = require("../middleware/security");

const router = express.Router();

async function loadQuestions(userId) {
    const questions = await prisma.surveyQuestion.findMany({
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        include: { answers: true }
    });
    return questions.map(function (question) {
        const options = JSON.parse(question.options);
        const counts = {};
        options.forEach(function (option) { counts[option] = 0; });
        let mine = "";
        question.answers.forEach(function (answer) {
            if (counts[answer.choice] === undefined) counts[answer.choice] = 0;
            counts[answer.choice] += 1;
            if (userId && answer.userId === userId) mine = answer.choice;
        });
        return {
            id: question.id,
            prompt: question.prompt,
            options: options,
            counts: counts,
            total: question.answers.length,
            mine: mine
        };
    });
}

router.get("/", asyncRoute(async function (req, res) {
    res.json({ questions: await loadQuestions(req.session.userId || null) });
}));

router.post("/", requireLogin, asyncRoute(async function (req, res) {
    const incoming = Array.isArray(req.body.answers) ? req.body.answers : [];
    const questions = await prisma.surveyQuestion.findMany({ where: { active: true } });
    const byId = {};
    questions.forEach(function (question) { byId[question.id] = JSON.parse(question.options); });
    if (incoming.length !== questions.length) {
        return res.status(400).json({ error: "请回答全部问题。" });
    }
    const seen = {};
    for (let i = 0; i < incoming.length; i += 1) {
        const id = Number(incoming[i].questionId);
        const choice = cleanText(incoming[i].choice, 80);
        if (!byId[id] || seen[id] || byId[id].indexOf(choice) === -1) {
            return res.status(400).json({ error: "有题目未选择有效选项。" });
        }
        seen[id] = choice;
    }
    const already = await prisma.surveyAnswer.count({ where: { userId: req.user.id } });
    if (already > 0) return res.status(409).json({ error: "你已经提交过这次调查。" });
    await prisma.$transaction(Object.keys(seen).map(function (id) {
        return prisma.surveyAnswer.create({
            data: { userId: req.user.id, questionId: Number(id), choice: seen[id] }
        });
    }));
    res.status(201).json({ questions: await loadQuestions(req.user.id) });
}));

module.exports = router;
