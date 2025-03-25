const fs = require('fs').promises;
const path = require('path');
const { loadIgnoredCommits } = require('./ignore');
const { generateOptimizedCommands } = require('./ignore');

function formatDate(date) {
  return new Date(date).toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function generateMarkdown(comparison) {
  let markdown = '# 分支提交差异对比\n\n';
  markdown += `生成时间: ${formatDate(new Date())}\n\n`;

  const { sourceBranch, targetBranch, author, timeRange, commits } = comparison;

  markdown += `## ${sourceBranch} vs ${targetBranch}\n\n`;
  if (author !== '全部') markdown += `提交者: ${author}\n`;
  if (timeRange !== '全部时间') markdown += `时间范围: ${timeRange}\n`;
  markdown += '\n';

  markdown += '| 提交信息 | 提交时间 | 作者 | 状态 | 提交哈希 |\n';
  markdown += '|----------|----------|------|------|----------|\n';

  // 按时间排序所有提交
  commits.sort((a, b) => new Date(b.date) - new Date(a.date));

  // 加载已忽略的提交
  const ignoredCommits = await loadIgnoredCommits();

  commits.forEach(commit => {
    if (!ignoredCommits.some(item => item.hash === commit.hash)) {
      const indicator = commit.status === 'both' ? '🔴🔵' : commit.status === 'source' ? '🔴' : '🔵';
      markdown += `| ${commit.message} | ${formatDate(commit.date)} | ${commit.authorName} | ${indicator} | ${commit.hash} |\n`;
    }
  });

  // 添加 Cherry-pick 指令块
  const sourceOnlyCommits = commits.filter(c => c.status === 'source' && !ignoredCommits.some(item => item.hash === c.hash));

  if (sourceOnlyCommits.length > 0) {
    markdown += '\n### Cherry-pick 指令\n\n';
    markdown += '```bash\n';
    markdown += `# 切换到 ${targetBranch} 分支\n`;
    markdown += `git checkout ${targetBranch}\n\n`;

    // 基础命令
    markdown += '# 基础命令（逐个提交）\n';
    sourceOnlyCommits.forEach(commit => {
      markdown += `git cherry-pick ${commit.hash}  # ${commit.message}\n`;
    });
    markdown += '\n';

    // 优化命令
    markdown += '# 优化命令（一次性合并）\n';
    markdown += generateOptimizedCommands(sourceOnlyCommits);
    markdown += '\n';
    markdown += '```\n';
  }

  return markdown;
}

async function generateTimelineHTML(commits, sourceBranch, targetBranch, author, timeRange, commitRemarks = []) {
  try {
    // 读取模板文件
    const template = await fs.readFile(path.join(__dirname, '..', 'templates', 'timeline.html'), 'utf8');

    // 读取已忽略的提交
    const ignoredCommits = await loadIgnoredCommits();

    // 格式化日期
    const formattedCommits = commits.map(commit => ({
      ...commit,
      formattedDate: formatDate(commit.date)
    }));

    // 确保备注是数组格式
    const remarksArray = Array.isArray(commitRemarks) ? commitRemarks : [];

    // 添加时间戳防止缓存
    const timestamp = new Date().getTime();

    console.log(`生成HTML报告 - 源分支: ${sourceBranch}, 目标分支: ${targetBranch}`);
    console.log(`提交数量: ${commits.length}, 备注数量: ${remarksArray.length}`);

    if (commits.length === 0) {
      console.warn('警告: 没有找到任何提交记录!');
    } else {
      console.log('提交记录示例:');
      const sampleCommits = commits.slice(0, Math.min(3, commits.length));
      sampleCommits.forEach(commit => {
        console.log(`- Hash: ${commit.hash}, 作者: ${commit.authorName}, 信息: ${commit.message}`);
      });
    }

    // 替换模板中的变量
    const html = template
      .replace(/\{\{title\}\}/g, `分支对比: ${sourceBranch} vs ${targetBranch} (${timestamp})`)
      .replace(/\{\{generatedTime\}\}/g, formatDate(new Date()))
      .replace(/\{\{sourceBranch\}\}/g, JSON.stringify(sourceBranch))
      .replace(/\{\{targetBranch\}\}/g, JSON.stringify(targetBranch))
      .replace(/\{\{commits\}\}/g, JSON.stringify(formattedCommits))
      .replace(/\{\{ignoredCommits\}\}/g, JSON.stringify(ignoredCommits))
      .replace(/\{\{commitRemarks\}\}/g, JSON.stringify(remarksArray))
      .replace(/\{\{author\}\}/g, JSON.stringify(author))
      .replace(/\{\{timeRange\}\}/g, JSON.stringify(timeRange));

    return html;
  } catch (error) {
    console.error('生成 HTML 报告失败:', error);
    throw error;
  }
}

module.exports = {
  generateMarkdown,
  generateTimelineHTML
};
