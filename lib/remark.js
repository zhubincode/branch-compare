/**
 * 备注管理模块 - 处理提交备注的保存和加载
 */
const fs = require("fs").promises;
const { getDataFilePath } = require("./config");

const REMARKS_FILE = getDataFilePath("commit-remarks.json");

/**
 * 确保备注数据文件存在并可访问
 */
async function ensureRemarkFile() {
  try {
    // 检查文件是否存在
    try {
      const stats = await fs.stat(REMARKS_FILE);
      // 文件存在，直接返回
      return;
    } catch (err) {
      // 文件不存在，创建新文件（对象格式）
      if (err.code === "ENOENT") {
        await fs.writeFile(
          REMARKS_FILE,
          JSON.stringify({ commitRemarks: [] }, null, 2),
          { mode: 0o644 }
        );
        console.log(`Created remarks file: ${REMARKS_FILE}`);
      } else {
        throw err;
      }
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
    // 读取对象格式 {commitRemarks: [...]}
    if (parsed && parsed.commitRemarks && Array.isArray(parsed.commitRemarks)) {
      return parsed.commitRemarks;
    }
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
    // 保存为对象格式 {commitRemarks: [...]}
    await fs.writeFile(
      REMARKS_FILE,
      JSON.stringify({ commitRemarks: dataToSave }, null, 2),
      { mode: 0o644 }
    );

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
