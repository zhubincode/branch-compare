const os = require("os");
const path = require("path");
const fs = require("fs");

// 定义应用数据目录 - 使用项目本地的data目录
const APP_DATA_DIR = path.join(process.cwd(), "data");

// 确保数据目录存在
function ensureDataDir() {
  try {
    if (!fs.existsSync(APP_DATA_DIR)) {
      fs.mkdirSync(APP_DATA_DIR, { recursive: true, mode: 0o755 });
      console.log(`Created data directory: ${APP_DATA_DIR}`);
    }

    // 确保目录有正确的权限
    fs.chmodSync(APP_DATA_DIR, 0o755);

    // 初始化必要的文件
    const files = ["commit-ignore.json", "commit-remarks.json"];
    files.forEach((file) => {
      const filePath = path.join(APP_DATA_DIR, file);
      if (!fs.existsSync(filePath)) {
        // 对于commit-ignore.json，初始化为对象格式以保持兼容性
        const initialData =
          file === "commit-ignore.json"
            ? { ignoredCommits: [] }
            : { commitRemarks: [] };
        fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2), {
          mode: 0o644,
        });
        console.log(`Initialized ${file}`);
      }
    });
  } catch (error) {
    console.error(`Error ensuring data directory: ${error.message}`);
    throw error;
  }
}

// 获取数据文件路径
function getDataFilePath(filename) {
  ensureDataDir();
  return path.join(APP_DATA_DIR, filename);
}

module.exports = {
  APP_DATA_DIR,
  getDataFilePath,
  ensureDataDir,
};
