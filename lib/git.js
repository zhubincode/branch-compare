const { execSync } = require("child_process");

function getAllBranches() {
  try {
    // 使用 git branch -a 获取所有分支，包括 worktree
    const branches = execSync("git branch -a", { encoding: "utf-8" })
      .split("\n")
      .map((branch) => {
        // 移除前导空格和当前分支标记 '*'
        branch = branch.trim().replace("* ", "");
        // 如果是 worktree 分支（以 '+' 开头），保留完整名称
        if (branch.startsWith("+")) {
          return branch;
        }
        // 如果是远程分支，去掉 remotes/ 前缀
        if (branch.startsWith("remotes/")) {
          return branch.replace("remotes/", "");
        }
        return branch;
      })
      .filter(Boolean) // 移除空行
      .filter((branch) => !branch.includes("HEAD")) // 移除 HEAD 引用
      .filter(
        (branch, index, self) =>
          // 去重，但保留 worktree 分支
          self.indexOf(branch) === index || branch.startsWith("+")
      );

    return branches;
  } catch (error) {
    return [];
  }
}

function getAllAuthors() {
  try {
    // 根据操作系统选择不同的实现方式
    if (process.platform === "win32") {
      // Windows系统下的实现:
      // 1. 使用git log命令获取所有提交者的名字
      // 2. %an 是git内置的格式化参数，表示"作者名字"
      const authorList = execSync('git log --format="%an"', {
        encoding: "utf-8",
      })
        .split("\n") // 按行分割
        .filter(Boolean); // 过滤掉空行

      // 使用Set数据结构来去重
      // 1. new Set()创建一个集合，自动去除重复值
      // 2. [...集合] 将集合转回数组
      const uniqueAuthors = [...new Set(authorList)];
      return uniqueAuthors;
    } else {
      // Mac/Linux系统下的实现:
      // 使用管道命令 | 组合git log和sort
      // 1. git log --format="%an" 获取所有作者名字
      // 2. sort -u 对结果进行排序并去重
      const authors = execSync('git log --format="%an" | sort -u', {
        encoding: "utf-8",
      })
        .split("\n") // 按行分割
        .filter(Boolean); // 过滤掉空行
      return authors;
    }
  } catch (error) {
    // 如果出现错误，打印错误信息并返回空数组
    console.error("获取作者列表失败:", error.message);
    return [];
  }
}

function getDateRange(timeRange) {
  // 使用上海时区
  const now = new Date();
  const tzOffset = 8 * 60; // 上海时区 UTC+8
  const localTime = new Date(
    now.getTime() + (tzOffset + now.getTimezoneOffset()) * 60000
  );

  switch (timeRange) {
    case "最近一周":
      return new Date(localTime - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .replace(/T.+/, "");
    case "最近两周":
      return new Date(localTime - 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .replace(/T.+/, "");
    case "最近一个月":
      return new Date(localTime - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .replace(/T.+/, "");
    case "最近三个月":
      return new Date(localTime - 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .replace(/T.+/, "");
    case "最近半年":
      return new Date(localTime - 180 * 24 * 60 * 60 * 1000)
        .toISOString()
        .replace(/T.+/, "");
    case "最近一年":
      return new Date(localTime - 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .replace(/T.+/, "");
    default:
      return "";
  }
}

function getAllCommits(branchName, targetBranch, author, timeRange) {
  try {
    // 直接移除 + 前缀
    const actualBranchName = branchName.startsWith("+")
      ? branchName.substring(1)
      : branchName;

    let baseCommand = `git log --pretty=format:"%H|%an|%s|%ai"`;

    if (author && author !== "全部") {
      baseCommand += ` --author="${author}"`;
    }

    if (timeRange && timeRange !== "全部时间") {
      const sinceDate = getDateRange(timeRange);
      if (sinceDate) {
        // 使用严格的时间范围过滤，同时设置until以确保不会包含未来的提交
        const now = new Date();
        const untilDate = now.toISOString().split("T")[0];
        baseCommand += ` --since="${sinceDate}T00:00:00+08:00" --until="${untilDate}T23:59:59+08:00"`;
      }
    }

    // 修改命令，确保获取完整历史
    const finalCommand = `${baseCommand} ${actualBranchName}`;
    console.log("执行Git命令:", finalCommand); // 调试日志

    try {
      // 获取分支提交
      const output = execSync(finalCommand, {
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024, // 增加缓冲区大小到10MB
      });

      if (!output || output.trim() === "") {
        return [];
      }

      const commits = output
        .split("\n")
        .filter(Boolean)
        .map((commit) => {
          const parts = commit.split("|");
          if (parts.length < 4) {
            return null;
          }
          const [hash, authorName, message, date] = parts;

          try {
            // 验证日期格式
            const commitDate = new Date(date);
            if (isNaN(commitDate.getTime())) {
              console.warn(
                `警告: 无效的提交日期格式 [${date}] for commit ${hash}`
              );
              return null;
            }

            // 转换为上海时区的时间
            const tzOffset = 8 * 60; // 上海时区 UTC+8
            const localDate = new Date(
              commitDate.getTime() +
                (tzOffset + commitDate.getTimezoneOffset()) * 60000
            );

            // 验证时间范围（如果指定了时间范围）
            if (timeRange && timeRange !== "全部时间") {
              const sinceDate = new Date(
                getDateRange(timeRange) + "T00:00:00+08:00"
              );
              const now = new Date();
              if (localDate < sinceDate || localDate > now) {
                console.warn(
                  `警告: 提交日期超出范围 [${date}] for commit ${hash}`
                );
                return null;
              }
            }

            return {
              hash,
              authorName,
              message,
              date: localDate.toISOString(),
              dateIso: date, // 保留原始ISO日期字符串
            };
          } catch (dateError) {
            console.error(
              `处理提交日期时出错 [${date}] for commit ${hash}:`,
              dateError
            );
            return null;
          }
        })
        .filter((commit) => commit !== null);

      return commits;
    } catch (cmdError) {
      console.error("执行Git命令失败:", cmdError);
      return [];
    }
  } catch (error) {
    console.error("获取提交记录失败:", error);
    return [];
  }
}

module.exports = {
  getAllBranches,
  getAllAuthors,
  getAllCommits,
  getDateRange,
};
