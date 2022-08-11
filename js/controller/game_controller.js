const GameController = function(c) {
	const controls = require('../../json/settings.json').controls;
	const getKey = function(key) {
		switch(key) {
			case 'up' : case 'k' : return 'up';
			case 'down' : case 'j' : return 'down';
			case 'left' : case 'h' : return 'left';
			case 'right' : case 'l' : return 'right';
			case 'space' : return 'space';
		}
	}
	this.update = function(key) {
		this.up = this.down = this.left = this.right = false;
		this.space = this.to = this.enter = this.esc = false;
		switch(key) {
			case 'up' : case 'k' : this.up = true; return true;
			case 'down' : case 'j' : this.down = true; return true;
			case 'left' : case 'h' : this.left = true; return true;
			case 'right' : case 'l' : this.right = true; return true;
			case 'space' : this.space = true; return true;
			case 't' : this.to = true; return true;
			case 'return' : this.enter = true; return true;
			case 'escape' : this.esc = true; return true;
			// case '1' : this.jumpTo = 0; return true;
			// case '2' : this.jumpTo = 1; return true;
			// case '3' : this.jumpTo = 2; return true;
			// case '4' : this.jumpTo = 3; return true;
			// case '5' : this.jumpTo = 4; return true;
			// case '6' : this.jumpTo = 5; return true;
			// case '7' : this.jumpTo = 6; return true;
		}
		return false;
	}
	this.up = this.down = this.left = this.right = false;
	this.space = this.to = this.enter = this.esc = false;

	this.buffer = [{type: 'pile', index: 3, depth: 0, fullDepth: 3}];
	const bufferBeforeToMode = {type: 'pile', index: 3, depth: 0, fullDepth: 3};
	this.handleScreen = function() {
		const first = this.buffer[0];
		if (this.buffer.length == 1) {
			if (this.left) {
				first.index = this.cycle(first.index, false);
				return c.outputCommand('move', this.buffer);
			} else if (this.right) {
				first.index = this.cycle(first.index);
				return c.outputCommand('move', this.buffer);
			} else if (this.space) {
				return c.outputCommand('flip', this.buffer);
			} else if (this.to) {
				this.toMode = true;
				bufferBeforeToMode.type = first.type;
				bufferBeforeToMode.index = first.index;
				bufferBeforeToMode.depth = 0;
				this.buffer.push({type: 'pile', index: bufferBeforeToMode.index, depth: 0});
				return c.outputCommand('move', this.buffer);
			} else if (this.enter) {
				return c.outputCommand('pileToFoundation', this.buffer[0].index);
			}
		} else { // buffer.length == 2
			const second = this.buffer[1];
			if (this.left) {
				second.index = this.cycle(second.index, false, false);
				return c.outputCommand('move', this.buffer);
			} else if (this.right) {
				second.index = this.cycle(second.index, true, false);
				return c.outputCommand('move', this.buffer);
			} else if (this.esc || this.to) {
				if (this.pileCounts[second.index]) this.buffer[0].index = second.index;
				if (bufferBeforeToMode.type == 'pile') this.buffer[0].type = 'pile';
				this.buffer[0].depth = 0;
				this.buffer.pop();
				this.toMode = false;
				return c.outputCommand('move', this.buffer);
			}
		}
		return false;
	}
	this.cycle = function(index, up = true, skip = true) {
		const newIndex = c.cycle(index, 7, up);
		if (skip && this.pileCounts[newIndex] == 0)
			return this.cycle(newIndex, up, true);
		else return newIndex;
	}
	this.getData = () => this.buffer;
}

module.exports = GameController;
