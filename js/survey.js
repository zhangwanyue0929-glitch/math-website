/**
 * 参观调查。每人只能提交一次，结果用选项计数显示，不展示别人的账号。
 */
(function () {
    var box = document.getElementById("surveyBox");
    var notice = document.getElementById("surveyNotice");
    var errorNode = document.getElementById("formError");
    if (!box) return;

    function draw(questions) {
        SuanjingUI.clear(box);
        var answered = questions.length > 0 && questions.every(function (question) { return question.mine; });
        questions.forEach(function (question) {
            var card = SuanjingUI.el("fieldset", "message-card");
            card.appendChild(SuanjingUI.el("legend", "", question.prompt));
            question.options.forEach(function (option) {
                var label = SuanjingUI.el("label", "choice");
                var input = document.createElement("input");
                input.type = "radio";
                input.name = "q" + question.id;
                input.value = option;
                if (question.mine === option) input.checked = true;
                if (answered) input.disabled = true;
                label.appendChild(input);
                label.appendChild(document.createTextNode(option));
                card.appendChild(label);
                var count = question.counts[option] || 0;
                var ratio = question.total ? Math.round(count * 100 / question.total) : 0;
                var bar = SuanjingUI.el("div", "bar");
                var fill = document.createElement("span");
                fill.style.width = ratio + "%";
                bar.appendChild(fill);
                card.appendChild(bar);
                card.appendChild(SuanjingUI.el("p", "help", count + " 人，" + ratio + "%"));
            });
            box.appendChild(card);
        });
        var button = document.getElementById("surveySubmit");
        if (button) button.hidden = answered || !SuanjingAPI.state.user;
        if (answered && errorNode && errorNode.textContent.indexOf("提交成功") === -1) {
            errorNode.textContent = "你已经提交过，下面是目前的汇总。";
        }
    }

    function load() {
        SuanjingAPI.request("survey").then(function (data) {
            draw(data.questions);
        }).catch(function (error) {
            SuanjingUI.offlineNotice(notice, error.message);
        });
    }

    SuanjingAPI.ready.then(function () {
        if (!SuanjingAPI.state.online) {
            SuanjingUI.offlineNotice(notice, "调查需要连接本馆服务器。离线时不能提交，也不会显示一份假装的统计。");
            return;
        }
        if (!SuanjingAPI.state.user) {
            SuanjingUI.offlineNotice(notice, "可以先看题目和汇总。提交请先登录。");
        }
        load();
    });

    var form = document.getElementById("surveyForm");
    if (form) {
        form.addEventListener("submit", function (event) {
            event.preventDefault();
            if (!SuanjingAPI.state.online) {
                errorNode.textContent = "服务器未连接，暂时不能提交调查。";
                return;
            }
            if (!SuanjingAPI.state.user) {
                location.href = "login.html?next=survey.html";
                return;
            }
            var answers = [];
            Array.prototype.forEach.call(box.querySelectorAll("fieldset"), function (field) {
                var chosen = field.querySelector("input:checked");
                var name = field.querySelector("input");
                if (!name) return;
                answers.push({
                    questionId: Number(name.name.slice(1)),
                    choice: chosen ? chosen.value : ""
                });
            });
            SuanjingAPI.request("survey", { method: "POST", body: { answers: answers } })
                .then(function (data) {
                    errorNode.textContent = "提交成功。下面是目前的汇总。";
                    draw(data.questions);
                })
                .catch(function (error) {
                    errorNode.textContent = error.message;
                });
        });
    }
})();
