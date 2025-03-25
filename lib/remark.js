/**
 * 备注管理模块 - 处理提交备注的保存和加载
 */
const fs = require("fs").promises;
const { getDataFilePath } = require("./config");

const REMARKS_FILE = getDataFilePath("remarks.json");

/**
 * 确保备注数据文件存在并可访问
 */
async function ensureRemarkFile() {
  try {
    // 尝试读取文件
    try {
      await fs.access(
        REMARKS_FILE,
        fs.constants.F_OK | fs.constants.R_OK | fs.constants.W_OK
      );
    } catch {
      // 如果文件不存在或无法访问，创建新文件
      await fs.writeFile(REMARKS_FILE, JSON.stringify([], null, 2), {
        mode: 0o644,
      });
      console.log(`Created remarks file: ${REMARKS_FILE}`);
    }
  } catch (error) {
    console.error("Error ensuring remarks file:", error);
    throw error;
  }
}

/**
 * 加载备注数据
 * @returns {Promise<Array>} 备注数据数组
 */
async function loadRemarks() {
  try {
    await ensureRemarkFile();
    const data = await fs.readFile(REMARKS_FILE, "utf8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("加载备注失败:", error);
    return []; // 出错时返回空数组
  }
}

/**
 * 保存备注数据
 * @param {Array} remarks 备注数据数组
 * @returns {Promise<boolean>} 保存是否成功
 */
async function saveRemarks(remarks) {
  try {
    await ensureRemarkFile();
    const dataToSave = Array.isArray(remarks) ? remarks : [];
    await fs.writeFile(REMARKS_FILE, JSON.stringify(dataToSave, null, 2), {
      mode: 0o644,
    });

    // 验证写入
    try {
      const saved = await loadRemarks();
      console.log(`Successfully saved ${saved.length} remarks`);
    } catch (verifyError) {
      console.error("Warning: Could not verify saved data:", verifyError);
    }
    return true;
  } catch (error) {
    console.error("保存备注失败:", error);
    throw error;
  }
}

module.exports = {
  loadRemarks,
  saveRemarks,
};
