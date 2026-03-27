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

// Fired by letterboxdContent.ts once the Letterboxd page has loaded, so we can update the icon
browser.runtime.onMessage.addListener(async (msg: object, sender: browser.runtime.MessageSender) => {
  const {type, imdbUrl} = msg as {type?: string; imdbUrl?: string | null};
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

updateIconForActiveTab();
