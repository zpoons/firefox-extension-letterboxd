const imdbRegex = /\/(?:title|name)\/([a-zA-Z0-9])+\//gi;

let letterboxdUrl: string | undefined;

function getMovieIdFromIMDbUrl(url: string): string | undefined {
  var matches = url?.match(imdbRegex);
  if (!matches || matches.length <= 0) {
    return;
  };
  // match will look like this: /title/tt6751668/
  return matches[0].toString().split("\/")[2];
}

async function getActiveTabUrl(): Promise<string|undefined> {
  var activeTab = await browser.tabs.query({active: true, currentWindow: true});
  if (!activeTab || activeTab.length <= 0) {
    return;
  };
  return activeTab[0].url;
}

async function updateActiveTab() {
  const url = await getActiveTabUrl();
  const movieId = getMovieIdFromIMDbUrl(url||'');
  if (!movieId) {
    updateIcon(false);
    letterboxdUrl = undefined;
    return;
  }
  letterboxdUrl = 'https://letterboxd.com/imdb/' + movieId;
  updateIcon(true);
}

function updateIcon(isImdbPage: boolean) {
  const ico = isImdbPage ? 'favicon.ico' : 'favicon-grey.ico';
  browser.browserAction.setIcon({
    path: {'48': ico}
  });
  browser.browserAction.setTitle({
    title: letterboxdUrl ? 'go to ' + letterboxdUrl : 'not supported url'
  });
}

function onActionClicked() {
  if (!letterboxdUrl) return;
  browser.tabs.create({active: true, url: letterboxdUrl});
}

/*************************************************************************************************
* action click event handler
*/

browser.browserAction.onClicked.addListener(() => onActionClicked());

/*************************************************************************************************
* all tab change handler
*/

// listen to tab URL changes
browser.tabs.onUpdated.addListener(() => updateActiveTab());

// listen to tab switching
browser.tabs.onActivated.addListener(() => updateActiveTab());

// listen for window switching
browser.windows.onFocusChanged.addListener(() => updateActiveTab());

/*************************************************************************************************
* init
*/

// update when the extension loads initially
updateActiveTab();