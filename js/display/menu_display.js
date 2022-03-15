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

	const background = d.buffer.new(0, 0, d.width, d.height, 'menu', 0);
	const logoBuffer = d.buffer.new(logo.x, logo.y, logo.w, logo.h, 'menu', 1);
	const optionsBuffer = d.buffer.new(options.x, options.y, options.w, options.h, 'menu', 1);

	this.start = function(index = 0) {
		background.fill('green').simpleRender();
		d.buffer.setColor('white', 'black');
		d.drawSquare(logoBuffer, 0, 0, logo.w, logo.h, true);
		for (let i = 0; i < logoText.length; i++)
			logoBuffer.draw(logoText[i], 1, 2 + i);
		logoBuffer.simpleRender();
		drawMenu(index);
		optionsBuffer.simpleRender();
	}
	const drawMenu = function(index) {
		d.buffer.setColor('white', 'black');
		d.drawSquare(optionsBuffer, 0, 0, options.w, options.h, true);
		for (let i = 0; i < optionText.length; i++) {
			if (i == index) d.buffer.setColor('black', 'white');
			else d.buffer.setColor('white', 'black');
			const spacing = (options.w - optionText[i].length - 2) / 2;
			const output = ' '.repeat(spacing) + optionText[i] + ' '.repeat(spacing);
			optionsBuffer.draw(output, 1, 2 * i + 1);
		}
	}
	this.update = function(index = 0) {
		drawMenu(index);
		optionsBuffer.render();
	}
	this.clear = function() {
		logoBuffer.fill('green').simpleRender();
		optionsBuffer.fill('green').simpleRender();
	}
}

module.exports = MenuDisplay;