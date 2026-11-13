// Every button (and BaseButton link) gets a hover title: an explicit `title` or `data-tip` tooltip wins,
// otherwise its aria-label or own text. One global listener, so custom buttons can't forget it.
document.addEventListener('pointerover', (event) => {
	const button = (event.target as Element).closest<HTMLElement>('button, .btn');
	if (!button || button.dataset.tip !== undefined || (button.title && !button.dataset.autoTitle)) {
		return;
	}
	button.title = button.getAttribute('aria-label') ?? button.textContent?.trim() ?? '';
	button.dataset.autoTitle = '';
});
