const MenuController = require('./menu_controller.js');
const SettingsController = require('./settings_controller.js');
const GameController = require('./game_controller.js');

const Controller = function() {
	this.menu = new MenuController(this);
	this.settings = new SettingsController(this);
	this.game = new GameController(this);

	this.cycle = function(number, count, up = true) {
		const max = count - 1;
		const end = up * max;
		const start = max - end;
		if (number == end) number = start;
		else number = number - (2 * !up) + 1;
		return number;
	}
	this.outputCommand = function(type, data) {
		return {
			ran: true,
			command: { type: type, data: data }
		}
	};
}

module.exports = Controller;
