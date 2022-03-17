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
	this.reset = () => menuOption = 0;
	this.handleScreen = function() {
		if (this.up) {
			menuOption = c.cycle(menuOption, optionCount, false);
			return c.outputCommand('move', menuOption);
		} else if (this.down) {
			menuOption = c.cycle(menuOption, optionCount);
			return c.outputCommand('move', menuOption);
		} else if (this.esc) return c.outputCommand('quit');
		else if (this.enter) {
			switch(menuOption) {
				case 0: return c.outputCommand('newGame');
				case 2: 
					const data = [c.settings.buffer, c.settings.code];
					return c.outputCommand('settings', data);
				case 3: return c.outputCommand('quit');
				default: return false;
			}
		}
	}
}

module.exports = MenuController;
