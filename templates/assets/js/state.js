/**
 * State Management Module 状态管理模块
 * 管理应用的全局状态
 */

// 全局状态对象
const appState = {
  commits: [],
  ignoredCommits: [],
  commitRemarks: [],
  filterState: {
    mainFilter: "all",
    hideIgnored: true,
    hideCommon: false,
    searchText: "",
    searchMessage: true,
    searchAuthor: true,
    searchHash: false,
  },
  layout: "flat",
  sourceBranch: "",
  targetBranch: "",
};

/**
 * 更新筛选状态
 * @param {Object} updates - 要更新的状态字段
 */
function updateFilterState(updates) {
  appState.filterState = {
    ...appState.filterState,
    ...updates,
  };
}

/**
 * 获取当前筛选状态
 * @returns {Object} 筛选状态对象
 */
function getFilterState() {
  return { ...appState.filterState };
}

/**
 * 保存筛选状态到URL
 */
function saveFilterStateToURL() {
  const url = new URL(window.location.href);
  url.searchParams.set("filter", appState.filterState.mainFilter);
  url.searchParams.set(
    "hideIgnored",
    appState.filterState.hideIgnored ? "1" : "0"
  );
  url.searchParams.set(
    "hideCommon",
    appState.filterState.hideCommon ? "1" : "0"
  );
  window.history.replaceState({}, "", url.toString());
}

/**
 * 从URL加载筛选状态
 * @returns {Object} 从URL解析的筛选状态
 */
function loadFilterStateFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    mainFilter: urlParams.get("filter") || "all",
    hideIgnored: urlParams.get("hideIgnored") === "1",
    hideCommon: urlParams.get("hideCommon") === "1",
  };
}

/**
 * 保存当前筛选状态（用于操作前保存）
 */
function saveCurrentFilterState() {
  const hideIgnoredEl = document.getElementById("hideIgnoredCommits");
  const hideCommonEl = document.getElementById("hideCommonCommits");
  const searchInputEl = document.getElementById("searchInput");
  const searchMessageEl = document.getElementById("searchMessage");
  const searchAuthorEl = document.getElementById("searchAuthor");
  const searchHashEl = document.getElementById("searchHash");

  if (
    !hideIgnoredEl ||
    !hideCommonEl ||
    !searchInputEl ||
    !searchMessageEl ||
    !searchAuthorEl ||
    !searchHashEl
  ) {
    console.warn("部分筛选DOM元素未找到，跳过状态保存");
    return;
  }

  appState.filterState = {
    mainFilter: document.body.getAttribute("data-current-filter") || "all",
    hideIgnored: hideIgnoredEl.checked,
    hideCommon: hideCommonEl.checked,
    searchText: searchInputEl.value.trim(),
    searchMessage: searchMessageEl.checked,
    searchAuthor: searchAuthorEl.checked,
    searchHash: searchHashEl.checked,
  };

  console.log("已保存筛选状态:", appState.filterState);
}

/**
 * 恢复筛选状态（用于操作后恢复）
 */
function restoreFilterState() {
  console.log("正在恢复筛选状态:", appState.filterState);

  if (!appState.filterState) {
    console.warn("没有筛选状态可恢复");
    return;
  }

  // 设置主筛选按钮状态
  document.querySelectorAll(".filter-button").forEach((btn) => {
    btn.classList.toggle(
      "active",
      btn.getAttribute("data-filter") === appState.filterState.mainFilter
    );
  });

  document.body.setAttribute(
    "data-current-filter",
    appState.filterState.mainFilter
  );

  // 获取DOM元素
  const hideIgnoredEl = document.getElementById("hideIgnoredCommits");
  const hideCommonEl = document.getElementById("hideCommonCommits");
  const searchInputEl = document.getElementById("searchInput");
  const searchMessageEl = document.getElementById("searchMessage");
  const searchAuthorEl = document.getElementById("searchAuthor");
  const searchHashEl = document.getElementById("searchHash");
  const clearButton = document.getElementById("clearSearch");
  const subFilterSection = document.getElementById("subFilterSection");

  if (
    !hideIgnoredEl ||
    !hideCommonEl ||
    !searchInputEl ||
    !searchMessageEl ||
    !searchAuthorEl ||
    !searchHashEl ||
    !clearButton ||
    !subFilterSection
  ) {
    console.warn("部分筛选DOM元素未找到，跳过状态恢复");
    return;
  }

  // 恢复复选框状态
  hideIgnoredEl.checked = appState.filterState.hideIgnored;
  hideCommonEl.checked = appState.filterState.hideCommon;

  // 恢复搜索状态
  searchInputEl.value = appState.filterState.searchText;
  searchMessageEl.checked = appState.filterState.searchMessage;
  searchAuthorEl.checked = appState.filterState.searchAuthor;
  searchHashEl.checked = appState.filterState.searchHash;

  // 显示/隐藏清除按钮
  if (appState.filterState.searchText) {
    clearButton.classList.add("visible");
  } else {
    clearButton.classList.remove("visible");
  }

  // 设置子筛选器可见性
  if (appState.filterState.mainFilter === "all") {
    subFilterSection.classList.remove("hidden");
  } else {
    subFilterSection.classList.add("hidden");
  }

  // 应用筛选
  if (appState.filterState.searchText) {
    searchCommits(false);
  } else {
    applyFilters(appState.filterState.mainFilter);
  }
}

/**
 * 初始化筛选状态（从URL）
 */
function initializeFilterState() {
  const urlParams = loadFilterStateFromURL();

  appState.filterState = {
    ...appState.filterState,
    mainFilter: urlParams.mainFilter,
    hideIgnored: urlParams.hideIgnored,
    hideCommon: urlParams.hideCommon,
  };

  document.body.setAttribute(
    "data-current-filter",
    appState.filterState.mainFilter
  );

  // 更新UI
  document.querySelectorAll(".filter-button").forEach((btn) => {
    btn.classList.toggle(
      "active",
      btn.getAttribute("data-filter") === appState.filterState.mainFilter
    );
  });

  const hideIgnoredEl = document.getElementById("hideIgnoredCommits");
  const hideCommonEl = document.getElementById("hideCommonCommits");
  if (hideIgnoredEl) hideIgnoredEl.checked = appState.filterState.hideIgnored;
  if (hideCommonEl) hideCommonEl.checked = appState.filterState.hideCommon;

  const subFilterSection = document.getElementById("subFilterSection");
  if (subFilterSection) {
    if (appState.filterState.mainFilter === "all") {
      subFilterSection.classList.remove("hidden");
    } else {
      subFilterSection.classList.add("hidden");
    }
  }

  console.log("已从URL初始化筛选状态:", appState.filterState);
}

/**
 * 设置布局模式
 * @param {string} layout - 布局模式 ('chat' 或 'flat')
 */
function setLayout(layout) {
  appState.layout = layout;
  localStorage.setItem("preferredLayout", layout);
}

/**
 * 获取布局模式
 * @returns {string} 当前布局模式
 */
function getLayout() {
  return appState.layout;
}

/**
 * 从localStorage加载布局偏好
 * @returns {string} 保存的布局模式
 */
function loadLayoutPreference() {
  return localStorage.getItem("preferredLayout") || "flat";
}
