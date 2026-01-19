const fs = require("fs").promises;
const { getDataFilePath } = require("./config");

// 预定义的忽略原因
const IGNORE_REASONS = [
  "已手动合并",
  "不需要合并",
  "存在冲突",
  "待进一步确认",
  "其他原因",
];

const IGNORED_COMMITS_FILE = getDataFilePath("commit-ignore.json");

// 确保数据文件存在并可访问
async function ensureDataFile() {
  try {
    // 检查文件是否存在
    try {
      const stats = await fs.stat(IGNORED_COMMITS_FILE);
      // 文件存在，直接返回
      return;
    } catch (err) {
      // 文件不存在，创建新文件（对象格式）
      if (err.code === "ENOENT") {
        await fs.writeFile(
          IGNORED_COMMITS_FILE,
          JSON.stringify({ ignoredCommits: [] }, null, 2),
          { mode: 0o644 }
        );
        console.log(`Created ignored commits file: ${IGNORED_COMMITS_FILE}`);
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error("Error ensuring ignored commits file:", error);
    throw error;
  }
}

async function loadIgnoredCommits() {
  try {
    await ensureDataFile();
    const data = await fs.readFile(IGNORED_COMMITS_FILE, "utf8");
    const parsed = JSON.parse(data);
    // 读取对象格式 {ignoredCommits: [...]}
    if (
      parsed &&
      parsed.ignoredCommits &&
      Array.isArray(parsed.ignoredCommits)
    ) {
      return parsed.ignoredCommits;
    }
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("加载忽略提交失败:", error);
    return []; // 出错时返回空数组
  }
}

async function saveIgnoredCommits(commits) {
  try {
    await ensureDataFile();
    const dataToSave = Array.isArray(commits) ? commits : [];
    // 保存为对象格式 {ignoredCommits: [...]}
    await fs.writeFile(
      IGNORED_COMMITS_FILE,
      JSON.stringify({ ignoredCommits: dataToSave }, null, 2),
      { mode: 0o644 }
    );

    // 验证写入
    try {
      const saved = await loadIgnoredCommits();
      console.log(`Successfully saved ${saved.length} ignored commits`);
    } catch (verifyError) {
      console.error("Warning: Could not verify saved data:", verifyError);
    }
  } catch (error) {
    console.error("保存忽略提交失败:", error);
    throw error;
  }
}

function generateOptimizedCommands(commits) {
  if (!Array.isArray(commits) || commits.length === 0) return "";
  if (commits.length === 1) {
    return `git cherry-pick ${commits[0].hash}  # ${commits[0].message}`;
  }

  commits.sort((a, b) => new Date(b.date) - new Date(a.date));
  const oldestCommit = commits[commits.length - 1];
  const newestCommit = commits[0];

  return `git cherry-pick ${oldestCommit.hash}^..${newestCommit.hash}  # 包含 ${commits.length} 个提交`;
}

module.exports = {
  IGNORE_REASONS,
  loadIgnoredCommits,
  saveIgnoredCommits,
  generateOptimizedCommands,
};
