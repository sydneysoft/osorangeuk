(() => {
  const STORYLINGO_ORIGIN = 'https://storylingo.uk';
  const ONBOARDING_KEY = 'orangesoft:storylingo-onboarding:v1';
  const PREFS_KEY = 'orangesoft:storylingo-preferences:v1';

  const LANGUAGES = {
    en: { name: 'English', flag: '🇬🇧' },
    uk: { name: 'Ukrainian', flag: '🇺🇦' },
    ru: { name: 'Russian', flag: '🇷🇺' },
    pl: { name: 'Polish', flag: '🇵🇱' },
    fr: { name: 'French', flag: '🇫🇷' },
    de: { name: 'German', flag: '🇩🇪' },
    es: { name: 'Spanish', flag: '🇪🇸' },
    it: { name: 'Italian', flag: '🇮🇹' }
  };

  const tutorialSteps = [
    {
      eyebrow: 'STEP 1 OF 4',
      title: 'Translate as you browse',
      copy: 'Click a word — or select a short word or phrase — on any webpage. OrangeSoft Browser translates it without taking you away from what you are reading.',
      demo: '<span class="sl-demo-word">bonjour</span><span class="sl-demo-arrow">→</span><strong>hello</strong>'
    },
    {
      eyebrow: 'STEP 2 OF 4',
      title: 'Translate into your native language',
      copy: 'Choose your native language below. When you sign in, OrangeSoft Browser can use the native language saved in your StoryLingo profile automatically.',
      settings: true
    },
    {
      eyebrow: 'STEP 3 OF 4',
      title: 'Save words to StoryLingo',
      copy: 'When a translation appears, choose Save word. Sign in to StoryLingo to sync saved vocabulary to your account and use it again from your learning area.',
      account: true
    },
    {
      eyebrow: 'STEP 4 OF 4',
      title: 'Your vocabulary stays organised',
      copy: 'Saved words are grouped by language. If a page uses a language outside the StoryLingo learning list, those words are kept under Other languages. Use your profile picture in the toolbar for Saved words, Settings and this tutorial.',
      demo: '<span class="sl-demo-chip">🇫🇷 French</span><span class="sl-demo-chip">🇵🇱 Polish</span><span class="sl-demo-chip">＋ Other languages</span>'
    }
  ];

  let preferences = readPreferences();
  let account = { signedIn: false, profile: null, email: '', avatar: '' };
  let bridgeReady = false;
  let pendingWord = null;
  let currentTutorialStep = 0;
  let activePanel = 'menu';
  let statusMessage = '';

  const toolbar = document.getElementById('toolbar');
  const browserContainer = document.getElementById('browser-container');
  if (!toolbar || !browserContainer) return;

  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);

  function readPreferences() {
    try {
      const value = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null');
      if (value && LANGUAGES[value.nativeLanguage]) {
        return { nativeLanguage: value.nativeLanguage };
      }
    } catch {}
    return { nativeLanguage: 'en' };
  }

  function savePreferences() {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(preferences)); } catch {}
  }

  function languageName(code) {
    if (LANGUAGES[code]) return LANGUAGES[code].name;
    try {
      return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) || String(code || '').toUpperCase();
    } catch {
      return String(code || '').toUpperCase();
    }
  }

  function languageLabel(code) {
    const known = LANGUAGES[code];
    return known ? `${known.flag} ${known.name}` : languageName(code);
  }

  function initials() {
    const source = account.profile?.displayName || account.email || 'StoryLingo';
    return source.split(/[\s@._-]+/).filter(Boolean).slice(0, 2)
      .map(part => part[0]?.toUpperCase()).join('') || 'S';
  }

  function navigate(url) {
    const address = document.getElementById('address');
    if (!address) return;
    address.value = url;
    address.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  }

  function createUI() {
    const profileButton = document.createElement('button');
    profileButton.id = 'storylingo-profile-button';
    profileButton.className = 'storylingo-profile-button';
    profileButton.type = 'button';
    profileButton.title = 'StoryLingo account and settings';
    profileButton.setAttribute('aria-label', 'StoryLingo account and settings');
    profileButton.setAttribute('aria-expanded', 'false');
    toolbar.appendChild(profileButton);

    const popover = document.createElement('section');
    popover.id = 'storylingo-account-popover';
    popover.className = 'storylingo-account-popover';
    popover.hidden = true;
    document.body.appendChild(popover);

    const tutorial = document.createElement('div');
    tutorial.id = 'storylingo-tutorial';
    tutorial.className = 'storylingo-tutorial';
    tutorial.hidden = true;
    tutorial.innerHTML = `
      <div class="storylingo-tutorial-backdrop" data-tutorial-skip></div>
      <section class="storylingo-tutorial-card" role="dialog" aria-modal="true" aria-labelledby="storylingoTutorialTitle">
        <button class="storylingo-modal-close" type="button" data-tutorial-skip aria-label="Close tutorial">×</button>
        <div class="storylingo-tutorial-art">
          <div class="storylingo-tutorial-orb">S</div>
          <p>ORANGESOFT × STORYLINGO</p>
        </div>
        <div class="storylingo-tutorial-content">
          <p class="storylingo-eyebrow" data-tutorial-eyebrow></p>
          <h1 id="storylingoTutorialTitle" data-tutorial-title></h1>
          <p class="storylingo-tutorial-copy" data-tutorial-copy></p>
          <div class="storylingo-tutorial-demo" data-tutorial-demo></div>
          <div class="storylingo-tutorial-setting" data-tutorial-setting hidden>
            <label for="storylingo-tutorial-language">MY NATIVE LANGUAGE</label>
            <select id="storylingo-tutorial-language"></select>
          </div>
          <div class="storylingo-tutorial-account" data-tutorial-account hidden></div>
          <div class="storylingo-tutorial-progress" data-tutorial-progress></div>
          <div class="storylingo-tutorial-actions">
            <button class="storylingo-text-button" type="button" data-tutorial-back>BACK</button>
            <button class="storylingo-text-button" type="button" data-tutorial-skip>SKIP</button>
            <button class="storylingo-primary-button" type="button" data-tutorial-next>NEXT</button>
          </div>
        </div>
      </section>
    `;
    document.body.appendChild(tutorial);

    const toast = document.createElement('div');
    toast.id = 'storylingo-toast';
    toast.className = 'storylingo-toast';
    toast.setAttribute('role', 'status');
    document.body.appendChild(toast);

    const bridge = document.createElement('webview');
    bridge.id = 'storylingo-account-bridge';
    bridge.className = 'storylingo-account-bridge';
    bridge.src = `${STORYLINGO_ORIGIN}/`;
    document.body.appendChild(bridge);

    bindUI();
    renderProfileButton();
    renderPopover();
    populateLanguageSelects();
  }

  function bindUI() {
    const button = document.getElementById('storylingo-profile-button');
    const popover = document.getElementById('storylingo-account-popover');

    button?.addEventListener('click', async event => {
      event.stopPropagation();
      const opening = popover?.hidden !== false;
      if (opening) {
        await syncAccount();
        activePanel = 'menu';
        renderPopover();
        setPopoverOpen(true);
      } else {
        setPopoverOpen(false);
      }
    });

    popover?.addEventListener('click', async event => {
      event.stopPropagation();

      const removeButton = event.target.closest?.('[data-remove-word]');
      if (removeButton) {
        await deleteSavedWord(removeButton.dataset.removeWord);
        return;
      }

      const action = event.target.closest?.('[data-storylingo-action]')?.dataset?.storylingoAction;
      if (!action) return;

      if (action === 'close') setPopoverOpen(false);
      else if (action === 'login') {
        pendingWord = null;
        setPopoverOpen(false);
        navigate(`${STORYLINGO_ORIGIN}/login?next=/account`);
      } else if (action === 'account') {
        setPopoverOpen(false);
        navigate(`${STORYLINGO_ORIGIN}/account`);
      } else if (action === 'saved') {
        activePanel = 'saved';
        renderPopover();
        await renderSavedWords();
      } else if (action === 'settings') {
        activePanel = 'settings';
        renderPopover();
        bindSettingsSelect();
      } else if (action === 'tutorial') {
        setPopoverOpen(false);
        openTutorial(0);
      } else if (action === 'back') {
        activePanel = 'menu';
        renderPopover();
      } else if (action === 'refresh') {
        await reloadAccountBridge();
        await delay(800);
        await syncAccount();
        renderPopover();
      }
    });

    document.addEventListener('click', event => {
      if (!popover?.hidden && !popover.contains(event.target) && event.target !== button) {
        setPopoverOpen(false);
      }
    });

    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      setPopoverOpen(false);
      closeTutorial(false);
    });

    const tutorial = document.getElementById('storylingo-tutorial');
    tutorial?.querySelectorAll('[data-tutorial-skip]').forEach(element =>
      element.addEventListener('click', () => closeTutorial(true))
    );
    tutorial?.querySelector('[data-tutorial-next]')?.addEventListener('click', () => {
      if (currentTutorialStep < tutorialSteps.length - 1) {
        currentTutorialStep++;
        renderTutorial();
      } else {
        closeTutorial(true);
      }
    });
    tutorial?.querySelector('[data-tutorial-back]')?.addEventListener('click', () => {
      if (currentTutorialStep > 0) {
        currentTutorialStep--;
        renderTutorial();
      }
    });
    tutorial?.addEventListener('click', event => {
      const action = event.target.closest?.('[data-tutorial-account-action]')?.dataset?.tutorialAccountAction;
      if (action === 'login') {
        closeTutorial(true);
        navigate(`${STORYLINGO_ORIGIN}/login?next=/account`);
      } else if (action === 'account') {
        closeTutorial(true);
        navigate(`${STORYLINGO_ORIGIN}/account`);
      }
    });
    tutorial?.querySelector('#storylingo-tutorial-language')?.addEventListener('change', event => {
      if (account.signedIn) {
        event.target.value = preferences.nativeLanguage;
        return;
      }
      setNativeLanguage(event.target.value);
    });

    bindBridge();
    observeBrowserTabs();
  }

  function setPopoverOpen(open) {
    const popover = document.getElementById('storylingo-account-popover');
    const button = document.getElementById('storylingo-profile-button');
    if (!popover || !button) return;
    popover.hidden = !open;
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function profileAvatarMarkup(className = '') {
    const classes = `storylingo-avatar ${className}`.trim();
    if (account.avatar) {
      return `<span class="${classes}"><img src="${escapeHTML(account.avatar)}" alt=""></span>`;
    }
    return `<span class="${classes}" aria-hidden="true">${escapeHTML(initials())}</span>`;
  }

  function renderProfileButton() {
    const button = document.getElementById('storylingo-profile-button');
    if (!button) return;
    if (account.avatar) button.innerHTML = `<img src="${escapeHTML(account.avatar)}" alt="">`;
    else button.textContent = account.signedIn ? initials() : '👤';
    button.classList.toggle('is-signed-in', account.signedIn);
  }

  function renderPopover() {
    const popover = document.getElementById('storylingo-account-popover');
    if (!popover) return;

    if (activePanel === 'saved') {
      popover.innerHTML = `
        <div class="storylingo-popover-titlebar">
          <button type="button" class="storylingo-icon-button" data-storylingo-action="back" aria-label="Back">←</button>
          <strong>SAVED WORDS</strong>
          <button type="button" class="storylingo-icon-button" data-storylingo-action="close" aria-label="Close">×</button>
        </div>
        <div class="storylingo-saved-list" data-saved-list>
          <p class="storylingo-empty">Loading saved vocabulary…</p>
        </div>
      `;
      return;
    }

    if (activePanel === 'settings') {
      const disabled = account.signedIn ? ' disabled' : '';
      popover.innerHTML = `
        <div class="storylingo-popover-titlebar">
          <button type="button" class="storylingo-icon-button" data-storylingo-action="back" aria-label="Back">←</button>
          <strong>SETTINGS</strong>
          <button type="button" class="storylingo-icon-button" data-storylingo-action="close" aria-label="Close">×</button>
        </div>
        <div class="storylingo-settings">
          <label for="storylingo-settings-language">TRANSLATE WORDS INTO</label>
          <select id="storylingo-settings-language"${disabled}>${languageOptions()}</select>
          <p>${account.signedIn
            ? 'This follows the native language in your StoryLingo account.'
            : 'Choose the language you want translations to appear in.'}</p>
          ${account.signedIn
            ? '<button type="button" class="storylingo-secondary-button" data-storylingo-action="account">OPEN STORYLINGO ACCOUNT SETTINGS</button>'
            : '<button type="button" class="storylingo-primary-button wide" data-storylingo-action="login">LOG IN TO STORYLINGO</button>'}
        </div>
      `;
      return;
    }

    const name = account.profile?.displayName || (account.signedIn ? 'StoryLingo reader' : 'Guest');
    const subline = account.signedIn ? (account.email || 'StoryLingo account') : 'Sign in to sync your vocabulary';

    popover.innerHTML = `
      <div class="storylingo-account-head">
        ${profileAvatarMarkup('large')}
        <div><strong>${escapeHTML(name)}</strong><span>${escapeHTML(subline)}</span></div>
        <button type="button" class="storylingo-icon-button" data-storylingo-action="close" aria-label="Close">×</button>
      </div>
      <div class="storylingo-account-language">
        <span>TRANSLATION LANGUAGE</span>
        <strong>${escapeHTML(languageLabel(preferences.nativeLanguage))}</strong>
      </div>
      ${statusMessage ? `<p class="storylingo-account-status">${escapeHTML(statusMessage)}</p>` : ''}
      <div class="storylingo-account-menu">
        ${account.signedIn
          ? '<button type="button" data-storylingo-action="account"><span>👤</span><b>Manage StoryLingo account</b><small>Profile and learning languages</small></button>'
          : '<button type="button" class="accent" data-storylingo-action="login"><span>↗</span><b>Log in to StoryLingo</b><small>Save and sync words across your account</small></button>'}
        <button type="button" data-storylingo-action="saved"><span>☆</span><b>Saved words</b><small>${account.signedIn ? 'Your synced vocabulary' : 'Available after you log in'}</small></button>
        <button type="button" data-storylingo-action="settings"><span>⚙</span><b>Settings</b><small>Translation language and account</small></button>
        <button type="button" data-storylingo-action="tutorial"><span>?</span><b>How OrangeSoft translation works</b><small>Replay the browser tutorial</small></button>
      </div>
      <div class="storylingo-account-foot">
        <span>Powered by StoryLingo</span>
        <button type="button" data-storylingo-action="refresh">REFRESH ACCOUNT</button>
      </div>
    `;
  }

  function languageOptions() {
    return Object.entries(LANGUAGES).map(([code, item]) =>
      `<option value="${code}"${preferences.nativeLanguage === code ? ' selected' : ''}>${item.flag} ${escapeHTML(item.name)}</option>`
    ).join('');
  }

  function populateLanguageSelects() {
    const select = document.getElementById('storylingo-tutorial-language');
    if (select) select.innerHTML = languageOptions();
  }

  function bindSettingsSelect() {
    const select = document.getElementById('storylingo-settings-language');
    if (!select) return;
    select.value = preferences.nativeLanguage;
    select.addEventListener('change', event => {
      if (account.signedIn) {
        event.target.value = preferences.nativeLanguage;
        return;
      }
      setNativeLanguage(event.target.value);
    });
  }

  function setNativeLanguage(code) {
    if (!LANGUAGES[code]) return;
    preferences.nativeLanguage = code;
    savePreferences();
    populateLanguageSelects();
    broadcastPreferences();
    renderPopover();
  }

  function openTutorial(step = 0) {
    currentTutorialStep = Math.max(0, Math.min(step, tutorialSteps.length - 1));
    const tutorial = document.getElementById('storylingo-tutorial');
    if (!tutorial) return;
    tutorial.hidden = false;
    renderTutorial();
  }

  function closeTutorial(markSeen) {
    const tutorial = document.getElementById('storylingo-tutorial');
    if (!tutorial || tutorial.hidden) return;
    tutorial.hidden = true;
    if (markSeen) {
      try { localStorage.setItem(ONBOARDING_KEY, '1'); } catch {}
    }
  }

  function renderTutorial() {
    const tutorial = document.getElementById('storylingo-tutorial');
    if (!tutorial) return;
    const step = tutorialSteps[currentTutorialStep];

    tutorial.querySelector('[data-tutorial-eyebrow]').textContent = step.eyebrow;
    tutorial.querySelector('[data-tutorial-title]').textContent = step.title;
    tutorial.querySelector('[data-tutorial-copy]').textContent = step.copy;

    const demo = tutorial.querySelector('[data-tutorial-demo]');
    demo.hidden = !step.demo;
    demo.innerHTML = step.demo || '';

    const setting = tutorial.querySelector('[data-tutorial-setting]');
    setting.hidden = !step.settings;

    const languageSelect = tutorial.querySelector('#storylingo-tutorial-language');
    if (languageSelect) {
      languageSelect.value = preferences.nativeLanguage;
      languageSelect.disabled = account.signedIn;
    }

    const accountBox = tutorial.querySelector('[data-tutorial-account]');
    accountBox.hidden = !step.account;
    if (step.account) {
      accountBox.innerHTML = account.signedIn
        ? `<div class="storylingo-tutorial-account-card">
            ${profileAvatarMarkup()}
            <div><strong>${escapeHTML(account.profile?.displayName || 'Signed in')}</strong><span>Your saved words will sync to this StoryLingo account.</span></div>
            <button type="button" data-tutorial-account-action="account">OPEN ACCOUNT</button>
          </div>`
        : `<div class="storylingo-tutorial-account-card">
            <span class="storylingo-avatar">👤</span>
            <div><strong>Get the full benefits</strong><span>Log in to save words, sync vocabulary and use your learning profile.</span></div>
            <button type="button" data-tutorial-account-action="login">LOG IN</button>
          </div>`;
    }

    tutorial.querySelector('[data-tutorial-progress]').innerHTML =
      tutorialSteps.map((value, index) => `<span class="${index === currentTutorialStep ? 'active' : ''}"></span>`).join('');

    tutorial.querySelector('[data-tutorial-back]').disabled = currentTutorialStep === 0;
    tutorial.querySelector('[data-tutorial-next]').textContent =
      currentTutorialStep === tutorialSteps.length - 1 ? 'START BROWSING' : 'NEXT';
  }

  function showToast(message) {
    const toast = document.getElementById('storylingo-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('visible'), 2600);
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function bindBridge() {
    const bridge = document.getElementById('storylingo-account-bridge');
    if (!bridge) return;
    bridge.addEventListener('dom-ready', async () => {
      bridgeReady = true;
      await syncAccount();
    });
    bridge.addEventListener('did-fail-load', () => { bridgeReady = false; });
  }

  async function reloadAccountBridge() {
    const bridge = document.getElementById('storylingo-account-bridge');
    if (!bridge) return;
    try { bridge.reload(); } catch {}
  }

  async function bridgeExecute(source) {
    const bridge = document.getElementById('storylingo-account-bridge');
    if (!bridge || !bridgeReady) throw new Error('StoryLingo account services are still loading.');
    return bridge.executeJavaScript(source, true);
  }

  async function syncAccount() {
    if (!bridgeReady) return account;
    try {
      const result = await bridgeExecute(`
        (async () => {
          try {
            const auth = window.StoryLingoAuth;
            if (!auth) return { signedIn: false };
            await auth.ready;
            const session = await auth.getSession();
            if (!session) return { signedIn: false };
            const profile = await auth.getProfile();
            const user = auth.getUser();
            return {
              signedIn: true,
              profile,
              email: user?.email || '',
              avatar: user?.user_metadata?.avatar_url || user?.user_metadata?.picture || ''
            };
          } catch (error) {
            return { signedIn: false, error: String(error?.message || error) };
          }
        })()
      `);

      account = result?.signedIn
        ? { signedIn: true, profile: result.profile || null, email: result.email || '', avatar: result.avatar || '' }
        : { signedIn: false, profile: null, email: '', avatar: '' };

      if (account.signedIn && LANGUAGES[account.profile?.nativeLanguage]) {
        preferences.nativeLanguage = account.profile.nativeLanguage;
        savePreferences();
      }

      statusMessage = '';
      renderProfileButton();
      broadcastPreferences();

      if (pendingWord && account.signedIn) {
        const word = pendingWord;
        pendingWord = null;
        await saveWord(word);
      }
    } catch {
      // Keep the last known account state if StoryLingo is temporarily offline.
    }
    return account;
  }

  function observeBrowserTabs() {
    const bindExisting = () => browserContainer.querySelectorAll('webview').forEach(bindBrowserWebview);
    bindExisting();
    new MutationObserver(bindExisting).observe(browserContainer, { childList: true });
  }

  function bindBrowserWebview(webview) {
    if (webview.dataset.storylingoBound === '1') return;
    webview.dataset.storylingoBound = '1';

    const send = () => sendPreferences(webview);
    webview.addEventListener('dom-ready', send);
    webview.addEventListener('ipc-message', event => {
      if (event.channel === 'storylingo-save-word') saveWord(event.args?.[0]);
    });

    const refreshIfStoryLingo = event => {
      const url = event?.url || webview.getURL?.() || '';
      if (url.startsWith(STORYLINGO_ORIGIN)) {
        setTimeout(() => reloadAccountBridge(), 700);
      }
    };
    webview.addEventListener('did-navigate', refreshIfStoryLingo);
    webview.addEventListener('did-navigate-in-page', refreshIfStoryLingo);
    send();
  }

  function sendPreferences(webview) {
    try {
      webview.send('storylingo-preferences', {
        nativeLanguage: preferences.nativeLanguage,
        signedIn: account.signedIn
      });
    } catch {}
  }

  function broadcastPreferences() {
    browserContainer.querySelectorAll('webview').forEach(sendPreferences);
  }

  async function saveWord(value) {
    const word = value && typeof value === 'object'
      ? {
          word: String(value.original || value.word || '').trim(),
          translation: String(value.translation || '').trim(),
          sourceLanguage: String(value.sourceLanguage || 'und').trim().toLowerCase().replace(/_/g, '-'),
          targetLanguage: String(value.targetLanguage || preferences.nativeLanguage).trim().toLowerCase()
        }
      : null;

    if (!word?.word) return;
    await syncAccount();

    if (!account.signedIn) {
      pendingWord = word;
      statusMessage = `Log in to save “${word.word}” and sync it with StoryLingo.`;
      activePanel = 'menu';
      renderPopover();
      setPopoverOpen(true);
      showToast('Log in to StoryLingo to save words');
      return;
    }

    try {
      const serialized = JSON.stringify(word);
      const result = await bridgeExecute(`
        (async () => {
          const auth = window.StoryLingoAuth;
          if (!auth) return { ok: false, reason: 'unavailable' };
          await auth.ready;
          if (!auth.isSignedIn()) return { ok: false, reason: 'signed-out' };
          await auth.saveFavoriteWord(${serialized});
          return { ok: true };
        })()
      `);
      if (!result?.ok) throw new Error('Please log in to StoryLingo again.');

      const other = !LANGUAGES[word.sourceLanguage];
      showToast(other ? 'Saved · Other languages' : `Saved · ${languageName(word.sourceLanguage)}`);
      statusMessage = '';
    } catch (error) {
      showToast(error?.message || 'Could not save this word');
    }
  }

  async function renderSavedWords() {
    const container = document.querySelector('[data-saved-list]');
    if (!container) return;
    await syncAccount();

    if (!account.signedIn) {
      container.innerHTML = `
        <div class="storylingo-empty">
          <strong>Log in to see saved words</strong>
          <span>Your vocabulary is stored in your StoryLingo account.</span>
          <button type="button" class="storylingo-primary-button wide" data-storylingo-action="login">LOG IN TO STORYLINGO</button>
        </div>
      `;
      return;
    }

    try {
      const words = await bridgeExecute(`
        (async () => {
          const auth = window.StoryLingoAuth;
          if (!auth) return [];
          await auth.ready;
          return auth.getFavoriteWords();
        })()
      `);

      if (!Array.isArray(words) || !words.length) {
        container.innerHTML = `
          <div class="storylingo-empty">
            <strong>No saved words yet</strong>
            <span>Select a word on any webpage, translate it and press Save word.</span>
          </div>
        `;
        return;
      }

      const known = Object.keys(LANGUAGES).map(code => ({
        title: languageLabel(code),
        words: words.filter(item => item.sourceLanguage === code)
      })).filter(group => group.words.length);

      const other = words.filter(item => !LANGUAGES[item.sourceLanguage]);
      const groups = other.length ? [...known, { title: 'Other languages', words: other }] : known;

      container.innerHTML = groups.map(group => `
        <section class="storylingo-word-group">
          <h3>${escapeHTML(group.title)}</h3>
          ${group.words.map(renderSavedWord).join('')}
        </section>
      `).join('');
    } catch (error) {
      container.innerHTML = `
        <div class="storylingo-empty">
          <strong>Could not load saved words</strong>
          <span>${escapeHTML(error?.message || 'Try again in a moment.')}</span>
        </div>
      `;
    }
  }

  function renderSavedWord(item) {
    return `
      <article class="storylingo-word-row">
        <div>
          <strong>${escapeHTML(item.word)}</strong>
          <span>${escapeHTML(item.translation || '')}</span>
          <small>${escapeHTML(languageLabel(item.sourceLanguage))} → ${escapeHTML(languageLabel(item.targetLanguage))}</small>
        </div>
        <button type="button" data-remove-word="${escapeHTML(item.id)}" aria-label="Remove ${escapeHTML(item.word)}">×</button>
      </article>
    `;
  }

  async function deleteSavedWord(id) {
    if (!id || !account.signedIn) return;
    try {
      const serialized = JSON.stringify(String(id));
      await bridgeExecute(`
        (async () => {
          const auth = window.StoryLingoAuth;
          if (!auth) return false;
          await auth.ready;
          await auth.deleteFavoriteWord(${serialized});
          return true;
        })()
      `);
      showToast('Word removed');
      await renderSavedWords();
    } catch (error) {
      showToast(error?.message || 'Could not remove word');
    }
  }

  createUI();

  try {
    if (localStorage.getItem(ONBOARDING_KEY) !== '1') {
      setTimeout(() => openTutorial(0), 350);
    }
  } catch {
    setTimeout(() => openTutorial(0), 350);
  }

  setInterval(() => {
    if (bridgeReady) syncAccount();
  }, 12000);
})();
