/**
 * 备注管理模块 - 处理提交备注的保存和加载
 */
const fs = require('fs').promises;
const path = require('path');

// 备注文件的绝对路径
const REMARKS_FILE = path.resolve(__dirname, '..', 'data', 'commit-remarks.json');

/**
 * 确保备注数据文件存在
 */
async function ensureRemarkFile() {
  // 确保data目录存在
  const dataDir = path.dirname(REMARKS_FILE);
  try {
    await fs.mkdir(dataDir, { recursive: true });
    console.log(`确保数据目录存在: ${dataDir}`);
  } catch (error) {
    if (error.code !== 'EEXIST') {
      console.error('创建数据目录失败:', error);
      throw new Error(`无法创建数据目录: ${error.message}`);
    }
  }

  // 检查备注文件是否存在，不存在则创建
  try {
    await fs.access(REMARKS_FILE);
    console.log(`备注文件已存在: ${REMARKS_FILE}`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`备注文件不存在，创建新文件: ${REMARKS_FILE}`);
      try {
        // 初始化为空数组，与忽略功能保持一致
        await fs.writeFile(REMARKS_FILE, JSON.stringify({ commitRemarks: [] }, null, 2));
        console.log('备注文件创建成功');
      } catch (writeError) {
        console.error('创建备注文件失败:', writeError);
        throw new Error(`创建备注文件失败: ${writeError.message}`);
      }
    } else {
      console.error('检查备注文件失败:', error);
      throw new Error(`无法访问备注文件: ${error.message}`);
    }
  }
}

/**
 * 加载备注数据
 * @returns {Promise<Array>} 备注数据数组
 */
async function loadRemarks() {
  try {
    // 确保文件存在
    await ensureRemarkFile();

    // 读取文件内容
    const fileContent = await fs.readFile(REMARKS_FILE, 'utf8');
    console.log(`已读取备注文件: ${REMARKS_FILE}`);

    // 解析JSON内容
    try {
      const data = JSON.parse(fileContent);
      const remarks = Array.isArray(data.commitRemarks) ? data.commitRemarks : [];
      // console.log('备注数据解析成功:', remarks.length, '条备注');
      return remarks;
    } catch (parseError) {
      console.error('备注文件内容解析失败:', parseError);
      // 如果文件内容损坏，创建一个新的空备注数组
      await fs.writeFile(REMARKS_FILE, JSON.stringify({ commitRemarks: [] }, null, 2));
      return [];
    }
  } catch (error) {
    console.error('加载备注数据失败:', error);
    return [];
  }
}

/**
 * 保存备注数据
 * @param {Array} remarks 备注数据数组
 * @returns {Promise<boolean>} 保存是否成功
 */
async function saveRemarks(remarks) {
  try {
    // 确保remarks是数组
    const normalizedRemarks = Array.isArray(remarks) ? remarks : [];

    if (!Array.isArray(remarks)) {
      console.warn('传入的备注不是数组, 已转换为空数组');
    }

    // 确保文件存在
    await ensureRemarkFile();

    // 写入备注数据
    const data = { commitRemarks: normalizedRemarks };
    try {
      await fs.writeFile(REMARKS_FILE, JSON.stringify(data, null, 2), { flag: 'w' });
      console.log(`备注数据已保存到: ${REMARKS_FILE}`);
      console.log('保存的备注条数:', normalizedRemarks.length);

      // 验证文件写入成功
      try {
        const fileContent = await fs.readFile(REMARKS_FILE, 'utf8');
        const parsedData = JSON.parse(fileContent);
        const savedRemarks = Array.isArray(parsedData.commitRemarks) ? parsedData.commitRemarks : [];
        console.log('备注文件验证成功:', savedRemarks.length, '条备注');
      } catch (verifyError) {
        console.error('验证备注文件失败，但写入可能已成功:', verifyError);
      }

      return true;
    } catch (writeError) {
      console.error('写入备注文件失败:', writeError);
      throw new Error(`写入备注文件失败: ${writeError.message}`);
    }
  } catch (error) {
    console.error('保存备注数据失败:', error);
    throw new Error(`保存备注失败: ${error.message}`);
  }
}

module.exports = {
  loadRemarks,
  saveRemarks
};
