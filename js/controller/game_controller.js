const GameController = function(c) {
	this.update = function(key) {
		this.up = this.down = this.left = this.right = false;
		this.space = false;
		switch(key) {
			case 'up' : case 'k' : this.up = true; return true;
			case 'down' : case 'j' : this.down = true; return true;
			case 'left' : case 'h' : this.left = true; return true;
			case 'right' : case 'l' : this.right = true; return true;
			case 'space' : this.space = true; return true;
		}
		return false;
	}
	this.up = this.down = this.left = this.right = false;
	this.space = false;

	this.buffer = {type: 'pile', index: 3};
	this.handleScreen = function() {
		if (this.left) {
			this.buffer.index = this.cycle(this.buffer.index, false);
			return c.outputCommand('move', this.buffer);
		}
		if (this.right) {
			this.buffer.index = this.cycle(this.buffer.index);
			return c.outputCommand('move', this.buffer);
		}
		if (this.space) {
			return c.outputCommand('flip');
		}
		return false;
	}
	this.cycle = function(index, up = true, skip = true) {
		const newIndex = c.cycle(index, 7, up);
		if (skip && this.pileCounts[newIndex] == 0)
			this.cycle(newIndex, up, true);
		else return newIndex;
	}
}

module.exports = GameController;
