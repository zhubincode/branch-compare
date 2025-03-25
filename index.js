#!/usr/bin/env node

const fs = require("fs").promises;
const http = require("http");
const path = require("path");
const chalk = require("chalk");
const inquirer = require("inquirer");
const autocomplete = require("inquirer-autocomplete-prompt");
const { getAllBranches, getAllAuthors, getAllCommits } = require("./lib/git");
const { loadIgnoredCommits, saveIgnoredCommits } = require("./lib/ignore");
const { loadRemarks, saveRemarks } = require("./lib/remark");
const { generateMarkdown, generateTimelineHTML } = require("./lib/report");
const { generateDiffReport } = require("./lib/report");
const { execSync } = require("child_process");
const { ensureDataDir, getDataFilePath } = require("./lib/config");
// const { startServer } = require('./lib/server');  // 不使用Express服务器

// 注册自动完成插件
inquirer.registerPrompt("autocomplete", autocomplete);

// 获取源分支
async function getSourceBranch() {
  const branches = getAllBranches();
  const { sourceBranch } = await inquirer.prompt([
    {
      type: "autocomplete",
      name: "sourceBranch",
      message: "选择基准分支 (输入可搜索):",
      source: async (answersSoFar, input = "") => {
        return branches.filter((branch) =>
          branch.toLowerCase().includes((input || "").toLowerCase())
        );
      },
    },
  ]);
  return sourceBranch;
}

// 获取目标分支
async function getTargetBranch(sourceBranch) {
  const branches = getAllBranches();
  const { targetBranch } = await inquirer.prompt([
    {
      type: "autocomplete",
      name: "targetBranch",
      message: "选择目标分支 (输入可搜索):",
      source: async (answersSoFar, input = "") => {
        return branches
          .filter((b) => b !== sourceBranch)
          .filter((branch) =>
            branch.toLowerCase().includes((input || "").toLowerCase())
          );
      },
    },
  ]);
  return targetBranch;
}

// 获取时间范围
async function getTimeRange() {
  const { timeRange } = await inquirer.prompt([
    {
      type: "list",
      name: "timeRange",
      message: "选择时间范围:",
      choices: [
        "全部时间",
        "最近一周",
        "最近两周",
        "最近一个月",
        "最近三个月",
        "最近半年",
        "最近一年",
      ],
    },
  ]);
  return timeRange;
}

// 获取作者
async function getAuthor() {
  const authors = getAllAuthors();
  const { author } = await inquirer.prompt([
    {
      type: "autocomplete",
      name: "author",
      message: "选择提交者 (输入可搜索):",
      source: async (answersSoFar, input = "") => {
        const authorChoices = ["全部", ...authors];
        return authorChoices.filter((choice) =>
          choice.toLowerCase().includes((input || "").toLowerCase())
        );
      },
    },
  ]);
  return author;
}

// 获取提交信息
async function getCommits(sourceBranch, targetBranch, timeRange, author) {
  console.log(
    `正在获取提交信息：源分支=${sourceBranch}, 目标分支=${targetBranch}, 时间范围=${timeRange}, 作者=${author}`
  );

  const sourceCommits = getAllCommits(sourceBranch, null, author, timeRange);
  console.log(`获取到 ${sourceBranch} 分支的提交数量: ${sourceCommits.length}`);

  const targetCommits = getAllCommits(targetBranch, null, author, timeRange);
  console.log(`获取到 ${targetBranch} 分支的提交数量: ${targetCommits.length}`);

  // 合并所有提交信息
  const commitsMap = new Map();

  // 消息到哈希的映射 (用于检测内容相同但哈希不同的提交)
  const messageMap = new Map();

  // 首先处理源分支提交
  sourceCommits.forEach((commit) => {
    // 标准化提交消息用于比较 - 移除所有空白和特殊字符
    const normalizedMessage = commit.message.trim();

    // 设置到主Map
    commitsMap.set(commit.hash, {
      ...commit,
      status: "source",
      branches: [sourceBranch],
      normalizedMessage,
    });

    // 保存消息到哈希的映射
    if (!messageMap.has(normalizedMessage)) {
      messageMap.set(normalizedMessage, [commit.hash]);
    } else {
      messageMap.get(normalizedMessage).push(commit.hash);
    }
  });

  // 然后处理目标分支提交，同时检查消息相似性
  targetCommits.forEach((commit) => {
    const normalizedMessage = commit.message.trim();

    // 检查是否有完全相同的哈希
    if (commitsMap.has(commit.hash)) {
      const existingCommit = commitsMap.get(commit.hash);
      existingCommit.status = "both";
      existingCommit.branches = [sourceBranch, targetBranch];
      return; // 跳过后续步骤，直接处理下一个提交
    }

    // 检查是否有相同的消息
    if (messageMap.has(normalizedMessage)) {
      // 有相同消息的提交
      const sourceHashes = messageMap.get(normalizedMessage);

      // 遍历相同消息的源分支提交，将它们标记为共同提交
      sourceHashes.forEach((sourceHash) => {
        const sourceCommit = commitsMap.get(sourceHash);
        if (sourceCommit && sourceCommit.status === "source") {
          sourceCommit.status = "both";
          sourceCommit.branches = [sourceBranch, targetBranch];
          sourceCommit.matchedByMessage = true; // 标记是通过消息匹配的

          // 添加目标分支的哈希信息，用于展示
          sourceCommit.targetHash = commit.hash;
        }
      });

      // 不再将此提交添加到列表中，因为它已经被匹配为共同提交
      // 避免重复显示相同内容的提交
      return;
    }

    // 如果没有匹配到相同消息，添加为目标分支独有的提交
    commitsMap.set(commit.hash, {
      ...commit,
      status: "target",
      branches: [targetBranch],
      normalizedMessage,
    });
  });

  const mergedCommits = Array.from(commitsMap.values());

  // 统计各类提交数量
  const sourceOnly = mergedCommits.filter((c) => c.status === "source").length;
  const targetOnly = mergedCommits.filter((c) => c.status === "target").length;
  const common = mergedCommits.filter((c) => c.status === "both").length;

  console.log(`合并后的总提交数量: ${mergedCommits.length}`);
  console.log(`- 仅在 ${sourceBranch} 分支: ${sourceOnly}`);
  console.log(`- 仅在 ${targetBranch} 分支: ${targetOnly}`);
  console.log(`- 共同提交: ${common} (包含通过消息匹配的提交)`);

  if (mergedCommits.length === 0) {
    console.warn("警告: 没有找到任何提交记录!");
  }

  return mergedCommits;
}

// 创建服务器处理忽略提交的保存
const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // 解析URL和查询参数
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const params = Object.fromEntries(url.searchParams);

  if (req.method === "GET" && pathname === "/ignored-commits") {
    try {
      const ignoredCommits = await loadIgnoredCommits();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ignoredCommits }));
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error.message }));
    }
  } else if (req.method === "POST" && pathname === "/ignore-commit") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      try {
        const { ignoredCommits } = JSON.parse(body);
        await saveIgnoredCommits(ignoredCommits);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else if (req.method === "GET" && pathname === "/commit-remarks") {
    try {
      // 使用新的备注模块加载备注
      const commitRemarks = await loadRemarks();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ commitRemarks }));
    } catch (error) {
      console.error("获取备注失败:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error.message }));
    }
  } else if (req.method === "POST" && pathname === "/commit-remarks") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      try {
        console.log("收到备注保存请求");

        // 解析请求体
        let commitRemarks;
        try {
          const data = JSON.parse(body);
          console.log(
            "请求体解析成功:",
            `${JSON.stringify(data).substring(0, 200)}...`
          );

          if (!data) {
            throw new Error("请求体为空");
          }

          commitRemarks = data.commitRemarks;
          console.log(
            "解析备注数据成功, 类型:",
            Array.isArray(commitRemarks) ? "Array" : typeof commitRemarks
          );
        } catch (parseError) {
          console.error("解析请求体失败:", parseError);
          throw new Error(`无效的请求格式: ${parseError.message}`);
        }

        // 验证备注数据
        if (!Array.isArray(commitRemarks)) {
          // 如果前端还是发送对象格式, 转换为数组格式
          if (typeof commitRemarks === "object" && commitRemarks !== null) {
            const remarkArray = [];
            for (const hash in commitRemarks) {
              if (Object.prototype.hasOwnProperty.call(commitRemarks, hash)) {
                remarkArray.push({
                  hash: hash,
                  content: commitRemarks[hash] || "",
                  timestamp: new Date().toISOString(),
                });
              }
            }
            commitRemarks = remarkArray;
            console.log(
              "已将对象格式的备注转换为数组格式, 条数:",
              commitRemarks.length
            );
          } else {
            console.warn("备注数据格式不正确, 将使用空数组");
            commitRemarks = [];
          }
        }

        // 过滤掉无效的备注
        commitRemarks = commitRemarks.filter(
          (remark) =>
            remark &&
            remark.hash &&
            typeof remark.hash === "string" &&
            remark.hash.trim().length > 0
        );
        console.log("过滤后的备注数量:", commitRemarks.length);

        try {
          // 使用新的备注模块保存备注
          const result = await saveRemarks(commitRemarks);
          console.log("备注保存结果:", result ? "成功" : "失败");

          // 返回成功响应
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: true,
              message: "备注保存成功",
              timestamp: new Date().toISOString(),
              commitRemarks: commitRemarks,
              count: commitRemarks.length,
            })
          );
        } catch (saveError) {
          console.error("调用saveRemarks失败:", saveError);
          throw saveError;
        }
      } catch (error) {
        console.error("保存备注失败:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: error.message,
            timestamp: new Date().toISOString(),
          })
        );
      }
    });
  } else if (req.method === "GET" && pathname === "/git/show") {
    try {
      // 获取提交哈希
      const hash = params.hash;

      if (!hash) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            message: "缺少提交哈希参数",
          })
        );
        return;
      }

      console.log(`获取提交 ${hash} 的变更信息`);

      // 使用Git命令获取提交的差异信息
      try {
        // 验证提交哈希是否存在和有效
        const objectType = execSync(`git cat-file -t ${hash}`, {
          encoding: "utf-8",
        }).trim();
        console.log(`提交 ${hash} 的对象类型: ${objectType}`);

        // 获取提交差异 - 添加参数使输出更完整
        const diff = execSync(`git show --patch --stat ${hash}`, {
          encoding: "utf-8",
          maxBuffer: 5 * 1024 * 1024, // 5MB缓冲区
        });

        console.log(`获取到提交 ${hash} 的差异数据, 长度: ${diff.length} 字节`);
        // 打印差异数据的前100个字符作为调试信息
        console.log(`差异数据预览: ${diff.substring(0, 100)}...`);

        // 构造响应对象
        const responseData = {
          success: true,
          data: {
            hash,
            diff: diff,
          },
        };

        console.log(
          `响应数据结构: ${JSON.stringify(Object.keys(responseData))}`
        );
        console.log(
          `数据对象结构: ${JSON.stringify(Object.keys(responseData.data))}`
        );

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(responseData));
      } catch (gitError) {
        console.error("Git操作失败:", gitError.message);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            message: `Git操作失败: ${gitError.message}`,
          })
        );
      }
    } catch (error) {
      console.error("获取提交差异失败:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          message: `服务器错误: ${error.message}`,
        })
      );
    }
  } else {
    res.writeHead(404);
    res.end();
  }
});

// 添加获取可用端口的函数
function getAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const server = require("net").createServer();
    server.unref();
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        server.listen(++startPort);
      } else {
        reject(err);
      }
    });
    server.listen(startPort, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function main() {
  try {
    // 确保数据目录已初始化
    await ensureDataDir();

    // 获取可用端口
    const port = await getAvailablePort(3000);

    // 启动服务器
    await new Promise((resolve) => {
      server.listen(port, () => {
        console.log(chalk.blue(`服务器已启动在端口 ${port}`));
        resolve();
      });
    });

    console.log(chalk.blue("开始比较分支差异..."));

    // 获取分支信息
    const sourceBranch = await getSourceBranch();
    const targetBranch = await getTargetBranch(sourceBranch);
    const timeRange = await getTimeRange();
    const author = await getAuthor();

    // 获取提交信息
    const commits = await getCommits(
      sourceBranch,
      targetBranch,
      timeRange,
      author
    );

    // 生成报告
    const comparison = {
      sourceBranch,
      targetBranch,
      author,
      timeRange,
      commits,
    };

    // 生成并保存 Markdown 报告
    const markdown = await generateMarkdown(comparison);
    const markdownPath = getDataFilePath("branch-diff.md");
    await fs.writeFile(markdownPath, markdown);

    // 获取备注信息
    const commitRemarks = await loadRemarks();

    // 生成并保存 HTML 时间轴，传入端口
    const html = await generateTimelineHTML(
      commits,
      sourceBranch,
      targetBranch,
      author,
      timeRange,
      commitRemarks,
      port
    );
    const htmlPath = getDataFilePath("branch-timeline.html");
    await fs.writeFile(htmlPath, html);

    console.log(chalk.green("\n报告生成完成:"));
    console.log(chalk.green(`- Markdown 报告: ${markdownPath}`));
    console.log(chalk.green(`- HTML 时间轴: ${htmlPath}`));

    // 尝试打开浏览器
    try {
      const { exec } = require("child_process");
      const command =
        process.platform === "darwin"
          ? `open "${htmlPath}"`
          : process.platform === "win32"
          ? `start "" "${htmlPath}"`
          : `xdg-open "${htmlPath}"`;

      exec(command, (error) => {
        if (error) {
          console.log(chalk.yellow("\n无法自动打开浏览器，请手动打开HTML文件"));
        } else {
          console.log(chalk.green("\n已在浏览器中打开报告"));
        }
      });
    } catch (openError) {
      console.log(chalk.yellow("\n无法自动打开浏览器，请手动打开HTML文件"));
    }
  } catch (error) {
    console.error(chalk.red("发生错误:"), error);
    process.exit(1);
  }
}

// 添加清理函数
process.on("SIGINT", () => {
  server.close(() => {
    console.log(chalk.yellow("\n已关闭服务器"));
    process.exit();
  });
});

// 启动程序
main();
