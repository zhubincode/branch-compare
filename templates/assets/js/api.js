/**
 * API Communication Module API通信模块
 * 处理所有与后端的数据交互
 */

// API_BASE 由HTML模板的数据注入脚本定义

/**
 * 加载已忽略的提交列表
 * @returns {Promise<Array>} 忽略的提交数组
 */
async function loadIgnoredCommits() {
  try {
    const response = await fetch(`${API_BASE}/ignored-commits`, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store",
        Pragma: "no-cache",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data.ignoredCommits) ? data.ignoredCommits : [];
  } catch (error) {
    console.error("加载忽略的提交失败:", error);
    return [];
  }
}

/**
 * 保存已忽略的提交列表
 * @param {Array} commits - 忽略的提交数组
 * @returns {Promise<boolean>} 是否保存成功
 */
async function saveIgnoredCommits(commits) {
  try {
    const response = await fetch(`${API_BASE}/ignore-commit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ignoredCommits: commits }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error("保存忽略的提交失败:", error);
    throw error;
  }
}

/**
 * 加载提交备注
 * @returns {Promise<Array>} 备注数组
 */
async function loadCommitRemarks() {
  try {
    const response = await fetch(`${API_BASE}/commit-remarks`, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store",
        Pragma: "no-cache",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // 处理数据格式转换（向后兼容）
    if (data.commitRemarks) {
      if (Array.isArray(data.commitRemarks)) {
        return data.commitRemarks;
      } else if (typeof data.commitRemarks === "object") {
        // 转换旧格式（对象）为新格式（数组）
        const remarksArray = [];
        for (const hash in data.commitRemarks) {
          remarksArray.push({
            hash: hash,
            content: data.commitRemarks[hash],
            timestamp: new Date().toISOString(),
          });
        }
        console.log("已将对象格式备注转换为数组格式");
        return remarksArray;
      }
    }

    return [];
  } catch (error) {
    console.error("加载提交备注失败:", error);
    return [];
  }
}

/**
 * 保存提交备注
 * @param {Array} remarks - 备注数组
 * @returns {Promise<Object>} 保存结果
 */
async function saveCommitRemarks(remarks) {
  try {
    // 验证数据格式
    if (!Array.isArray(remarks)) {
      console.error("备注数据必须是数组格式");
      remarks = [];
    }

    // 过滤无效数据
    const validRemarks = remarks.filter(
      (remark) =>
        remark &&
        remark.hash &&
        typeof remark.hash === "string" &&
        remark.hash.trim().length > 0
    );

    if (validRemarks.length !== remarks.length) {
      console.warn(`过滤了 ${remarks.length - validRemarks.length} 条无效备注`);
    }

    const response = await fetch(`${API_BASE}/commit-remarks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ commitRemarks: validRemarks }),
      cache: "no-cache",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`服务器返回错误: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log("备注保存成功:", data);
    return data;
  } catch (error) {
    console.error("保存备注失败:", error);
    throw error;
  }
}

/**
 * 获取Git提交的diff内容
 * @param {string} commitHash - 提交哈希值
 * @returns {Promise<Object>} diff数据
 */
async function fetchGitDiff(commitHash) {
  try {
    const response = await fetch(
      `${API_BASE}/git/show?hash=${encodeURIComponent(commitHash)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `服务器返回错误: ${response.status} ${response.statusText}`
      );
    }

    const responseObj = await response.json();

    if (!responseObj.success) {
      throw new Error(responseObj.message || "服务器返回错误");
    }

    return responseObj.data;
  } catch (error) {
    console.error("获取Git diff失败:", error);
    throw error;
  }
}

/**
 * 通用的fetch重试包装器
 * @param {Function} fetchFunc - fetch函数
 * @param {number} retries - 重试次数
 * @returns {Promise} fetch结果
 */
async function fetchWithRetry(fetchFunc, retries = 1) {
  try {
    return await fetchFunc();
  } catch (error) {
    if (retries > 0) {
      console.log(`请求失败，${retries}次重试后重新尝试...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return fetchWithRetry(fetchFunc, retries - 1);
    }
    throw error;
  }
}
