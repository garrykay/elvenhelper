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
		this.password = w.password || '';
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
	// the password to decrypt the key
	password;
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
				if (!societyWonder || societyWonder.size == wonder.size) {
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
			// query the index sheet
			let indexSheet = new ELI_Sheet;
			return indexSheet.query();
		})
		.then(table => {
			// decrypt the index
			let id = `${this.world.server}_${obj.guild.id}`;
			let row = table.find(r => r[0] == id);
			let encrypted = row ? row[1] : null;
			let society = this.value.society || {};
			let password = society.password || '';
			if (encrypted && password) {
				let crypto = new ELI_Crypto(password);
				this.world.key = crypto.decrypt(encrypted);
				if (!this.world.key) {
					let message = new ELI_Message(this.world);
					message.alert('Warning', 'Wrong Wonder Society password.');
				}
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

class ELI_PasswordHandler {
	constructor(world) {
		this.world = world;
	}

	setPassword(password) {
		browser.storage.local.get(this.world.id)
		.then(storage => {
			this.value = storage[this.world.id] || {};
			let society = {password: password};
			this.value.society = society;
			return browser.storage.local.set({[this.world.id]: this.value});
		})
		.then(() => {
			let sheet = new ELI_Sheet();
			return sheet.query()
		})
		.then(table => {
			let g = this.value.guild || {};
			let id = `${this.world.server}_${g.id}`;
			let row = table.find(r => r[0] == id);
			let encrypted = row ? row[1] : '';
			let society = this.value.society || {};
			let password = society.password || '';
			this.world.key = '';
			if (encrypted && password) {
				let crypto = new ELI_Crypto(password);
				this.world.key = crypto.decrypt(encrypted);
				if (!this.world.key) {
					let message = new ELI_Message(this.world);
					message.alert('Warning', 'Wrong password.');
				}
			}
			return browser.storage.local.get('worlds');
		})
		.then(value => {
			let worlds = new ELI_Worlds(value.worlds);
			worlds.insert(this.world);
			return browser.storage.local.set({worlds: worlds});
		});
	}

	world;

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
	
	setSpireSlots(slots) {
		this.send({type: 'SPIRE', slots: slots});
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
		// if no key is provided, the key for the index sheet is used
		let k = key || '1jJjg3LbpmnF41GhncPUOeHTVFHszcAnjVdzRLOe-A3s';
		// using the preview to ignore the hidden cells
		this.url = `https://docs.google.com/spreadsheets/d/${k}/preview/sheet?gid=0`;
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

// the spire
class ELI_Spire {
	static create(world) {
		return browser.storage.local.get(world.id)
		.then(storage => {
			let value = storage[world.id] || {};
			let spire = new ELI_Spire(world, value);
			return new Promise(resolve => resolve(spire));
		})
	}

	constructor(world, value) {
		this.storage = value || {};
		let s = this.storage.spire || {};
		this.world = new ELI_World(world);
		this.resources = s.resources || [];
		this.costs = s.costs || [];
		this.slots = s.slots || [];
	}

	static close(world, obj = null) {
		if (!obj || obj.points[obj.points.length - 1].state == "available") {
			let message = new ELI_Message(world);
			message.setSpireSlots(null);
		}
	}

	close(obj = null) {
		ELI_Spire.close(this.world, obj);
	}
	
	getData(obj) {
		if (this.world.valid) {
			if (obj.turn == 1) {
				let slots = [];
				let max = this.resources.length;
				for (let i = 0; i < 5; ++i) {
					slots.push(this.getResourceName(this.resources[i < max ? i : 0]));
				}
				const chances = [100, 100, 100, 100, 87, 71, 47, 28, 16];
				slots.push(chances[max]);
				this.display(slots);
			}
		}
	}
	
	getSlots(result, suggest, slots) {
		let nslots = [];
		for (const slot of slots) nslots.push(slot);
		for (let i = 0; i < 5; i++) {
			switch(result[i]) {
			case "Y":
				nslots[i] = "";
				break;
			case "O":
				nslots[i] = nslots[i].split(suggest[i]).join("");
				break;
			default:
				for (let j = 0; j < 5; j++) {
					nslots[j] = nslots[j].split(suggest[i]).join("");
				}
				break;
			}
		}
		return nslots;
	}
	
	compare(combination, suggest) {
		let tempResult = [];
		let other = [];
		for (let i = 0; i < 5; i++) {
			if (suggest[i] == combination[i] || suggest[i] == "X")  {
				tempResult.push("Y");
			} else {
				tempResult.push("N");
				other.push(combination[i]);
			}
		}
		let result = [];
		for (let i = 0; i < 5; i++) {
			if (tempResult[i] == "N") {
				if (other.includes(suggest[i])) result.push("O");
				else result.push("N");
			} else {
				result.push("Y");
			}	
		}
		return result;
	}
	
	calcChance(suggest, slots, other, round) {
		let total = 0;
		let correct = 0;
		let combination = this.firstCombination(slots, other);
		while (combination.length == 5) {
			let result = this.compare(combination, suggest);
			total++;
			correct  += this.solve(combination, result, suggest, slots, round + 1);
			combination = this.nextCombination(combination, slots, other);
		}
		return correct / total;
	}
	
	calcCost(suggest) {
		let cost = 0;
		for (const s of suggest) {
			if (s != "X") cost += this.costs["ABCDEFGH".indexOf(s)];
		}
		return cost;
	}
	
	solve(combination, result, suggest, slots, round) {
		if (result.join("") == "YYYYY") return 1;
		if (round >= 3) return 0;
		let total = 0;
		let correct = 0;
		let nslots = this.getSlots(result, suggest, slots);
		let other = [];
		if (result.includes("O")) {
			for (let i in result) {
				if(result[i] == "O") {
					if (!other.includes(suggest[i])) other.push(suggest[i]);
				}
			}
		}
		let nsuggest = this.firstCombination(nslots, other);
		while (nsuggest.length == 5) {
			let result = this.compare(combination, nsuggest);
			total ++;
			correct  += this.solve(combination, result, nsuggest, nslots, round + 1);
			nsuggest = this.nextCombination(nsuggest, nslots, other);
		}
		return correct / total;
	}
	
	firstCombination(slots, other) {
		let combination = [];
		for (const slot of slots) {
			combination.push(slot.length ? slot[0] : "X");
		}
		let valid = true;
		for (const o of other) {
			if (!combination.includes(o)) valid = false;
		}
		if (!valid) combination = this.nextCombination(combination, slots, other);
		return combination;
	}

	getResourceName(resource) {
		const names = {
			ascendedcrystal: "Aerosols",
			ascendedmarble: "Minerals",
			ascendedplanks: "Sprouts",
			ascendedscrolls: "Wax",
			ascendedsilk: "Powder",
			ascendedsteel: "Ingots",
			money: "Coins",
			supplies: "Supplies",
			marble: "Marble",
			steel: "Steel",
			planks: "Planks",
			crystal: "Crystal",
			scrolls: "Scrolls",
			silk: "Silk",
			elixir: "Elixir",
			magic_dust: "Dust",
			gems: "Gems",
			sentientmarble: "Moonstone",
			sentientsteel: "Platinum",
			sentientplanks: "Tree Gum",
			sentientcrystal: "Obsidian",
			sentientscrolls: "Ink",
			sentientsilk: "Velvet",
			sentientelixir: "Soap",
			sentientmagic_dust: "Shrooms",
			sentientgems: "Bismuth",
			mana: "Mana",
			seeds: "Seeds",
			orcs: "Orcs",
			unurium: "Unurium"
		}
		return names[resource] || '';
	}

	resourceId(resource) {
		return "ABCDEFGH".charAt(this.resources.indexOf(resource));
	}

	findResource(id) {
		return this.resources["ABCDEFGH".indexOf(id)];
	}

	display(arr) {
		let message = new ELI_Message(this.world);
		message.setSpireSlots(arr);
	}

	submit(obj) {
		if (obj.state == "won") return this.close();
		if (this.world.valid) {
			let turn = obj.turn - 2;
			let suggests = ["X", "X", "X", "X", "X"];
			let results = ["Y", "Y", "Y", "Y", "Y"];
			let other = [];
			for (const slot of obj.slots) {
				let slotNumber = slot.slot || 0;
				if (slot.history.length > turn) {
					let resource = slot.history[turn];
					if (resource) {
						let id = this.resourceId(resource.goodId);
						suggests[slotNumber] = id;
						switch(resource.result) {
						case "other":
							results[slotNumber] = "O";
							if (!other.includes(id)) other.push(id);
							break;
						case "nobody":
							results[slotNumber] = "N";
						default:
							break;
						}
					}
				}	
			}
			this.slots = this.getSlots(results, suggests, this.slots);
			let chance = 0;
			let cost = 0;
			let suggest = this.firstCombination(this.slots, other);
			let bestChance = 0;
			let bestCost = 0;
			let bestCombination = suggest;
			while (suggest.length == 5) {
				chance = this.calcChance(suggest, this.slots, other, turn + 1);
				if (chance > bestChance) {
					bestChance = chance;
					bestCost = this.calcCost(suggest);
					bestCombination = suggest;
				} else if (chance == bestChance) {
					cost = this.calcCost(suggest);
					if (cost < bestCost) {
						bestCost = cost;
						bestCombination = suggest;
					}
				}
				suggest = this.nextCombination(suggest, this.slots, other);
			}
			let arr = [];
			for (let i = 0; i < 5 ; i++) {
				if (this.slots[i] == "") arr.push("");
				else arr.push(this.getResourceName(this.findResource(bestCombination[i])));
			}
			arr.push((100 * bestChance).toFixed(0));
			this.display(arr);
			this.storage.spire = this;				
			browser.storage.local.set({[this.world.id]: this.storage});
		}
	}
	
	nextCombination(current, slots, other) {
		let combination = [];
		let i = 4;
		while (i >= 0) {
			if (current[i] == "X") {
				combination.unshift("X");
			} else {
				let slot = slots[i];
				let idx = (slot.indexOf(current[i]) + 1) % slot.length;
				combination.unshift(slot[idx]);
				if (idx != 0) break;
			}
			i--;
		}
		if (i < 0) return [];
		i--;
		while (i >= 0) combination.unshift(current[i--]);
		let valid = true;
		for (const o of other) {
			if (!combination.includes(o)) valid = false;
		}
		if (!valid) combination = this.nextCombination(combination, slots, other);
		return combination;
	}
	
	getEncounter(obj) {
		this.resources = [];
		this.slots = [];
		let resourceRatio = [];
		let low = [];
		if (this.storage.goods) {
			for (const resource in obj.costOptions.resources) {
				if (resource != "__class__") {
					let ratio =  this.storage.goods[resource] ? obj.costOptions.resources[resource] / (this.storage.goods[resource]) : 1000;
					resourceRatio.push({
						resource: resource,
						ratio: ratio
					});
					if (ratio > .2) low.push(resource); 
				}
			}
		} else {
			for (const resource in obj.costOptions.resources) {
				if (resource != "__class__") resourceRatio.push({resource: resource, ratio: 0.1});
			}
			let message = new ELI_Message(this.world);
			message.alert('Warning', 'No information about goods availabe yet. The spire helper will only be partially functional.');
		}
		if (low.length) {
			let text = '';
			let message = new ELI_Message(this.world);
			for (const good of low) text += `Low supply of ${this.getResourceName(good)}\n`;
			message.alert("Warning", text);				
		}
		resourceRatio.sort((r1, r2) => r1.ratio - r2.ratio);
		for (const r of  resourceRatio) {
			this.resources.push(r.resource);
			this.costs.push(r.ratio);
		}
		let slot = "ABCDEFGH".substring(0, resourceRatio.length);
		for (let i = 0; i < 5; i++) this.slots.push(slot);
		this.storage.spire = this;
		browser.storage.local.set({[this.world.id]: this.storage});
	}
	
	world;
	resources;
	costs;
	slots;
	storage;
}

// -----------------------------------------------------------------------

// the resources
class ELI_Goods {
	constructor(world) {
		this.world = world;
	}

	update(obj) {
		return browser.storage.local.get(this.world.id)
		.then(storage => {
			let value = storage[this.world.id] || {};
			if (obj && obj.resources) value.goods = {
				ascendedcrystal: obj.resources.ascendedcrystal,
				ascendedmarble: obj.resources.ascendedmarble,
				ascendedplanks: obj.resources.ascendedplanks,
				ascendedscrolls: obj.resources.ascendedscrolls,
				ascendedsilk: obj.resources.ascendedsilk,
				ascendedsteel: obj.resources.ascendedsteel,
				crystal: obj.resources.crystal,
				elixir: obj.resources.elixir,
				gems: obj.resources.gems,
				magic_dust: obj.resources.magic_dust,
				mana: obj.resources.mana,
				marble: obj.resources.marble,
				money: obj.resources.money,
				orcs: obj.resources.orcs,
				planks: obj.resources.planks,
				scrolls: obj.resources.scrolls,
				seeds: obj.resources.seeds,
				sentientcrystal: obj.resources.sentientcrystal,
				sentientelixir: obj.resources.sentientelixir,
				sentientgems: obj.resources.sentientgems,
				sentientmagic_dust: obj.resources.sentientmagic_dust,
				sentientmarble: obj.resources.sentientmarble,
				sentientplanks: obj.resources.sentientplanks,
				sentientscrolls: obj.resources.sentientscrolls,
				sentientsilk: obj.resources.sentientsilk,
				sentientsteel: obj.resources.sentientsteel,
				silk: obj.resources.silk,
				steel: obj.resources.steel,
				supplies: obj.resources.supplies,
				unurium: obj.resources.unurium
			};
			return browser.storage.local.set({[this.world.id]: value});
		});
	}

	world;
}

// -----------------------------------------------------------------------

class ELI_Crypto {
	constructor(password) {
		let utfPass = this.utfEncode(password || '');
		let hash = this.generateHash(utfPass);
		this.hash = hash.concat(this.generateHash(hash.concat(utfPass)));
	}

	encrypt(id) {
		return this.g64Encode(this.doEncrypt(this.g64Decode(id)));
	}

	decrypt(key) {
		return this.g64Encode(this.doDecrypt(this.g64Decode(key)));
	}

	doEncrypt(utf) {
		try {
			const checksum = this.generateHash(utf);
			let plainArray = utf.concat(checksum);
			return plainArray.map((value, index) => value ^ this.hash[index % 8]);
		} catch(error) {
			console.error('Error in ELI_Crypto.doEncrypt');
			return [];
		};
	}

	doDecrypt(bin) {
		try {
			if (!bin) return [];
			let plainArray = bin.map((value, index) => value ^ this.hash[index % 8]);
			const checksum = JSON.stringify(plainArray.slice(-4));
			const retVal = plainArray.slice(0, -4);
			return checksum == JSON.stringify(this.generateHash(retVal)) ? retVal : [];
		} catch(error) {
			console.error('Error in ELI_Crypto.doDecrypt');
			return [];
		}
	}

	utfEncode(string) {
		try {
			let encoder = new TextEncoder;
			return Array.from(encoder.encode(string));
		} catch (error) {
			console.error('Error in ELI_Crypto.utfEncode');
			return [];
		}
	}

	utfDecode(utf) {
		try {
			let decoder = new TextDecoder;
			return decoder.decode(utf);		
		} catch (error) {
			console.error('Error in ELI_Crypto.utfEncode');
			return '';
		}
	}

	g64Encode(utf) {
		try {
			let string = utf.map(value => String.fromCharCode(value)).join('');
			return btoa(string).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
		} catch (error) {
			console.error('Error in ELI_Crypto.g64Encode');
			return '';
		}
	}

	g64Decode(string) {
		try {
			let b64 = atob(string.replaceAll('-', '+').replaceAll('_', '/')).split('');
			return b64.map(value => value.charCodeAt(0));
		} catch {
			console.error('Error in ELI_Crypto.g64Decode');
			return[];
		}
	}

	generateHash(utf) {
		try {
			let hash = utf.reduce((prevHash, currVal) => (((prevHash << 5) - prevHash) + currVal) | 0, 0);
			if (hash < 0) hash += 0x80000000;
			let retVal = [];
			for (let i = 0; i < 4; i++) {
				retVal.push(hash % 0xff);
				hash >>= 8;
			}
			return retVal;
		} catch (error) {
			console.error('Error in ELI_Crypto.generateHash');
			return[];
		}
	}

	hash;
}

// -----------------------------------------------------------------------

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (tab.status === 'complete' && tab.url.match(/elvenar\.com\/game/ )) {
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
					case "CityResourcesService.getResources":
						let goods = new ELI_Goods(world);
						goods.update(message.response);
						break;
					case "AncientWonderService.getOtherPlayerAncientWonders":
						message.response = message.response.ancientWonderPhases;
					case "AncientWonderService.phaseUpdated":
					case "AncientWonderService.getPhases":
						let awHandler = new ELI_WonderHandler(world);
						awHandler.update(message.response);
						break;
					case "SpireService.getEncounter":
						ELI_Spire.create(world)
						.then(spire => spire.getEncounter(message.response));
						break;
					case "SpireDiplomacyService.getData":
						ELI_Spire.create(world)
						.then(spire => spire.getData(message.response));
						break;
					case "SpireDiplomacyService.submit":
						ELI_Spire.create(world)
						.then(spire => spire.submit(message.response));
						break;
					case "SpireService.getData":
					case "SpireService.updateMap":
						ELI_Spire.close(world, message.response);
						break;
					case "WonderSociety.password":
						let pass = new ELI_PasswordHandler(world);
						pass.setPassword(message.response);
						break;
					case "WonderSociety.open":
						if (world.key) {
							browser.tabs.create({url: `https://docs.google.com/spreadsheets/d/${world.key}/edit#gid=0`});
						}
						break;
					default:
						console.log(message.method);
						break;
				}
			}
		}
	})
})

// -----------------------------------------------------------------------
				