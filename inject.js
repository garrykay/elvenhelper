let oldXHROpen = window.XMLHttpRequest.prototype.open;
window.XMLHttpRequest.prototype.open = function(method, url) {
	this.addEventListener("load", function() {
		let text = "<";
		if(this.responseType == '') text = this.responseText;
		if (text[0] == "<") {
			// invalid || graphics
		} else {
			let arr = [];
			try {
				arr = JSON.parse(this.responseText);
			} catch (e) {
				arr = [];
			}
			if (arr[0] && arr[0].__class__ == 'ServerResponseVO') {
				for (i = 0; i < arr.length; i++) {
					if (arr[i].__class__ == 'ServerResponseVO') {
						let reqMethod = arr[i].requestClass + "." + arr[i].requestMethod;
						switch(reqMethod) {
						case "CityResourcesService.getResources":
						case "StartupService.getData":
						case "AncientWonderService.getOtherPlayerAncientWonders":
						case "AncientWonderService.phaseUpdated":
						case "AncientWonderService.getPhases":
						case "SpireService.getEncounter":
						case "SpireDiplomacyService.getData":
						case "SpireDiplomacyService.submit":
						case "SpireService.getData":
						case "SpireService.updateMap":
							let msg = {
								method: reqMethod,
								response: arr[i].responseData,
							}
							let event = new CustomEvent("ELI", {detail: msg});
							window.dispatchEvent(event);
						default:
							break;
						}
					}
				}
			}
		}
	});
	return oldXHROpen.apply(this, arguments);
}

let oldConsoleInfo = console.info;
console.info = function() {
	let event = new CustomEvent("ELI", {detail: 'LOAD'});
	window.dispatchEvent(event);
	oldConsoleInfo.apply(this, arguments);
}

