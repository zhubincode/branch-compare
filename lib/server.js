const fs = require('fs');
const path = require('path');
const cors = require('cors');
const express = require('express');

const app = express();
app.use(cors());
app.use(express.json());

const dataDir = path.join(__dirname, '..', 'data');
const ignoreFile = path.join(dataDir, 'commit-ignore.json');
const remarksFile = path.join(dataDir, 'commit-remarks.json');

// 确保数据目录存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 初始化文件
if (!fs.existsSync(ignoreFile)) {
  fs.writeFileSync(ignoreFile, JSON.stringify({ ignoredCommits: [] }));
}
if (!fs.existsSync(remarksFile)) {
  fs.writeFileSync(remarksFile, JSON.stringify({ commitRemarks: {} }));
}

// 获取忽略的提交
app.get('/ignored-commits', (req, res) => {
  try {
    const data = fs.readFileSync(ignoreFile, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('读取忽略提交失败:', error);
    res.status(500).json({ error: '读取忽略提交失败' });
  }
});

// 保存忽略的提交
app.post('/ignore-commit', (req, res) => {
  try {
    const { ignoredCommits } = req.body;
    fs.writeFileSync(ignoreFile, JSON.stringify({ ignoredCommits }, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('保存忽略提交失败:', error);
    res.status(500).json({ error: '保存忽略提交失败' });
  }
});

// 获取提交备注
app.get('/commit-remarks', (req, res) => {
  try {
    const data = fs.readFileSync(remarksFile, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('读取提交备注失败:', error);
    res.status(500).json({ error: '读取提交备注失败' });
  }
});

// 保存提交备注
app.post('/commit-remarks', (req, res) => {
  try {
    const { commitRemarks } = req.body;
    fs.writeFileSync(remarksFile, JSON.stringify({ commitRemarks }, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('保存提交备注失败:', error);
    res.status(500).json({ error: '保存提交备注失败' });
  }
});

const PORT = 3001;

module.exports = {
  startServer: () => {
    return new Promise(resolve => {
      app.listen(PORT, () => {
        console.log(`服务已启动，端口: ${PORT}`);
        resolve(PORT);
      });
    });
  }
};

// 优雅关闭
process.on('SIGINT', () => {
  console.log('正在关闭服务器...');
  process.exit();
});
