'use strict';

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
		case 'ARCHITECT':
			new ELI_ArchitectOverlay(message.citymap);
			break;
		case 'SOCIETY':
			new ELI_SocietyOverlay(message.targets);
			break;
		case 'ALERT':
			new ELI_AlertOverlay(message.caption, message.text);
			break;
		default:
			break;
		}
	}
});

window.addEventListener('ELI', evt => browser.runtime.sendMessage(evt.detail));

let script = document.createElement('script');
script.src = browser.runtime.getURL('inject.js');
document.head.appendChild(script);
let stylesheet = document.createElement('link');
stylesheet.href = browser.runtime.getURL('content.css');
stylesheet.rel = 'stylesheet';
document.head.appendChild(stylesheet);
