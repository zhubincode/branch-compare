/**
 * Render Module 渲染模块
 * 负责UI的渲染和更新
 */

/**
 * 渲染提交列表
 * @param {boolean} shouldRestoreState - 是否恢复筛选状态（默认不恢复）
 * @param {string} changedHash - 改变状态的提交哈希（用于动画）
 * @param {boolean} isInitialLoad - 是否首次加载（用于动画）
 */
function renderCommits(
  shouldRestoreState = false,
  changedHash = null,
  isInitialLoad = false
) {
  console.log(
    "渲染提交列表, shouldRestoreState:",
    shouldRestoreState,
    "changedHash:",
    changedHash,
    "isInitialLoad:",
    isInitialLoad
  );

  const timeline = document.getElementById("timeline");
  const currentLayout = document.body.getAttribute("data-layout") || "flat";

  // 按时间排序（从新到旧）
  const sortedCommits = [...appState.commits].sort(
    (a, b) => new Date(b.date || b.dateIso) - new Date(a.date || a.dateIso)
  );

  // 如果有changedHash，只更新那个特定的卡片
  if (changedHash) {
    const existingRow = timeline
      .querySelector(`[data-hash="${changedHash}"]`)
      ?.closest(".commit-row");
    if (existingRow) {
      const commit = sortedCommits.find((c) => c.hash === changedHash);
      if (commit) {
        const newRow = renderCommitCard(commit, currentLayout);
        newRow.classList.add("state-changed");
        existingRow.replaceWith(newRow);

        // 移除动画类，以便下次可以再次触发
        setTimeout(() => {
          newRow.classList.remove("state-changed");
        }, 300);
      }
      updateCherryPickCommands();
      console.log("已更新单个提交卡片");
      return;
    }
  }

  // 完全重新渲染（首次加载或无法找到特定卡片）
  timeline.innerHTML = "";
  sortedCommits.forEach((commit) => {
    const commitRow = renderCommitCard(commit, currentLayout);
    // 只在首次加载时添加动画类
    if (isInitialLoad) {
      commitRow.classList.add("initial-load");
    }
    timeline.appendChild(commitRow);
  });

  updateCherryPickCommands();

  console.log("提交列表渲染完成");
}

/**
 * 渲染单个提交卡片
 * @param {Object} commit - 提交对象
 * @param {string} layout - 布局模式
 * @returns {HTMLElement} 提交行元素
 */
function renderCommitCard(commit, layout) {
  const isIgnored = appState.ignoredCommits.some(
    (item) => item.hash === commit.hash
  );
  const ignoredCommit = appState.ignoredCommits.find(
    (item) => item.hash === commit.hash
  );
  const hasRemarkForCommit = hasRemark(commit.hash);
  const remarkContent = getRemarkContent(commit.hash);
  const isMatchedByMessage = commit.matchedByMessage === true;

  const commitRow = document.createElement("div");
  commitRow.className = "commit-row";

  const commitContainer = document.createElement("div");

  if (commit.status === "both") {
    commitContainer.className = "commit-container both";
  } else if (commit.status === "source") {
    commitContainer.className = "commit-container source";
  } else {
    commitContainer.className = "commit-container target";
  }

  let badgeText;
  let badgeClass = "";

  if (commit.status === "both") {
    badgeText = isMatchedByMessage ? "已同步(commit 消息匹配)" : "共同提交";
    if (isMatchedByMessage) {
      badgeClass = "message-matched";
    }
  } else if (commit.status === "source") {
    badgeText = appState.sourceBranch;
  } else {
    badgeText = appState.targetBranch;
  }

  let commitClasses = `commit${isIgnored ? " ignored" : ""}`;
  if (isMatchedByMessage) {
    commitClasses += " matched-by-message";
  }

  let hashContent = "";
  const vscodeIconSvg = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M21.29 4.1L17.47.28a1 1 0 0 0-.71-.28h-.09a1 1 0 0 0-.67.3l-10.48 9.5-4.23-3.2a.67.67 0 0 0-.89.01l-.8.72a.67.67 0 0 0 0 .99l3.45 3.12L.6 14.56a.67.67 0 0 0 0 .99l.8.72a.67.67 0 0 0 .89.01l4.23-3.2 10.48 9.5a1 1 0 0 0 .67.3h.09a1 1 0 0 0 .71-.28l3.82-3.82a1 1 0 0 0 .3-.71V4.81a1 1 0 0 0-.3-.71zM17 18.5l-9-6.75L17 5v13.5z"/></svg>`;

  function getHashWithButtons(hash) {
    const shortHash = hash.substring(0, 7);
    return `
      <span class="commit-hash" title="${hash}">${shortHash}</span>
      <button class="vscode-button" title="在VS Code中查看">
        ${vscodeIconSvg}
      </button>
      <button class="view-changes-btn">
        查看变更
      </button>
    `;
  }

  if (isMatchedByMessage && commit.targetHash) {
    const cherryPickTimeHtml = commit.cherryPickTime
      ? `
      <div class="cherry-pick-time">
        <span class="cherry-pick-label">🍒 Cherry-pick 时间:</span>
        <span class="cherry-pick-timestamp">${formatDate(
          commit.cherryPickTime
        )}</span>
      </div>
    `
      : "";

    hashContent = `
      <div class="commit-hash-pair">
        <div class="commit-hash-branch">
          <span class="branch-label">${appState.sourceBranch}:</span>
          ${getHashWithButtons(commit.hash)}
        </div>
        <div class="commit-hash-branch">
          <span class="branch-label">${appState.targetBranch}:</span>
          ${getHashWithButtons(commit.targetHash)}
        </div>
        ${cherryPickTimeHtml}
        <button class="compare-in-vscode">
          ${vscodeIconSvg} 在VS Code中比较两个提交
        </button>
      </div>
    `;
  } else {
    hashContent = getHashWithButtons(commit.hash);
  }

  const branchIndicator =
    layout === "flat"
      ? `<div class="branch-indicator ${badgeClass}"></div>`
      : "";

  commitContainer.innerHTML = `
    <div class="${commitClasses}" data-hash="${commit.hash}" data-status="${
      commit.status
    }">
      ${branchIndicator}
      <span class="commit-badge ${badgeClass}">${badgeText}</span>
      <div class="commit-time">${commit.formattedDate}</div>
      <div class="commit-info">
        <div class="commit-message">${escapeHtml(commit.message)}</div>
        ${
          commit.body && commit.body.trim()
            ? `<div class="commit-body">${escapeHtml(commit.body)}</div>`
            : ""
        }
        <div class="commit-details">
          <span class="commit-author">作者: ${escapeHtml(
            commit.authorName
          )}</span>
          ${hashContent}
          <button class="ignore-button">
            ${isIgnored ? "取消忽略" : "忽略"}
          </button>
          <button class="remark-button">
            ${hasRemarkForCommit ? "编辑备注" : "添加备注"}
          </button>
        </div>
        ${
          isIgnored && ignoredCommit
            ? `
          <div class="ignore-reason">
            <span class="ignore-reason-title">🚫 忽略原因</span>
            <span class="ignore-reason-content">${escapeHtml(
              ignoredCommit.reason
            )}</span>
          </div>`
            : ""
        }
        ${
          remarkContent
            ? `
          <div class="commit-remark">
            <span class="commit-remark-title">📝 备注</span>
            <span class="commit-remark-content">${escapeHtml(
              remarkContent
            )}</span>
          </div>`
            : ""
        }
      </div>
    </div>
  `;

  commitRow.appendChild(commitContainer);
  return commitRow;
}

/**
 * 更新cherry-pick命令
 */
function updateCherryPickCommands() {
  const sourceOnlyCommits = appState.commits.filter(
    (commit) =>
      commit.status === "source" &&
      !appState.ignoredCommits.some((item) => item.hash === commit.hash)
  );

  const targetOnlyCommits = appState.commits.filter(
    (commit) =>
      commit.status === "target" &&
      !appState.ignoredCommits.some((item) => item.hash === commit.hash)
  );

  updateDirectionalCommands(
    sourceOnlyCommits,
    appState.sourceBranch,
    appState.targetBranch,
    "source-to-target"
  );
  updateDirectionalCommands(
    targetOnlyCommits,
    appState.targetBranch,
    appState.sourceBranch,
    "target-to-source"
  );
}

/**
 * 生成特定方向的cherry-pick命令
 * @param {Array} directionCommits - 提交列表
 * @param {string} fromBranch - 源分支
 * @param {string} toBranch - 目标分支
 * @param {string} direction - 方向标识
 */
function updateDirectionalCommands(
  directionCommits,
  fromBranch,
  toBranch,
  direction
) {
  directionCommits.sort((a, b) => new Date(b.date) - new Date(a.date));

  let commandsArray = [];
  commandsArray.push(`# 切换到 ${toBranch} 分支`);
  commandsArray.push(`git checkout ${toBranch}`);
  commandsArray.push("");
  commandsArray.push(`# Cherry-pick 从 ${fromBranch} 分支的提交`);

  directionCommits.forEach((commit) => {
    commandsArray.push(`git cherry-pick ${commit.hash}  # ${commit.message}`);
  });

  const commands = commandsArray.join("\n");

  const commandsContainer = document.getElementById(
    `${direction}-commands-container`
  );
  commandsContainer.innerHTML = "";

  commandsArray.forEach((cmd) => {
    // 跳过空行，不渲染
    if (!cmd || cmd.trim() === "") {
      return;
    }

    const cmdLine = document.createElement("div");
    cmdLine.className = "command-line";

    const cmdText = document.createElement("pre");
    cmdText.innerHTML = highlightGitCommand(cmd);
    cmdLine.appendChild(cmdText);

    if (cmd && !cmd.startsWith("#")) {
      const copyBtn = document.createElement("button");
      copyBtn.className = "copy-line-button";
      copyBtn.textContent = "复制";
      copyBtn.onclick = function () {
        copyToClipboard(cmd, this);
      };
      cmdLine.appendChild(copyBtn);
    }

    commandsContainer.appendChild(cmdLine);
  });

  document.getElementById(`${direction}-commands`).textContent = commands;
}

/**
 * Git 命令语法高亮
 * @param {string} command - Git 命令字符串
 * @returns {string} 高亮后的 HTML
 */
function highlightGitCommand(command) {
  // 如果是注释行
  if (command.startsWith("#")) {
    return `<span class="git-comment">${escapeHtml(command)}</span>`;
  }

  // 分离命令和注释
  const commentIndex = command.indexOf("#");
  let cmdPart = command;
  let commentPart = "";

  if (commentIndex !== -1) {
    cmdPart = command.substring(0, commentIndex);
    commentPart = command.substring(commentIndex);
  }

  // 转义 HTML 特殊字符
  cmdPart = escapeHtml(cmdPart);

  // 高亮 git 关键字
  cmdPart = cmdPart.replace(
    /\b(git)\b/g,
    '<span class="git-keyword">$1</span>'
  );

  // 高亮子命令 (checkout, cherry-pick, etc.)
  cmdPart = cmdPart.replace(
    /\b(checkout|cherry-pick|commit|push|pull|merge|rebase|branch|status|log|diff|add|reset|stash)\b/g,
    '<span class="git-subcommand">$1</span>'
  );

  // 高亮哈希值 (7位或更长的十六进制字符串)
  cmdPart = cmdPart.replace(
    /\b([0-9a-f]{7,40})\b/g,
    '<span class="git-hash">$1</span>'
  );

  // 添加注释部分
  if (commentPart) {
    cmdPart += `  <span class="git-comment">${escapeHtml(commentPart)}</span>`;
  }

  return cmdPart;
}

/**
 * 更新备注UI
 * @param {string} hash - 提交哈希
 */
function updateRemarkUI(hash) {
  const remarkElement = document.querySelector(
    `.remark-content[data-hash="${hash}"]`
  );
  if (!remarkElement) return;

  const remark = getCommitRemark(hash);

  if (remark && remark.content) {
    remarkElement.value = remark.content;
    remarkElement.classList.add("has-content");
  } else {
    remarkElement.value = "";
    remarkElement.classList.remove("has-content");
  }
}

/**
 * 更新所有备注UI
 */
function updateAllRemarkUI() {
  document.querySelectorAll(".commit").forEach((commitEl) => {
    const hash = commitEl.getAttribute("data-hash");
    if (hash) {
      updateRemarkUI(hash);
    }
  });
}

/**
 * 获取备注内容
 * @param {string} hash - 提交哈希
 * @returns {string} 备注内容
 */
function getRemarkContent(hash) {
  const remark = appState.commitRemarks.find((r) => r.hash === hash);
  return remark ? remark.content : "";
}

/**
 * 判断是否有备注
 * @param {string} hash - 提交哈希
 * @returns {boolean} 是否有备注
 */
function hasRemark(hash) {
  return appState.commitRemarks.some((r) => r.hash === hash);
}

/**
 * 获取提交的备注对象
 * @param {string} hash - 提交哈希
 * @returns {Object|undefined} 备注对象
 */
function getCommitRemark(hash) {
  return appState.commitRemarks.find((r) => r.hash === hash);
}
