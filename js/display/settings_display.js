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
		['DRAW 1', 'DRAW 3']
	];
	this.importThemes = (themes) => { for (const theme of themes) options[0].push(theme.toUpperCase()) };
	const preview = require('../../json/preview.json');

	const settings = d.buffer.new(x, y, w, h, 1, 'settings');
	const drawSettings = function(buffer, code) {
		d.setColor('txt');
		d.drawSquare(settings, 0, 0, w, h, true);
		for (let i = 0; i < settingsLogo.length; i++) {
			settings.draw(settingsLogo[i], 4, 2 + i);
		}
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
		drawPreview(d.themes[code[0]], code[1] == 0);

		if (buffer.length == 2) {
			const secondWidth = 16;
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
		}
	}
	const drawPreview = function(theme, labels = false) {
		const previewRows = preview.text.length;
		for (let i = 0; i < previewRows; i++) {
			settings.cursorTo(4, 13 + i);
			drawRow(i == 5 && !labels ? 4 : i, i);
		}
		function drawRow(textIndex, colorIndex) {
			let position = 0;
			for (const item of preview.color[colorIndex]) {
				const color = theme[item[0]];
				d.buffer.setColor(color[0], color[1]);
				const count = item[1];
				for (let j = 0; j < count; j++) {
					let char = preview.text[textIndex][position];
					if (!labels) {
						switch(char.charCodeAt(0)) {
							case 9824: case 9827: case 9829: case 9830:
								char = ' ';
						}
					}
					settings.write(char);
					position++;
				}
			}
		}
	}
	this.update = function(buffer, code) {
		drawSettings(buffer, code);
		settings.render();
	}
	this.draw = function(buffer, code) {
		drawSettings(buffer, code);
	}
}

module.exports = SettingsDisplay;
