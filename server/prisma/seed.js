/**
 * 把 js/content-data.js 里的展项和问卷写进数据库，并保证有一名管理员。
 * 已经存在的展项不会被覆盖，这样后台改过的文字还在。
 * 管理员也只在用户名还不存在时创建。
 */
require("../src/load-env");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const content = require("../../js/content-data");

const prisma = new PrismaClient();

async function main() {
    const username = process.env.SEED_ADMIN_USERNAME || "admin";
    const password = process.env.SEED_ADMIN_PASSWORD;
    const email = process.env.SEED_ADMIN_EMAIL || "admin@suanjing.local";
    const question = process.env.SEED_ADMIN_QUESTION || "本馆的馆名是什么";
    const answer = process.env.SEED_ADMIN_ANSWER || "算经千年";
    if (!password || password.length < 8) {
        throw new Error("请在 server/.env 里设置 SEED_ADMIN_PASSWORD。");
    }

    const existingAdmin = await prisma.user.findUnique({ where: { username: username } });
    if (!existingAdmin) {
        await prisma.user.create({
            data: {
                username: username,
                email: email,
                passwordHash: await bcrypt.hash(password, 10),
                role: "ADMIN",
                securityQuestion: question,
                securityAnswerHash: await bcrypt.hash(answer.toLowerCase(), 10)
            }
        });
        console.log("已创建管理员：" + username);
    } else {
        console.log("管理员已存在，不重置密码：" + username);
    }

    let created = 0;
    for (let i = 0; i < content.items.length; i += 1) {
        const item = content.items[i];
        const found = await prisma.contentItem.findUnique({
            where: { kind_slug: { kind: item.kind, slug: item.slug } }
        });
        if (found) continue;
        await prisma.contentItem.create({
            data: {
                kind: item.kind,
                slug: item.slug,
                title: item.title,
                subtitle: item.subtitle,
                summary: item.summary,
                sourceNote: item.sourceNote,
                sourceText: item.sourceText,
                modernText: item.modernText,
                demoNote: item.demoNote,
                imageUrl: item.imageUrl,
                imageCaption: item.imageCaption,
                demoHref: item.demoHref,
                pageUrl: item.pageUrl,
                points: item.points,
                diagram: item.diagram === "none" ? "" : item.diagram,
                sortOrder: item.sortOrder,
                published: true
            }
        });
        created += 1;
    }
    console.log("新增展项 " + created + " 条。");

    const questionCount = await prisma.surveyQuestion.count();
    if (questionCount === 0) {
        for (let i = 0; i < content.survey.length; i += 1) {
            const questionItem = content.survey[i];
            await prisma.surveyQuestion.create({
                data: {
                    prompt: questionItem.prompt,
                    options: JSON.stringify(questionItem.options),
                    sortOrder: i + 1
                }
            });
        }
        console.log("已写入调查 " + content.survey.length + " 题。");
    } else {
        console.log("调查题目已存在，不覆盖。");
    }
}

main()
    .then(function () { return prisma.$disconnect(); })
    .catch(function (error) {
        console.error(error);
        return prisma.$disconnect().then(function () { process.exit(1); });
    });
