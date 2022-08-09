const ThemeManagerDisplay = function(d) {
	this.setSize = function() {
		w = 119; h = 27;
		x = d.centerWidth(w);
		y = d.centerHeight(h);
	}
	let x, y, w, h;
	this.setSize();
	const menuWidth = 37;
	const menuHeight = 18;

	const themeManagerLogo = [
		'▄▄▄▄▄ ▄  ▄ ▄▄▄▄ ▄▄▄▄▄ ▄▄▄▄ ▄▄▄▄',
		'  █   █▄▄█ █▄▄▄ █ █ █ █▄▄▄ █▄▄▄',
		'  █   █  █ █▄▄▄ █ █ █ █▄▄▄ ▄▄▄█',
	];
	const menuItems = ['SELECTED THEME', 'THEME OPTIONS...', 'REVERT CHANGES...'];
	const attributeItems = ['HEARTS', 'CLUBS', 'DIAMONDS', 'SPADES', 'CARD BACK', 'TABLE', 'MENU TEXT', 'TEXT CURSOR', 'GAME CURSOR', 'TO MODE'];
	const colorAttributes = new Map();
	colorAttributes.set('HEARTS', 'h').set('CLUBS', 'c').set('DIAMONDS', 'd').set('SPADES', 's').set('CARD BACK', 'bac').set('TABLE', 'tab').set('MENU TEXT', 'txt').set('TEXT CURSOR', 'txtcur').set('GAME CURSOR', 'cur').set('TO MODE', 'tom');
	let themeOptions;
	this.importThemes = () => themeOptions = d.exportThemesForMenu();

	// From controller
	const controllerBuffer = {option: 6, optionSelected: false, secondary: 0, onFg: false};
	const selectedThemeIndex = 0;

	const themeManager = d.buffer.new(x, y, w, h, 1, 'themeManager');
	const menuBuffer = d.buffer.new(x + 3, y + 6, menuWidth, menuHeight, 2, 'themeManager');
	const preview = d.buffer.new(x + 42, y + 6, 74, menuHeight, 2, 'themeManager');

	const drawThemeManager = function() {
		d.setColor('txt');
		d.drawSquare(themeManager, 0, 0, w, h, true);
		for (let i = 0; i < themeManagerLogo.length; i++)
			themeManager.draw(themeManagerLogo[i], 4, 2 + i);
		themeManager.draw('press space to cycle scene', w - 30, 5);

		// Menu
		d.drawSquare(menuBuffer, 0, 0, menuWidth, menuHeight, true);
		if (!controllerBuffer.optionSelected) {
			const selectedThemeText = themeOptions[selectedThemeIndex];
			for (let i = 0; i < menuItems.length; i++) {
				if (i == controllerBuffer.option) d.setColor('txtcur');
				else d.setColor('txt');
				const output = ' ' + menuItems[i] + (i == 0 ? ' - ' + themeOptions[selectedThemeIndex] : '');
				menuBuffer.draw(output, 1, 1 + i);
				const spaceAmount = menuWidth - (2 + output.length);
				menuBuffer.write(' '.repeat(spaceAmount));
			}
			menuBuffer.draw('-'.repeat(menuWidth - 2), 1, 4).draw('item', 3, 5).draw('| fg', 15, 5).draw('| bg', 25, 5);
			menuBuffer.draw('-'.repeat(14) + '+' + '-'.repeat(9) + '+' + '-'.repeat(10), 1, 6);
			const selectedTheme = d.getTheme(selectedThemeText.toLowerCase());
			let i = 0;
			colorAttributes.forEach((jsonName, menuName) => {
				const rowSelected = i + 3 == controllerBuffer.option;
				const attribute = selectedTheme[jsonName];
				menuBuffer.draw(' ' + menuName + ' '.repeat(13 - menuName.length) + '|', 1, 7 + i);
				if (rowSelected && controllerBuffer.onFg) d.setColor('txtcur');
				menuBuffer.write(' ' + attribute[0].toUpperCase() + ' '.repeat(8 - attribute[0].length));
				d.setColor('txt');
				menuBuffer.write('|');
				if (rowSelected && !controllerBuffer.onFg) d.setColor('txtcur');
				menuBuffer.write(' ' + attribute[1].toUpperCase() + ' '.repeat(8 - attribute[1].length));
				d.setColor('txt');
				i++;
			});
		} else {
			const colorMap = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'none'];
			for (let i = 0; i < 9; i++) {
				const char = i < 8 ? '░' : '.';
				const x = (i % 3) * 11 + 3;
				const y = Math.floor(i / 3) * 5 + 2;
				if (i == 0) {
					d.drawSquare(menuBuffer, x - 1, y - 1, 11, 6, false);
					d.buffer.setColor(colorMap[i], colorMap[i]);
					// d.buffer.setColor('background', 'background');
				} else d.buffer.setColor(d.theme.txt[0], colorMap[i]);
				for (let j = 0; j < 3; j++) menuBuffer.draw(char.repeat(9), x, y + j);
				if (i == 0) d.setColor('txtcur');
				else d.setColor('txt');
				menuBuffer.draw(colorMap[i] + ' '.repeat(9 - colorMap[i].length), x, y + 3);
			}
		}

		// Preview
		d.drawPreview(preview, 0, 1, 'game', d.themes[0], false);
		d.setColor('txt');
		d.drawSquare(preview, 0, 0, preview.width, menuHeight, false);
		
		themeManager.draw('press esc when done', 4, themeManager.bottom - 2);
	}

	this.draw = function() {
		drawThemeManager();
	}
}

module.exports = ThemeManagerDisplay;
