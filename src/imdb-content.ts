function injectLetterboxdButton(): void {
  if (!getMovieId(window.location.href)) return;
  if (document.getElementById('lbd-header-btn')) return;

  const proSection = document.querySelector<HTMLElement>('.navbar__imdbpro');
  if (!proSection) return;

  const btn = document.createElement('a');
  btn.id = 'lbd-header-btn';
  btn.title = 'View on Letterboxd';
  btn.setAttribute('aria-label', 'View on Letterboxd');
  btn.style.cssText = [
    'display:inline-flex',
    'align-items:center',
    'justify-content:center',
    'cursor:pointer',
    'padding:0 8px',
    'height:100%',
    'opacity:0.75',
    'transition:opacity 0.15s',
  ].join(';');

  const img = document.createElement('img');
  img.src = browser.runtime.getURL('favicon-48.png');
  img.width = 24;
  img.height = 24;
  img.alt = 'Letterboxd';
  img.style.cssText = 'display:block;border-radius:3px;';
  btn.appendChild(img);

  btn.addEventListener('mouseenter', () => { btn.style.opacity = '1'; });
  btn.addEventListener('mouseleave', () => { btn.style.opacity = '0.75'; });
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    browser.runtime.sendMessage({type: 'go-to-letterboxd'});
  });

  proSection.parentElement!.insertBefore(btn, proSection);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectLetterboxdButton);
} else {
  injectLetterboxdButton();
}
