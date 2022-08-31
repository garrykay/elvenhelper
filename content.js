'use strict';

// a dialog window with a text/password input and OK and Cancel buttons
class ELI_Dialog {
	constructor() {
		let element = document.querySelector('#eli_dialog') || this.init();
		element.style.display = 'block';
	}

	init() {
		let dialog = document.createElement('div');
		dialog.id = 'eli_dialog';
		dialog.addEventListener('mousemove', evt => evt.stopPropagation());
		let game = document.querySelector('#openfl-content');
		if (game) dialog.style.cursor = game.style.cursor;
		let para = document.createElement('p');
		para.textContent = 'Wonder Society';
		dialog.appendChild(para);
		let label = document.createElement('label');
		label.htmlFor = 'eli_password';
		label.textContent = 'Enter your Wonder Society password:';
		dialog.appendChild(label);
		let input = document.createElement('input');
		input.id = 'eli_password';
		input.type = 'password';
		input.addEventListener('keyup', evt => evt.stopPropagation());
		dialog.appendChild(input);
		let eye = document.createElement('img');
		eye.src = browser.runtime.getURL('eye.png');
		eye.alt = 'Show or hide password';
		eye.addEventListener('click', () => {
			if (input.type == 'password') {
				eye.src = browser.runtime.getURL('eye-crossed.png');
				input.type = 'text';
			} else {
				eye.src = browser.runtime.getURL('eye.png');
				input.type = 'password';
			}
		});
		dialog.appendChild(eye);
		let ok = document.createElement('button');
		ok.className = 'eli_ui';
		ok.textContent = 'OK';
		ok.addEventListener('click', () => {
			let message = {method: 'WonderSociety.password', response: input.value};
			let event = new CustomEvent('ELI', {detail: message});
			window.dispatchEvent(event);
			dialog.style.display = 'none'
			input.value = '';
			input.type = 'password';
			eye.src = browser.runtime.getURL('eye.png'); 
		});
		dialog.appendChild(ok);
		let cancel = document.createElement('button');
		cancel.className = 'eli_ui';
		cancel.textContent = 'Cancel';
		cancel.addEventListener('click', () => {
			dialog.style.display = 'none';
			input.value = '';
			input.type = 'password';
			eye.src = browser.runtime.getURL('eye.png'); 
		});
		dialog.appendChild(cancel);
		return document.body.appendChild(dialog);
	}
}

// adds a menu entry above the existing context menu
class ELI_ContextMenu {
	constructor(x, y) {
		this.element = document.querySelector('#eli_context_menu') || this.init();
		this.element.style.top = `${y - 22}px`;
		this.element.style.left = `${x + 3}px`;
		this.element.style.display = 'block';
	}

	init() {
		let parent = document.querySelector('#openfl-content');
		let contextMenu = document.createElement('div');
		contextMenu.id = 'eli_context_menu';
		if (parent) contextMenu.style.cursor = parent.style.cursor;
		let entry = document.createElement('div');
		entry.className = 'eli_context_entry';
		entry.textContent = 'WS Password...';
		entry.addEventListener('click', () => new ELI_Dialog);
		contextMenu.appendChild(entry);
		let separator = document.createElement('div');
		separator.className = 'eli_context_separator';
		contextMenu.appendChild(separator);
		return (parent || document.body).appendChild(contextMenu);
	}

	element;
}

// A window in the lower left corner that permanently displays the Wonder Society targets
// Only for Wonder Society members of fellowships with registered Wonder Society spreadsheets
class ELI_SocietyOverlay {
	constructor(targets) {
		let element = document.querySelector('#eli_society_overlay') || this.init();
		this.display(element, targets);
	}
	
	init() {
		let overlay = document.createElement('div');
		overlay.id = 'eli_society_overlay';
		overlay.addEventListener('click', () => {
			let message = {method: 'WonderSociety.open', response: ''};
			let event = new CustomEvent('ELI', {detail: message});
			window.dispatchEvent(event);
		});
		let game = document.querySelector('#openfl-content');
		if (game) overlay.style.cursor = game.style.cursor;
		let para = document.createElement('p');
		overlay.appendChild(para);
		for (let i = 0; i < 4; i++)	overlay.appendChild(para.cloneNode(false));
		para.textContent = 'Wonder Society Targets:';
		return document.body.appendChild(overlay);
	}
	
	display(element, targets) {
	let lines = element.querySelectorAll('p');
	let targetCount = 0;
	if (targets.length) {
			targets.unshift({});
			for (let idx = 1; idx < targets.length; idx++) {
				if (targets[idx].filled) {
					lines[idx].className =  'eli_red';
				} else {
					lines[idx].className = '';
					targetCount++;
				}
				lines[idx].textContent = targetCount > 2 ? '' : targets[idx].id;
			}
			element.style.display = 'block';
		} else {
			element.style.display = 'none';
		}
	}
}

// Makes suggestions for Spire Diplomacy and calculates the chance for sucess
class ELI_SpireOverlay {
	constructor(slots) {
		let game = document.querySelector('#openfl-content');
		let cursor = game ? game.style.cursor : 'pointer';
		let overlay = document.querySelector('#eli_spire_overlay') || this.initSlots(cursor);
		let chance = document.querySelector('#eli_spire_chance') || this.initChance(cursor);
		this.display(overlay, chance, slots);
	}

	initSlots(cursor) {
		// should be a list
		let overlay = document.createElement('div');
		overlay.id = 'eli_spire_overlay';
		overlay.style.cursor = cursor;
		let list = document.createElement('ul');
		overlay.appendChild(list);
		let cell = document.createElement('li');
		list.appendChild(cell);
		for (let i = 0; i < 4; i++) {
			list.appendChild(cell.cloneNode(false));			
		}
		return document.body.appendChild(overlay);
	}

	initChance(cursor) {
		let overlay = document.createElement('div');
		overlay.id = 'eli_spire_chance';
		overlay.style.cursor = cursor;
		return document.body.appendChild(overlay);
	}

	display(overlay, chance, slots) {
		let spireSlots = overlay.querySelectorAll('li');
		if (slots && slots.length == 6) {
			for (let i = 0; i < 5; i++) spireSlots[i].textContent = slots[i];
			chance.textContent = `${slots[5]}%`;
			chance.style.color = this.getColor(slots[5]);
			overlay.style.display = 'block';
			chance.style.display = 'block';
		} else {
			overlay.style.display = 'none';
			chance.style.display = 'none';
		}
	}

	getColor(percent) {
		let factor = percent * 1.5 - 50;
		if (factor < 0) factor = 0;
		let red = 249 - 1.47 * factor;
		let green = 34 + 1.18 * factor;
		let blue = 1 + 0.12 * factor;
		return `rgb(${red},${green},${blue})`;
	}
}

// Provides a link to ElvenArchitect without the need for other third party sites
class ELI_ArchitectOverlay {
	constructor(town) {
		let element = document.querySelector('#eli_architect_overlay') || this.init();
		this.display(element, town);
	}

	init() {
		let overlay = document.createElement('div');
		overlay.id = 'eli_architect_overlay';
		let game = document.querySelector('#openfl-content');
		if (game) overlay.style.cursor = game.style.cursor;
		let form = document.createElement('form');
		form.method = 'post';
		form.target = '_blank';
		form.action = 'https://www.elvenarchitect.com/city/planner/';
		overlay.appendChild(form);
		let input = document.createElement('input');
		input.id = 'eli_architect';
		input.type = 'hidden';
		input.name = 'import';
		input.value = '';
		form.appendChild(input);
		let button = document.createElement('button');
		button.type = 'submit';
		button.style.cursor = overlay.style.cursor;
		form.appendChild(button);
		let image = document.createElement('img');
		image.src = browser.runtime.getURL('elvenArchitect.png');
		button.appendChild(image);
		let line = document.createElement('p');
		line.textContent = 'View City on ElvenArchitect';
		button.appendChild(line);
		return document.body.appendChild(overlay);
	}

	display(element, town) {
		let input = element.querySelector('#eli_architect');
		if (town) input.value = town;
		element.style.display = town ? 'block' : 'none';
	}
}

// A notification window
class ELI_AlertOverlay {
	constructor(caption, text) {
		let element = (document.querySelector('#eli_alert_overlay')) || this.init();
		this.display(element, caption,text);
		element.style.display = 'block';
	}

	init() {
		let overlay = document.createElement('div');
		overlay.id = 'eli_alert_overlay';
		let line = document.createElement('p');
		overlay.appendChild(line);
		overlay.appendChild(line.cloneNode(false));
		let button = document.createElement('button');
		button.className = 'eli_ui';
		button.textContent = 'OK';
		button.addEventListener('click', () => overlay.style.display = 'none');
		overlay.appendChild(button);
		return document.body.appendChild(overlay);
	}

	display(element, caption, text) {
		let lines = element.querySelectorAll('p');
		if (caption == 'Warning') {
			lines[0].className = 'eli_red';
		} else if (caption == 'Information') {
			lines[0].className = 'eli_green';
		} else {
			lines[0].className = '';
		}
		lines[0].textContent = caption;
		lines[1].innerText = text;
	}
}

browser.runtime.onMessage.addListener(message => {
	if (message) {
		switch(message.type) {
		case 'SPIRE':
			new ELI_SpireOverlay(message.slots);
			break;
		case 'ARCHITECT':
			new ELI_ArchitectOverlay(message.citymap);
			break;
		case 'SOCIETY':
			new ELI_SocietyOverlay(message.targets);
			break;
		case 'ALERT':
			new ELI_AlertOverlay(message.caption, message.text);
			break;
		case 'PROMPT':
			new ELI_Dialog;
			break;
		default:
			break;
		}
	}
});

window.addEventListener('ELI', evt => {
	if (evt.detail == 'LOAD') new ELI_SpireOverlay;
	else browser.runtime.sendMessage(evt.detail);
});

window.addEventListener('contextmenu', evt => new ELI_ContextMenu(evt.x, evt.y));

window.addEventListener('click', () => {
	let context = document.querySelector('#eli_context_menu');
	if (context) context.style.display = 'none';
});

window.addEventListener('keydown', evt => {
	if (evt.key == 'Escape') {
		let context = document.querySelector('#eli_context_menu');
		if (context) context.style.display = 'none';
	};
});


let script = document.createElement('script');
script.src = browser.runtime.getURL('inject.js');
document.head.appendChild(script);
let stylesheet = document.createElement('link');
stylesheet.href = browser.runtime.getURL('content.css');
stylesheet.rel = 'stylesheet';
document.head.appendChild(stylesheet);
