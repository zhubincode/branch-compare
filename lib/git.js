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
    const authors = execSync('git log --format="%an" | sort -u', {
      encoding: "utf-8",
    })
      .split("\n")
      .filter(Boolean);
    return authors;
  } catch (error) {
    return [];
  }
}

function getDateRange(timeRange) {
  const now = new Date();
  switch (timeRange) {
    case "最近一周":
      return new Date(now - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
    case "最近两周":
      return new Date(now - 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
    case "最近一个月":
      return new Date(now - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
    case "最近三个月":
      return new Date(now - 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
    case "最近半年":
      return new Date(now - 180 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
    case "最近一年":
      return new Date(now - 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
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
        baseCommand += ` --since="${sinceDate}"`;
      }
    }

    // 修改命令，确保获取完整历史
    const finalCommand = `${baseCommand} ${actualBranchName}`;

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
          return { hash, authorName, message, date };
        })
        .filter((commit) => commit !== null);

      return commits;
    } catch (cmdError) {
      return [];
    }
  } catch (error) {
    return [];
  }
}

module.exports = {
  getAllBranches,
  getAllAuthors,
  getAllCommits,
  getDateRange,
};
