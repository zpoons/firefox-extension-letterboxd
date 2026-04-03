function getMovieId(url: string): string | undefined {
  return url.match(/\/(?:title|name)\/([a-zA-Z0-9]+)\//i)?.[1];
}

function getTitleId(url: string): string | undefined {
  return url.match(/\/title\/([a-zA-Z0-9]+)\//i)?.[1];
}

function toLetterboxdUrl(movieId: string): string {
  return `https://letterboxd.com/imdb/${movieId}`;
}

function isLetterboxdPage(url: string): boolean {
  return /letterboxd\.com/.test(url);
}

async function getActiveTab(): Promise<browser.tabs.Tab | undefined> {
  const [tab] = await browser.tabs.query({active: true, currentWindow: true});
  return tab;
}
