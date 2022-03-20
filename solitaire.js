const keypress = require('keypress');
const game = new (require('./js/game.js'));
const display = new (require('./js/display/display.js'));
const controller = new (require('./js/controller/controller.js'));

//Temporary
let jsonSettings = {
	theme: 'normal',
	label: false,
	draw: 3
};
const allSettings = {
	theme: ['normal', 'light', 'dark', 'ice', 'candy'],
	label: [true, false],
	draw: [1, 3]
};
function applySettings(settings) {
	display.setTheme(settings.theme);
	game.drawAmount = settings.draw;
}
for (const k of Object.keys(allSettings))
	controller.settings.counts.push(allSettings[k].length);
for (const k of Object.keys(jsonSettings))
	controller.settings.code.push(allSettings[k].indexOf(jsonSettings[k]));
display.settings.importThemes(allSettings.theme);

applySettings(jsonSettings);
display.init();
display.menu.start();

const update = {};
update.menu = function(command) {
	switch (command.type) {
		case 'newGame': 
			game.shuffle().dealCards();
			const data = [{
				piles: game.piles
			}];
			switchTo('game', data);
			break;
		case 'move': display.menu.update(command.data); break;
		case 'settings':
			// display.settings.preDraw(...command.data);
			// display.menu.dynamicClear();
			switchTo('settings', command.data);
			break;
		case 'quit':
			display.exit();
			console.clear();
			process.exit();
	}
}
update.settings = function(command) {
	switch(command.type) {
		case 'move':
			display.settings.update(...command.data);
			break;
		case 'preview':
			display.settings.update(...command.data);
			break;
		case 'back':
			const newSettings = controller.settings.exportChanges(allSettings);
			const themeChanged = newSettings.theme != display.theme.title;
			applySettings(newSettings);
			controller.menu.reset();
			controller.settings.reset();
			if (themeChanged) display.applyBackground();
			switchTo('menu', [0]);
	}
}
update.game = function(command) {
	switch (command.type) {
		case 'up': display.game.up(game.piles); break;
	}
}

let screen = 'menu';
function switchTo(destination, data = []) {
	// display[screen].clear();
	// display[destination].start(...data);
	display[destination].draw(...data);
	display.buffer.dynamicSwitch(destination);
	// display.buffer.dynamicClear(destination);
	// display.buffer.renderScreen(destination);
	screen = destination;
}

keypress(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', function(chunk, key) {
	const keyPressed = key == undefined ? chunk : key.name;
	if (keyPressed == 'q') {
		display.exit();
		console.clear();
		process.exit();
	}
	const keyValid = controller[screen].update(keyPressed);
	if (keyValid) {
		const action = controller[screen].handleScreen();
		if (action.ran) {
			update[screen](action.command);
		}
	}
});
