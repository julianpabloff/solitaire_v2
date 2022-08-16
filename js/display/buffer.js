const BufferManager = function() {
	const sortedIndex = function(array, value) {
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
	let idIncrement = 0;
	const newID = () => { idIncrement++; return idIncrement }
	this.new = function(x, y, width, height, zIndex = 0, screen = 'main') {
		if (!this.screen) this.screen = screen;
		if (!this.screens[screen]) this.screens[screen] = [];
		const zArray = this.screens[screen];
		const buffer = new DisplayBuffer(x, y, width, height, this, screen, zIndex);
		buffer.id = newID();
		if (zArray.length > 0) zArray.splice(sortedIndex(zArray, zIndex), 0, buffer);
		else zArray.push(buffer);
		return buffer;
	}
	this.setSize = function() {
		screenWidth = process.stdout.columns;
		screenSize = screenWidth * process.stdout.rows;
		this.codes = new Uint16Array(screenSize);
		this.colors = new Uint8Array(screenSize);
	}
	let screenWidth, screenSize;
	this.setSize();
	this.save = function(code, color, x, y) {
		const index = y * screenWidth + x;
		this.codes[index] = code;
		this.colors[index] = color;
	}

	// Colors
	this.color = 0;
	this.lastRenderedColor = 0;
	this.lastRenderedLocation = {x: 0, y: 0};
	this.colorMap = { none: 0, black: 1, red: 2, green: 3, yellow: 4, blue: 5, magenta: 6, cyan: 7, white: 8, background: 9 };
	this.setFg = function(color) {
		const fgCode = this.colorMap[color];
		this.color = (fgCode << 4) + (this.color & 0x0F);
		return this.color;
	}
	this.setBg = function(color) {
		const bgCode = this.colorMap[color];
		this.color = (this.color & 0xF0) + bgCode;
		return this.color;
	}
	this.setColor = function(foreground, background) {
		const fgCode = this.colorMap[foreground];
		const bgCode = this.colorMap[background];
		this.color = (fgCode << 4) + bgCode;
		return this.color;
	}
	this.fgToString = code => '\x1b[' + (29 + code).toString() + 'm';
	this.bgToString = code => '\x1b[' + (39 + code).toString() + 'm';
	this.resetColorString = '\x1b[0m';
	this.moveCursorString = (x, y) => '\x1b[' + (y + 1).toString() + ';' + (x + 1).toString() + 'H'

	// Buffer interaction
	this.gatherBuffersOnScreen = function(screen = this.screen) {
		const screenArray = this.screens[screen];
		const allScreen = this.screens['all'];
		const zArray = [];
		for (const buffer of screenArray) zArray.push(buffer);
		if (allScreen)
			for (const buffer of allScreen)
				zArray.splice(sortedIndex(zArray, buffer.zIndex), 0, buffer);
		return zArray;
	}
	this.somethingAbove = function(target, x, y) {
		const zArray = this.gatherBuffersOnScreen();
		if (zArray.length < 2) return false;
		let found = false;
		let output = { code: 0, fg: 0, bg: 0 };
		for (const buffer of zArray) {
			const index = buffer.screenToIndex(x, y);
			if (found && index != null) {
				const code = buffer.previous[index];
				const color = buffer.prevColors[index];
				const fg = color >> 4; const bg = color & 0x0F;
				if (code) output.code = code;
				if (fg) output.fg = fg;
				if (bg) output.bg = bg;
			}
			if (buffer.id == target.id) found = true;
		}
		if (output.code || output.fg || output.bg) return output;
		return false;
	}
	this.somethingBelow = function(target, x, y) {
		const zArray = this.gatherBuffersOnScreen();
		if (zArray.length < 2) return false;
		let found = false;
		let output = { code: 0, fg: 0, bg: 0 };
		for (let i = zArray.length - 1; i >= 0; i--) {
			const buffer = zArray[i];
			const index = buffer.screenToIndex(x, y);
			if (found && index != null) {
				const code = buffer.previous[index];
				const color = buffer.prevColors[index];
				const fg = color >> 4; const bg = color & 0x0F;
				if (code && !output.code) output.code = code;
				if (fg && !output.fg) output.fg = fg;
				if (bg && !output.bg) output.bg = bg;
			}
			if (buffer.id == target.id) found = true; 
		}
		if (output.code || output.fg || output.bg) return output;
		return false;
	}
	this.addToOutput = function(output, code, color, x, y) {
		const fgCode = color >> 4; const bgCode = color & 0x0F;
		if (color != this.lastRenderedColor) {
			if (fgCode == 0 || bgCode == 0 || fgCode == 9 || bgCode == 9) output.push(this.resetColorString);
			if (fgCode > 0) output.push(this.fgToString(fgCode));
			if (bgCode > 0) output.push(this.bgToString(bgCode));
		}
		const char = String.fromCharCode(code);
		const last = this.lastRenderedLocation;
		if (!(last.y == y && last.x == x - 1)) output.push(this.moveCursorString(x, y));
		output.push(char);
		this.lastRenderedColor = color;
		this.lastRenderedLocation = {x: x, y: y};
	}
	this.generateScreen = function(screen = this.screen) {
		const zArray = this.gatherBuffersOnScreen(screen);
		const output = [];
		for (let i = 0; i < screenSize; i++) {
			const x = i % screenWidth; const y = Math.floor(i / screenWidth);
			const point = { code: 0, fg: 0, bg: 0 };
			for (let j = zArray.length - 1; j >= 0; j--) {
				const buffer = zArray[j];
				const index = buffer.screenToIndex(x, y);
				if (index == null) continue;
				const code = buffer.current[index];
				const color = buffer.colors[index];
				buffer.previous[index] = code;
				buffer.prevColors[index] = color;
				if (!code && !color) continue;
				if (code && !point.code) point.code = this.codes[i] = code;
				if (color && !this.colors[i]) this.colors[i] = color;
				const fg = color >> 4; const bg = color & 0xF;
				if (fg && !point.fg) point.fg = fg;
				if (bg && !point.bg) point.bg = bg;
				if (point.code && point.fg && point.bg) break;
			}
			if (point.code || point.fg || point.bg)
				this.addToOutput(output, point.code, (point.fg << 4) + point.bg, x, y);
		}
		for (const buffer of zArray) buffer.clearDraw();
		return output.join('');
	}
	this.resizeAndRender = function(screen = this.screen) {
		this.setSize();
		process.stdout.write(this.generateScreen(screen));
	}
	this.switchToScreen = function(screen) {
		if (screen == this.screen) return;
		const zArray = this.gatherBuffersOnScreen(screen);
		const newCodes = new Uint16Array(screenSize);
		const newColors = new Uint8Array(screenSize);
		const output = [];
		for (let i = 0; i < screenSize; i++) {
			const x = i % screenWidth; const y = Math.floor(i / screenWidth);
			const point = { code: 0, fg: 0, bg: 0 };
			const codeOnScreen = this.codes[i];
			const colorOnScreen = this.colors[i];
			for (let j = zArray.length - 1; j >= 0; j--) {
				const buffer = zArray[j];
				const index = buffer.screenToIndex(x, y);
				if (index == null) continue;
				let code, color;
				if (buffer.screen == 'all') {
					code = buffer.previous[index];
					color = buffer.prevColors[index];
				} else {
					code = buffer.current[index];
					color = buffer.colors[index];
					buffer.previous[index] = code;
					buffer.prevColors[index] = color;
				}
				if (!code && !color) continue;
				if (code && !point.code) point.code = code;
				const fg = color >> 4; const bg = color & 0x0F;
				if (fg && !point.fg) point.fg = fg;
				if (bg && !point.bg) point.bg = bg;
				if (point.code && point.fg && point.bg) break;
			}
			if (point.code || point.fg || point.bg) {
				const outputColor = (point.fg << 4) + point.bg;
				newCodes[i] = point.code;
				newColors[i] = outputColor;
				this.addToOutput(output, point.code, outputColor, x, y);
			} else if (codeOnScreen) this.addToOutput(output, 32, 0, x, y);
		}
		for (const buffer of zArray) buffer.clearDraw();
		this.codes = new Uint16Array(newCodes);
		this.colors = new Uint8Array(newColors);
		this.screen = screen;
		process.stdout.write(output.join(''));
	}
	this.groupRender = function() {
		const buffersToRender = [...arguments];
		const output = [];
		for (const buffer of buffersToRender) {
			output.push(buffer.render(true, false));
		}
		process.stdout.write(output.join(''));
	}
}

const DisplayBuffer = function(x, y, width, height, manager, screen, zIndex = 0) {
	this.screen = screen;
	this.zIndex = zIndex;
	this.transparent = true;
	this.enforceChanged = true;
	this.reset = function() {
		this.current = new Uint16Array(this.size);
		this.previous = new Uint16Array(this.size);
		this.colors = new Uint8Array(this.size);
		this.prevColors = new Uint8Array(this.size);
		this.changed = false;
	}
	this.setSize = function(x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.end = width - 1;
		this.bottom = height - 1;
		this.size = width * height;
		this.empty = true;
		this.reset();
	}
	this.setSize(x, y, width, height);
	this.move = (x, y) => { this.x = x; this.y = y }

	// Coordinates
	this.coordinateIndex = (x, y) => (y * this.width) + x; // buffer x & y to buffer array index
	this.indexToScreen = index => { return {x: this.x + (index % this.width), y: this.y + Math.floor(index / this.width)} }
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
		if (cursorIndex > this.size) cursorIndex = 0;
		this.changed = true;
	}
	this.cursorTo = (x, y) => cursorIndex = this.coordinateIndex(x, y);
	this.write = function(string) {
		this.print(string, cursorIndex);
		return this;
	}
	this.draw = function(string, x, y, fg = false, bg = false) {
		const index = this.coordinateIndex(x, y);
		this.print(string, index, fg, bg);
		return this;
	}
	this.clearDraw = function() {
		this.current = new Uint16Array(this.size);
		this.colors = new Uint8Array(this.size);
		this.changed = true;
	}
	this.moveToPrevious = function(index, code, color) {
		this.current[index] = 0;
		this.colors[index] = 0;
		this.previous[index] = code;
		this.prevColors[index] = color;
	}
	this.render = function(clearLastFrame = true, execute = true) {
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
			if (code == 0) {
				const below = manager.somethingBelow(this, x, y);
				if (below) {
					drawingCode = below.code;
					drawingColorCode = (below.fg << 4) + below.bg;
				} else {
					if (!this.transparent) code = 32;
					drawingCode = 32;
					drawingColorCode = 0;
				}
			} else if ((colorCode & 0x0F) == 0 && this.transparent) { // Character present but no background color
				const below = manager.somethingBelow(this, x, y);
				if (below) drawingColorCode = (drawingColorCode & 0xF0) + below.bg;
			}
			const bufferOnActiveScreen = !(manager.enforceScreens && manager.screen != this.screen);
			const differentThanPrev = code != prevCode || colorCode != prevColorCode;
			const above = manager.somethingAbove(this, x, y);
			if (bufferOnActiveScreen && differentThanPrev) {
				let draw = !above.code;
				if (above.code && !above.bg) {
					drawingCode = above.code;
					// Uses the code and color of the above point, but preserves the background of this buffer's point
					drawingColorCode = (above.fg << 4) + (drawingColorCode & 0x0F);
					draw = true;
				}
				if (draw) {
					manager.addToOutput(output, drawingCode, drawingColorCode, x, y);
					manager.save(drawingCode, drawingColorCode, x, y);
				}
			}
			this.moveToPrevious(i, code, colorCode);
		}
		this.changed = false;
		const outputString = output.join('');
		if (execute) process.stdout.write(outputString);
		else return outputString;
	}
	this.paint = function() {
		this.render(false);
		return this;
	}
	this.fill = function(color, char = ' ', foreground = null) {
		const tempBg = manager.color & 0xF;
		this.current.fill(char.charCodeAt(0));
		manager.setBg(color);
		if (foreground) manager.setFg(foreground);
		this.colors.fill(manager.color);
		manager.setBg(tempBg);
		this.changed = true;
		return this;
	}
	this.fillArea = function(x, y, w, h, color = false) {
		if (color) manager.setBg(color);
		const row = ' '.repeat(w);
		for (let i = 0; i < h; i++) this.draw(row, x, y + i);
	}
	this.clear = function() {
		this.clearDraw();
		this.changed = true;
		this.render();
	}
	let savedBuffer, savedColors;
	this.save = function() {
		savedBuffer = new Uint16Array(this.current);
		savedColors = new Uint8Array(this.colors);
		return this;
	}
	this.load = function() {
		if (!savedBuffer) return this;
		this.current = new Uint16Array(savedBuffer);
		this.colors = new Uint8Array(savedColors);
		this.changed = true;
		return this;
	}
	this.outline = function(color = null) {
		const sq = {tl: '┌', h: '─', tr: '┐', v: '│', bl: '└', br: '┘'};
		if (color) manager.setFg(color);
		this.draw(sq.tl + sq.h.repeat(this.width - 2) + sq.tr, 0, 0);
		for (let i = 1; i < this.height - 1; i++)
			this.draw(sq.v, 0, i).draw(sq.v, this.end, i);
		this.draw(sq.bl + sq.h.repeat(this.width - 2) + sq.br, 0, 0);
		return this;
	}
}

module.exports = BufferManager;
