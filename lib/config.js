const os = require("os");
const path = require("path");
const fs = require("fs");

// 定义应用数据目录
const APP_NAME = "branch-compare";
const APP_DATA_DIR = path.join(os.homedir(), ".config", APP_NAME);

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
    const files = ["ignored-commits.json", "remarks.json"];
    files.forEach((file) => {
      const filePath = path.join(APP_DATA_DIR, file);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([], null, 2), {
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
