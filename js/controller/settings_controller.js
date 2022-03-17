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

	this.buffer = [0];
	this.counts = [];
	this.code = [];
	
	this.handleScreen = function() {
		const length = this.buffer.length;
		const prevBuffer = [this.buffer[0], this.buffer[1]];
		if (length == 1) {
			if (this.up) this.buffer[0] = c.cycle(this.buffer[0], this.counts.length, false);
			else if (this.down) this.buffer[0] = c.cycle(this.buffer[0], this.counts.length);
			else if (this.enter) this.buffer.push(this.code[this.buffer[0]]);
			else if (this.esc) return c.outputCommand('back');
		} else if (length == 2) {
			if (this.up) this.buffer[1] = c.cycle(this.buffer[1], this.counts[this.buffer[0]], false);
			else if (this.down) this.buffer[1] = c.cycle(this.buffer[1], this.counts[this.buffer[0]]);
			else if (this.enter) {
				this.code[this.buffer[0]] = this.buffer[1];
				this.buffer.pop();
				if (this.buffer[0] == 0 || this.buffer[0] == 1) {
					const data = [this.buffer, this.code];
					return c.outputCommand('preview', data);
				}
			} else if (this.esc) this.buffer.pop();
		}
		const data = [this.buffer, this.code];
		return c.outputCommand('move', data);
	}
	this.reset = () => this.buffer = [0];
	this.exportChanges = function(allSettings) {
		let output = {};
		let i = 0;
		for (let k of Object.keys(allSettings)) {
			output[k] = allSettings[k][this.code[i]];
			i++;
		}
		return output;
	}
}

module.exports = SettingsController;
