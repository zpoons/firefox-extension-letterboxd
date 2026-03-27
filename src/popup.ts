async function loadSettings(): Promise<{openInNewTab: boolean; autoRedirect: boolean}> {
  const stored = await browser.storage.local.get(['openInNewTab', 'autoRedirect']);
  return {
    openInNewTab: stored.openInNewTab !== false,
    autoRedirect: !!stored.autoRedirect,
  };
}

function bindCheckbox(id: string, value: boolean, storageKey: string): HTMLInputElement {
  const cb = document.getElementById(id) as HTMLInputElement;
  cb.checked = value;
  cb.addEventListener('change', () => browser.storage.local.set({[storageKey]: cb.checked}));
  return cb;
}

function navigate(url: string, openInNewTab: boolean, currentTabId: number): void {
  if (openInNewTab) {
    browser.tabs.create({active: true, url});
  } else {
    browser.tabs.update(currentTabId, {url});
  }
}

async function getImdbUrlFromLetterboxd(tabId: number): Promise<string | null> {
  try {
    const response = await browser.tabs.sendMessage(tabId, {type: 'get-imdb-url'}) as {imdbUrl: string | null} | null;
    return response?.imdbUrl ?? null;
  } catch {
    return null;
  }
}

async function setupButton(
  btn: HTMLButtonElement,
  activeTab: browser.tabs.Tab,
  url: string,
  openInNewTabCb: HTMLInputElement
): Promise<void> {
  if (isLetterboxdPage(url)) {
    btn.textContent = 'Go to IMDb';
    const imdbUrl = await getImdbUrlFromLetterboxd(activeTab.id!);
    if (!imdbUrl) {
      btn.disabled = true;
      btn.textContent = 'No IMDb link found';
      return;
    }
    const movieId = getMovieId(imdbUrl);
    btn.addEventListener('click', async () => {
      await browser.storage.local.set({skipNextRedirectForMovie: movieId});
      navigate(imdbUrl, openInNewTabCb.checked, activeTab.id!);
      window.close();
    });
    return;
  }

  const movieId = getMovieId(url);
  if (!movieId) {
    btn.disabled = true;
    btn.textContent = 'Not a supported page';
    return;
  }

  btn.addEventListener('click', () => {
    navigate(toLetterboxdUrl(movieId), openInNewTabCb.checked, activeTab.id!);
    window.close();
  });
}

async function init(): Promise<void> {
  const activeTab = await getActiveTab();
  if (!activeTab) return;
  const settings = await loadSettings();

  const openInNewTabCb = bindCheckbox('new-tab-cb', settings.openInNewTab, 'openInNewTab');
  bindCheckbox('auto-redirect-cb', settings.autoRedirect, 'autoRedirect');

  const btn = document.getElementById('go-btn') as HTMLButtonElement;
  await setupButton(btn, activeTab, activeTab.url ?? '', openInNewTabCb);
}

init();
