/**
 * 数学家专题馆的静态条目。
 * 第二阶段接入数据库后，把 people 换成接口返回的数组，
 * render() 仍然负责左侧按钮和右侧图文，页面骨架可以保留。
 */
(function () {
    var people = {
        zuchongzhi: {
            name: "祖冲之",
            image: "assets/images/mathematicians/zuchongzhi.jpg",
            text: "南北朝杰出的数学家与天文学家，首次将圆周率精确到小数点后七位。",
            achievements: ["圆周率 3.1415926～3.1415927", "《缀术》", "大明历"]
        },
        liuhui: {
            name: "刘徽",
            image: "assets/images/mathematicians/liuhui.jpg",
            text: "魏晋数学家，为《九章算术》作注，提出割圆术，用“割之弥细，所失弥少”说明以多边形逼近圆。",
            achievements: ["割圆术", "《九章算术注》", "出入相补"]
        },
        yanghui: {
            name: "杨辉",
            image: "assets/images/mathematicians/yanghui.jpg",
            text: "南宋数学家，在《详解九章算法》中记载三角数表，后世称为杨辉三角，也整理了不少乘除捷法。",
            achievements: ["杨辉三角", "乘除捷法", "《详解九章算法》"]
        },
        qinjiushao: {
            name: "秦九韶",
            image: "assets/images/mathematicians/qinjiushao.jpg",
            text: "南宋数学家，著《数书九章》，系统论述一次同余式组的大衍求一术，以及高次方程的数值解法。",
            achievements: ["大衍求一术", "正负开方术", "《数书九章》"]
        },
        zhushijie: {
            name: "朱世杰",
            image: "assets/images/mathematicians/zhushijie.jpg",
            text: "元代数学家，著《四元玉鉴》和《算学启蒙》，把天元术推广为可以联立多个未知数的四元术。",
            achievements: ["四元术", "《四元玉鉴》", "《算学启蒙》"]
        }
    };

    var buttons = document.querySelectorAll(".person-btn");
    var nameEl = document.getElementById("person-name");
    var textEl = document.getElementById("person-text");
    var imageEl = document.getElementById("person-image");
    var achievementEl = document.getElementById("person-achievement");

    function render(key) {
        var person = people[key];
        nameEl.textContent = person.name;
        textEl.textContent = person.text;
        imageEl.src = person.image;
        imageEl.alt = person.name;
        achievementEl.innerHTML = "<h3>代表成就</h3><ul>" +
            person.achievements.map(function (item) {
                return "<li>" + item + "</li>";
            }).join("") +
            "</ul>";
    }

    buttons.forEach(function (button) {
        button.addEventListener("click", function () {
            buttons.forEach(function (item) { item.classList.remove("active"); });
            button.classList.add("active");
            render(button.dataset.person);
        });
    });

    render("zuchongzhi");
})();
