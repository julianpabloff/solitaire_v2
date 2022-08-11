const GameController = function(c) {
	const controls = require('../../json/settings.json').controls;
	this.update = function(key) {
		up = down = left = right = false;
		space = to = enter = esc = undo = false;
		switch(key) {
			case 'up' : case 'k' : up = true; return true;
			case 'down' : case 'j' : down = true; return true;
			case 'left' : case 'h' : left = true; return true;
			case 'right' : case 'l' : right = true; return true;
			case 'space' : space = true; return true;
			case 't' : to = true; return true;
			case 'return' : enter = true; return true;
			case 'escape' : esc = true; return true;
			case 'u' : undo = true; return true;
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
	let up, down, left, right, space, to, enter, esc, undo;

	this.buffer = [{type: 'pile', index: 3, depth: 0, fullDepth: 3}];
	const bufferBeforeToMode = {type: 'pile', index: 3, depth: 0, fullDepth: 3};
	this.handleScreen = function() {
		const first = this.buffer[0];
		if (this.buffer.length == 1) {
			if (left) {
				first.index = this.cycle(first.index, false);
				return c.outputCommand('move', null);
			} else if (right) {
				first.index = this.cycle(first.index);
				return c.outputCommand('move', null);
			} else if (space) {
				return c.outputCommand('flip', null);
			} else if (to) {
				bufferBeforeToMode.type = first.type;
				bufferBeforeToMode.index = first.index;
				bufferBeforeToMode.depth = 0;
				this.buffer.push({type: 'pile', index: bufferBeforeToMode.index, depth: 0});
				return c.outputCommand('move', null);
			} else if (enter) {
				return c.outputCommand('pileToFoundation', [first.index]);
			} else if (undo) {
				return c.outputCommand('undo', null);
			}
		} else { // buffer.length == 2
			const second = this.buffer[1];
			if (left) {
				second.index = this.cycle(second.index, false, false);
				return c.outputCommand('move', null);
			} else if (right) {
				second.index = this.cycle(second.index, true, false);
				return c.outputCommand('move', null);
			} else if (esc || to) {
				if (this.pileCounts[second.index]) first.index = second.index;
				if (bufferBeforeToMode.type == 'pile') first.type = 'pile';
				first.depth = 0;
				this.buffer.pop();
				return c.outputCommand('move', null);
			} else if (enter && first.index != second.index) {
				return c.outputCommand('pileToPile', [first.index, second.index, first.depth]);
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
