const fs = require('fs').promises;
const path = require('path');

// 预定义的忽略原因
const IGNORE_REASONS = ['已手动合并', '不需要合并', '存在冲突', '待进一步确认', '其他原因'];

// 确保数据目录和文件存在
async function ensureDataFiles() {
  const dataDir = path.join(__dirname, '..', 'data');
  const ignoreFile = path.join(dataDir, 'commit-ignore.json');

  try {
    await fs.mkdir(dataDir, { recursive: true });

    // 检查并初始化忽略文件
    try {
      await fs.access(ignoreFile);
    } catch {
      await fs.writeFile(ignoreFile, JSON.stringify({ ignoredCommits: [] }, null, 2));
    }

    // 不再处理备注文件，交由remark.js模块处理
  } catch (error) {
    console.error('初始化数据文件失败:', error);
  }
}

async function loadIgnoredCommits() {
  try {
    await ensureDataFiles();
    const ignoreFile = path.join(__dirname, '..', 'data', 'commit-ignore.json');
    const data = await fs.readFile(ignoreFile, 'utf8');
    return JSON.parse(data).ignoredCommits || [];
  } catch (error) {
    console.warn('警告: 无法读取忽略配置文件');
    return [];
  }
}

async function saveIgnoredCommits(commits) {
  try {
    await ensureDataFiles();
    const ignorePath = path.join(__dirname, '..', 'data', 'commit-ignore.json');
    await fs.writeFile(ignorePath, JSON.stringify({ ignoredCommits: commits }, null, 2));
  } catch (error) {
    console.error('保存忽略提交失败:', error);
    throw error;
  }
}

function generateOptimizedCommands(commits) {
  if (commits.length === 0) return '';
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
  generateOptimizedCommands
};
