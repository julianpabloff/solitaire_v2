const keypress = require('keypress');
const display = new (require('./js/display/display.js'));
const controller = new (require('./js/controller/controller.js'));

display.init();
display.menu.start();

const update = {};
update.menu = function(command) {
	switch (command) {
		case 'settings' :
			switchTo('settings');
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
	console.log(command);
}

let screen = 'menu';
function switchTo(destination) {
	display[screen].clear();
	display[destination].start();
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
