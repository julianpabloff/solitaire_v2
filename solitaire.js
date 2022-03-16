const keypress = require('keypress');
const display = new (require('./js/display/display.js'));
const controller = new (require('./js/controller/controller.js'));

display.init();
display.menu.start();

//Temporary
let jsonSettings = {
	theme: 'normal',
	label: false,
	draw: 1
};
const allSettings = {
	theme: ['normal', 'light', 'dark', 'ice'],
	label: [true, false],
	draw: [1, 3]
};
for (const k of Object.keys(allSettings))
	controller.settings.counts.push(allSettings[k].length);
for (const k of Object.keys(jsonSettings))
	controller.settings.code.push(allSettings[k].indexOf(jsonSettings[k]));
display.settings.importThemes(allSettings.theme);

const update = {};
update.menu = function(command) {
	switch (command) {
		case 'settings' :
			const data = [controller.settings.buffer, controller.settings.code];
			switchTo('settings', data);
			break;
		case 'quit' :
			display.exit();
			console.clear();
			process.exit();
			break;
		default: display.menu.update(command);
	}
}
update.settings = function(command) {
	switch(command) {
		case 'move' :
			break;
		case 'preview' :
			break;
		case 'back' :
			controller.menu.reset();
			switchTo('menu', [0]);
			return;
	}
	const data = [controller.settings.buffer, controller.settings.code];
	display.settings.update(...data);
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
		if (action.ran) update[screen](action.command);
	}
});
