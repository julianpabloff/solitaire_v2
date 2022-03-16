const BufferManager = require('./buffer.js');
const MenuDisplay = require('./menu_display.js');
const SettingsDisplay = require('./settings_display.js');

const Display = function() {
	this.init = function() {
		process.stdout.write('\x1b[2J');
		process.stdout.write('\x1b[?25l');
		background.fill(this.theme['tab'][1]).simpleRender();
	}
	this.exit = function(screen = 'menu') {
		// this[screen].exit();
		// stdout.write('\x1b[?25h\x1b[0m\x1b[2J');
		process.stdout.write('\x1b[?25h\x1b[0m');
		process.stdout.cursorTo(0,0);
	}

	this.setSize = function() {
		rows = process.stdout.rows;
		columns = process.stdout.columns;
		this.width = columns; this.height = rows;
	}
	let rows, columns;
	this.setSize();

	this.centerWidth = width => { return Math.floor(columns/2 - width/2); }
	this.centerHeight = height => { return Math.floor(rows/2 - height/2); }
	this.centerString = (string, width = columns) => { return Math.floor(width / 2 - string.length / 2); }

	this.buffer = new BufferManager();
	this.menu = new MenuDisplay(this);
	this.settings = new SettingsDisplay(this);
	const background = this.buffer.new(0, 0, columns, rows, 'menu', 0);

	this.themes = require('../../json/themes.json');
	this.getTheme = function(name) {
		for (const theme of this.themes)
			if (theme.title == name) return theme;
	}
	this.setTheme = function(name) {
		this.theme = this.getTheme(name);
	}
	this.setColor = function(attribute) {
		const color = this.theme[attribute];
		this.buffer.setColor(color[0], color[1]);
	}

	const squareElements = {
		none: {tl: ' ', tr: ' ', bl: ' ', br: ' ', h: ' ', v: ' '},
		thin: {tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│'},
		thick: {tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│'}
	};
	this.drawSquare = function(buffer, x, y, width, height, fill, border = 'thin') {
		let piece = squareElements[border];
		buffer.draw(piece.tl + piece.h.repeat(width - 2) + piece.tr, x, y);

		for (let i = 0; i < height - 2; i++) {
			buffer.draw(piece.v, x, y + 1 + i);
			if (fill) buffer.write(' '.repeat(width - 2));
			buffer.draw(piece.v, x + width - 1, y + 1 + i);
		}
		buffer.draw(piece.bl + piece.h.repeat(width - 2) + piece.br, x, y + height - 1);
		return buffer;
	}

}

module.exports = Display;
