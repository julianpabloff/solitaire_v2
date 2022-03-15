const MenuController = function(c) {
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

	let menuOption = 0; const optionCount = 4;
	this.handleScreen = function() {
		if (this.up) {
			menuOption = c.cycle(menuOption, optionCount, false);
			return c.outputCommand(menuOption);
		} else if (this.down) {
			menuOption = c.cycle(menuOption, optionCount);
			return c.outputCommand(menuOption);
		} else if (this.esc) return c.outputCommand('quit');
		else if (this.enter) {
			switch(menuOption) {
				case 2 : return c.outputCommand('settings');
				case 3 : return c.outputCommand('quit');
				default : return false;
			}
		}
	}
}

module.exports = MenuController;
