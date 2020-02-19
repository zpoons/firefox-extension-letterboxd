// code based on https://bookmarkify.it/6479
function createImdbUrl(url?: string): string | undefined {
  if (!url) return;

  var p = /\/(?:title|name)\/([a-zA-Z0-9])+\//gi;
  if (p.test(url)) {
    try {
      var x = url?.match(p);
      if (!x) {} else {
        var a = x[0].toString().split("\/")[2];
        return 'https://letterboxd.com/imdb/' + a;
      }
    } catch (e) {
      return undefined;
    }
  };
  return undefined;
}

(async () => {
  const activeTabsResult = await browser.tabs.query({active: true, currentWindow: true});
  if (!activeTabsResult || activeTabsResult.length <= 0) return;
  const currentUrl = activeTabsResult[0].url;
  const imdbUrl = createImdbUrl(currentUrl);
  if (!imdbUrl) return;
  browser.tabs.create({active: true, url: imdbUrl});
})();
