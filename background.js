'use strict';

// -----------------------------------------------------------------------

// ELI_World provides an association between tabID and the local storage. We do need this since it
// is possible to have different cities in different tabs.
class ELI_World {
	constructor(world) {
		let w = world || {};
		this.id = w.id || '';
		this.tab = w.tab || -1;
		this.server = w.server || '';
		this.key = w.key || '';
		if (w.url) this.server = w.url.replace(/https?:\/\/(\w+)\..*/, '$1');
	}

	set player(playerId) {
		if (this.server && playerId) this.id = `${this.server}_${playerId}`;
	}

	get valid() {
		return this.id != '';
	}

	// the id consists of the server code and the player id within the server.
	id;
	// the tabId of the tab
	tab;
	// the server code, two letters for the language plus one digit
	server;
	// the key of the Wonder Society google spreadsheet 
	key;
}

// -----------------------------------------------------------------------

// container for ELI_World
class ELI_Worlds {
	constructor(worlds) {
		let w = worlds || {};
		this.worlds = w.worlds || [];
	}	

	// insert a new world or replace an existing one
	insert(world) {
		this.remove(world.tab);
		this.worlds.push(world);
	}

	// remove the world with a given tab id
	remove(tabId) {
		this.worlds = this.worlds.filter(w => w.tab != tabId);
	}

	// returns the world with a given tab id or null if no such world exists
	getWorld(tabId) {
		let world = this.worlds.find(w => w.tab == tabId);
		return world ? new ELI_World(world) : null;
	}

	// array of ELI_World
	worlds;
}

// -----------------------------------------------------------------------

// player representation
class ELI_Player {
	constructor(player) {
		let p = player || {};
		this.id = p.id || p.player_id || 0;
		this.name = p.name || p.user_name || '';
		this.societyMember = p.societyMember || false;
	}

	// player ID
	id;
	// the displayed name
	name;
	// whether or not the player is member of the Wonder Society
	societyMember;
}

// -----------------------------------------------------------------------

// fellowship representation
class ELI_Guild {
	constructor(guild) {
		let g = guild || {};
		this.id = g.id || 0;
		this.name = g.name || '';
		this.members = g.members || [];
	}

	// add new members and remove the ones that are no longer part of the fellowship
	updateMembers(members) {
		this.members = this.members.filter(m => members.find(g => g.player.player_id == m.id));
		for (const member of members) {
			if (!this.members.find(m => m.id == member.player.player_id)) {
				this.members.push(new ELI_Player(member.player));
			}
		}
	}

	// sets the Wonder Society membership status
	updateSocietyMembers(societyMembers) {
		for (const member of this.members) {
			member.societyMember = societyMembers.includes(member.name);
		}
	}

	// returns the member with a given id or name. Null if not existing
	getMember(idOrName) {
		let member = this.members.find(m => m.id == idOrName || m.name == idOrName);
		return member ? new ELI_Player(member) : null;
	}

	// fellowship ID
	id;
	// its displayed name
	name;
	// its members as array of ELI_Player
	members;
}

// -----------------------------------------------------------------------

// ancient wonder representation
class ELI_Wonder {
	constructor(wonder, owner) {
		let w = wonder || {};
		this.id = w.id || w.entityBaseName || '';
		this.owner = owner || w.owner || '';
		if (w.name) this.name = this.correctName(w.name);
		else this.name = this.getName(this.id) || '';
		this.size = w.size || w.requiredKnowledgePoints || 0;
		this.invested = w.invested || w.investedKnowledgePoints || 0;
	}

	// maps ids to names
	getName(id) {
		const awNames = {
			B_All_AW1: "Tome of Secrets",
			B_All_AW2: "Golden Abyss",
			B_All_AW3: "Endless Excavation",
			B_All_AW4: "Needles of the Tempest",
			B_All_AW5: "Watchtower Ruins",
			B_All_AW6: "Thrones of the High Men",
			B_Elves_AW1: "Martial Monastery",
			B_Elves_AW2: "Crystal Lighthouse",
			B_Humans_AW1: "The Sanctuary",
			B_Humans_AW2: "The Great Bell Spire",
			B_Dwarfs_AW1: "Dwarven Bulwark",
			B_Dwarfs_AW2: "Mountain Halls",
			B_Fairies_AW1: "Prosperity Towers",
			B_Fairies_AW2: "Blooming Trader Guild",
			B_Orcs_AW1: "Heroes' Forge",
			B_Orcs_AW2: "Shrine of the Shrewdy Shrooms",
			B_Gr4_AW1: "Enar's Embassy",
			B_Gr4_AW2: "Flying Academy",
			B_Gr5_AW1: "Maze of the Dark Matter",
			B_Gr5_AW2: "Dragon Abbey",
			B_Gr6_AW1: "Temple of the Toads",
			B_Gr6_AW2: "Elvenar Trade Center",
			B_Gr7_AW1: "Sunset Towers",
			B_Gr7_AW2: "Victory Springs",
			B_Gr8_AW1: "Pyramid of Purification",
			B_Gr8_AW2: "Lighthouse of Good Neighborhood",
			B_Gr9_AW1: "D111-a \"Timewarp\"",
			B_Gr9_AW2: "D222-z \"Simia Sapiens\"",
			B_Gr10_AW1: "Vortex of Storage",
			B_Gr10_AW2: "Thermal Spring of Youth",
			B_Gr11_AW1: "Spire Library",
			B_Gr11_AW2: "Tournament Arena",
			B_Ch17_AW1: "Dragon Ark",
			B_Ch17_AW2: "Oracle of Fortune",
			B_Ch18_AW1: "Shrine of the Champions",
			B_Ch18_AW2: "Temple of Spirits",
			B_Ch19_AW1: "Vallorian Seal Tower",
			B_Ch19_AW2: "Tree of Enlightenment"
		}
		return awNames[id];
	}

	// some Wonder Society sheets use wrong names in their internal data, those are
	// mapped to match their in-game names 
	correctName(awName) {
		const names = {
			'D111-a Timewarp': 'D111-a "Timewarp"',
			'D222-z Simia Sapiens': 'D222-z "Simia Sapiens"',
			'Enars Embassy': "Enar's Embassy",
			'Endless excavation': 'Endless Excavation',
			'Great Bell Spire': 'The Great Bell Spire',
			'Heroes Forge':	"Heroes' Forge",
			'Sanctuary': 'The Sanctuary',
			'Simia Sapiens': 'D222-z "Simia Sapiens"',
			'Temple of the toads': 'Temple of the Toads',
			'Timewarp': 'D111-a "Timewarp"',
			'Tome of secrets': 'Tome of Secrets',
		};
		return names[awName] || awName;
	}
	
	// indicates when a wonder has received all necessary KP for that level
	get filled() {
		return this.size == this.invested;
	}
	
	// the entity base name is unique, so is used as id
	id;
	// the player that owns this ancient wonder
	owner;
	// the name of the wonder
	name;
	// the amount of KP needed to fill this level
	size;
	// the amount of KP already invested into this wonder
	invested;
}

// -----------------------------------------------------------------------

// container for ELI_Wonder
class ELI_Wonders {
	constructor(wonders) {
		let w = wonders || {};
		this.wonders = w.wonders || [];
	}

	// append a wonder or update it
	insert(wonder) {
		let index = this.wonders.findIndex(w => w.owner == wonder.owner && w.name == wonder.name);
		if (index < 0) {
			this.wonders.push(wonder);
		} else {
			if (wonder.id) this.wonders[index].id = wonder.id;
			if (wonder.size > this.wonders[index].size) this.wonders[index].size = wonder.size;
			if (wonder.invested > this.wonders[index].invested) this.wonders[index].invested = wonder.invested;
		}
	}

	// returns the wonder with a given owner and name. Null if not existing
	find(owner, name) {
		let w = this.wonders.find(w => w.owner == owner && w.name == name);
		return w ? new ELI_Wonder(w) : null;
	}

	// access to the wonders array
	getWonder(index) {
		return new ELI_Wonder(this.wonders[index]);
	}

	// access to the wonders array
	get length() {
		return this.wonders.length;
	}

	// array of ELI_Wonder
	wonders;
}

// -----------------------------------------------------------------------

// collects information about ancient wonders and makes them available
class ELI_WonderHandler {
	constructor(world) {
		this.world = world;
		this.playerWonders = new ELI_Wonders;
		this.societyWonders = {};
		this.player = {};
		this.guild = {};
		this.value = {};
	}

	// awPhases holds information about all wonders of one player
	update(awPhases) {
		return browser.storage.local.get(this.world.id)
		.then(storage => {
			this.value = storage[this.world.id] || {};
			this.guild = new ELI_Guild(this.value.guild);
			this.player = new ELI_Player(this.value.player);
			this.societyWonders = new ELI_Wonders(this.value.wonders);
			this.upgradable = this.value.upgradable || [];
			let owner = this.guild.getMember(awPhases[0].playerId);
			if (owner) {
				for (const awPhase of awPhases) {
					if (awPhase.__class__ == "ResearchPhaseVO") {
						let wonder = new ELI_Wonder(awPhase, owner.name);
						this.playerWonders.insert(wonder);
					}
				}
			}
			// access the Wonder Society sheet of this fellowship
			let sheet = new ELI_Sheet(this.world.key);
			return sheet.query();
		})
		.then(table => {
			if (table.length) {
				// find the table caption
				let header = table.find(t => t.length && t[1] == 'Person') || [];
				let wIndex = header.indexOf('Wonder');
				let sIndex = header.indexOf('Size');
				if (wIndex > 0 && sIndex > 0) {
					// only active rows
					let rows = table.filter(t => ['A', 'B1', 'B2', 'D'].includes(t[0]));
					let wonders = this.societyWonders;
					this.societyWonders = new ELI_Wonders;
					for (const row of rows) {
						let wonder = new ELI_Wonder({owner: row[1], name: row[wIndex], size: row[sIndex]});
						let societyWonder = wonders.find(wonder.owner, wonder.name) || wonder;
						societyWonder.size = wonder.size;
						this.societyWonders.insert(societyWonder);
					}
					this.value.wonders = this.societyWonders;
					// only Wonder Society members will get a display of the targets
					if (this.player.societyMember) this.setTargets();
				}
				// notify about wonders that are ready to upgrade
				if (this.player.id == awPhases[0].playerId) this.testOwn();
			}
			return browser.storage.local.set({[this.world.id]: this.value});
		})
	}

	// displays the Wonder Society targets
	setTargets() {
		let targets = [];
		let w = this.playerWonders.getWonder(0);
		let owner = w ? w.owner : ''; 
		for (let i = 0; i < this.societyWonders.length; i++) {
			let wonder = this.societyWonders.getWonder(i);
			if (wonder.owner == owner) {
				wonder = this.playerWonders.find(wonder.owner, wonder.name);
				if (wonder) this.societyWonders.insert(wonder);
				wonder = this.societyWonders.getWonder(i);
			}
			if (wonder.owner && wonder.name) {
				let suffix = wonder.owner.slice(-1) == 's' ? "'" : "'s";
				let target = {id: `${wonder.owner}${suffix} ${wonder.name}`, filled: wonder.filled};
				if (targets.push(target) == 4) break;
			}
		}
		let message = new ELI_Message(this.world);
		message.setSocietyTargets(targets);
	}

	// informs the user about upgradable wonders
	testOwn() {
		let upgradable = [];
		for (let i = 0; i < this.playerWonders.length; i++) {
			let wonder = this.playerWonders.getWonder(i);
			if (wonder.filled) {
				let societyWonder = this.societyWonders.find(wonder.owner, wonder.name);
				if (!societyWonder || societyWonder.size > wonder.size) {
					if (!this.upgradable.includes(wonder.name)) {
						upgradable.push(wonder.name);
						this.upgradable.push(wonder.name);
					}
				}
			}
		}		
		if (upgradable.length) {
			let text = '';
			let message = new ELI_Message(this.world);
			for (const u of upgradable) text += `Your ${u} is ready to upgrade.\n`;
			message.alert('Information', text);
			this.value.upgradable = this.upgradable;
		}
	}
		
	world;
	// the player's wonders
	playerWonders;
	// the currently active wonders of the Wonder Society
	societyWonders;
	player;
	guild;
	// the local storage for this world
	value;
	// the upgradable wonder the user has received a notification
	upgradable;
}

// -----------------------------------------------------------------------

// initializes everything
class ELI_StartupHandler {
	constructor(world) {
		this.world = new ELI_World(world);
		this.value ={};
	}

	startup(obj) {
		this.world.player = obj.user_data.player_id;
		browser.storage.local.get(this.world.id)
		.then (value => {
			// get the stored information for this world
			this.value = value[this.world.id] || {};
			// find the wonder society sheet
			let id = `${this.world.server}_${obj.guild.id}`;
			switch (id) {
				case "en1_14720":
					this.world.key = "1ux8S8QJpISAKU3veOJHvdvNAGN5mgMKJLfQcqFdlw7U";
					break;
				default:
					this.world.key = "";
					break;
			}
			if (!this.world.key) {
				let message = new ELI_Message(this.world);
				message.alert('Warning', 'No Wonder Society spreadsheet found for your fellowship.');
			}
			return browser.storage.local.get('worlds');
		})
		.then (value => {
			// update the worlds to include this one
			let w = value.worlds || {};
			let worlds = new ELI_Worlds(w);
			worlds.insert(this.world);
			return browser.storage.local.set({worlds: worlds});
		})
		.then(() => {
			// update the guild
			this.value.guild =  new ELI_Guild(this.value.guild || {id: obj.guild.id, name: obj.guild.name});
			this.value.guild.updateMembers(obj.guild.members);
			let sheet = new ELI_Sheet(this.world.key);
			return sheet.query()
		})
		.then(table => {
			// update the Wonder Society membership
			let row = table.find(t => t[1] == 'Person') || [];
			let start = row.indexOf('Total') + 1;
			let societyMembers = row.slice(start, -1);
			if (societyMembers.length) this.value.guild.updateSocietyMembers(societyMembers);
			this.value.player = this.value.guild.getMember(obj.user_data.player_id);
			this.value.upgradable = [];
			return browser.storage.local.set({[this.world.id]: this.value});
		})
		.then(() => {
			// handle Ancient Wonder information
			let awHandler = new ELI_WonderHandler(this.world);
			return awHandler.update(obj.ancient_wonder_phases);
		})
		.then(() => {
			// create a link to the city's representation in elvenarchitect
			let cityMap = new ELI_Citymap(obj.city_map, obj.user_data.race);
			cityMap.send(this.world);
		})
	}
	
	world;
	// the local storage for this world
	value;
}

// -----------------------------------------------------------------------

// send messages via browser.tabs
class ELI_Message {
	constructor(world) {
		this.tabId = world ? world.tab : 0;
	}

	send(message) {
		if (this.tabId > 0) browser.tabs.sendMessage(this.tabId, message);
	}
	
	setCitymap(citymap) {
		this.send({type: 'ARCHITECT', citymap: citymap});
		let self = this;
	  	if (citymap) setTimeout(() => self.setCitymap(null), 12000);
	}

	setSocietyTargets(targets) {
		this.send({type: 'SOCIETY', targets: targets});
	}

	alert(caption, text) {
		this.send({type: 'ALERT', caption: caption, text: text});
	}
	
	tabId;
}

// -----------------------------------------------------------------------

// read a google sheets spreadsheet
class ELI_Sheet {
	constructor(key) {
		// using the preview to ignore the hidden cells
		this.url = `https://docs.google.com/spreadsheets/d/${key}/preview/sheet?gid=0`;
	}

	query() {
		return fetch(this.url, {credentials: 'omit'})
		.then(response => {
			const reader = response.body.getReader();
			return new ReadableStream({
				start(controller) {
				   function pump() {
						return reader.read().then(({ done, value }) => {
						 if (done) {
							 controller.close();
							 return;
						 }
						 controller.enqueue(value);
						 return pump();
					  });
					}
					return pump();
				}
			 });
		})
		.then(stream => new Response(stream))
		.then(response => response.blob())
		.then(blob => blob.text())
		.then(sheet => {
			let start = sheet.indexOf('<tbody');
			start = sheet.indexOf('>', start) + 1;
			let end = sheet.indexOf('</tbody>', start);
			return this.readTable(sheet.substring(start, end));
		})
		.catch(() => new Promise(resolve => resolve([])));
	}

	readTable(table) {
		let rows = [];
		let columns = [];
		let value = '';
		let lines = table.split('>');
		lines.pop();
		for (let line of lines) {
			if (!line) break;
			if (line[0] != '<') {
				let end = line.indexOf('<');
				value = line.substring(0, end);
				line = line.substring(end);
			}
			switch (line.substring(0, 3)) {
				case '<tr':
					columns = [];
					break;
				case '</t':
					switch(line[3]) {
						case 'r':
							rows.push(columns);
							break;
						case 'd':
							columns.push(this.decode(value));
						default:
					}
					break;
				case '<td':
					value = '';
				default:
			}
		}
		return new Promise(resolve => resolve(rows));
	}

	decode(string) {
		if (string.includes('&')) {
			string = string.replaceAll('&quot;', '"').replaceAll('&amp;', '&').replaceAll('&lt;', '<')
				.replaceAll('&gt;', '>').replaceAll('&#39;', "'");
		}
		return string;
	}

	url;
}

// -----------------------------------------------------------------------

// interface to elvenarchitect
class ELI_Citymap {
	constructor (town, race) {
		let areas = [];
		let entities = [];
		let id = 1;
		for (const area of town.unlocked_areas) {
			areas.push({x: area.x || 0, y: area.y || 0, width: area.width, length: area.length});		
		}
		for (const entity of town.entities) {
			entities.push({id: id++, cityentity_id: entity.cityentity_id, x: entity.x, y: entity.y, stage: entity.stage || null});
		}
		this.eaData = {
			city_map: {unlocked_areas: areas, entities: entities},
			user_data: {race: race},
			ea_data: {cultureBonus: 1, completedProvinces: 0, battleSquadsize: 0, encountersPoints:0, tournamentPoints:0,
				producing: [], relicCounts: [], relicBoosts: []}
		};
	}

	send(world) {
		let message = new ELI_Message(world);
		message.setCitymap(btoa(JSON.stringify(this.eaData)));
	}

	eaData;
}

// -----------------------------------------------------------------------

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (tab && tab.status === 'complete' && tab.url.match(/elvenar\.com\/game/ )) {
		browser.storage.local.get('worlds')
		.then(value => {
			let v = value || {};
			let worlds = new ELI_Worlds(v.worlds);
			let world = new ELI_World({tab: tabId, url: tab.url});
			worlds.insert(world);
			return browser.storage.local.set({worlds: worlds});
		})
	}
});

browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
	browser.storage.local.get('worlds')
	.then(value => {
		let v = value || {};
		let worlds = new ELI_Worlds(v.worlds);
		worlds.remove(tabId);
		return browser.storage.local.set({worlds: worlds});
	})
});

browser.runtime.onMessage.addListener((message, sender) => {
	browser.storage.local.get('worlds')
	.then(value => {
		let worlds = new ELI_Worlds(value.worlds);
		let world = worlds.getWorld(sender.tab.id);
		if (world) {
			if (message.method == 'StartupService.getData') {
				let startupHandler = new ELI_StartupHandler(world);
				startupHandler.startup(message.response);
			} else if (world.valid) {
				switch (message.method) {
					case "AncientWonderService.getOtherPlayerAncientWonders":
						message.response = message.response.ancientWonderPhases;
					case "AncientWonderService.phaseUpdated":
					case "AncientWonderService.getPhases":
						let awHandler = new ELI_WonderHandler(world);
						awHandler.update(message.response);
						break;
					case "WonderSociety.open":
						if (world.key) {
							browser.tabs.create({url: `https://docs.google.com/spreadsheets/d/${world.key}/edit#gid=0`});
						}
						break;
					default:
						break;
				}
			}
		}
	})
})

// -----------------------------------------------------------------------
				
