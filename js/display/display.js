const BufferManager = require('./buffer.js');
const MenuDisplay = require('./menu_display.js');
const GameDisplay = require('./game_display.js');
const SettingsDisplay = require('./settings_display.js');
const ThemeManagerDisplay = require('./themeManager_display.js');

const Display = function() {
	this.init = function() {
		// process.stdout.write('\x1b[2J');
		process.stdout.write('\x1b[?25l');
		this.applyBackground();
	}
	this.clear = () => {
		process.stdout.write('\x1b[0m\x1b[2J');
		this.buffer.lastRenderedColor = 0;
	}
	this.exit = function(screen = 'menu') {
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
	const background = this.buffer.new(0, 0, columns, rows, 0, 'all');

	// this.themes = require('../../json/themes.json');
	this.themes = [];
	this.getTheme = function(name) {
		for (const theme of this.themes)
			if (theme.title == name) return theme;
	}
	this.setTheme = function(name) {
		this.theme = this.getTheme(name);
	}
	this.exportThemesForMenu = function() {
		const output = [];
		// let i = 0;
		for (const theme of this.themes) {
			output.push(theme.title.toUpperCase());
			// if (i < this.themes.length - 1) output.push(theme.title.toUpperCase())
			// else output.push(theme.title);
			// i++;
		}
		return output;
	}
	this.setColor = function(attribute) {
		const color = this.theme[attribute];
		this.buffer.setColor(color[0], color[1]);
	}
	this.applyBackground = function() {
		const bg = this.theme['tab'][1];
		const fg = this.theme['tom'][1];
		background.fill(bg);
		// background.fill(this.theme['tab'][1], '.', this.theme['tom'][1]);
		background.render();
	}
	this.fillBackground = color => background.fill(color);

	const squareElements = {
		thin: {tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│'},
		thick: {tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│'}
	};
	this.drawSquare = function(buffer, x, y, width, height, fill = true, border = 'thin') {
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
	const previewJSON = require('../../json/preview.json');
	this.drawPreview = function(buffer, x, y, scene, theme, labels = false) {
		const preview = previewJSON[scene];
		const previewRows = preview.text.length;
		for (let i = 0; i < previewRows; i++) {
			buffer.cursorTo(x, y + i);
			const textIndex = i == 5 && !labels ? 4 : i;
			let position = 0;
			for (const item of preview.color[i]) {
				const changeToModeCursor = item[0] == 'tom' && theme['tom'][1] == theme['cur'][1];
				const color = changeToModeCursor ? theme['tab'] : theme[item[0]];
				if (color[1] == 'none') color[1] = 'black';
				this.buffer.setColor(color[0], color[1]);
				const count = item[1];
				for (let j = 0; j < count; j++) {
					let char = changeToModeCursor ? '░' : preview.text[textIndex][position];
					if (!labels) {
						switch(char.charCodeAt(0)) {
							case 9824: case 9827: case 9829: case 9830:
								char = ' ';
						}
					}
					buffer.write(char);
					position++;
				}
			}
		}
	}

	const debug = this.buffer.new(24, Math.floor(this.height / 2) - 10, columns, 2, 3, 'all');//.fill('red');
	this.debug = function(item) {
		// this.setColor('txt');
		this.buffer.setColor('white', 'none');
		debug.draw(item, 0, 0).render();
	}
	this.redrawTest = function() {
		this.clear();
		setTimeout(() => {
			this.menu.redrawTest();
			this.buffer.generateSavedScreen('menu');
		}, 1000);
	}
	this.resize = function(screen, data) {
		// this.buffer.setSize();
		this.setSize();
		background.setSize(0, 0, columns, rows);
		const bg = this.theme['tab'][1];
		background.fill(bg);
		// background.fill(this.theme['tab'][1], '.', this.theme['tom'][1]);
		this.menu.resize();
		this.settings.resize();
		this.game.resize();
		this[screen].draw(...data);
		// this.buffer.logScreen(screen);
		this.buffer.generateSavedScreen(screen);
	}

	this.menu = new MenuDisplay(this);
	this.game = new GameDisplay(this);
	this.settings = new SettingsDisplay(this);
	this.themeManager = new ThemeManagerDisplay(this);
}

module.exports = Display;
