const SettingsController = function(c) {
	this.update = function(key) {
		this.up = this.down = this.enter = this.esc = false;
		switch(key) {
			case 'up' : case 'k' : this.up = true; return true;
			case 'down' : case 'j' : this.down = true; return true;
			case 'return' : this.enter = true; return true;
			case 'escape' : this.esc = true; return true;
		}
		return false;
	}
	this.up = this.down = this.enter = this.esc = false;

	let buffer = [0];
	let counts = [];
	let code;
	
	this.handleScreen = function() {
		const length = buffer.length;
		if (length == 1) {
			if (this.up) buffer[0] = c.cycle(buffer[0], counts.length, false);
			else if (this.down) buffer[0] = c.cycle(buffer[0], counts.length);
			else if (this.enter) buffer.push(code[buffer[0]]);
		} else if (length == 2) {
			if (this.up) buffer[1] = c.cycle(buffer[1], counts[buffer[0]], false);
			else if (this.down) buffer[1] = c.cycle(buffer[1], counts[buffer[0]]);
			else if (this.enter) {
				this.code[this.buffer[0]] = this.buffer[1];
				this.buffer.pop();
			}
		}
		return c.outputCommand(buffer);
	}

	let jsonSettings = {
		theme: 'normal',
		label: false,
		draw: 1
	};
	const allSettings = {
		theme: ['normal', 'light', 'dark', 'ice'],
		label: [true, false],
		draw: [1, 3]
	};
	this.importSettings = function(settings) {
		for (let k of Object.keys(settings))
			counts.push(settings[k].length);
	}
	this.importSettings(allSettings);
	this.generateSettingsCode = function(settings) {
		const output = [];
		for (let k of Object.keys(settings)) {
			output.push(allSettings[k].indexOf(settings[k]));
		}
		code = output;
	}
	this.generateSettingsCode(jsonSettings);
}

module.exports = SettingsController;
