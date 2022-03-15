const keypress = require('keypress');
const display = new (require('./js/display/display.js'));

display.init();
display.menu.start();

keypress(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', function(chunk, key) {
	const keyPressed = key == undefined ? chunk : key.name;
	if (keyPressed == 'q') {
		display.exit();
		process.exit();
	} else if (keyPressed == '1') {
		display.menu.drawLogo();
	} else if (keyPressed == '2') {
		display.menu.clearLogo();
	}
});
