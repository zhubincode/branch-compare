/**
 * Filter Module 筛选模块
 * 处理提交的筛选和搜索功能
 */

/**
 * 筛选提交
 * @param {string} type - 筛选类型 ('all', 'source', 'target', 'common', 'ignored')
 */
function filterCommits(type) {
  const buttons = document.querySelectorAll(".filter-button");
  buttons.forEach((btn) => btn.classList.remove("active"));
  document.querySelector(`[data-filter="${type}"]`).classList.add("active");

  document.body.setAttribute("data-current-filter", type);
  updateFilterState({ mainFilter: type });

  const subFilterSection = document.getElementById("subFilterSection");
  if (type === "all") {
    subFilterSection.classList.remove("hidden");
  } else {
    subFilterSection.classList.add("hidden");
  }

  applyFilters(type);
  saveFilterStateToURL();
}

/**
 * 应用筛选
 * @param {string} type - 筛选类型
 */
function applyFilters(type) {
  const commitRows = document.querySelectorAll(".commit-row");
  const hideIgnored = document.getElementById("hideIgnoredCommits").checked;
  const hideCommon = document.getElementById("hideCommonCommits").checked;

  commitRows.forEach((row) => {
    const commitElement = row.querySelector(".commit");
    if (!commitElement) return;

    const status = commitElement.getAttribute("data-status");
    const hash = commitElement.getAttribute("data-hash");
    const isIgnored = appState.ignoredCommits.some(
      (item) => item.hash === hash
    );
    const isCommon = status === "both";

    let shouldShow = false;

    switch (type) {
      case "all":
        shouldShow = true;
        break;
      case "source":
        shouldShow = status === "source";
        break;
      case "target":
        shouldShow = status === "target";
        break;
      case "common":
        shouldShow = status === "both";
        break;
      case "ignored":
        shouldShow = isIgnored;
        break;
    }

    if (shouldShow) {
      if (hideIgnored && isIgnored && type !== "ignored") {
        shouldShow = false;
      }
      if (hideCommon && isCommon && type !== "common") {
        shouldShow = false;
      }
    }

    row.style.display = shouldShow ? "" : "none";
  });
}

/**
 * 应用子筛选器
 */
function applySubFilters() {
  const currentFilter =
    document.body.getAttribute("data-current-filter") || "all";
  applyFilters(currentFilter);
  saveFilterStateToURL();
}

/**
 * 搜索提交
 * @param {boolean} saveState - 是否保存状态
 */
function searchCommits(saveState = true) {
  const searchText = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();
  const searchMessage = document.getElementById("searchMessage").checked;
  const searchAuthor = document.getElementById("searchAuthor").checked;
  const searchHash = document.getElementById("searchHash").checked;
  const clearButton = document.getElementById("clearSearch");

  if (saveState) {
    updateFilterState({
      searchText,
      searchMessage,
      searchAuthor,
      searchHash,
    });
  }

  if (searchText) {
    clearButton.classList.add("visible");
  } else {
    clearButton.classList.remove("visible");
  }

  if (!searchText) {
    const currentFilter =
      document.body.getAttribute("data-current-filter") || "all";
    applyFilters(currentFilter);
    return;
  }

  const commitRows = document.querySelectorAll(".commit-row");

  // 清除现有高亮
  commitRows.forEach((row) => {
    const commitElement = row.querySelector(".commit");
    if (!commitElement) return;

    const messageElement = commitElement.querySelector(".commit-message");
    const authorElement = commitElement.querySelector(".commit-author");
    const hashElements = commitElement.querySelectorAll(".commit-hash");

    if (messageElement) {
      messageElement.innerHTML = messageElement.innerHTML.replace(
        /<span class="highlight">([^<]+)<\/span>/g,
        "$1"
      );
    }
    if (authorElement) {
      authorElement.innerHTML = authorElement.innerHTML.replace(
        /<span class="highlight">([^<]+)<\/span>/g,
        "$1"
      );
    }
    hashElements.forEach((el) => {
      el.innerHTML = el.innerHTML.replace(
        /<span class="highlight">([^<]+)<\/span>/g,
        "$1"
      );
    });
  });

  // 搜索并高亮
  commitRows.forEach((row) => {
    const commitElement = row.querySelector(".commit");
    if (!commitElement) return;

    let matches = false;

    if (searchMessage) {
      const messageElement = commitElement.querySelector(".commit-message");
      if (
        messageElement &&
        messageElement.textContent.toLowerCase().includes(searchText)
      ) {
        matches = true;
        highlightText(messageElement, searchText);
      }
    }

    if (searchAuthor && !matches) {
      const authorElement = commitElement.querySelector(".commit-author");
      if (
        authorElement &&
        authorElement.textContent.toLowerCase().includes(searchText)
      ) {
        matches = true;
        highlightText(authorElement, searchText);
      }
    }

    if (searchHash && !matches) {
      const hashElements = commitElement.querySelectorAll(".commit-hash");
      hashElements.forEach((hashElement) => {
        if (hashElement.textContent.toLowerCase().includes(searchText)) {
          matches = true;
          highlightText(hashElement, searchText);
        }
      });
    }

    row.style.display = matches ? "" : "none";
  });
}

/**
 * 高亮文本
 * @param {HTMLElement} element - 要高亮的元素
 * @param {string} searchText - 搜索文本
 */
function highlightText(element, searchText) {
  if (!element.innerHTML.includes('<span class="highlight">')) {
    const innerHTML = element.innerHTML;
    const index = innerHTML.toLowerCase().indexOf(searchText.toLowerCase());
    if (index >= 0) {
      const highlighted =
        innerHTML.substring(0, index) +
        '<span class="highlight">' +
        innerHTML.substring(index, index + searchText.length) +
        "</span>" +
        innerHTML.substring(index + searchText.length);
      element.innerHTML = highlighted;
    }
  }
}

/**
 * 清除搜索
 */
function clearSearch() {
  document.getElementById("searchInput").value = "";

  // 清除高亮
  document.querySelectorAll(".highlight").forEach((el) => {
    const parent = el.parentNode;
    parent.textContent = parent.textContent;
  });

  searchCommits();
  document.getElementById("clearSearch").classList.remove("visible");
}
