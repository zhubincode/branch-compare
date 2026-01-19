/**
 * Utility Functions 工具函数
 * 通用的辅助函数
 */

/**
 * 复制命令块
 * @param {string} direction - 方向标识 ('source-to-target' 或 'target-to-source')
 */
function copyCommandBlock(direction) {
  const commandsElement = document.getElementById(`${direction}-commands`);
  if (commandsElement) {
    const text = commandsElement.textContent;
    const button = document.querySelector(`.copy-${direction}-button`);
    copyToClipboard(text, button);
  }
}

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 * @param {HTMLElement} element - 触发复制的元素（用于显示提示）
 */
function copyToClipboard(text, element) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      // 创建Neumorphism风格的toast提示
      const toast = document.createElement("div");
      toast.className = "copy-toast";
      toast.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="flex-shrink: 0;">
          <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/>
          <path d="M6 10L9 13L14 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>已复制到剪贴板</span>
      `;

      // 设置样式
      toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: var(--color-bg);
        color: var(--color-success);
        padding: var(--spacing-4) var(--spacing-5);
        border-radius: var(--radius-base);
        box-shadow: 
          8px 8px 16px rgba(163, 177, 198, 0.5),
          -8px -8px 16px rgba(255, 255, 255, 0.8),
          inset 0 0 0 1px rgba(255, 255, 255, 0.5);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
        font-family: var(--font-body);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: var(--spacing-3);
        opacity: 0;
        transform: translateY(20px) scale(0.9);
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        pointer-events: none;
      `;

      document.body.appendChild(toast);

      // 触发动画
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          toast.style.opacity = "1";
          toast.style.transform = "translateY(0) scale(1)";
        });
      });

      // 2秒后淡出并移除
      setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-20px) scale(0.9)";
        setTimeout(() => {
          if (toast.parentNode) {
            document.body.removeChild(toast);
          }
        }, 300);
      }, 2000);
    })
    .catch((err) => {
      console.error("复制失败:", err);

      // 显示错误提示
      const errorToast = document.createElement("div");
      errorToast.className = "copy-toast error";
      errorToast.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="flex-shrink: 0;">
          <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/>
          <path d="M10 6V11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <circle cx="10" cy="14" r="1" fill="currentColor"/>
        </svg>
        <span>复制失败</span>
      `;

      errorToast.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: var(--color-bg);
        color: var(--color-danger);
        padding: var(--spacing-4) var(--spacing-5);
        border-radius: var(--radius-base);
        box-shadow: 
          8px 8px 16px rgba(163, 177, 198, 0.5),
          -8px -8px 16px rgba(255, 255, 255, 0.8),
          inset 0 0 0 1px rgba(255, 255, 255, 0.5);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
        font-family: var(--font-body);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: var(--spacing-3);
        opacity: 0;
        transform: translateY(20px) scale(0.9);
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        pointer-events: none;
      `;

      document.body.appendChild(errorToast);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          errorToast.style.opacity = "1";
          errorToast.style.transform = "translateY(0) scale(1)";
        });
      });

      setTimeout(() => {
        errorToast.style.opacity = "0";
        errorToast.style.transform = "translateY(-20px) scale(0.9)";
        setTimeout(() => {
          if (errorToast.parentNode) {
            document.body.removeChild(errorToast);
          }
        }, 300);
      }, 2000);
    });
}

/**
 * HTML转义，防止XSS攻击
 * @param {string} str - 要转义的字符串
 * @returns {string} 转义后的字符串
 */
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * 格式化日期
 * @param {string|Date} date - 日期对象或字符串
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 从diff --git行提取文件路径
 * @param {string} diffGitLine - diff --git行
 * @returns {string} 文件路径
 */
function extractFilePath(diffGitLine) {
  try {
    const parts = diffGitLine.split(" ");
    if (parts.length >= 4) {
      let path = parts[3];
      if (path.startsWith("b/")) {
        path = path.substring(2);
      }
      return path;
    }
  } catch (e) {
    console.error("提取文件路径失败:", e);
  }
  return "unknown-file";
}

/**
 * 将Git差异文本解析为文件块
 * @param {string} diffText - Git diff文本
 * @returns {Array} 文件块数组
 */
function parseDiffToFileBlocks(diffText) {
  const lines = diffText.split("\n");
  const fileBlocks = [];
  let currentFile = null;
  let inFileHeader = false;
  let currentHunk = null;
  let currentHunkContent = [];

  lines.forEach((line) => {
    if (line.startsWith("diff --git ")) {
      if (currentFile) {
        if (currentHunk) {
          currentFile.hunks.push({
            header: currentHunk,
            content: currentHunkContent,
          });
        }
        fileBlocks.push(currentFile);
      }

      currentFile = {
        header: line,
        path: extractFilePath(line),
        hunks: [],
      };
      inFileHeader = true;
      currentHunk = null;
      currentHunkContent = [];
    } else if (
      inFileHeader &&
      (line.startsWith("--- ") || line.startsWith("+++ "))
    ) {
      if (currentFile) {
        currentFile.header += "\n" + line;
      }
    } else if (line.startsWith("@@ ")) {
      inFileHeader = false;
      if (currentHunk && currentFile) {
        currentFile.hunks.push({
          header: currentHunk,
          content: currentHunkContent,
        });
      }
      currentHunk = line;
      currentHunkContent = [];
    } else if (currentFile) {
      if (inFileHeader) {
        currentFile.header += "\n" + line;
      } else if (currentHunk) {
        currentHunkContent.push(line);
      }
    }
  });

  if (currentFile && currentHunk) {
    currentFile.hunks.push({
      header: currentHunk,
      content: currentHunkContent,
    });
    fileBlocks.push(currentFile);
  }

  return fileBlocks;
}

/**
 * 创建GitHub风格的差异HTML
 * @param {Object} fileBlock - 文件块对象
 * @returns {string} HTML字符串
 */
function createGitHubStyleDiffHTML(fileBlock) {
  const filePath = fileBlock.path;

  let html = `
    <div style="margin-bottom: 16px;">
      <div style="background-color: #f6f8fa; border: 1px solid #e1e4e8; border-bottom: none; border-top-left-radius: 6px; border-top-right-radius: 6px; padding: 8px 16px; font-weight: 600;">
        ${escapeHtml(filePath)}
      </div>
  `;

  fileBlock.hunks.forEach((hunk, index) => {
    const isLast = index === fileBlock.hunks.length - 1;
    html += `
      <div style="background-color: #f8fafd; color: #586069; padding: 4px 10px; border: 1px solid #e1e4e8; border-bottom: none; font-size: 12px;">
        ${escapeHtml(hunk.header)}
      </div>
      <div style="border: 1px solid #e1e4e8; border-bottom-left-radius: ${
        isLast ? "6px" : "0"
      }; border-bottom-right-radius: ${
      isLast ? "6px" : "0"
    }; overflow: hidden;">
        <table style="border-collapse: collapse; width: 100%; tab-size: 4;">
          <tbody>
    `;

    hunk.content.forEach((line) => {
      let lineClass = "";
      let lineStyle = "";
      let prefix = "";

      if (line.startsWith("+")) {
        lineClass = "addition";
        lineStyle = "background-color: #e6ffed;";
        prefix = "+";
      } else if (line.startsWith("-")) {
        lineClass = "deletion";
        lineStyle = "background-color: #ffeef0;";
        prefix = "-";
      } else {
        lineClass = "context";
        lineStyle = "";
        prefix = " ";
      }

      const lineContent = line.substring(1);

      html += `
        <tr class="${lineClass}" style="${lineStyle}">
          <td style="width: 1%; padding: 0 10px; text-align: right; color: #bbb; border-right: 1px solid #e1e4e8; user-select: none;">${prefix}</td>
          <td style="padding: 0 10px; white-space: pre-wrap; word-break: break-all;">${escapeHtml(
            lineContent
          )}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;
  });

  html += `</div>`;
  return html;
}

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 时间限制（毫秒）
 * @returns {Function} 节流后的函数
 */
function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
