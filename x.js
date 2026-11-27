
{
  /* Kontaktadresse hier eintragen, dann wird der Knopf zum E-Mail-Link */
  const CONTACT = '';
  const btn = document.getElementById('contactBtn');
  if (CONTACT) btn.href = 'mailto:' + CONTACT + '?subject=' + encodeURIComponent('Pilotprojekt Zeitreise Schweiz');
  else btn.addEventListener('click', e => { e.preventDefault(); document.getElementById('contactNote').hidden = false; });

  /* Spiel erst auf Klick laden: die Seite bleibt schnell */
  const poster = document.getElementById('poster');
  poster.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = 'flug-3d.html?embed=1&t=' + Date.now();   /* immer die aktuelle Fassung laden */
    f.title = 'Zeitreise Schweiz – 3D-Flug';
    f.allow = 'fullscreen';
    f.setAttribute('allowfullscreen', '');
    poster.replaceWith(f);
    f.focus();
  });
}
