const { execSync } = require('child_process');

function getAllBranches() {
  try {
    const branches = execSync('git branch', { encoding: 'utf-8' })
      .split('\n')
      .map(branch => branch.trim().replace('* ', ''))
      .filter(Boolean);
    return branches;
  } catch (error) {
    console.error('获取分支列表失败:', error.message);
    return [];
  }
}

function getAllAuthors() {
  try {
    const authors = execSync('git log --format="%an" | sort -u', { encoding: 'utf-8' }).split('\n').filter(Boolean);
    return authors;
  } catch (error) {
    console.error('获取作者列表失败:', error.message);
    return [];
  }
}

function getDateRange(timeRange) {
  const now = new Date();
  switch (timeRange) {
    case '最近一周':
      return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    case '最近一月':
      return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    case '最近三月':
      return new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    default:
      return '';
  }
}

function getAllCommits(branchName, targetBranch, author, timeRange) {
  try {
    console.log(`[Git] 开始获取分支 ${branchName} 的提交...`);

    let baseCommand = `git log --pretty=format:"%H|%an|%s|%ai"`;

    if (author && author !== '全部') {
      baseCommand += ` --author="${author}"`;
    }

    if (timeRange && timeRange !== '全部时间') {
      const sinceDate = getDateRange(timeRange);
      if (sinceDate) {
        baseCommand += ` --since="${sinceDate}"`;
      }
    }

    // 修改命令，确保获取完整历史
    const finalCommand = `${baseCommand} ${branchName}`;
    console.log(`[Git] 执行命令: ${finalCommand}`);

    try {
      // 获取分支提交
      const output = execSync(finalCommand, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024 // 增加缓冲区大小到10MB
      });

      if (!output || output.trim() === '') {
        console.warn(`[Git] 警告: 分支 ${branchName} 没有提交记录`);
        return [];
      }

      const commits = output
        .split('\n')
        .filter(Boolean)
        .map(commit => {
          const parts = commit.split('|');
          if (parts.length < 4) {
            console.warn(`[Git] 警告: 提交记录格式异常 "${commit}"`);
            return null;
          }
          const [hash, authorName, message, date] = parts;
          return { hash, authorName, message, date };
        })
        .filter(commit => commit !== null);

      console.log(`[Git] 成功获取到 ${commits.length} 条提交记录`);
      return commits;
    } catch (cmdError) {
      console.error(`[Git] 执行Git命令失败: ${cmdError.message}`);

      // 尝试检查是否是分支不存在的问题
      try {
        execSync(`git show-ref --verify --quiet refs/heads/${branchName}`);
      } catch (branchError) {
        console.error(`[Git] 分支 ${branchName} 可能不存在，请检查分支名称`);
      }

      return [];
    }
  } catch (error) {
    console.error(`[Git] 获取提交记录失败: ${error.message}`);
    return [];
  }
}

module.exports = {
  getAllBranches,
  getAllAuthors,
  getAllCommits,
  getDateRange
};
