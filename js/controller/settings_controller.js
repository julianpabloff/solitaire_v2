const SettingsController = function(c) {
	this.update = function(key) {
		up = down = left = right = enter = esc = false;
		switch(key) {
			case 'up' : case 'k' : up = true; return true;
			case 'down' : case 'j' : down = true; return true;
			case 'left' : case 'h' : left = true; return true;
			case 'right' : case 'l' : right = true; return true;
			case 'return' : enter = true; return true;
			case 'escape' : esc = true; return true;
		}
		return false;
	}
	let up, down, left, right, enter, esc;

	this.buffer = [0];
	this.counts = [];
	this.code = [];
	let leftSideIndex = 0;
	
	this.handleScreen = function() {
		const length = this.buffer.length;
		const countsLength = this.counts.length;
		const prevBuffer = [this.buffer[0], this.buffer[1]];
		let first = this.buffer[0];
		const onFirstMenu = first < countsLength - 1;
		if (length == 1) {
			if (up && onFirstMenu) this.buffer[0] = c.cycle(first, countsLength - 1, false);
			else if (down && onFirstMenu) this.buffer[0] = c.cycle(first, countsLength - 1);
			else if (left && !onFirstMenu) this.buffer[0] = leftSideIndex;
			else if (right && onFirstMenu) {
				leftSideIndex = first;
				this.buffer[0] = countsLength - 1;
			}
			else if (enter) {
				if (onFirstMenu) this.buffer.push(this.code[first]);
				else this.code[first] = c.cycle(this.code[first], 2);
			}
			else if (esc) return c.outputCommand('back');
		} else if (length == 2) {
			if (up) this.buffer[1] = c.cycle(this.buffer[1], this.counts[first], false);
			else if (down) this.buffer[1] = c.cycle(this.buffer[1], this.counts[first]);
			else if (enter) {
			if (this.buffer[1] == this.counts[0] - 1) {
					return c.outputCommand('manageThemes', null);
				}
				this.code[first] = this.buffer[1];
				this.buffer.pop();
				if (first == 0 || first == 1) {
					const data = [this.buffer, this.code];
					return c.outputCommand('preview', data);
				}
			} else if (esc) this.buffer.pop();
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
	this.getData = () => [this.buffer, this.code];
}

module.exports = SettingsController;
