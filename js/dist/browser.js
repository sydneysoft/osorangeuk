(() => {
  // js/config.js
  var HOME_URL = "https://storylingo.uk";
  var NEW_TAB_URL = "orangesoft://newtab/";
  var MAX_HISTORY_ITEMS = 100;

  // js/state.js
  var state = {
    tabs: [],
    activeTabId: null,
    tabCounter: 0,
    selectedSuggestion: -1
  };

  // js/urls.js
  function parseInput(value) {
    value = value.trim();
    if (!value) {
      return null;
    }
    if (value.startsWith("orangesoft://")) {
      return value;
    }
    if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("file://")) {
      return value;
    }
    if (value.includes(".") && !value.includes(" ")) {
      return "https://" + value;
    }
    return "https://www.google.com/search?q=" + encodeURIComponent(value);
  }
  function displayURL(url) {
    if (url && url.startsWith("orangesoft://newtab")) {
      return "";
    }
    return url || "";
  }

  // js/history.js
  var browsingHistory = [];
  try {
    browsingHistory = JSON.parse(
      localStorage.getItem(
        "orangesoft-history"
      )
    ) || [];
  } catch {
    browsingHistory = [];
  }
  function getHistory() {
    return browsingHistory;
  }
  function saveHistory() {
    localStorage.setItem(
      "orangesoft-history",
      JSON.stringify(
        browsingHistory.slice(
          0,
          MAX_HISTORY_ITEMS
        )
      )
    );
  }
  function rememberActivity(item) {
    const key = item.type === "search" ? `search:${item.query.toLowerCase()}` : item.url;
    const existingIndex = browsingHistory.findIndex(
      (existing) => {
        const existingKey = existing.type === "search" ? `search:${(existing.query || "").toLowerCase()}` : existing.url;
        return existingKey === key;
      }
    );
    if (existingIndex !== -1) {
      browsingHistory.splice(
        existingIndex,
        1
      );
    }
    browsingHistory.unshift(item);
    if (browsingHistory.length > MAX_HISTORY_ITEMS) {
      browsingHistory.length = MAX_HISTORY_ITEMS;
    }
    saveHistory();
  }

  // js/tabs.js
  var tabsElement = document.getElementById(
    "tabs"
  );
  var newTabButton = document.getElementById(
    "new-tab-button"
  );
  var browserContainer = document.getElementById(
    "browser-container"
  );
  var address = document.getElementById(
    "address"
  );
  function currentTab() {
    return state.tabs.find(
      (tab) => tab.id === state.activeTabId
    );
  }
  function getActiveTabId() {
    return state.activeTabId;
  }
  function createTabUI(id) {
    const button = document.createElement(
      "div"
    );
    button.className = "tab";
    button.dataset.id = id;
    const favicon = document.createElement(
      "img"
    );
    favicon.className = "tab-icon";
    favicon.src = "assets/orangesoft-icon.png";
    const title = document.createElement(
      "div"
    );
    title.className = "tab-title";
    title.textContent = "New Tab";
    const closeButton = document.createElement(
      "div"
    );
    closeButton.className = "close-tab";
    closeButton.textContent = "\xD7";
    button.append(
      favicon,
      title,
      closeButton
    );
    tabsElement.insertBefore(
      button,
      newTabButton
    );
    return {
      button,
      favicon,
      title,
      closeButton
    };
  }
  function createWebview(url) {
    const webview = document.createElement(
      "webview"
    );
    webview.setAttribute(
      "allowpopups",
      ""
    );
    const preloadURL = new URL(
      "webview-preload.js",
      window.location.href
    ).toString();
    webview.setAttribute(
      "preload",
      preloadURL
    );
    webview.setAttribute(
      "tabindex",
      "-1"
    );
    if (url !== NEW_TAB_URL) {
      webview.src = url;
    }
    browserContainer.appendChild(
      webview
    );
    return webview;
  }
  function createTabObject(id, url, ui, webview) {
    return {
      id,
      button: ui.button,
      title: ui.title,
      favicon: ui.favicon,
      closeButton: ui.closeButton,
      webview,
      initialURL: url,
      currentURL: url === NEW_TAB_URL ? "" : url,
      isNewTab: url === NEW_TAB_URL
    };
  }
  function navigateTab(tab, url) {
    if (!tab || !url) {
      return;
    }
    tab.currentURL = url;
    tab.isNewTab = false;
    tab.webview.src = url;
    if (state.activeTabId === tab.id) {
      syncAddressBar(
        tab
      );
    }
  }
  function bindTabEvents(tab) {
    tab.button.addEventListener(
      "click",
      (event) => {
        if (event.target === tab.closeButton) {
          event.stopPropagation();
          closeTab(
            tab.id
          );
          return;
        }
        activateTab(
          tab.id
        );
      }
    );
  }
  function bindNavigationEvents(tab) {
    tab.webview.addEventListener(
      "did-navigate",
      (event) => {
        updateAddressBar(
          tab,
          event.url
        );
      }
    );
    tab.webview.addEventListener(
      "did-navigate-in-page",
      (event) => {
        updateAddressBar(
          tab,
          event.url
        );
      }
    );
  }
  function bindPageInfoEvents(tab) {
    tab.webview.addEventListener(
      "page-title-updated",
      (event) => {
        tab.title.textContent = event.title || "New Tab";
        const url = tab.webview.getURL();
        saveHistory2(
          tab,
          url
        );
      }
    );
    tab.webview.addEventListener(
      "page-favicon-updated",
      (event) => {
        if (event.favicons?.length) {
          tab.favicon.src = event.favicons[0];
        }
      }
    );
  }
  function bindWebviewEvents(tab) {
    bindNavigationEvents(
      tab
    );
    bindPageInfoEvents(
      tab
    );
  }
  function syncAddressBar(tab) {
    if (!tab) {
      return;
    }
    if (tab.isNewTab) {
      address.value = "";
      return;
    }
    address.value = displayURL(
      tab.currentURL || tab.webview.getURL()
    );
  }
  function updateAddressBar(tab, url) {
    if (tab.isNewTab && (!url || url === "about:blank" || url.startsWith(
      "orangesoft://newtab"
    ))) {
      if (state.activeTabId === tab.id) {
        address.value = "";
      }
      return;
    }
    tab.currentURL = url;
    if (url && url !== "about:blank" && !url.startsWith(
      "orangesoft://newtab"
    )) {
      tab.isNewTab = false;
    }
    if (state.activeTabId !== tab.id) {
      return;
    }
    syncAddressBar(
      tab
    );
  }
  function saveHistory2(tab, url) {
    if (!url) {
      return;
    }
    if (!url.startsWith(
      "http://"
    ) && !url.startsWith(
      "https://"
    )) {
      return;
    }
    rememberActivity({
      type: "history",
      title: tab.title.textContent || url,
      url
    });
  }
  function createTab(url = NEW_TAB_URL) {
    const id = ++state.tabCounter;
    const ui = createTabUI(
      id
    );
    const webview = createWebview(
      url
    );
    const tab = createTabObject(
      id,
      url,
      ui,
      webview
    );
    state.tabs.push(
      tab
    );
    bindTabEvents(
      tab
    );
    bindWebviewEvents(
      tab
    );
    activateTab(
      id
    );
    return tab;
  }
  function activateTab(id) {
    state.activeTabId = id;
    state.tabs.forEach(
      (tab2) => {
        const active = tab2.id === id;
        tab2.button.classList.toggle(
          "active",
          active
        );
        tab2.webview.classList.toggle(
          "active",
          active
        );
      }
    );
    const tab = currentTab();
    if (!tab) {
      return;
    }
    syncAddressBar(
      tab
    );
  }
  function closeTab(id) {
    const index = state.tabs.findIndex(
      (tab2) => tab2.id === id
    );
    if (index === -1) {
      return;
    }
    const wasActive = state.activeTabId === id;
    const tab = state.tabs[index];
    tab.button.remove();
    tab.webview.remove();
    state.tabs.splice(
      index,
      1
    );
    if (state.tabs.length === 0) {
      createTab();
      return;
    }
    if (wasActive) {
      const nextIndex = Math.min(
        index,
        state.tabs.length - 1
      );
      const nextTab = state.tabs[nextIndex];
      activateTab(
        nextTab.id
      );
    }
  }

  // js/events/navigation-events.js
  function setupNavigationEvents() {
    const backButton = document.getElementById(
      "back"
    );
    const forwardButton = document.getElementById(
      "forward"
    );
    const reloadButton = document.getElementById(
      "reload"
    );
    const homeButton = document.getElementById(
      "home"
    );
    backButton.addEventListener(
      "click",
      () => {
        const tab = currentTab();
        if (tab && tab.webview.canGoBack()) {
          tab.webview.goBack();
        }
      }
    );
    forwardButton.addEventListener(
      "click",
      () => {
        const tab = currentTab();
        if (tab && tab.webview.canGoForward()) {
          tab.webview.goForward();
        }
      }
    );
    reloadButton.addEventListener(
      "click",
      () => {
        const tab = currentTab();
        if (tab) {
          tab.webview.reload();
        }
      }
    );
    homeButton.addEventListener(
      "click",
      () => {
        const tab = currentTab();
        if (tab) {
          tab.webview.loadURL(
            HOME_URL
          );
        }
      }
    );
  }

  // js/suggestions.js
  var knownSites = [
    {
      title: "StoryLingo",
      url: "https://storylingo.uk"
    },
    {
      title: "OrangeSoft",
      url: "https://orangesoft.uk"
    },
    {
      title: "Google",
      url: "https://google.com"
    },
    {
      title: "YouTube",
      url: "https://youtube.com"
    },
    {
      title: "Scribd",
      url: "https://scribd.com"
    }
  ];
  var suggestions = document.getElementById(
    "suggestions"
  );
  function getSuggestions(value) {
    const query = value.trim().toLowerCase();
    if (!query) {
      const recent = getHistory().slice(0, 5);
      const seen2 = new Set(
        recent.map(
          (item) => item.url
        )
      );
      const defaults = knownSites.filter(
        (site) => !seen2.has(site.url)
      ).slice(
        0,
        8 - recent.length
      );
      return [
        ...recent,
        ...defaults
      ];
    }
    const allSites = [
      ...getHistory(),
      ...knownSites
    ];
    const unique = [];
    const seen = /* @__PURE__ */ new Set();
    for (const site of allSites) {
      if (!site.url)
        continue;
      if (seen.has(site.url))
        continue;
      const title = (site.title || "").toLowerCase();
      const url = site.url.toLowerCase();
      const savedQuery = (site.query || "").toLowerCase();
      if (title.includes(query) || url.includes(query) || savedQuery.includes(query)) {
        unique.push(site);
        seen.add(site.url);
      }
    }
    unique.push({
      type: "search",
      title: `Search for "${value}"`,
      query: value,
      url: "https://www.google.com/search?q=" + encodeURIComponent(value)
    });
    return unique.slice(
      0,
      8
    );
  }
  function renderSuggestions(value) {
    const results = getSuggestions(value);
    suggestions.innerHTML = "";
    state.selectedSuggestion = -1;
    if (!results.length) {
      hideSuggestions();
      return;
    }
    results.forEach(
      (result, index) => {
        const row = document.createElement(
          "div"
        );
        row.className = "suggestion";
        row.dataset.index = index;
        row.dataset.url = result.url;
        const icon = document.createElement(
          "span"
        );
        icon.className = "suggestion-icon";
        if (result.type === "history" || result.type === "search") {
          icon.textContent = "\u25F7";
        } else {
          icon.textContent = "\u2197";
        }
        const title = document.createElement(
          "span"
        );
        title.className = "suggestion-title";
        title.textContent = result.title;
        const url = document.createElement(
          "span"
        );
        url.className = "suggestion-url";
        url.textContent = result.url;
        row.appendChild(icon);
        row.appendChild(title);
        row.appendChild(url);
        row.addEventListener(
          "mousedown",
          (event) => {
            event.preventDefault();
            if (result.type === "search") {
              rememberActivity({
                type: "search",
                title: result.query,
                query: result.query,
                url: result.url
              });
            }
            const tab = currentTab();
            if (tab) {
              tab.webview.loadURL(
                result.url
              );
            }
            hideSuggestions();
          }
        );
        suggestions.appendChild(
          row
        );
      }
    );
    suggestions.classList.add(
      "visible"
    );
  }
  function hideSuggestions() {
    suggestions.classList.remove(
      "visible"
    );
    state.selectedSuggestion = -1;
  }
  function moveSuggestionSelection(direction) {
    const rows = Array.from(
      suggestions.querySelectorAll(
        ".suggestion"
      )
    );
    if (!rows.length)
      return;
    state.selectedSuggestion += direction;
    if (state.selectedSuggestion < 0) {
      state.selectedSuggestion = rows.length - 1;
    }
    if (state.selectedSuggestion >= rows.length) {
      state.selectedSuggestion = 0;
    }
    rows.forEach(
      (row, index) => {
        row.classList.toggle(
          "selected",
          index === state.selectedSuggestion
        );
      }
    );
  }
  function activateSelectedSuggestion() {
    if (state.selectedSuggestion < 0) {
      return false;
    }
    const rows = suggestions.querySelectorAll(
      ".suggestion"
    );
    const selected = rows[state.selectedSuggestion];
    if (!selected)
      return false;
    selected.dispatchEvent(
      new MouseEvent(
        "mousedown",
        {
          bubbles: true
        }
      )
    );
    return true;
  }

  // js/favorites.js
  var STORAGE_KEY = "orangesoft-favorites";
  var favorites = [];
  try {
    favorites = JSON.parse(
      localStorage.getItem(
        STORAGE_KEY
      )
    ) || [];
  } catch {
    favorites = [];
  }
  function saveFavorites() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        favorites
      )
    );
  }
  function getFavorites() {
    return favorites;
  }
  function isFavorite(url) {
    return favorites.some(
      (favorite) => favorite.url === url
    );
  }
  function addFavorite(item) {
    if (!item || !item.url) {
      return;
    }
    if (isFavorite(
      item.url
    )) {
      return;
    }
    favorites.unshift({
      type: "favorite",
      title: item.title || item.url,
      url: item.url
    });
    saveFavorites();
  }
  function removeFavorite(url) {
    favorites = favorites.filter(
      (favorite) => favorite.url !== url
    );
    saveFavorites();
  }
  function toggleFavorite(item) {
    if (!item || !item.url) {
      return false;
    }
    if (isFavorite(
      item.url
    )) {
      removeFavorite(
        item.url
      );
      return false;
    }
    addFavorite(
      item
    );
    return true;
  }

  // js/favorites-popup.js
  var popup;
  var grid;
  function renderFavorites() {
    const favorites2 = getFavorites();
    grid.innerHTML = "";
    if (favorites2.length === 0) {
      const empty = document.createElement("div");
      empty.className = "favorites-empty";
      empty.textContent = "No favorites yet";
      grid.appendChild(empty);
      return;
    }
    favorites2.forEach(
      (favorite) => {
        const item = document.createElement("div");
        item.className = "favorite-item";
        const icon = document.createElement("div");
        icon.className = "favorite-icon";
        if (favorite.icon) {
          const img = document.createElement("img");
          img.src = favorite.icon;
          img.alt = "";
          icon.appendChild(img);
        } else {
          icon.textContent = (favorite.title || favorite.url).charAt(0).toUpperCase();
        }
        const title = document.createElement("div");
        title.className = "favorite-title";
        title.textContent = favorite.title || favorite.url;
        const removeButton = document.createElement("button");
        removeButton.className = "favorite-remove";
        removeButton.textContent = "\xD7";
        removeButton.addEventListener(
          "click",
          (event) => {
            event.stopPropagation();
            removeFavorite(
              favorite.url
            );
            renderFavorites();
          }
        );
        item.appendChild(
          removeButton
        );
        item.appendChild(
          icon
        );
        item.appendChild(
          title
        );
        item.addEventListener(
          "click",
          () => {
            const tab = currentTab();
            if (tab) {
              tab.webview.loadURL(
                favorite.url
              );
            }
            closeFavoritesPopup();
          }
        );
        grid.appendChild(
          item
        );
      }
    );
  }
  function openFavoritesPopup() {
    if (!popup || !grid) {
      return;
    }
    renderFavorites();
    popup.classList.add(
      "visible"
    );
  }
  function closeFavoritesPopup() {
    if (!popup) {
      return;
    }
    popup.classList.remove(
      "visible"
    );
  }
  function setupFavoritesPopup() {
    popup = document.getElementById(
      "favorites-popup"
    );
    grid = document.getElementById(
      "favorites-grid"
    );
    const closeButton = document.getElementById(
      "close-favorites"
    );
    closeButton.addEventListener(
      "click",
      () => {
        closeFavoritesPopup();
      }
    );
    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape") {
          closeFavoritesPopup();
        }
      }
    );
  }

  // js/events/address-events.js
  function setupAddressEvents() {
    const address2 = document.getElementById(
      "address"
    );
    address2.addEventListener(
      "focus",
      () => {
        openFavoritesPopup();
        renderSuggestions("");
      }
    );
    address2.addEventListener(
      "input",
      () => {
        const value = address2.value.trim();
        if (!value) {
          hideSuggestions();
          openFavoritesPopup();
          return;
        }
        closeFavoritesPopup();
        renderSuggestions(
          value
        );
      }
    );
    address2.addEventListener(
      "blur",
      () => {
        setTimeout(
          () => {
            hideSuggestions();
          },
          150
        );
      }
    );
    address2.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          moveSuggestionSelection(
            1
          );
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          moveSuggestionSelection(
            -1
          );
          return;
        }
        if (event.key === "Escape") {
          hideSuggestions();
          closeFavoritesPopup();
          address2.blur();
          return;
        }
        if (event.key !== "Enter") {
          return;
        }
        if (activateSelectedSuggestion()) {
          closeFavoritesPopup();
          return;
        }
        const rawValue = address2.value.trim();
        const target = parseInput(
          rawValue
        );
        if (!target) {
          return;
        }
        const isDirectURL = rawValue.startsWith(
          "http://"
        ) || rawValue.startsWith(
          "https://"
        ) || rawValue.startsWith(
          "orangesoft://"
        ) || rawValue.includes(".") && !rawValue.includes(" ");
        if (!isDirectURL) {
          rememberActivity({
            type: "search",
            title: rawValue,
            query: rawValue,
            url: target
          });
        }
        hideSuggestions();
        closeFavoritesPopup();
        const tab = currentTab();
        if (tab) {
          navigateTab(
            tab,
            target
          );
        }
      }
    );
  }

  // js/events/new-tab-events.js
  function openNewTab() {
    createTab();
    const address2 = document.getElementById(
      "address"
    );
    address2.value = "";
    address2.focus();
    address2.setSelectionRange(
      0,
      0
    );
    openFavoritesPopup();
    renderSuggestions("");
  }
  function setupNewTabEvents() {
    const button = document.getElementById(
      "new-tab-button"
    );
    button.addEventListener(
      "mousedown",
      (event) => {
        event.preventDefault();
      }
    );
    button.addEventListener(
      "click",
      () => {
        openNewTab();
      }
    );
  }

  // js/events/favorite-events.js
  function setupFavoriteEvents() {
    const favoriteButton = document.getElementById(
      "favorite"
    );
    if (!favoriteButton) {
      return;
    }
    favoriteButton.addEventListener(
      "click",
      () => {
        const tab = currentTab();
        if (!tab) {
          return;
        }
        const url = tab.webview.getURL();
        if (!url || url.startsWith(
          "orangesoft://newtab"
        )) {
          return;
        }
        const title = tab.webview.getTitle?.() || tab.title?.textContent || url;
        const added = toggleFavorite({
          title,
          url,
          icon: tab.favicon?.src || ""
        });
        favoriteButton.textContent = added ? "\u2605" : "\u2606";
        favoriteButton.title = added ? "Remove from Favorites" : "Add to Favorites";
      }
    );
  }

  // js/events/keyboard-events.js
  function setupKeyboardEvents() {
    const address2 = document.getElementById(
      "address"
    );
    window.addEventListener(
      "keydown",
      (event) => {
        const cmd = event.metaKey || event.ctrlKey;
        if (!cmd) {
          return;
        }
        const key = event.key.toLowerCase();
        if (key === "l") {
          event.preventDefault();
          address2.focus();
          address2.select();
          return;
        }
        if (key === "t") {
          event.preventDefault();
          openNewTab();
          return;
        }
        if (key === "w") {
          event.preventDefault();
          const id = getActiveTabId();
          if (id !== null) {
            closeTab(
              id
            );
          }
          return;
        }
        if (key === "r") {
          event.preventDefault();
          const tab = currentTab();
          if (tab) {
            tab.webview.reload();
          }
        }
      }
    );
  }

  // js/events.js
  function setupEvents() {
    setupNavigationEvents();
    setupAddressEvents();
    setupNewTabEvents();
    setupFavoriteEvents();
    setupKeyboardEvents();
  }

  // js/main.js
  setupFavoritesPopup();
  setupEvents();
  createTab(
    HOME_URL
  );
})();
