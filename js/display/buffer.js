const BufferManager = function() {
	function sortedIndex(array, value) {
		let low = 0;
        let high = array.length;
		while (low < high) {
			const mid = (low + high) >>> 1;
			if (array[mid].zIndex < value) low = mid + 1;
			else high = mid;
		}
		return low;
	}
	this.screens = {};
	this.enforceScreens = false;
	this.new = function(x, y, width, height, zIndex = 0, screen = 'main') {
		if (!this.screen) this.screen = screen;
		if (!this.screens[screen]) this.screens[screen] = [];
		const zArray = this.screens[screen];
		const buffer = new DisplayBuffer(x, y, width, height, this, screen, zIndex);
		if (zArray.length > 0) zArray.splice(sortedIndex(zArray, zIndex), 0, buffer);
		else zArray.push(buffer);
		return buffer;
	}
	this.switch = function(screen) {
		for (const buffer of this.screens[this.screen]) {
			if (!buffer.empty) buffer.hide();
			if (buffer.outlined) buffer.outline.hide();
		}
		this.screen = screen;
		for (const buffer of this.screens[screen]) {
			if (buffer.outlined) buffer.outline();
			if (buffer.hidden) buffer.show();
		}
	}
	this.logScreens = function() {
		console.log(this.screens);
	}
	this.somethingAbove = function(target, x, y) {
		const zArray = this.screens[this.screen];
		if (zArray.length < 2) return false;
		let found = false;
		for (const buffer of zArray) {
			const index = buffer.screenToIndex(x, y);
			if (found && index != null) {
				if (!buffer.transparent) return true;
				if (buffer.previous[index] != 0) return true;
			}
			if (buffer.id == target.id) found = true;
		}
		return false;
	}
	this.somethingBelow = function(target, x, y) {
		const zArray = this.screens[this.screen];
		if (zArray.length < 2) return false;
		let found = false;
		for (let i = zArray.length - 1; i >= 0; i--) {
			const buffer = zArray[i];
			const index = buffer.screenToIndex(x, y);
			if (found && index != null) {
				const code = buffer.previous[index];
				const color = buffer.prevColors[index];
				if (code != 0 || color != 0) return { char: code, color: color };
				else if (!buffer.transparent) return false;
			}
			if (buffer.id == target.id) found = true; 
		}
		return false;
	}
	// All coordinates are buffer relative
	// first four coordinates are for target selection, final x and y are the destination cooridinates
	this.clone = function(target, destination, leftX, topY, rightX, bottomY, x, y) {
		const width = rightX - leftX + 1;
		const height = bottomY - topY + 1;
		if (width < 1 || height < 1) return;
		const area = width * height;
		let readIndex = target.coordinateIndex(leftX, topY);
		let writeIndex = destination.coordinateIndex(x, y);
		let i = 0;
		do {
			destination.current[writeIndex] = target.current[readIndex];
			i++;
			if (i % width == 0) {
				readIndex = target.coordinateIndex(leftX, topY + (i / width));
				writeIndex = destination.coordinateIndex(x, y + (i / width));
			} else {
				readIndex++;
				writeIndex++;
			}
		} while (i < area);
	}

	const multiRender = function(buffers) {
		const start = Date.now();
		process.stdout.write('\x1b[42m');
		const rows = process.stdout.rows;
		const columns = process.stdout.columns;
		// for (let i = 0; i < rows; i++) {
		// 	process.stdout.cursorTo(0, i);
		// 	process.stdout.write(' '.repeat(columns));
		// }
		const output = [];
		const size = rows * columns;
		for (let i = 0; i < size - 1; i++) {
			if ((i + 1) % columns == 0) output.push('\n');
			output.push(' ');
		}
		process.stdout.cursorTo(0, 0);
		process.stdout.write(output.join(''));

		process.stdout.write('\x1b[30m');
		process.stdout.cursorTo(1, 1);
		process.stdout.write((Date.now() - start).toString());
	}
	this.renderScreen = function(screenName) {
		multiRender(this.screens[screenName]);
	}

	// Colors
	this.color = 0;
	this.lastRenderedColor = 0;
	this.lastRenderedLocation = {x: 0, y: 0};
	this.colors = { reset: 0, black: 1, red: 2, green: 3, yellow: 4, blue: 5, magenta: 6, cyan: 7, white: 8 };
	this.setFg = function(color) {
		const fgCode = this.colors[color];
		this.color = (fgCode << 4) + (this.color & 0x0F);
		return this.color;
	}
	this.setBg = function(color) {
		const bgCode = this.colors[color];
		this.color = (this.color & 0xF0) + bgCode;
		return this.color;
	}
	this.setColor = function(foreground, background) {
		const fgCode = this.colors[foreground];
		const bgCode = this.colors[background];
		this.color = (fgCode << 4) + bgCode;
		return this.color;
	}
	this.setColorCode = code => this.color = code;
	this.resetColor = function() {
		this.color = 0;
	}
	this.setBackground = function(color, screen) {
		const timestamp = Date.now();
		process.stdout.write('\x1b[43m');
		const width = process.stdout.columns;
		const height = process.stdout.rows;
		const size = width * height;
		const buffers = this.screens[screen];
		let mark = 0;
		let i = 1;
		while (i < size) {
			if ((i + 1) % width == 0) {
				const start = screenCoorindates(mark);
				process.stdout.cursorTo(start.x, start.y);
				process.stdout.write(' '.repeat(i - mark + 1));
				i++;
				mark = i;
			} else if (check(i)) {
				const start = screenCoorindates(mark);
				process.stdout.cursorTo(start.x, start.y);
				process.stdout.write(' '.repeat(i - mark));
				mark = i;
				while (check(mark) && mark < size) {
					mark++;
				}
				i = mark;
			}
			i++;
		}
		process.stdout.write('\x1b[30m');
		process.stdout.cursorTo(1, 1);
		process.stdout.write((Date.now() - timestamp).toString());
		function check(screenIndex) {
			const x = screenIndex % width;
			const y = Math.floor(screenIndex / width);
			for (const buffer of buffers) {
				const charCode = buffer.previous[buffer.screenToIndex(x, y)];
				if (!charCode) continue;
				if (charCode != 0 || !buffer.transparent) return true;
			}
			return false;
		}
		function screenCoorindates(index) {
			return { x: index % width, y: Math.floor(index / width) }
		}
	}
	this.setBackground2 = function(color, screen) {
		// process.stdout.cursorTo(0,0);
		// process.stdout.write('X\x1b[4;4Hthe');
		output = [];
		function move(x, y) { output.push('\x1b[' + (y + 1).toString() + ';' + (x + 1).toString() + 'H'); }
		function write(string) { output.push(string); }
		move(0,0);

		const width = process.stdout.columns;
		const height = process.stdout.rows;
		for (let i = 0; i < height; i++) {
			for (let j = 0; j < width; j += 2) {
				move(j, i);
				write('X');
			}
		}
		process.stdout.write(output.join(''));
	}
	this.setBackground3 = function(color, screen) {
		const width = process.stdout.columns;
		const height = process.stdout.rows;
		for (let i = 0; i < height; i++) {
			for (let j = 0; j < width; j += 2) {
				process.stdout.cursorTo(j, i);
				process.stdout.write('X');
			}
		}
	}
}

const crypto = require('crypto');
const DisplayBuffer = function(x, y, width, height, manager, screen, zIndex = 0) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.end = width - 1;
	this.bottom = height - 1;
	this.size = width * height;
	this.empty = true;
	this.outlined = false;
	this.screen = screen;
	this.zIndex = zIndex;
	this.transparent = true;
	this.id = crypto.randomBytes(32);

	this.current = new Uint16Array(this.size);
	this.previous = new Uint16Array(this.size);
	this.colors = new Uint8Array(this.size);
	this.prevColors = new Uint8Array(this.size);

	// Coordinates
	this.coordinateIndex = (x, y) => (y * this.width) + x; // buffer x & y to buffer array index
	this.indexToScreen = (index) => { return {x: this.x + (index % this.width), y: this.y + Math.floor(index / this.width)} }
	this.screenToIndex = function(x, y) {
		if (x < this.x || x >= this.x + this.width || y < this.y || y >= this.y + this.height) return null;
		return ((y - this.y) * this.width) + x - this.x;
	}

	// Writing to buffer
	let cursorIndex = 0;
	this.print = function(string, index, fg = false, bg = false) {
		if (fg) manager.setFg(fg);
		if (bg) manager.setBg(bg);
		for (let i = 0; i < string.length; i++) {
			this.current[index + i] = string.charCodeAt(i);
			this.colors[index + i] = manager.color;
		}
		cursorIndex = index + string.length;
		if (cursorIndex > this.size) cursorIndex = this.size;
	}
	this.cursorTo = (x, y) => cursorIndex = this.coordinateIndex(x, y);
	this.write = function(string, fg = false, bg = false) {
		this.print(string, cursorIndex, fg, bg);
		return this;
	}
	this.draw = function(string, x, y, fg = false, bg = false) {
		const index = this.coordinateIndex(x, y);
		this.print(string, index, fg, bg);
		return this;
	}
	this.erase = function(x, y, count = 1) {
		const index = this.coordinateIndex(x, y);
		for (let i = 0; i < count; i++) {
			this.current[index + i] = 0;
			this.colors[index + i] = 0;
		}
		return this;
	}

	// Rendering buffer
	function drawToScreen(string, x, y) {
		process.stdout.cursorTo(x, y);
		process.stdout.write(string);
	}
	this.render = function(clearLastFrame = true) {
		const output = [];
		for (let i = 0; i < this.size; i++) {
			let code = this.current[i];
			let colorCode = this.colors[i];
			const prevCode = this.previous[i];
			const prevColorCode = this.prevColors[i];
			if (!clearLastFrame && code == 0 && prevCode != 0) {
				code = prevCode;
				colorCode = prevColorCode;
			}
			const screenLocation = this.indexToScreen(i);
			const x = screenLocation.x; const y = screenLocation.y;
			let drawingCode = code;
			let drawingColorCode = colorCode;
			if (code == 0) {// && clearLastFrame) {
				const below = manager.somethingBelow(this, x, y);
				if (below) {
					drawingCode = below.char;
					drawingColorCode = below.color;
				} else {
					if (!this.transparent) code = 32;
					drawingCode = 32;
					drawingColorCode = 0;
				}
			}
			const draw = 
				(!(manager.enforceScreens && manager.screen != this.screen)) &&
				(code != prevCode || colorCode != prevColorCode) &&
				(!manager.somethingAbove(this, x, y));
			if (draw) {
				const fgCode = drawingColorCode >> 4;
				const bgCode = drawingColorCode & 0x0F;
				if (drawingColorCode != manager.lastRenderedColor) {
					if (fgCode == 0 || bgCode == 0) output.push('\x1b[0m');
					if (fgCode > 0) output.push('\x1b[' + (29 + fgCode).toString() + 'm');
					if (bgCode > 0) output.push('\x1b[' + (39 + bgCode).toString() + 'm');
				}
				const char = String.fromCharCode(drawingCode);
				const last = manager.lastRenderedLocation;
				if (!(last.y == y && last.x == x - 1))
					output.push('\x1b[' + (y + 1).toString() + ';' + (x + 1).toString() + 'H'); 
				output.push(char); 
				manager.lastRenderedColor = drawingColorCode;
				manager.lastRenderedLocation = screenLocation;
			}
			this.current[i] = 0;
			this.colors[i] = 0;
			this.previous[i] = code;
			this.prevColors[i] = colorCode;
		}
		process.stdout.write(output.join(''));
	}
	// Prints row by row, each row all at once. Faster for large areas that completely change
	this.simpleRender = function() {
		let start = this.indexToScreen(0);
		let output = []; let outputColor;
		for (let i = 0; i <= this.size; i++) {
			let code = this.current[i];
			let colorCode = this.colors[i];
			const prevCode = this.previous[i];
			const prevColorCode = this.prevColors[i];
			if (code == 0 && prevCode != 0) {
				code = prevCode;
				colorCode = prevColorCode;
			}
			// i + 1 % this.width -- solution is to look ahead
			if ((i % this.width == 0 && i > 0) || colorCode != outputColor) {
				const fgCode = outputColor >> 4;
				const bgCode = outputColor & 0x0F;
				if (fgCode == 0 || bgCode == 0) process.stdout.write('\x1b[0m');
				if (fgCode > 0) process.stdout.write('\x1b[' + (29 + fgCode).toString() + 'm');
				if (bgCode > 0) process.stdout.write('\x1b[' + (39 + bgCode).toString() + 'm');
				const string = output.join('');
				drawToScreen(string, start.x, start.y);
				start = this.indexToScreen(i);
				output = [];
				manager.lastRenderedColor = outputColor = colorCode;
			}
			output.push(String.fromCharCode(code));
			outputColor = colorCode;
			manager.lastRenderedColor = colorCode;
			if (i < this.size) {
				this.current[i] = this.colors[i] = 0;
				this.previous[i] = code;
				this.prevColors[i] = colorCode;
			}
		}
	}
	// For adding to the canvas without it clearing
	this.paint = function() {
		this.render(false);
		return this;
	}
	this.fill = function(color, char = ' ') {
		this.current.fill(char.charCodeAt(0));
		manager.setBg(color);
		this.colors.fill(manager.color);
		return this;
	}

	// Saving buffer and reading from the save
	let savedBuffer, savedColors;
	this.save = function() {
		savedBuffer = new Uint16Array(this.current);
		for (let i = 0; i < this.size; i++) {
			if (savedBuffer[i] == 0) savedBuffer[i] = 32;
		}
		savedColors = new Uint8Array(this.colors);
		return this;
	}
	const colorLookup = ['reset', 'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
	this.read = function(x, y) {
		const index = this.coordinateIndex(x, y);
		const colorCode = savedColors[index];
		return {
			char: String.fromCharCode(savedBuffer[index]),
			fg: colorLookup[colorCode >> 4],
			bg: colorLookup[colorCode & 0x0F]
		};
		return this;
	}
	this.load = function() {
		this.current = new Uint16Array(savedBuffer);
		this.colors = new Uint8Array(savedColors);
		return this;
	}
	this.loadArea = function(x, y, width = 1, height = 1) {
		const area = width * height;
		let index = this.coordinateIndex(x, y);
		let i = 0;
		do {
			this.current[index] = savedBuffer[index];
			this.colors[index] = savedColors[index];
			i++;
			if (i % width == 0) index = this.coordinateIndex(x, y + (i / width));
			else index++;
		} while (i < area);
		return this;
	}
	let hideBuffer, hideColors;
	this.hidden = false;
	this.hide = function() {
		hideBuffer = new Uint16Array(this.previous);
		hideColors = new Uint8Array(this.prevColors);
		this.clear();
		this.hidden = true;
	}
	this.show = function() {
		this.current = new Uint16Array(hideBuffer);
		this.colors = new Uint8Array(hideColors);
		this.render();
		this.hidden = false;
	}
	// Empties current drawing buffers
	this.clearDraw = function() {
		this.current = new Uint16Array(this.size);
		this.colors = new Uint8Array(this.size);
	}
	this.clear = function(render = false) {
		this.clearDraw();
		this.render();
		this.empty = true;
	}
	// Only meant to be used for when the screen dimensions change
	this.move = function(x, y) {
		const wasOutlined = this.outlined;
		const tempBuffer = new Uint16Array(this.previous);
		const tempColorBuffer = new Uint8Array(this.prevColors);
		if (!this.hidden) this.clear();
		if (wasOutlined) this.outline('reset', false);
		this.current = tempBuffer;
		this.colors = tempColorBuffer;
		this.x = x; this.y = y;
		if (!this.hidden) {
			this.render();
			if (wasOutlined) this.outline(outlineColor);
		}
	}

	this.roll = function(amount) {
		this.size += this.width * amount;
	}

	// These parameters are all deltas. Width/height gets added to right/bottom
	this.transform = function(top, right = 0, bottom = 0, left = 0) {
		const newX = this.x - left;
		const newY = this.y - top;
		const newW = this.width + left + right;
		const newH = this.height + top + bottom;
		for (let i = 0; i < this.size; i++) {
			const screenLocation = this.indexToScreen(i);
			const x = screenLocation.x; const y = screenLocation.y;
			const localX = i % this.width;
			const localY = Math.floor(i / this.width);
			if (x < newX || x > newX + newW - 1 || y < newY || y > newY + newH - 1) {
				this.current[i] = 0;
				this.colors[i] = 0;
			} else {
				this.current[i] = this.previous[i];
				this.colors[i] = this.prevColors[i];
			};
		}
		this.render();
		const tempBuffer = new Uint16Array(this.previous);
		const tempColorBuffer = new Uint8Array(this.prevColors);
		
	}
	this.randomFill = function() {
		for (let i = 0; i < this.size; i++) {
			const random = Math.random() * 50 + 65;
			const char = String.fromCharCode(random);
			this.draw(char, i % this.width, Math.floor(i / this.width));
		}
		this.render();
	}

	// For seeing where it is
	let outlineColor = 'reset';
	this.outline = function(color = outlineColor, draw = true) {
		if (this.screen == manager.screen) {
			const fgCode = manager.colors[color];
			process.stdout.write('\x1b[0m');
			process.stdout.write('\x1b[' + (29 * (fgCode != 0) + fgCode).toString() + 'm');
			const sq = draw ?
				{tl: '┌', h: '─', tr: '┐', v: '│', bl: '└', br: '┘'}:
				{tl: ' ', h: ' ', tr: ' ', v: ' ', bl: ' ', br: ' '};
			drawToScreen(sq.tl + sq.h.repeat(this.width) + sq.tr, this.x - 1, this.y - 1);
			for (let i = 0; i < this.height; i++) {
				drawToScreen(sq.v, this.x - 1, this.y + i);
				drawToScreen(sq.v, this.x + this.width, this.y + i);
			}
			drawToScreen(sq.bl + sq.h.repeat(this.width) + sq.br, this.x - 1, this.y + this.height);
			manager.lastRenderedColor = manager.setColor(color, 'reset');
		}
		this.outlined = draw;
		if (draw) outlineColor = color;
	}
	this.outline.clear = () => {
		if (this.outlined) this.outline('reset', false);
	}
	this.outline.hide = () => {
		this.outline.clear();
		this.outlined = true;
	}
	this.enablePixels = function() {
		const PixelEngine = require('./pixels.js');
		this.pixel = new PixelEngine(manager, this);
	}
}

module.exports = BufferManager;
