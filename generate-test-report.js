// 生成测试报告
const { generateTimelineHTML } = require("./lib/report");
const fs = require("fs").promises;

async function generateTestReport() {
  // 模拟提交数据
  const commits = [
    {
      hash: "abc123",
      message: "测试提交1",
      authorName: "张三",
      date: new Date(),
      status: "source",
    },
    {
      hash: "def456",
      message: "测试提交2",
      authorName: "李四",
      date: new Date(),
      status: "target",
    },
    {
      hash: "ghi789",
      message: "共同提交",
      authorName: "王五",
      date: new Date(),
      status: "both",
    },
  ];

  const html = await generateTimelineHTML(
    commits,
    "main",
    "feature/test",
    "全部",
    "全部时间",
    [],
    3002
  );

  await fs.writeFile("test-report.html", html, "utf8");
  console.log("✓ 测试报告已生成: test-report.html");
  console.log("请在浏览器中打开 test-report.html 查看效果");
}

generateTestReport().catch(console.error);
