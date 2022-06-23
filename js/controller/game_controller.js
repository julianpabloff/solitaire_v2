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
		this.space = false;
		this.key = false;
		switch(key) {
			case 'up' : case 'k' : this.key = true; return true;
			case 'down' : case 'j' : this.down = true; return true;
			case 'left' : case 'h' : this.left = true; return true;
			case 'right' : case 'l' : this.right = true; return true;
			case 'space' : this.space = true; return true;
			// case 'up' : case 'k' : this.up = true; return true;
			// case 'down' : case 'j' : this.down = true; return true;
			// case 'left' : case 'h' : this.left = true; return true;
			// case 'right' : case 'l' : this.right = true; return true;
			// case 'space' : this.space = true; return true;
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
	this.space = false;
	this.key = false;

	this.buffer = {type: 'pile', index: 3};
	this.handleScreen = function() {
		if (this.left) {
			this.buffer.index = this.cycle(this.buffer.index, false);
			return c.outputCommand('move', this.buffer);
		} else if (this.right) {
			this.buffer.index = this.cycle(this.buffer.index);
			return c.outputCommand('move', this.buffer);
		} else if (this.space) {
			return c.outputCommand('flip', this.buffer);
		}
		return false;
	}
	this.cycle = function(index, up = true, skip = true) {
		const newIndex = c.cycle(index, 7, up);
		if (skip && this.pileCounts[newIndex] == 0)
			this.cycle(newIndex, up, true);
		else return newIndex;
	}
	this.getData = () => this.buffer;
}

module.exports = GameController;
