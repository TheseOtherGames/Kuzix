// Every button (and BaseButton link) gets a hover title: an explicit `title` or `data-tip` tooltip wins,
// otherwise its aria-label or own text. One global listener, so custom buttons can't forget it.
document.addEventListener('pointerover', (event) => {
	const el = (event.target as Element).closest<HTMLElement>('button, .btn');
	if (!el || el.dataset.tip !== undefined || (el.title && !el.dataset.autoTitle)) {
		return;
	}
	el.title = el.getAttribute('aria-label') ?? el.textContent?.trim() ?? '';
	el.dataset.autoTitle = '';
});
