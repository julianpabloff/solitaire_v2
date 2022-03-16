const keypress = require('keypress');
const display = new (require('./js/display/display.js'));
const controller = new (require('./js/controller/controller.js'));

//Temporary
let jsonSettings = {
	theme: 'ice',
	label: false,
	draw: 1
};
const allSettings = {
	theme: ['normal', 'light', 'dark', 'ice'],
	label: [true, false],
	draw: [1, 3]
};
function applySettings(settings) {
	display.setTheme(settings.theme);
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
		case 'move': display.menu.update(command.data); break;
		case 'settings':
			// const data = [controller.settings.buffer, controller.settings.code];
			switchTo('settings', command.data);
			break;
		case 'quit':
			display.exit();
			console.clear();
			process.exit();
			break;
		// default: display.menu.update(command);
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
			controller.menu.reset();
			switchTo('menu', [0]);
			return;
	}
	// const data = [controller.settings.buffer, controller.settings.code];
	// display.settings.update(...data);
}

let screen = 'menu';
function switchTo(destination, data = []) {
	display[screen].clear();
	display[destination].start(...data);
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
