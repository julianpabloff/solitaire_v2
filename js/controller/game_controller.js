const GameController = function(c) {
	this.update = function(key) {
		this.up = this.down = this.left = this.right = false;
		switch(key) {
			case 'up' : case 'k' : this.up = true; return true;
			case 'down' : case 'j' : this.down = true; return true;
			case 'left' : case 'h' : this.left = true; return true;
			case 'right' : case 'l' : this.right = true; return true;
		}
		return false;
	}
	this.up = this.down = this.left = this.right = false;

	this.handleScreen = function() {
		if (this.up) return c.outputCommand('up');
		else if (this.down) return c.outputCommand('down');
	}
}

module.exports = GameController;
