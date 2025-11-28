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


	// Populate nationality dropdown dynamically ----------------------------------------------------

	const allCountries = [
    "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria","Azerbaijan",
    "Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi",
    "Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica","Côte d'Ivoire","Croatia","Cuba","Cyprus","Czech Republic",
    "Democratic Republic of the Congo","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia",
    "Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana",
    "Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy",
    "Jamaica","Japan","Jordan",
    "Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan",
    "Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg",
    "Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar",
    "Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway",
    "Oman",
    "Pakistan","Palau","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal",
    "Qatar",
    "Romania","Russia","Rwanda",
    "Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria",
    "Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu",
    "Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan",
    "Vanuatu","Vatican City","Venezuela","Vietnam",
    "Yemen",
    "Zambia","Zimbabwe"
];

	function populateNationalityDropdown() {
		const nationalityOptionsContainer = document.querySelector('.custom-select[data-select-name="nationality"] .select-options');
		if (!nationalityOptionsContainer) return;
		// clear existing
		nationalityOptionsContainer.innerHTML = '';
		// prepend default, non-selectable initial option
		const defaultOpt = document.createElement('div');
		defaultOpt.className = 'option';
		defaultOpt.setAttribute('role', 'option');
		defaultOpt.setAttribute('data-value', '');
		defaultOpt.textContent = 'Select nationality';
		nationalityOptionsContainer.appendChild(defaultOpt);

		allCountries.forEach(country => {
			const el = document.createElement('div');
			el.className = 'option';
			el.setAttribute('role', 'option');
			el.setAttribute('data-value', country);
			el.textContent = country;
			nationalityOptionsContainer.appendChild(el);
		});
	}

	// populate now so initCustomSelects will attach handlers to options
	populateNationalityDropdown();

	// --- Custom select components initialization -------------------------------------------------

	function initCustomSelects() {
		const selects = Array.from(document.querySelectorAll('.custom-select'));
		selects.forEach(cs => {
			const hidden = cs.querySelector('input[type="hidden"]');
			const trigger = cs.querySelector('.select-trigger');
			const options = Array.from(cs.querySelectorAll('.option'));
			if (!hidden || !trigger) return;

			// Make options programmatically focusable and initialize aria-selected
			options.forEach((opt, i) => {
				opt.setAttribute('tabindex', '-1');
				if (opt.getAttribute('aria-selected') === 'true') {
					opt.setAttribute('tabindex', '0');
				}
			});

			// Toggle open/close on trigger click
			trigger.addEventListener('click', (ev) => {
				ev.stopPropagation();
				const isOpen = cs.classList.toggle('open');
				trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

				if (isOpen) {
					// when opening, focus the first option (or the selected one)
					const opts = Array.from(cs.querySelectorAll('.option'));
					if (opts.length) {
						let selIdx = opts.findIndex(o => o.getAttribute('aria-selected') === 'true');
						if (selIdx < 0) selIdx = 0;
						opts.forEach(o => o.setAttribute('tabindex','-1'));
						opts[selIdx].setAttribute('tabindex','0');
						opts[selIdx].focus();
					}
				}
			});

			// keyboard handling for trigger (Enter / Space / Escape)
			trigger.addEventListener('keydown', (ev) => {
				if (ev.key === 'Enter' || ev.key === ' ') {
					ev.preventDefault(); trigger.click();
				}
				if (ev.key === 'Escape') {
					cs.classList.remove('open');
					trigger.setAttribute('aria-expanded','false');
				}
			});

			// option selection
			options.forEach(opt => {
				opt.addEventListener('click', (e) => {
					e.stopPropagation();
					selectOption(cs, opt, trigger, hidden);
				});
			});
		});

		// click outside closes any open custom-select
		document.addEventListener('click', (ev) => {
			const open = document.querySelectorAll('.custom-select.open');
			open.forEach(os => {
				if (!os.contains(ev.target)) {
					os.classList.remove('open');
					const t = os.querySelector('.select-trigger');
					if (t) t.setAttribute('aria-expanded','false');
				}
			});
		});
	}

	initCustomSelects();

	// Type-ahead buffer for option search
	let searchBuffer = '';
	let lastKeyPressTime = 0;

	// Helper to perform selection logic for an option
	function selectOption(container, optionEl, triggerEl, hiddenInput) {
		const val = optionEl.getAttribute('data-value') || '';
		const label = (optionEl.textContent || '').trim();
		hiddenInput.value = val;
		triggerEl.textContent = label;
		// mark aria-selected
		const opts = Array.from(container.querySelectorAll('.option'));
		opts.forEach(o => o.removeAttribute('aria-selected'));
		optionEl.setAttribute('aria-selected', 'true');
		// close
		container.classList.remove('open');
		triggerEl.setAttribute('aria-expanded','false');
		// return focus to trigger
		try { triggerEl.focus(); } catch (e) {}
	}

	// Keyboard navigation for open custom-selects
	document.addEventListener('keydown', (ev) => {
		const active = document.querySelector('.custom-select.open');
		if (!active) return;
		const options = Array.from(active.querySelectorAll('.option'));
		if (!options.length) return;
		const key = ev.key;
		// Type-ahead: alphanumeric single characters
		if (key.length === 1 && /^[a-z0-9]$/i.test(key)) {
			// debounce buffer: reset if more than 500ms since last key
			const now = Date.now();
			if (now - lastKeyPressTime > 500) searchBuffer = '';
			searchBuffer += key.toLowerCase();
			lastKeyPressTime = now;
			// search options for first match starting with buffer
			const buff = searchBuffer;
			const matchIdx = options.findIndex(o => (o.textContent || '').trim().toLowerCase().startsWith(buff));
			if (matchIdx >= 0) {
				focusOption(options, matchIdx);
				// ensure the focused option is visible
				try { options[matchIdx].scrollIntoView({block: 'nearest'}); } catch (e) {}
			}
			return;
		}
		if (!['ArrowDown','ArrowUp','Home','End','Enter',' '].includes(key)) return;
		ev.preventDefault();
		let idx = options.indexOf(document.activeElement);
		if (key === 'ArrowDown') {
			if (idx === -1) idx = 0; else idx = (idx + 1) % options.length;
			focusOption(options, idx);
		} else if (key === 'ArrowUp') {
			if (idx === -1) idx = options.length - 1; else idx = (idx - 1 + options.length) % options.length;
			focusOption(options, idx);
		} else if (key === 'Home') {
			focusOption(options, 0);
		} else if (key === 'End') {
			focusOption(options, options.length - 1);
		} else if (key === 'Enter' || key === ' ') {
			if (idx === -1) idx = 0;
			const opt = options[idx];
			const container = active;
			const triggerEl = container.querySelector('.select-trigger');
			const hidden = container.querySelector('input[type="hidden"]');
			if (opt && triggerEl && hidden) selectOption(container, opt, triggerEl, hidden);
		}
	});

	function escapeHtml(str) {
		return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}

	function clearHighlights(options) {
		options.forEach(o => {
			const txt = (o.getAttribute('data-value') || o.textContent || '').trim();
			o.innerHTML = escapeHtml(txt);
		});
	}

	function highlightMatch(options, idx, buff) {
		// buff should be lowercased
		options.forEach((o, i) => {
			const text = (o.textContent || '').trim();
			const lower = text.toLowerCase();
			if (i === idx && buff && lower.startsWith(buff)) {
				const prefix = text.substring(0, buff.length);
				const rest = text.substring(buff.length);
				o.innerHTML = escapeHtml(prefix) + '<span class="match">' + escapeHtml(rest).replace(/^/, '') + '</span>';
				// above: wrap the remainder in .match (visual preference)
			} else {
				o.innerHTML = escapeHtml(text);
			}
		});
	}

	function focusOption(options, idx, buff) {
		const prev = options.find(o => o.getAttribute('tabindex') === '0' || o.getAttribute('aria-selected') === 'true');
		if (prev) {
			prev.setAttribute('tabindex','-1');
			prev.removeAttribute('aria-selected');
		}
		const el = options[idx];
		if (!el) return;
		el.setAttribute('tabindex','0');
		el.setAttribute('aria-selected','true');
		// apply highlight if buffer present
		if (typeof buff === 'string' && buff.length > 0) {
			highlightMatch(options, idx, buff.toLowerCase());
		} else {
			// clear highlights
			clearHighlights(options);
		}
		try { el.focus(); } catch (e) {}
	}
});

