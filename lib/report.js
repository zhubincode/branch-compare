const fs = require("fs").promises;
const path = require("path");
const { loadIgnoredCommits } = require("./ignore");
const { generateOptimizedCommands } = require("./ignore");

function formatDate(date) {
  return new Date(date).toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function generateMarkdown(comparison) {
  let markdown = "# 分支提交差异对比\n\n";
  markdown += `生成时间: ${formatDate(new Date())}\n\n`;

  const { sourceBranch, targetBranch, author, timeRange, commits } = comparison;

  markdown += `## ${sourceBranch} vs ${targetBranch}\n\n`;
  if (author !== "全部") markdown += `提交者: ${author}\n`;
  if (timeRange !== "全部时间") markdown += `时间范围: ${timeRange}\n`;
  markdown += "\n";

  markdown += "| 提交信息 | 提交时间 | 作者 | 状态 | 提交哈希 |\n";
  markdown += "|----------|----------|------|------|----------|\n";

  // 按时间排序所有提交
  commits.sort((a, b) => new Date(b.date) - new Date(a.date));

  // 加载已忽略的提交
  const ignoredCommits = await loadIgnoredCommits();

  commits.forEach((commit) => {
    if (!ignoredCommits.some((item) => item.hash === commit.hash)) {
      const indicator =
        commit.status === "both"
          ? "🔴🔵"
          : commit.status === "source"
          ? "🔴"
          : "🔵";
      markdown += `| ${commit.message} | ${formatDate(commit.date)} | ${
        commit.authorName
      } | ${indicator} | ${commit.hash} |\n`;
    }
  });

  // 添加 Cherry-pick 指令块
  const sourceOnlyCommits = commits.filter(
    (c) =>
      c.status === "source" &&
      !ignoredCommits.some((item) => item.hash === c.hash)
  );

  if (sourceOnlyCommits.length > 0) {
    markdown += "\n### Cherry-pick 指令\n\n";
    markdown += "```bash\n";
    markdown += `# 切换到 ${targetBranch} 分支\n`;
    markdown += `git checkout ${targetBranch}\n\n`;

    // 基础命令
    markdown += "# 基础命令（逐个提交）\n";
    sourceOnlyCommits.forEach((commit) => {
      markdown += `git cherry-pick ${commit.hash}  # ${commit.message}\n`;
    });
    markdown += "\n";

    // 优化命令
    markdown += "# 优化命令（一次性合并）\n";
    markdown += generateOptimizedCommands(sourceOnlyCommits);
    markdown += "\n";
    markdown += "```\n";
  }

  return markdown;
}

async function generateTimelineHTML(
  commits,
  sourceBranch,
  targetBranch,
  author,
  timeRange,
  commitRemarks,
  port
) {
  try {
    // 读取模板文件
    const templatePath = path.join(
      __dirname,
      "..",
      "templates",
      "timeline.html"
    );
    let template = await fs.readFile(templatePath, "utf8");

    // 读取CSS文件（按顺序）
    const cssFiles = [
      "tokens.css",
      "base.css",
      "layout.css",
      "utilities.css",
      "components.css",
    ];

    let inlinedCSS = "";
    for (const cssFile of cssFiles) {
      const cssPath = path.join(
        __dirname,
        "..",
        "templates",
        "assets",
        "css",
        cssFile
      );
      try {
        const cssContent = await fs.readFile(cssPath, "utf8");
        inlinedCSS += cssContent + "\n";
      } catch (error) {
        console.warn(`警告: 无法读取CSS文件 ${cssFile}:`, error.message);
      }
    }

    // 读取JS文件（按顺序）
    const jsFiles = [
      "utils.js",
      "api.js",
      "state.js",
      "render.js",
      "filter.js",
      "modal.js",
      "main.js",
    ];

    let inlinedJS = "";
    for (const jsFile of jsFiles) {
      const jsPath = path.join(
        __dirname,
        "..",
        "templates",
        "assets",
        "js",
        jsFile
      );
      try {
        const jsContent = await fs.readFile(jsPath, "utf8");
        inlinedJS += jsContent + "\n";
      } catch (error) {
        console.warn(`警告: 无法读取JS文件 ${jsFile}:`, error.message);
      }
    }

    // 加载已忽略的提交
    const ignoredCommits = await loadIgnoredCommits();

    // 格式化日期
    const formattedCommits = commits.map((commit) => ({
      ...commit,
      formattedDate: formatDate(commit.date),
    }));

    // 确保备注是数组格式
    const remarksArray = Array.isArray(commitRemarks) ? commitRemarks : [];

    // 替换所有模板变量
    const replacements = {
      "{{title}}": `分支对比: ${sourceBranch} vs ${targetBranch}`,
      "{{generatedTime}}": formatDate(new Date()),
      "{{sourceBranch}}": JSON.stringify(sourceBranch),
      "{{targetBranch}}": JSON.stringify(targetBranch),
      "{{commits}}": JSON.stringify(formattedCommits),
      "{{ignoredCommits}}": JSON.stringify(ignoredCommits),
      "{{commitRemarks}}": JSON.stringify(remarksArray),
      "{{author}}": JSON.stringify(author),
      "{{timeRange}}": JSON.stringify(timeRange),
      "{{port}}": port.toString(),
      "{{inlinedCSS}}": inlinedCSS,
      "{{inlinedJS}}": inlinedJS,
    };

    // 执行所有替换
    for (const [key, value] of Object.entries(replacements)) {
      template = template.replace(
        new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
        value
      );
    }

    return template;
  } catch (error) {
    console.error("生成 HTML 报告失败:", error);
    throw error;
  }
}

module.exports = {
  generateMarkdown,
  generateTimelineHTML,
};
