// script.js
document.addEventListener('DOMContentLoaded', () => {
	const nav = document.querySelector('.primary-nav-red');
	const hamburger = document.querySelector('.nav-right .hamburger');
	const navCenter = document.querySelector('.nav-center');
	const menuLive = document.getElementById('menu-live');

	// helper to update tabindex for menu items; value should be string '0' or '-1'
	function setMenuTabIndex(value) {
		const items = navCenter.querySelectorAll('a[role="menuitem"]');
		items.forEach(item => {
			try { item.setAttribute('tabindex', String(value)); } catch (e) { /* ignore */ }
		});
	}

	if (!hamburger || !nav || !navCenter) return;

	// initialize ARIA
	hamburger.setAttribute('aria-expanded', 'false');
	hamburger.setAttribute('aria-controls', 'primary-nav-center');
	navCenter.id = 'primary-nav-center';

	// ensure menu items are not tabbable initially when menu is closed
	setMenuTabIndex('-1');

	function setOpen(open) {
		const isOpen = typeof open === 'boolean' ? open : !nav.classList.contains('open');
		if (isOpen) {
			nav.classList.add('open');
			hamburger.classList.add('open');
			hamburger.setAttribute('aria-expanded', 'true');
			navCenter.setAttribute('aria-hidden', 'false');
			// make menu items tabbable again
			setMenuTabIndex('0');
			// when opened, focus the first menuitem for keyboard navigation
			const items = navCenter.querySelectorAll('a[role="menuitem"]');
			if (items && items.length) {
				items[0].focus();
				// announce the menu opened and the first focused item
				announce('Menu opened');
				setTimeout(() => announceCurrentFocused(), 120);
			}
		} else {
			nav.classList.remove('open');
			hamburger.classList.remove('open');
			hamburger.setAttribute('aria-expanded', 'false');
			navCenter.setAttribute('aria-hidden', 'true');
			// remove from tab sequence when closed
			setMenuTabIndex('-1');
			// move focus back to the hamburger so keyboard users are not trapped
			try { hamburger.focus(); } catch (e) { /* ignore focus errors */ }
			announce('Menu closed');
		}
	}


	// Keyboard navigation handler for the mobile menu (ArrowUp/ArrowDown with wrap)
	function handleKeyboardNavigation(e) {
		const items = Array.from(navCenter.querySelectorAll('a[role="menuitem"]'));
		if (!items.length) return;
		const key = e.key;
		// handle navigation keys: ArrowDown/ArrowUp, PageDown/PageUp, Home/End
		if (!['ArrowDown','ArrowUp','PageDown','PageUp','Home','End'].includes(key)) return;
		e.preventDefault();
		let idx = items.indexOf(document.activeElement);
		// if focus is not within the items, send focus to start/end depending on key
		if (idx === -1) {
			if (key === 'ArrowDown' || key === 'PageDown' || key === 'Home') {
				items[0].focus();
				return;
			}
			if (key === 'ArrowUp' || key === 'PageUp' || key === 'End') {
				items[items.length - 1].focus();
				return;
			}
		}
		// handle Home/End explicitly
		if (key === 'Home') {
			items[0].focus();
			return;
		}
		if (key === 'End') {
			items[items.length - 1].focus();
			return;
		}
		// PageUp/PageDown mirror ArrowUp/ArrowDown behavior
		if (key === 'PageDown') key = 'ArrowDown';
		if (key === 'PageUp') key = 'ArrowUp';
		if (key === 'ArrowDown') {
			idx = (idx + 1) % items.length;
		} else if (key === 'ArrowUp') {
			idx = (idx - 1 + items.length) % items.length;
		}
		items[idx].focus();
		// announce the newly focused item
		setTimeout(() => announceCurrentFocused(), 60);
	}

	function announce(text) {
		if (!menuLive) return;
		// Clear then set so SR picks up repeated announcements
		menuLive.textContent = '';
		setTimeout(() => { menuLive.textContent = text; }, 60);
	}

	function announceCurrentFocused() {
		if (!menuLive) return;
		const items = Array.from(navCenter.querySelectorAll('a[role="menuitem"]'));
		const active = document.activeElement;
		const idx = items.indexOf(active);
		let label = '';
		if (active) {
			label = (active.innerText || active.textContent || '').trim();
		}
		if (idx >= 0) {
			announce(`${label}. ${idx + 1} of ${items.length}`);
		} else if (label) {
			announce(label);
		}
	}

	// attach keyboard handler to the menu container so arrow keys are managed
	navCenter.addEventListener('keydown', handleKeyboardNavigation);

	// announce focus changes triggered by mouse or programmatic focus
	navCenter.addEventListener('focusin', () => { setTimeout(() => announceCurrentFocused(), 40); });

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

