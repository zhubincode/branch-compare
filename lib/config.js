const os = require("os");
const path = require("path");
const fs = require("fs");

// 定义应用数据目录
const APP_NAME = "branch-compare";
const APP_DATA_DIR = path.join(os.homedir(), ".config", APP_NAME);

// 确保数据目录存在
function ensureDataDir() {
  if (!fs.existsSync(APP_DATA_DIR)) {
    fs.mkdirSync(APP_DATA_DIR, { recursive: true });
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
};
