const ThemeManagerController = function(c) {
	this.update = function(key) {
		this.up = this.down = this.enter = this.space = this.esc = false;
		switch(key) {
			case 'up' : case 'k' : this.up = true; return true;
			case 'down' : case 'j' : this.down = true; return true;
			case 'return' : this.enter = true; return true;
			case 'space' : this.space = true; return true;
			case 'escape' : this.esc = true; return true;
		}
		return false;
	}
	this.up = this.down = this.enter = this.space = this.esc = false;

	this.buffer = [0];
	this.counts = [];
	this.code = [];

	this.handleScreen = function() {
		if (this.esc) return c.outputCommand('back');
		return c.outputCommand('move', null);
	}
}

module.exports = ThemeManagerController;
