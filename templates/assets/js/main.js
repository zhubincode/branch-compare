// 主入口文件 - 初始化应用和事件绑定

/**
 * 初始化应用
 */
async function initApp() {
  console.log("初始化应用...");

  // 初始化appState中的数据（从HTML模板注入的全局变量）
  appState.commits = commits || [];
  appState.sourceBranch = sourceBranch || "";
  appState.targetBranch = targetBranch || "";
  appState.ignoredCommits = ignoredCommits || [];
  appState.commitRemarks = commitRemarks || [];

  console.log("已加载提交数据:", appState.commits.length, "条");
  console.log("已加载忽略提交:", appState.ignoredCommits.length, "条");
  console.log("已加载备注:", appState.commitRemarks.length, "条");

  // 从服务器加载最新的已忽略提交和备注数据
  try {
    const [loadedIgnored, loadedRemarks] = await Promise.all([
      loadIgnoredCommits(),
      loadCommitRemarks(),
    ]);

    appState.ignoredCommits = loadedIgnored;
    appState.commitRemarks = loadedRemarks;

    console.log("从服务器更新忽略提交:", appState.ignoredCommits.length, "条");
    console.log("从服务器更新备注:", appState.commitRemarks.length, "条");
  } catch (error) {
    console.error("加载服务器数据失败:", error);
  }

  // 渲染提交列表
  renderCommits(false);

  // 初始化布局
  initializeLayout();

  // 初始化筛选状态
  initializeFilterState();

  // 设置初始子筛选器可见性
  const initialFilter =
    document.body.getAttribute("data-current-filter") || "all";
  const subFilterSection = document.getElementById("subFilterSection");
  if (initialFilter !== "all") {
    subFilterSection.classList.add("hidden");
  }

  console.log("应用初始化完成");
}

/**
 * 绑定全局事件（使用事件委托）
 */
function bindEvents() {
  // 全局点击事件委托
  document.addEventListener("click", handleGlobalClick);

  // 全局输入事件委托
  document.addEventListener("input", handleGlobalInput);

  // 全局change事件委托
  document.addEventListener("change", handleGlobalChange);

  // 滚动事件
  window.addEventListener("scroll", handleScroll);

  // 浏览器前进后退事件
  window.addEventListener("popstate", handlePopState);
}

/**
 * 处理全局点击事件
 */
function handleGlobalClick(event) {
  const target = event.target;

  // 处理筛选按钮点击
  if (target.classList.contains("filter-button")) {
    const filterType = target.getAttribute("data-filter");
    if (filterType) {
      filterCommits(filterType);
    }
    return;
  }

  // 处理忽略按钮点击
  if (target.classList.contains("ignore-button")) {
    const commitElement = target.closest(".commit");
    const hash = commitElement.getAttribute("data-hash");
    toggleIgnoreCommit(hash, target);
    return;
  }

  // 处理备注按钮点击
  if (target.classList.contains("remark-button")) {
    const commitElement = target.closest(".commit");
    const hash = commitElement.getAttribute("data-hash");
    showRemarkModal(hash, target);
    return;
  }

  // 处理提交消息复制
  if (target.classList.contains("commit-message")) {
    copyToClipboard(target.textContent, target);
    return;
  }

  // 处理提交哈希复制
  if (target.classList.contains("commit-hash")) {
    const fullHash = target.getAttribute("title") || target.textContent;
    copyToClipboard(fullHash, target);
    return;
  }

  // 处理VS Code按钮点击
  if (
    target.classList.contains("vscode-button") ||
    target.closest(".vscode-button")
  ) {
    const button = target.classList.contains("vscode-button")
      ? target
      : target.closest(".vscode-button");
    const commitElement = button.closest(".commit");
    if (commitElement) {
      const hash = commitElement.getAttribute("data-hash");
      openInVSCode(hash);
    }
    event.stopPropagation();
    return;
  }

  // 处理查看变更按钮点击
  if (target.classList.contains("view-changes-btn")) {
    const commitElement = target.closest(".commit");
    if (commitElement) {
      const hash = commitElement.getAttribute("data-hash");
      const status = commitElement.getAttribute("data-status");
      viewCommitChanges(hash, status);
    }
    event.stopPropagation();
    return;
  }

  // 处理比较提交按钮点击
  if (
    target.classList.contains("compare-in-vscode") ||
    target.closest(".compare-in-vscode")
  ) {
    const button = target.classList.contains("compare-in-vscode")
      ? target
      : target.closest(".compare-in-vscode");
    const commitElement = button.closest(".commit");
    if (commitElement) {
      const hash = commitElement.getAttribute("data-hash");
      // 从commit-hash-pair中找到两个hash
      const hashPair = button.closest(".commit-hash-pair");
      if (hashPair) {
        const hashBranches = hashPair.querySelectorAll(".commit-hash");
        if (hashBranches.length >= 2) {
          const hash1 = hashBranches[0].getAttribute("title");
          const hash2 = hashBranches[1].getAttribute("title");
          compareCommitsInVSCode(hash1, hash2);
        }
      }
    }
    event.stopPropagation();
    return;
  }

  // 处理命令标签切换
  if (target.classList.contains("command-tab")) {
    const tab = target.getAttribute("data-command");
    switchCommandTab(tab);
    return;
  }

  // 处理复制按钮点击
  if (target.classList.contains("copy-button")) {
    // 检查是哪个复制按钮
    if (target.classList.contains("copy-source-to-target-button")) {
      copyCommandBlock("source-to-target");
    } else if (target.classList.contains("copy-target-to-source-button")) {
      copyCommandBlock("target-to-source");
    }
    return;
  }

  // 处理单行复制按钮点击
  if (target.classList.contains("copy-line-button")) {
    const cmdText = target.previousElementSibling.textContent;
    copyToClipboard(cmdText, target);
    return;
  }

  // 处理清除搜索按钮点击
  if (target.id === "clearSearch") {
    clearSearch();
    return;
  }

  // 处理返回顶部按钮点击
  if (target.id === "backToTop") {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    return;
  }

  // 处理布局切换按钮
  if (target.id === "chatLayoutBtn" || target.closest("#chatLayoutBtn")) {
    switchLayout("chat");
    return;
  }

  if (target.id === "flatLayoutBtn" || target.closest("#flatLayoutBtn")) {
    switchLayout("flat");
    return;
  }

  // 处理模态框关闭
  if (target.id === "ignoreModal" || target.classList.contains("modal")) {
    if (target === event.target) {
      closeIgnoreModal();
    }
    return;
  }

  if (
    target.id === "remarkModal" ||
    target.classList.contains("remark-modal")
  ) {
    if (target === event.target) {
      closeRemarkModal();
    }
    return;
  }

  // 处理模态框按钮
  if (target.classList.contains("modal-button")) {
    if (target.classList.contains("confirm")) {
      confirmIgnore();
    } else if (target.classList.contains("cancel")) {
      closeIgnoreModal();
    }
    return;
  }

  if (target.classList.contains("remark-modal-button")) {
    if (target.classList.contains("remark-save")) {
      confirmRemark();
    } else if (target.classList.contains("remark-cancel")) {
      closeRemarkModal();
    } else if (target.classList.contains("remark-delete")) {
      deleteRemark();
    }
    return;
  }

  // 处理忽略原因选项点击
  if (
    target.classList.contains("reason-option") ||
    target.closest(".reason-option")
  ) {
    const option = target.classList.contains("reason-option")
      ? target
      : target.closest(".reason-option");
    const radio = option.querySelector('input[type="radio"]');
    if (radio && event.target !== radio) {
      radio.checked = true;

      // 处理自定义原因输入框显示逻辑
      const customReasonInput = document.getElementById("customReasonInput");
      if (radio.value === "其他原因") {
        customReasonInput.classList.add("show");
      } else {
        customReasonInput.classList.remove("show");
      }

      // 更新选中样式
      document.querySelectorAll(".reason-option").forEach((opt) => {
        opt.classList.remove("selected");
      });
      option.classList.add("selected");
    }
    return;
  }
}

/**
 * 处理全局输入事件
 */
function handleGlobalInput(event) {
  const target = event.target;

  // 处理搜索输入
  if (target.id === "searchInput") {
    searchCommits();
    return;
  }
}

/**
 * 处理全局change事件
 */
function handleGlobalChange(event) {
  const target = event.target;

  // 处理子筛选器复选框变化
  if (target.id === "hideIgnoredCommits" || target.id === "hideCommonCommits") {
    applySubFilters();
    return;
  }

  // 处理搜索选项复选框变化
  if (
    target.id === "searchMessage" ||
    target.id === "searchAuthor" ||
    target.id === "searchHash"
  ) {
    searchCommits();
    return;
  }

  // 处理忽略原因单选按钮变化
  if (target.name === "ignoreReason") {
    const customReasonInput = document.getElementById("customReasonInput");
    if (target.value === "其他原因") {
      customReasonInput.classList.add("show");
    } else {
      customReasonInput.classList.remove("show");
    }

    // 更新选中样式
    document.querySelectorAll(".reason-option").forEach((opt) => {
      opt.classList.remove("selected");
    });
    target.closest(".reason-option").classList.add("selected");
    return;
  }
}

/**
 * 处理滚动事件
 */
function handleScroll() {
  const backToTopButton = document.getElementById("backToTop");
  if (backToTopButton) {
    if (window.scrollY > 300) {
      backToTopButton.classList.add("show");
    } else {
      backToTopButton.classList.remove("show");
    }
  }
}

/**
 * 处理浏览器前进后退事件
 */
function handlePopState() {
  // 从URL恢复筛选状态
  initializeFilterState();
}

/**
 * 初始化布局
 */
function initializeLayout() {
  const savedLayout = localStorage.getItem("preferredLayout") || "flat";
  switchLayout(savedLayout);
}

/**
 * 切换布局
 */
function switchLayout(layout) {
  // 更新布局按钮
  document
    .getElementById("chatLayoutBtn")
    .classList.toggle("active", layout === "chat");
  document
    .getElementById("flatLayoutBtn")
    .classList.toggle("active", layout === "flat");

  // 更新时间轴类
  const timeline = document.getElementById("timeline");
  if (layout === "flat") {
    timeline.classList.add("flat-layout");
  } else {
    timeline.classList.remove("flat-layout");
  }

  // 存储当前布局
  document.body.setAttribute("data-layout", layout);

  // 重新渲染提交
  renderCommits();

  // 保存偏好到localStorage
  localStorage.setItem("preferredLayout", layout);
}

/**
 * 切换命令标签
 */
function switchCommandTab(tab) {
  document.querySelectorAll(".command-tab").forEach((item) => {
    item.classList.toggle("active", item.getAttribute("data-command") === tab);
  });
  document.querySelectorAll(".command-content").forEach((item) => {
    item.classList.toggle("active", item.id === `${tab}-content`);
  });
}

// 页面加载时初始化
document.addEventListener("DOMContentLoaded", () => {
  // 检查URL是否有参数
  const urlParams = new URLSearchParams(window.location.search);
  if (
    !urlParams.has("filter") &&
    !urlParams.has("hideIgnored") &&
    !urlParams.has("hideCommon")
  ) {
    // 设置默认URL参数
    const url = new URL(window.location.href);
    url.searchParams.set("filter", "all");
    url.searchParams.set("hideIgnored", "0");
    url.searchParams.set("hideCommon", "1");
    window.history.replaceState({}, "", url.toString());
  }

  // 设置初始筛选状态跟踪
  saveCurrentFilterState();

  // 绑定事件
  bindEvents();

  // 初始化应用
  initApp();
});
