const keypress = require('keypress');
const game = new (require('./js/game.js'));
const display = new (require('./js/display/display.js'));
const controller = new (require('./js/controller/controller.js'));

//Temporary
let jsonSettings = {
	theme: 'normal',
	label: false,
	draw: 1
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
			controller.game.pileCounts = game.getPileData();
			// const data = [{
			// 	cards: game.getData(),
			// 	buffer: controller.game.buffer
			// }];
			switchTo('game', [game.getData(), controller.game.buffer]);
			break;
		case 'move': display.menu.update(command.data); break;
		case 'settings':
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
			controller.settings.reset();
			switchTo('menu', [controller.menu.reset()]);
			if (themeChanged) display.applyBackground();
	}
}
update.game = function(command) {
	function updateDisplay() {
		const data = {
			cards: game.getData(),
			buffer: controller.game.buffer
		};
		display.game.update(data);
	}
	controller.game.pileCounts = game.getPileData();
	switch (command.type) {
		case 'up': display.game.up(); break;
		case 'flip':
			game.flipDeck();
			break;
		case 'move': break;
		default: return false;
	}
	display.game.update(game.getData(), command.data);
}

let screen = 'menu';
function switchTo(destination, data = []) {
	display[destination].draw(...data);
	display.buffer.preRender(destination);
	screen = destination;
}

keypress(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', function(chunk, key) {
	if (resizing) return;
	const keyPressed = key == undefined ? chunk : key.name;
	if (keyPressed == 'q') {
		display.exit();
		console.clear();
		process.exit();
	}
	else if (keyPressed == 'f') process.stdout.write('\x1b[S');
	else if (keyPressed == 'v') process.stdout.write('\x1b[T');
	const keyValid = controller[screen].update(keyPressed);
	if (keyValid) {
		const action = controller[screen].handleScreen();
		if (action.ran) {
			update[screen](action.command);
		}
	}
});

let resizeCountdown;
let resizing = false;
process.stdout.on('resize', () => {
	// display.init();
	// clearTimeout(resizeCountdown);
	// resizing = true;
	// resizeCountdown = setTimeout(() => {
	// 	display.resize(screen);
	// 	setTimeout(() => resizing = false, 100);
	// }, 1000);
});
