const GameController = function(c) {
	const controls = require('../../json/settings.json').controls;
	this.update = function(key) {
		up = down = left = right = false;
		space = to = enter = esc = undo = false;
		wasteShortcut = foundationShortcut = false;
		jumpTo = null;
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
			case '1' : jumpTo = 0; return true;
			case '2' : jumpTo = 1; return true;
			case '3' : jumpTo = 2; return true;
			case '4' : jumpTo = 3; return true;
			case '5' : jumpTo = 4; return true;
			case '6' : jumpTo = 5; return true;
			case '7' : jumpTo = 6; return true;
			case 'w' : wasteShortcut = true; return true;
			case 'f' : foundationShortcut = true; return true;
		}
		return false;
	}
	let up, down, left, right, space, to, enter, esc, undo, jumpTo, wasteShortcut, foundationShortcut;

	this.buffer = [{type: 'pile', index: 3, depth: 0, fullDepth: 3}];
	let bufferTypeBeforeToMode = 'pile';
	this.handleScreen = function() {
		const first = this.buffer[0];
		const enterToMode = function(index, typeToSave = first.type) {
			bufferTypeBeforeToMode = typeToSave;
			this.buffer.push({type: 'pile', index: index, depth: 0});
			return c.outputCommand('move');
		}.bind(this);
		if (this.buffer.length == 1) {
			if (left && first.type == 'pile') {
				first.index = this.cycle(first.index, false);
				return c.outputCommand('move');
			} else if (right && first.type == 'pile') {
				first.index = this.cycle(first.index);
				return c.outputCommand('move');
			} else if (space) {
				return c.outputCommand('flip', null);
			} else if (to) {
				return enterToMode(first.index);
			} else if (jumpTo != null) {
				let secondIndex = first.index;
				if (first.type == 'waste') {
					first.type = 'pile';
					secondIndex = jumpTo;
				}
				first.index = jumpTo;
				first.depth = 0;
				return enterToMode(secondIndex);
			} else if (up && first.type == 'pile' && this.wasteCount) {
				first.type = 'waste';
				first.depth = this.wasteCount;
				return c.outputCommand('move');
			} else if (down && first.type == 'waste') {
				first.type = 'pile';
				first.depth = 0;
				if (this.pileCounts[first.index] == 0) this.buffer[0].index = this.cycle(first.index);
				return c.outputCommand('move');
			} else if (wasteShortcut && this.wasteCount) {
				const typeToSave = first.type;
				first.type = 'waste';
				first.depth = this.wasteCount;
				return enterToMode(first.index, typeToSave);
			} else if (enter) {
				if (first.type == 'pile') return c.outputCommand('pileToFoundation', [first.index]);
				else return c.outputCommand('wasteToFoundation', [null]);
			} else if (undo) {
				return c.outputCommand('undo', null);
			}
		} else { // buffer.length == 2
			const second = this.buffer[1];
			const submitBuffer = function() {
				const index = first.index; const depth = first.depth;
				const secondIndex = second.index;
				this.buffer.shift();
				if (first.type == 'pile') {
					if (index != secondIndex) return c.outputCommand('pileToPile', [index, secondIndex, depth]);
					else return c.outputCommand('move');
				}
				else return c.outputCommand('wasteToPile', [secondIndex]);
			}.bind(this);
			if (left) {
				second.index = this.cycle(second.index, false, false);
				return c.outputCommand('move');
			} else if (right) {
				second.index = this.cycle(second.index, true, false);
				return c.outputCommand('move');
			} else if (esc || to) {
				if (this.pileCounts[second.index]) first.index = second.index;
				first.type = bufferTypeBeforeToMode;
				first.depth = first.type == 'pile' ? 0 : this.wasteCount;
				this.buffer.pop();
				return c.outputCommand('move');
			} else if (jumpTo != null) {
				if (this.pileCounts[first.index]) {
					second.index = jumpTo;
					return submitBuffer();
				} else {
					this.buffer.shift();
					return c.outputCommand('move');
				}
			} else if (foundationShortcut) {
				if (first.type == 'pile') return c.outputCommand('pileToFoundation', [this.buffer.shift().index]);
				else {
					this.buffer.shift();
					return c.outputCommand('wasteToFoundation', [null]);
				}
			} else if (enter) {
				return submitBuffer();
			} else if (down && first.type == 'pile') {
				if (first.depth < this.pileCounts[first.index] - 1) first.depth++;
				return c.outputCommand('move');
			} else if (up && first.type == 'pile') {
				if (first.depth > 0) first.depth--;
				return c.outputCommand('move');
			}
		}
		return false;
	}
	this.moveToUndoSpot = function(path, wasteCount) {
		const first = this.buffer[0];
		if (path[0] != null) {
			if (path[1] != null) first.index = path[1];
			else {
				first.type = 'waste';
				first.depth = wasteCount;
			}
		} else if (first.type == 'waste') {
			if (wasteCount) first.depth = wasteCount;
			else {
				first.type = 'pile';
				first.depth = 0;
			}
		}
	}
	this.cycle = function(index, up = true, skip = true) {
		const newIndex = c.cycle(index, 7, up);
		if (skip && this.pileCounts[newIndex] == 0)
			return this.cycle(newIndex, up, true);
		else return newIndex;
	}
	this.checkForOverhang = function(pileCounts) {
		const first = this.buffer[0];
		if (pileCounts[first.index] == 0) this.buffer[0].index = this.cycle(first.index);
	}
	this.getData = () => this.buffer;
}

module.exports = GameController;
