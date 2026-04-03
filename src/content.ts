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

// Inject a "Go to IMDb" button on Letterboxd "not found" pages (e.g. /imdb/tt1234567/)
function tryInjectNotFoundButton(): void {
  if (document.getElementById('lbd-imdb-btn')) return;
  const match = window.location.pathname.match(/^\/imdb\/([a-zA-Z0-9]+)\/?$/);
  if (!match) return;

  let h1: Element | null = null;
  for (const el of document.querySelectorAll('h1')) {
    if (el.textContent?.includes("No-one has added")) {
      h1 = el;
      break;
    }
  }
  if (!h1) return;

  const targetEl = h1.nextElementSibling?.tagName === 'P' ? h1.nextElementSibling : h1;

  const movieId = match[1];
  const btn = document.createElement('button');
  btn.id = 'lbd-imdb-btn';
  btn.textContent = 'View on IMDb';
  btn.style.cssText = [
    'background-color:#F5C518',
    'color:#000000',
    'font-weight:700',
    'font-size:0.9em',
    'letter-spacing:0.05em',
    'border:none',
    'border-radius:4px',
    'padding:0.5em 1.4em',
    'cursor:pointer',
  ].join(';');

  const wrapper = document.createElement('p');
  wrapper.style.cssText = 'text-align:center;margin-top:1em;';
  wrapper.appendChild(btn);

  btn.addEventListener('click', () => {
    browser.runtime.sendMessage({type: 'go-to-imdb', movieId});
  });

  targetEl.insertAdjacentElement('afterend', wrapper);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', tryInjectNotFoundButton);
} else {
  tryInjectNotFoundButton();
}
