const MenuDisplay = function(d) {
	const logoText = [
		'  █████████  █████████  ██        ████████  ████████  █████████  ████████  █████████  █████████  ',
		'  ██         ██     ██  ██           ██        ██     ██     ██     ██     ██     ██  ██         ',
		'  █████████  ██     ██  ██           ██        ██     █████████     ██     █████████  ████████   ',
		'         ██  ██     ██  ██           ██        ██     ██     ██     ██     ██    ██   ██         ',
		'  █████████  █████████  ████████  ████████     ██     ██     ██  ████████  ██     ██  █████████  '
	];
	const optionText = ['NEW GAME', 'CONTINUE', 'SETTINGS', 'QUIT'];

	this.setSize = function() {
		logo = {
			w: logoText[0].length + 2,
			h: logoText.length + 4,
			x: d.centerWidth(logoText[0].length),
			y: d.centerHeight(20)
		}
		options = {
			w: 16,
			h: optionText.length + 5,
			x: d.centerWidth(16),
			y: logo.y + logoText.length + 6
		}
	}
	let logo, options;
	this.setSize();

	const logoBuffer = d.buffer.new(logo.x, logo.y, logo.w, logo.h, 2, 'menu');
	const optionsBuffer = d.buffer.new(options.x, options.y, options.w, options.h, 2, 'menu');

	const drawMenu = function(index) {
		d.setColor('txt');
		d.drawSquare(optionsBuffer, 0, 0, options.w, options.h, true);
		for (let i = 0; i < optionText.length; i++) {
			if (i == index) d.setColor('txtcur');
			else d.setColor('txt');
			const spacing = (options.w - optionText[i].length - 2) / 2;
			const output = ' '.repeat(spacing) + optionText[i] + ' '.repeat(spacing);
			optionsBuffer.draw(output, 1, 2 * i + 1);
		}
	}
	this.start = function(index = 0) {
		d.buffer.screen = 'menu';
		this.draw(index);
		logoBuffer.render();
		optionsBuffer.render();
	}
	this.update = function(index = 0) {
		drawMenu(index);
		optionsBuffer.render();
	}
	this.draw = function(index = 0) {
		d.setColor('txt');
		d.drawSquare(logoBuffer, 0, 0, logo.w, logo.h, true);
		for (let i = 0; i < logoText.length; i++)
			logoBuffer.draw(logoText[i], 1, 2 + i);
		drawMenu(index);
	}
	this.redrawTest = function() {
		logoBuffer.simpleMove(1, 1);
		// logoBuffer.current = new Uint16Array(logoBuffer.previous);
		// logoBuffer.render();
	}
	this.resize = function() {
		this.setSize();
		logoBuffer.simpleMove(logo.x, logo.y);
		optionsBuffer.simpleMove(options.x, options.y);
		// logoBuffer.outline('red');
		// d.buffer.renderScreen('menu');
		// logoBuffer.render();
	}
}

module.exports = MenuDisplay;
