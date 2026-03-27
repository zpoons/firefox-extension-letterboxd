function getImdbLink(): HTMLAnchorElement | null {
  return document.querySelector<HTMLAnchorElement>('a[href*="imdb.com/title/"]');
}

// Respond to popup requests for the IMDb URL
browser.runtime.onMessage.addListener((msg: object) => {
  if ((msg as {type?: string}).type !== 'get-imdb-url') return Promise.resolve(null);
  return Promise.resolve({imdbUrl: getImdbLink()?.href ?? null});
});

// Proactively notify background once the page is loaded so it can update the icon
browser.runtime.sendMessage({type: 'letterboxd-page-loaded', imdbUrl: getImdbLink()?.href ?? null});
