/**
 * Modal Module 模态框模块
 * 处理所有模态框相关的功能
 */

// IGNORE_REASONS 由HTML模板的数据注入脚本定义

let currentIgnoreHash = null;
let currentIgnoreElement = null;
let currentCommitHash = null;
let currentCommitElement = null;

/**
 * 显示忽略原因模态框
 * @param {string} hash - 提交哈希
 * @param {HTMLElement} element - 触发元素
 */
function showIgnoreModal(hash, element) {
  currentIgnoreHash = hash;
  currentIgnoreElement = element;

  const reasonListElement = document.getElementById("reasonList");
  reasonListElement.innerHTML = "";

  IGNORE_REASONS.forEach((reason, index) => {
    const optionElement = document.createElement("div");
    optionElement.className = "reason-option";

    const radioInput = document.createElement("input");
    radioInput.type = "radio";
    radioInput.id = `reason-${index}`;
    radioInput.name = "ignoreReason";
    radioInput.value = reason;
    if (index === 0) {
      radioInput.checked = true;
      optionElement.classList.add("selected");
    }

    const label = document.createElement("label");
    label.htmlFor = `reason-${index}`;
    label.textContent = reason;

    optionElement.appendChild(radioInput);
    optionElement.appendChild(label);

    optionElement.addEventListener("click", function (e) {
      if (e.target !== radioInput) {
        radioInput.checked = true;

        if (reason === "其他原因") {
          document.getElementById("customReasonInput").classList.add("show");
        } else {
          document.getElementById("customReasonInput").classList.remove("show");
        }

        document.querySelectorAll(".reason-option").forEach((opt) => {
          opt.classList.remove("selected");
        });
        this.classList.add("selected");
      }
    });

    if (reason === "其他原因") {
      radioInput.addEventListener("change", function () {
        document.getElementById("customReasonInput").classList.add("show");
        document.querySelectorAll(".reason-option").forEach((opt) => {
          opt.classList.remove("selected");
        });
        optionElement.classList.add("selected");
      });
    } else {
      radioInput.addEventListener("change", function () {
        document.getElementById("customReasonInput").classList.remove("show");
        document.querySelectorAll(".reason-option").forEach((opt) => {
          opt.classList.remove("selected");
        });
        optionElement.classList.add("selected");
      });
    }

    reasonListElement.appendChild(optionElement);
  });

  document.getElementById("customReasonText").value = "";
  document.getElementById("customReasonInput").classList.remove("show");
  const modal = document.getElementById("ignoreModal");
  modal.style.display = "flex";
  modal.classList.add("show");
}

/**
 * 关闭忽略原因模态框
 */
function closeIgnoreModal() {
  const modal = document.getElementById("ignoreModal");
  modal.style.display = "none";
  modal.classList.remove("show");
  currentIgnoreHash = null;
  currentIgnoreElement = null;
}

/**
 * 确认忽略
 */
async function confirmIgnore() {
  const selectedReason = document.querySelector(
    'input[name="ignoreReason"]:checked'
  ).value;
  const customReason = document.getElementById("customReasonText").value.trim();
  const finalReason =
    selectedReason === "其他原因" ? customReason : selectedReason;

  if (selectedReason === "其他原因" && !customReason) {
    alert("请输入自定义的忽略原因");
    return;
  }

  showLoading();
  saveCurrentFilterState();

  try {
    const commitElement = currentIgnoreElement.closest(".commit");

    const index = appState.ignoredCommits.findIndex(
      (item) => item.hash === currentIgnoreHash
    );
    if (index === -1) {
      appState.ignoredCommits.push({
        hash: currentIgnoreHash,
        reason: finalReason,
        timestamp: new Date().toISOString(),
      });
    }

    await saveIgnoredCommits(appState.ignoredCommits);

    // 重新加载数据
    appState.ignoredCommits = await loadIgnoredCommits();

    renderCommits();
    closeIgnoreModal();
    showSuccessMessage("忽略提交成功");
  } catch (error) {
    console.error("保存忽略提交失败:", error);
    alert("保存忽略提交失败: " + error.message);
  } finally {
    hideLoading();
  }
}

/**
 * 切换忽略状态
 * @param {string} hash - 提交哈希
 * @param {HTMLElement} element - 触发元素
 */
function toggleIgnoreCommit(hash, element) {
  const index = appState.ignoredCommits.findIndex((item) => item.hash === hash);

  if (index === -1) {
    showIgnoreModal(hash, element);
  } else {
    showLoading();
    saveCurrentFilterState();

    appState.ignoredCommits.splice(index, 1);

    saveIgnoredCommits(appState.ignoredCommits)
      .then(() => {
        return loadIgnoredCommits();
      })
      .then((commits) => {
        appState.ignoredCommits = commits;
        renderCommits();
        showSuccessMessage("取消忽略成功");
      })
      .catch((error) => {
        console.error("保存忽略提交失败:", error);
        alert("保存忽略提交失败: " + error.message);
      })
      .finally(() => {
        hideLoading();
      });
  }
}

/**
 * 显示备注模态框
 * @param {string} hash - 提交哈希
 * @param {HTMLElement} element - 触发元素
 */
function showRemarkModal(hash, element) {
  currentCommitHash = hash;
  currentCommitElement = element;

  const remarkText = document.getElementById("remarkText");
  remarkText.value = getRemarkContent(hash);

  const deleteButton = document.getElementById("deleteRemarkBtn");
  if (hasRemark(hash)) {
    deleteButton.style.display = "block";
  } else {
    deleteButton.style.display = "none";
  }

  const modal = document.getElementById("remarkModal");
  modal.style.display = "flex";
  modal.classList.add("show");
}

/**
 * 关闭备注模态框
 */
function closeRemarkModal() {
  const modal = document.getElementById("remarkModal");
  modal.style.display = "none";
  modal.classList.remove("show");
  currentCommitHash = null;
  currentCommitElement = null;
}

/**
 * 确认备注
 */
async function confirmRemark() {
  const remarkText = document.getElementById("remarkText").value.trim();
  console.log("开始保存备注，哈希值:", currentCommitHash, "内容:", remarkText);

  try {
    showLoading();
    saveCurrentFilterState();

    const existingIndex = appState.commitRemarks.findIndex(
      (r) => r.hash === currentCommitHash
    );

    if (remarkText) {
      if (existingIndex >= 0) {
        appState.commitRemarks[existingIndex].content = remarkText;
        appState.commitRemarks[existingIndex].timestamp =
          new Date().toISOString();
        console.log("已更新现有备注");
      } else {
        appState.commitRemarks.push({
          hash: currentCommitHash,
          content: remarkText,
          timestamp: new Date().toISOString(),
        });
        console.log("已添加新备注");
      }
    } else if (existingIndex >= 0) {
      appState.commitRemarks.splice(existingIndex, 1);
      console.log("已删除备注");
    }

    await saveCommitRemarks(appState.commitRemarks);
    console.log("服务器保存备注完成");

    closeRemarkModal();
    renderCommits();
    showSuccessMessage("备注已保存");
  } catch (error) {
    console.error("保存备注操作失败:", error);
    alert("保存备注失败: " + error.message);
  } finally {
    hideLoading();
  }
}

/**
 * 删除备注
 */
async function deleteRemark() {
  if (!currentCommitHash) return;

  try {
    showLoading();
    saveCurrentFilterState();

    const existingIndex = appState.commitRemarks.findIndex(
      (r) => r.hash === currentCommitHash
    );

    if (existingIndex >= 0) {
      appState.commitRemarks.splice(existingIndex, 1);
      console.log("已删除备注");

      await saveCommitRemarks(appState.commitRemarks);

      closeRemarkModal();
      renderCommits();
      showSuccessMessage("备注已删除");
    }
  } catch (error) {
    console.error("删除备注失败:", error);
    alert("删除备注失败: " + error.message);
  } finally {
    hideLoading();
  }
}

/**
 * 显示加载动画
 */
function showLoading() {
  document.getElementById("loadingOverlay").classList.add("show");
}

/**
 * 隐藏加载动画
 */
function hideLoading() {
  document.getElementById("loadingOverlay").classList.remove("show");
}

/**
 * 显示成功消息
 * @param {string} message - 消息内容
 */
function showSuccessMessage(message) {
  const successToast = document.createElement("div");
  successToast.className = "success-toast";
  successToast.textContent = message;
  document.body.appendChild(successToast);

  setTimeout(() => {
    successToast.classList.add("show");
  }, 100);

  setTimeout(() => {
    successToast.classList.remove("show");
    setTimeout(() => successToast.remove(), 500);
  }, 2000);
}

/**
 * 在VS Code中查看提交
 * @param {string} commitHash - 提交哈希
 */
function openInVSCode(commitHash) {
  const modal = document.createElement("div");
  modal.style.cssText =
    "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999";

  const content = document.createElement("div");
  content.style.cssText =
    "background:var(--color-bg);padding:var(--spacing-6);border-radius:var(--radius-container);max-width:500px;width:90%;box-shadow:var(--shadow-extruded-hover)";

  const title = document.createElement("h3");
  title.textContent = "查看提交的Git命令";
  title.style.marginTop = "0";
  title.style.marginBottom = "var(--spacing-4)";

  content.appendChild(title);

  const commands = [
    { name: "查看提交详情", command: `git show ${commitHash}` },
    {
      name: "查看提交更改的文件",
      command: `git show --name-only ${commitHash}`,
    },
    {
      name: "查看提交的完整差异",
      command: `git show --color-words ${commitHash}`,
    },
  ];

  commands.forEach((cmd) => {
    const section = document.createElement("div");
    section.style.marginBottom = "var(--spacing-4)";

    const label = document.createElement("div");
    label.textContent = cmd.name;
    label.style.fontWeight = "var(--font-weight-semibold)";
    label.style.marginBottom = "var(--spacing-2)";

    const commandArea = document.createElement("div");
    commandArea.style.display = "flex";
    commandArea.style.gap = "var(--spacing-2)";

    const cmdText = document.createElement("code");
    cmdText.textContent = cmd.command;
    cmdText.style.cssText =
      "padding:var(--spacing-2);background:rgba(163,177,198,0.1);border-radius:var(--radius-small);font-family:var(--font-mono);flex:1;overflow-x:auto";

    const copyBtn = document.createElement("button");
    copyBtn.textContent = "复制";
    copyBtn.className = "btn btn-small";
    copyBtn.onclick = () => {
      copyToClipboard(cmd.command, copyBtn);
    };

    commandArea.appendChild(cmdText);
    commandArea.appendChild(copyBtn);

    section.appendChild(label);
    section.appendChild(commandArea);
    content.appendChild(section);
  });

  const closeButton = document.createElement("button");
  closeButton.textContent = "关闭";
  closeButton.className = "btn";
  closeButton.style.width = "100%";
  closeButton.style.marginTop = "var(--spacing-4)";
  closeButton.onclick = () => document.body.removeChild(modal);

  content.appendChild(closeButton);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });

  modal.appendChild(content);
  document.body.appendChild(modal);
}

/**
 * 在VS Code中比较两个提交
 * @param {string} sourceHash - 源提交哈希
 * @param {string} targetHash - 目标提交哈希
 */
function compareCommitsInVSCode(sourceHash, targetHash) {
  const modal = document.createElement("div");
  modal.style.cssText =
    "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999";

  const content = document.createElement("div");
  content.style.cssText =
    "background:var(--color-bg);padding:var(--spacing-6);border-radius:var(--radius-container);max-width:500px;width:90%;box-shadow:var(--shadow-extruded-hover)";

  const title = document.createElement("h3");
  title.textContent = "比较两个提交的Git命令";
  title.style.marginTop = "0";
  title.style.marginBottom = "var(--spacing-4)";

  content.appendChild(title);

  const commands = [
    {
      name: "显示两个提交之间的差异",
      command: `git diff ${sourceHash} ${targetHash}`,
    },
    {
      name: "查看更改的文件列表",
      command: `git diff --name-only ${sourceHash} ${targetHash}`,
    },
    {
      name: "查看汇总统计信息",
      command: `git diff --stat ${sourceHash} ${targetHash}`,
    },
  ];

  commands.forEach((cmd) => {
    const section = document.createElement("div");
    section.style.marginBottom = "var(--spacing-4)";

    const label = document.createElement("div");
    label.textContent = cmd.name;
    label.style.fontWeight = "var(--font-weight-semibold)";
    label.style.marginBottom = "var(--spacing-2)";

    const commandArea = document.createElement("div");
    commandArea.style.display = "flex";
    commandArea.style.gap = "var(--spacing-2)";

    const cmdText = document.createElement("code");
    cmdText.textContent = cmd.command;
    cmdText.style.cssText =
      "padding:var(--spacing-2);background:rgba(163,177,198,0.1);border-radius:var(--radius-small);font-family:var(--font-mono);flex:1;overflow-x:auto;white-space:nowrap";

    const copyBtn = document.createElement("button");
    copyBtn.textContent = "复制";
    copyBtn.className = "btn btn-small";
    copyBtn.onclick = () => {
      copyToClipboard(cmd.command, copyBtn);
    };

    commandArea.appendChild(cmdText);
    commandArea.appendChild(copyBtn);

    section.appendChild(label);
    section.appendChild(commandArea);
    content.appendChild(section);
  });

  const closeButton = document.createElement("button");
  closeButton.textContent = "关闭";
  closeButton.className = "btn";
  closeButton.style.width = "100%";
  closeButton.style.marginTop = "var(--spacing-4)";
  closeButton.onclick = () => document.body.removeChild(modal);

  content.appendChild(closeButton);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });

  modal.appendChild(content);
  document.body.appendChild(modal);
}

/**
 * 查看提交变更
 * @param {string} commitHash - 提交哈希
 * @param {string} commitMessage - 提交消息
 */
function viewCommitChanges(commitHash, commitMessage) {
  console.log("查看提交变更:", commitHash, commitMessage);

  const originalBodyStyle = document.body.style.cssText;
  document.body.style.overflow = "hidden";
  document.body.style.paddingRight = "15px";

  const modal = document.createElement("div");
  modal.style.cssText =
    "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999";

  const content = document.createElement("div");
  content.style.cssText =
    "background:#ffffff;padding:var(--spacing-5);border-radius:var(--radius-container);max-width:90%;width:90%;max-height:90vh;display:flex;flex-direction:column;box-shadow:var(--shadow-extruded-hover)";

  const header = document.createElement("div");
  header.style.cssText =
    "display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--spacing-3);border-bottom:1px solid rgba(163,177,198,0.2);padding-bottom:var(--spacing-3)";

  const titleArea = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = "提交详情";
  title.style.margin = "0 0 var(--spacing-2) 0";

  const subtitle = document.createElement("p");
  subtitle.innerHTML = `<code style="font-family:var(--font-mono);background:rgba(163,177,198,0.15);padding:2px var(--spacing-2);border-radius:var(--radius-small)">${commitHash}</code> - ${escapeHtml(
    commitMessage
  )}`;
  subtitle.style.margin = "0";
  subtitle.style.color = "var(--color-muted)";
  subtitle.style.fontSize = "var(--font-size-sm)";

  titleArea.appendChild(title);
  titleArea.appendChild(subtitle);

  const closeIcon = document.createElement("button");
  closeIcon.innerHTML = "✕";
  closeIcon.className = "modal-close-button";
  closeIcon.style.cssText = `
    width: 44px;
    height: 44px;
    min-width: 44px;
    min-height: 44px;
    border-radius: 50%;
    border: none;
    background: var(--color-bg);
    color: var(--color-muted);
    font-size: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-extruded-small);
    transition: all var(--transition-base);
    flex-shrink: 0;
  `;

  closeIcon.addEventListener("mouseenter", () => {
    closeIcon.style.color = "var(--color-danger)";
    closeIcon.style.transform = "scale(1.05)";
  });

  closeIcon.addEventListener("mouseleave", () => {
    closeIcon.style.color = "var(--color-muted)";
    closeIcon.style.transform = "scale(1)";
  });

  const closeModal = () => {
    document.body.removeChild(modal);
    document.body.style.cssText = originalBodyStyle;
    document.removeEventListener("keydown", handleKeyDown);
  };

  closeIcon.addEventListener("click", closeModal);

  header.appendChild(titleArea);
  header.appendChild(closeIcon);
  content.appendChild(header);

  const diffContainer = document.createElement("div");
  diffContainer.style.cssText =
    "flex:1;overflow:auto;min-height:0;max-height:calc(90vh - 100px);padding-right:var(--spacing-2)";

  const diffViewer = document.createElement("div");
  diffViewer.className = "diff-viewer";
  diffViewer.innerHTML =
    '<div style="padding:var(--spacing-5);text-align:center;color:var(--color-muted)">正在加载变更数据...</div>';

  diffContainer.appendChild(diffViewer);
  content.appendChild(diffContainer);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      closeModal();
    }
  };

  document.addEventListener("keydown", handleKeyDown);

  modal.appendChild(content);
  document.body.appendChild(modal);

  // 获取diff数据
  fetchGitDiff(commitHash)
    .then((data) => {
      console.log("获取到diff数据:", data);
      renderDiffData(data, diffViewer);
    })
    .catch((error) => {
      console.error("获取提交变更数据失败:", error);
      diffViewer.innerHTML = `
        <div style="padding:var(--spacing-5);text-align:center;color:var(--color-danger);background-color:rgba(220,53,69,0.1);border-radius:var(--radius-base)">
          <p style="margin:0 0 var(--spacing-2) 0;font-weight:var(--font-weight-semibold)">获取提交变更数据失败</p>
          <p style="margin:0;font-size:var(--font-size-sm)">${escapeHtml(
            error.message
          )}</p>
        </div>
      `;
    });
}

/**
 * 使用Diff2Html渲染差异数据
 * @param {Object} data - diff数据
 * @param {HTMLElement} diffViewer - 差异查看器元素
 */
function renderDiffData(data, diffViewer) {
  console.log("渲染差异数据:", data);
  if (!data || !data.diff || data.diff.trim() === "") {
    diffViewer.innerHTML = `
      <div style="padding:var(--spacing-5);text-align:center;color:var(--color-muted);background-color:rgba(163,177,198,0.1);border-radius:var(--radius-base)">
        此提交没有文件变更或数据格式不正确
      </div>
    `;
    return;
  }

  const diffText = data.diff;
  diffViewer.innerHTML = "";

  try {
    const ui = new Diff2HtmlUI(diffViewer, diffText, {
      drawFileList: true,
      matching: "lines",
      outputFormat: "side-by-side",
      highlight: true,
    });
    ui.draw();
    ui.highlightCode();

    // 只隐藏行号，不添加任何其他样式
    const style = document.createElement("style");
    style.textContent = `
      /* 隐藏所有行号 */
      .d2h-code-line-prefix,
      .d2h-code-linenumber,
      .d2h-code-side-linenumber,
      .d2h-line-num1,
      .d2h-line-num2,
      .line-num1,
      .line-num2 {
        display: none !important;
      }
    `;
    diffViewer.appendChild(style);
  } catch (e) {
    console.error("Diff2Html 渲染失败:", e);
    diffViewer.innerHTML = `
      <div style="padding:var(--spacing-5);text-align:center;color:var(--color-danger);background-color:rgba(220,53,69,0.1);border-radius:var(--radius-base)">
        无法渲染差异视图：${escapeHtml(e.message)}
      </div>
    `;
  }
}
