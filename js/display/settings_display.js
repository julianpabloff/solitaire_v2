const SettingsDisplay = function(d) {
	this.setSize = function() {
		w = 80; h = 34;
		x = d.centerWidth(w);
		y = d.centerHeight(h);
	}
	let x, y, w, h;
	this.setSize();

	const settingsLogo = [
		'▄▄▄▄ ▄▄▄▄ ▄▄▄▄▄ ▄▄▄▄▄ ▄▄▄▄▄ ▄▄▄▄ ▄▄▄▄ ▄▄▄▄',
		'█▄▄▄ █▄▄▄   █     █     █   █  █ █ ▄▄ █▄▄▄',
		'▄▄▄█ █▄▄▄   █     █   ▄▄█▄▄ █  █ █▄▄█ ▄▄▄█'
	];
	const items = ['THEME', 'LABELS', 'DIFFICULTY'];
	const options = [
		[],
		['ENABLED', 'DISABLED'],
		['DRAW 1', 'DRAW 3'],
	];
	this.importThemes = () => {
		options[0] = d.exportThemesForMenu();
		// let i = 0;
		// for (const theme of themes) {
		// 	if (i < themes.length - 1) options[0].push(theme.toUpperCase())
		// 	else options[0].push(theme);
		// 	i++;
		// }
		options[0].push('manage...');
	};

	const settings = d.buffer.new(x, y, w, h, 1, 'settings');
	const colorToggle = d.buffer.new(x + settings.end - 10, y + 7, 5, 4, 2, 'settings');
	const drawSettings = function(buffer, code) {
		d.setColor('txt');
		d.drawSquare(settings, 0, 0, w, h, true);
		for (let i = 0; i < settingsLogo.length; i++)
			settings.draw(settingsLogo[i], 4, 2 + i);
		const firstWidth = 23;
		d.drawSquare(settings, 3, 6, firstWidth, 5, false);
		for (let i = 0; i < items.length; i++) {
			if (i == buffer[0]) d.setColor('txtcur');
			else d.setColor('txt');
			const output = ' ' + items[i] + ' - ' + options[i][code[i]];
			settings.draw(output, 4, 7 + i);
			const spaceAmount = firstWidth - (2 + output.length);
			if (spaceAmount > 0) settings.write(' '.repeat(spaceAmount));
		}
		d.setColor('txt');
		d.drawSquare(settings, 3, 12, 74, 19, false);
		settings.draw('press esc when done', 4, 31);
		d.drawPreview(settings, 4, 13, 'game', d.themes[code[0]], !code[1]);
		if (buffer.length == 2) {
			const secondWidth = 20;
			const secondOptions = options[buffer[0]];
			d.setColor('txt');
			d.drawSquare(settings, 26, 6, secondWidth, 2 + secondOptions.length, true);
			for (let i = 0; i < secondOptions.length; i++) {
				if (i == buffer[1]) d.setColor('txtcur');
				else d.setColor('txt');
				const text = secondOptions[i];
				const output = ' ' + text + ' '.repeat(secondWidth - 3 - text.length);
				settings.draw(output, 27, 7 + i);
			}
		} else if (buffer[0] == 3) {
			d.setColor('txt');
			colorToggle.draw('over here', 0, 0);
			colorToggle.render();
		}
		// drawPreview(d.themes[code[0]], code[1] == 0);
	}
	// const preview = require('../../json/preview.json');
	// const drawPreview = function(theme, labels = false) {
	// 	const previewRows = preview.text.length;
	// 	for (let i = 0; i < previewRows; i++) {
	// 		settings.cursorTo(4, 13 + i);
	// 		drawRow(i == 5 && !labels ? 4 : i, i);
	// 	}
	// 	function drawRow(textIndex, colorIndex) {
	// 		let position = 0;
	// 		for (const item of preview.color[colorIndex]) {
	// 			const color = theme[item[0]];
	// 			if (color[1] == 'none') color[1] = 'black';
	// 			d.buffer.setColor(color[0], color[1]);
	// 			const count = item[1];
	// 			for (let j = 0; j < count; j++) {
	// 				let char = preview.text[textIndex][position];
	// 				if (!labels) {
	// 					switch(char.charCodeAt(0)) {
	// 						case 9824: case 9827: case 9829: case 9830:
	// 							char = ' ';
	// 					}
	// 				}
	// 				settings.write(char);
	// 				position++;
	// 			}
	// 		}
	// 	}
	// }
	this.update = function(buffer, code) {
		drawSettings(buffer, code);
		settings.render();
	}
	this.draw = function(buffer, code) {
		drawSettings(buffer, code);
	}
	this.resize = function() {
		this.setSize();
		settings.simpleMove(x, y);
	}
}

module.exports = SettingsDisplay;
