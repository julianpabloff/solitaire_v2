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
			h: optionText.length + 5 - (this.drawContinueBtn ? 0 : 2),
			x: d.centerWidth(16),
			y: logo.y + logoText.length + 6
		}
	}
	let logo, options;
	this.setSize();

	const logoBuffer = d.buffer.new(logo.x, logo.y, logo.w, logo.h, 'menu', 1);
	const background = d.buffer.new(0, 0, d.width, d.height, 'menu', 0);

	this.drawLogo = function() {
		d.buffer.setColor('white', 'black');
		d.drawSquare(logoBuffer, 0, 0, logo.w, logo.h, true);
		for (let i = 0; i < logoText.length; i++)
			logoBuffer.draw(logoText[i], 1, 2 + i);
		logoBuffer.simpleRender();
	}
	this.clearLogo = function() {
		logoBuffer.fill('green');
	}

	// Old method
	this.drawStatic = function() {
		const start = Date.now();
		this.setColor('white', 'black');
		this.drawSquare(logo.x, logo.y, logo.w, logo.h, false);
		for (let i = 0; i < 2; i++)
			this.draw(' '.repeat(logo.w - 2), logo.x + 1, logo.y + 1 + 6 * i);
		for (let i = 0; i < logoText.length; i++)
			this.draw(logoText[i], logo.x + 1, logo.y + 2 + i);
		console.log(Date.now() - start);
	}
	const colors = {
		fg : { black:'\x1b[30m', red:'\x1b[31m', green:'\x1b[32m', blue:'\x1b[34m', cyan:'\x1b[36m', white:'\x1b[37m', reset:'\x1b[0m' },
		bg : { black:'\x1b[40m', red:'\x1b[41m', green:'\x1b[42m', blue:'\x1b[44m', cyan:'\x1b[46m', white:'\x1b[47m', reset:'\x1b[0m' },
		reset : '\x1b[0m'
	};
	let foreground = colors.reset;

	this.setFg = function(colorName) { 
		process.stdout.write(colors.fg[colorName]);
	}
	this.setBg = function(colorName) { 
		process.stdout.write(colors.bg[colorName]);
	}
	this.setColor = function(fg, bg) {
		this.setFg(fg); this.setBg(bg);
	}
	this.draw = function(string, x, y) {
		process.stdout.cursorTo(x, y);
		process.stdout.write(string);
	}
	const squareElements = {
		none: {tl: ' ', tr: ' ', bl: ' ', br: ' ', h: ' ', v: ' '},
		thin: {tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│'},
		thick: {tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│'}
	};
	this.drawSquare = function(x, y, width, height, fill, border = 'thin') {
		let piece = squareElements[border];
		this.draw(piece.tl + piece.h.repeat(width - 2) + piece.tr, x, y);

		for (let i = 0; i < height - 2; i++) {
			this.draw(piece.v, x, y + 1 + i);
			if (fill) stdout.write(' '.repeat(width - 2));
			this.draw(piece.v, x + width - 1, y + 1 + i);
		}
		this.draw(piece.bl + piece.h.repeat(width - 2) + piece.br, x, y + height - 1);
	}
	this.clear2 = function() {
		this.setColor('black', 'green');
		for (let y = 0; y < logo.h; y++) {
			process.stdout.cursorTo(logo.x, logo.y + y);
			process.stdout.write(' '.repeat(logo.w));
		}
	}

	this.start = function() {
		// logoBuffer.outline('red');
		const start = Date.now();
		background.fill('green');
		process.stdout.cursorTo(0, 0);
		process.stdout.write((Date.now() - start).toString());
		// setTimeout(() => this.drawLogo(), 1000);
	}
	this.start2 = function() {
		const start = Date.now();
		process.stdout.write('\x1b[0m\x1b[42m');
		process.stdout.cursorTo(0, 0);
		for (let r = 0; r < d.height; r++) {
			for (let c = 0; c < d.width; c++) {
				process.stdout.write(' ');
			}
		}
		process.stdout.cursorTo(0, 0);
		process.stdout.write((Date.now() - start).toString());
	}
}

module.exports = MenuDisplay;
