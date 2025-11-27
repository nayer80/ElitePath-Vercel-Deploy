// script.js
document.addEventListener('DOMContentLoaded', () => {
	const nav = document.querySelector('.primary-nav-red');
	const hamburger = document.querySelector('.nav-right .hamburger');
	const navCenter = document.querySelector('.nav-center');

	if (!hamburger || !nav || !navCenter) return;

	// initialize ARIA
	hamburger.setAttribute('aria-expanded', 'false');
	hamburger.setAttribute('aria-controls', 'primary-nav-center');
	navCenter.id = 'primary-nav-center';

	function setOpen(open) {
		const isOpen = typeof open === 'boolean' ? open : !nav.classList.contains('open');
		if (isOpen) {
			nav.classList.add('open');
			hamburger.classList.add('open');
			hamburger.setAttribute('aria-expanded', 'true');
			navCenter.setAttribute('aria-hidden', 'false');
			// when opened, focus the first menuitem for keyboard navigation
			const items = navCenter.querySelectorAll('a[role="menuitem"]');
			if (items && items.length) {
				items[0].focus();
			}
		} else {
			nav.classList.remove('open');
			hamburger.classList.remove('open');
			hamburger.setAttribute('aria-expanded', 'false');
			navCenter.setAttribute('aria-hidden', 'true');
		}
	}


	// Keyboard navigation handler for the mobile menu (ArrowUp/ArrowDown with wrap)
	function handleKeyboardNavigation(e) {
		const items = Array.from(navCenter.querySelectorAll('a[role="menuitem"]'));
		if (!items.length) return;
		const key = e.key;
		if (key !== 'ArrowDown' && key !== 'ArrowUp') return;
		e.preventDefault();
		let idx = items.indexOf(document.activeElement);
		if (idx === -1) {
			// if nothing focused inside, focus first or last depending on key
			idx = key === 'ArrowDown' ? 0 : items.length - 1;
			items[idx].focus();
			return;
		}
		if (key === 'ArrowDown') {
			idx = (idx + 1) % items.length;
		} else if (key === 'ArrowUp') {
			idx = (idx - 1 + items.length) % items.length;
		}
		items[idx].focus();
	}

	// attach keyboard handler to the menu container so arrow keys are managed
	navCenter.addEventListener('keydown', handleKeyboardNavigation);

	// toggle on click
	hamburger.addEventListener('click', (e) => {
		e.stopPropagation();
		setOpen();
	});

	// close when clicking outside
	document.addEventListener('click', (e) => {
		if (!nav.contains(e.target)) setOpen(false);
	});

	// close on escape
	document.addEventListener('keyup', (e) => {
		if (e.key === 'Escape') setOpen(false);
	});

	// ensure correct state on resize
	window.addEventListener('resize', () => {
		if (window.innerWidth >= 900) setOpen(false);
	});
});

