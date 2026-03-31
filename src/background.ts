function setActionIcon(tooltip: string | undefined): void {
  browser.browserAction.setIcon({path: {'48': tooltip ? 'favicon.ico' : 'favicon-grey.ico'}});
  browser.browserAction.setTitle({title: tooltip ?? 'Not a supported URL'});
}

async function getTooltipForTab(tab: browser.tabs.Tab): Promise<string | undefined> {
  const url = tab.url ?? '';
  const movieId = getMovieId(url);
  if (movieId) return `Go to ${toLetterboxdUrl(movieId)}`;

  if (isLetterboxdPage(url) && tab.id !== undefined) {
    try {
      const response = await browser.tabs.sendMessage(tab.id, {type: 'get-imdb-url'}) as {imdbUrl: string | null} | null;
      return response?.imdbUrl ? 'Go to IMDb' : undefined;
    } catch {
      return undefined;
    }
  }

  return undefined;
}

async function updateIconForActiveTab(): Promise<void> {
  const tab = await getActiveTab();
  if (!tab) return;
  setActionIcon(await getTooltipForTab(tab));
}

async function handleTabUrlChange(tabId: number, url: string): Promise<void> {
  const movieId = getMovieId(url);

  const activeTab = await getActiveTab();
  if (activeTab?.id === tabId) {
    // For Letterboxd pages the icon starts grey and is updated by the proactive content script message
    setActionIcon(movieId ? `Go to ${toLetterboxdUrl(movieId)}` : undefined);
  }

  if (!movieId) return;

  const stored = await browser.storage.local.get(['autoRedirect', 'skipNextRedirectForMovie']);
  if (stored.skipNextRedirectForMovie === movieId) return;

  if (stored.skipNextRedirectForMovie) {
    browser.storage.local.remove('skipNextRedirectForMovie');
  }

  if (stored.autoRedirect) {
    browser.tabs.update(tabId, {url: toLetterboxdUrl(movieId)});
  }
}

async function handleIconClick(tab: browser.tabs.Tab): Promise<void> {
  const url = tab.url ?? '';
  const stored = await browser.storage.local.get(['openInNewTab']);
  const openInNewTab = stored.openInNewTab !== false;

  if (isLetterboxdPage(url) && tab.id !== undefined) {
    try {
      const response = await browser.tabs.sendMessage(tab.id, {type: 'get-imdb-url'}) as {imdbUrl: string | null} | null;
      const imdbUrl = response?.imdbUrl;
      if (!imdbUrl) return;
      const movieId = getMovieId(imdbUrl);
      if (movieId) await browser.storage.local.set({skipNextRedirectForMovie: movieId});
      if (openInNewTab) {
        browser.tabs.create({active: true, url: imdbUrl});
      } else {
        browser.tabs.update(tab.id, {url: imdbUrl});
      }
    } catch {
      return;
    }
    return;
  }

  const movieId = getMovieId(url);
  if (!movieId) return;

  if (openInNewTab) {
    browser.tabs.create({active: true, url: toLetterboxdUrl(movieId)});
  } else {
    browser.tabs.update(tab.id!, {url: toLetterboxdUrl(movieId)});
  }
}

async function initMenus(): Promise<void> {
  const stored = await browser.storage.local.get(['openInNewTab', 'autoRedirect']);
  browser.menus.create({
    id: 'open-in-new-tab',
    title: 'Open in new tab',
    type: 'checkbox',
    checked: stored.openInNewTab !== false,
    contexts: ['browser_action'],
  });
  browser.menus.create({
    id: 'auto-redirect',
    title: 'Auto redirect',
    type: 'checkbox',
    checked: !!stored.autoRedirect,
    contexts: ['browser_action'],
  });
}

// Fired by letterboxdContent.ts once the Letterboxd page has loaded, so we can update the icon
browser.runtime.onMessage.addListener(async (msg: object, sender: browser.runtime.MessageSender) => {
  const {type, imdbUrl, movieId} = msg as {type?: string; imdbUrl?: string | null; movieId?: string};

  if (type === 'go-to-imdb' && movieId && sender.tab?.id !== undefined) {
    const stored = await browser.storage.local.get(['openInNewTab']);
    const openInNewTab = stored.openInNewTab !== false;
    const path = movieId.startsWith('nm') ? 'name' : 'title';
    const url = `https://www.imdb.com/${path}/${movieId}/`;
    await browser.storage.local.set({skipNextRedirectForMovie: movieId});
    if (openInNewTab) {
      browser.tabs.create({active: true, url});
    } else {
      browser.tabs.update(sender.tab.id, {url});
    }
    return Promise.resolve(null);
  }

  if (type !== 'letterboxd-page-loaded' || sender.tab?.id === undefined) return Promise.resolve(null);

  const activeTab = await getActiveTab();
  if (activeTab?.id !== sender.tab.id) return Promise.resolve(null);

  setActionIcon(imdbUrl ? 'Go to IMDb' : undefined);
  return Promise.resolve(null);
});

browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) handleTabUrlChange(tabId, changeInfo.url);
});

browser.tabs.onActivated.addListener(() => updateIconForActiveTab());
browser.windows.onFocusChanged.addListener(() => updateIconForActiveTab());

browser.browserAction.onClicked.addListener(handleIconClick);

browser.menus.onClicked.addListener((info) => {
  if (info.menuItemId === 'open-in-new-tab') {
    browser.storage.local.set({openInNewTab: info.checked});
  } else if (info.menuItemId === 'auto-redirect') {
    browser.storage.local.set({autoRedirect: info.checked});
  }
});

updateIconForActiveTab();
initMenus();
