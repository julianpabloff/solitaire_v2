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
		this.fg = new Uint32Array(screenSize);
		this.bg = new Uint32Array(screenSize);
	}
	let screenWidth, screenSize;
	this.setSize();
	this.save = function(code, fg, bg, x, y) {
		const index = y * screenWidth + x;
		this.codes[index] = code;
		this.fg[index] = fg;
		this.bg[index] = bg;
		// this.lastRenderedLocation = {x: 0, y: 0};
	}
	this.logScreens = function() {
		console.log(this.screens);
	}

	// Colors
	this.fg = 0;
	this.bg = 0;
	this.lastRenderedColor = {fg: 0, bg: 0};
	this.lastRenderedLocation = {x: 0, y: 0};

	// 0000 0000 0000 0000 0000 0000 - 24 bit
	this.hexToRGB = code => { return {r: code >> 16, g: (code >> 8) & 0xFF, b: code & 0xFF} };
	this.hexToString = hex => {
		const rgb = this.hexToRGB(hex);
		return '\x1b[38;2;' + rgb.r.toString() + ';' + rgb.g.toString() + ';' + rgb.b.toString() + 'm';
	}

	this.setFg = hex => this.fg = hex;
	this.setBg = hex => this.bg = hex;
	this.setColor = (foregroundHex, backgroundHex) => { this.fg = foregroundHex; this.bg = backgroundHex };

	this.fgToString = hex => '\x1b[38;2;' + (hex >> 16).toString() + ';' + ((hex >> 8) & 0xFF).toString() + ';' + (hex & 0xFF).toString() + 'm';
	this.bgToString = hex => '\x1b[48;2;' + (hex >> 16).toString() + ';' + ((hex >> 8) & 0xFF).toString() + ';' + (hex & 0xFF).toString() + 'm';
	this.moveCursorString = (x, y) => '\x1b[' + (y + 1).toString() + ';' + (x + 1).toString() + 'H';

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
				const fgHex = buffer.prevFg[index];
				const bgHex = buffer.prevBg[index];
				if (code) output.code = code;
				if (fgHex) output.fg = fgHex;
				if (bgHex) output.bg = bgHex;
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
				const fgHex = buffer.prevFg[index];
				const bgHex = buffer.prevBg[index];
				if (code && !output.code) output.code = code;
				if (fgHex && !output.fg) output.fg = fgHex;
				if (bgHex && !output.bg) output.bg = bgHex;
			}
			if (buffer.id == target.id) found = true;
		}
		if (output.code || output.fg || output.bg) return output;
		return false;
	}

	this.addToOutput = function(output, code, fg, bg, x, y) {
		if (fg != this.lastRenderedColor.fg || bg != this.lastRenderedColor.bg) {
			if (fg == 0 || bg == 0) output.push('\x1b[0m');
			if (fg > 0) output.push(this.fgToString(fg));
			if (bg > 0) output.push(this.bgToString(bg));
		}
		const char = String.fromCharCode(code);
		const last = this.lastRenderedLocation;
		if (!(last.y == y && last.x == x - 1)) output.push(this.moveCursorString(x, y));
		output.push(char);
		this.lastRenderedColor = {fg: fg, bg: bg};
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
				const fg = buffer.fg[index];
				const bg = buffer.bg[index];
				buffer.previous[index] = code;
				buffer.prevFg[index] = fg;
				buffer.prevBg[index] = bg;
				if (!code && !fg && !bg) continue;
				if (code && !point.code) {
					point.code = code;
					this.codes[i] = code;
				}
				if (fg && !point.fg) {
					point.fg = fg;
					this.fg[i] = fg;
				}
				if (bg && !point.bg) {
					point.bg = bg;
					this.bg[i] = bg;
				}
				if (point.code && point.fg && point.bg) break;
			}
			if (point.code || point.fg || point.bg)
				this.addToOutput(output, point.code, point.fg, point.bg, x, y);
		}
		for (const buffer of zArray) buffer.clearDraw();
		return output.join('');
	}
	this.resizeAndRender = function(screen = this.screen) {
		this.setSize();
		process.stdout.write(this.generateScreen(screen));
	}
	this.switchToScreen = function(screen) {
		if (screen == this.screen) return '';
		const zArray = this.gatherBuffersOnScreen(screen);
		const newCodes = new Uint16Array(screenSize);
		const newFg = new Uint32Array(screenSize);
		const newBg = new Uint32Array(screenSize);
		const output = [];
		for (let i = 0; i < screenSize; i++) {
			const x = i % screenWidth; const y = Math.floor(i / screenWidth);
			const point = { code: 0, fg: 0, bg: 0 };
			const codeOnScreen = this.codes[i];
			const fgOnScreen = this.fg[i];
			const bgOnScreen = this.bg[i];
			for (let j = zArray.length - 1; j >= 0; j--) {
				const buffer = zArray[j];
				const index = buffer.screenToIndex(x, y);
				if (index == null) continue;
				let code, fg, bg;
				if (buffer.screen == 'all') {
					code = buffer.previous[index];
					fg = buffer.prevFg[index];
					bg = buffer.prevBg[index];
				} else {
					code = buffer.current[index];
					fg = buffer.fg[index];
					bg = buffer.bg[index];
					buffer.previous[index] = code;
					buffer.prevFg[index] = fg;
					buffer.prevBg[index] = bg;
				}
				if (!code && !fg && !bg) continue;
				if (code && !point.code) point.code = code;
				if (fg && !point.fg) point.fg = fg;
				if (bg && !point.bg) point.bg = bg;
				if (point.code && point.fg && point.bg) break;
			}
			if (point.code || point.fg || point.bg) {
				newCodes[i] = point.code;
				newFg[i] = point.fg;
				newBg[i] = point.bg;
				this.addToOutput(output, point.code, point.fg, point.bg, x, y);
			} else if (codeOnScreen) {
				this.addToOutput(output, 32, 0, 0, x, y);
			}
		}
		for (const buffer of zArray) buffer.clearDraw();
		this.codes = new Uint16Array(newCodes);
		this.fg = new Uint32Array(newFg);
		this.bg = new Uint32Array(newBg);
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
		this.fg = new Uint32Array(this.size);
		this.bg = new Uint32Array(this.size);
		this.prevFg = new Uint32Array(this.size);
		this.prevBg = new Uint32Array(this.size);
		this.changed = false;
	}
	this.setSize = function(x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.end = width - 1;
		this.botttom = height - 1;
		this.size = width * height;
		this.empty = true;
		this.reset();
	}
	this.setSize(x, y, width, height);
	this.move = (x, y) => { this.x = x; this.y = y }

	// Coordinates
	this.coordinateIndex = (x, y) => (y * this.width) + x;
	this.indexToScreen = index => { return {x: this.x + (index % this.width), y: this.y + Math.floor(index / this.width)} }
	this.screenToIndex = function(x, y) {
		if (x < this.x || x >= this.x + this.width || y < this.y || y >= this.y + this.height) return null;
		return ((y - this.y) * this.width) + x - this.x;
	}

	// Writing to buffer
	let cursorIndex = 0;
	this.print = function(string, index) {
		for (let i = 0; i < string.length; i++) {
			this.current[index + i] = string.charCodeAt(i);
			this.fg[index + i] = manager.fg;
			this.bg[index + i] = manager.bg;
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
	this.draw = function(string, x, y) {
		const index = this.coordinateIndex(x, y);
		this.print(string, index);
		return this;
	}
	this.clearDraw = function() {
		this.current = new Uint16Array(this.size);
		this.fg = new Uint32Array(this.size);
		this.bg = new Uint32Array(this.size);
		this.changed = false;
	}
	this.moveToPrevious = function(index, code, fg, bg) {
		this.current[index] = 0;
		this.fg[index] = 0;
		this.bg[index] = 0
		this.previous[index] = code;
		this.prevFg[index] = fg;
		this.prevBg[index] = bg;
	}
	this.render = function(clearLastFrame = true, execute = true) {
		if (!this.changed && this.enforceChanged) return;
		if (manager.enforceScreens && manager.screen != this.screen) return;
		const output = [];
		for (let i = 0; i < this.size; i++) {
			let code = this.current[i];
			let fgHex = this.fg[i];
			let bgHex = this.bg[i];
			const prevCode = this.previous[i];
			const prevFgHex = this.prevFg[i];
			const prevBgHex = this.prevBg[i];
			if (!clearLastFrame && code == 0 && prevCode != 0) {
				code = prevCode;
				fgHex = prevFgHex;
				bgHex = prevBgHex;
			}
			const screenLocation = this.indexToScreen(i);
			const x = screenLocation.x; const y = screenLocation.y;
			let drawingCode = code;
			let drawingFg = fgHex;
			let drawingBg = bgHex;
			if (code == 0) {
				const below = manager.somethingBelow(this, x, y);
				if (below) {
					drawingCode = below.code;
					drawingFg = below.fg;
					drawingBg = below.bg;
				} else {
					if (!this.transparent) code = 32;
					drawingCode = 32;
					drawingFg = 0;
					drawingBg = 0;
				}
			} else if (bgHex == 0 && this.transparent) { // Character present but no background color
				const below = manager.somethingBelow(this, x, y);
				if (below) drawingBg = below.bg;
			}
			const above = manager.somethingAbove(this, x, y);
			if (code != prevCode || fgHex != prevFgHex || bgHex != prevBgHex) {
				let draw = !above.code;
				if (above.code && !above.bg) {
					drawingCode = above.code;
					// Uses the code and color of the above point, but preserves the background of this buffer's point
					drawingFg = above.fg;
					draw = true;
				}
				if (draw) {
					manager.addToOutput(output, drawingCode, drawingFg, drawingBg, x, y);
					manager.save(drawingCode, drawingFg, drawingBg, x, y);
				}
			}
			this.moveToPrevious(i, code, fgHex, bgHex);
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
	this.fill = function(hex, char = ' ', foregroundHex = null) {
		const tempBg = manager.bg;
		this.current.fill(char.charCodeAt(0));
		manager.setBg(hex);
		if (foreground) manager.setFg(foregroundHex);
		this.bg.fill(hex);
		manager.setBg(tempBg);
		this.changed = true;
		return this;
	}
	this.clear = function() {
		this.clearDraw();
		this.changed = true;
		this.render();
		// this.empty = true;
	}
	this.outline = function(hex, draw = true) {
		const output = [];
		const colorString = manager.fgToString(hex);
		output.push('\x1b[0m', colorString);
		output.push(manager.moveCursorString(this.x - 1, this.y - 1));
		const sq = {tl: '┌', h: '─', tr: '┐', v: '│', bl: '└', br: '┘'};
		output.push(sq.tl + sq.h.repeat(this.width) + sq.tr);
		for (let i = 0; i < this.height; i++) {
			output.push(manager.moveCursorString(this.x - 1, this.y + i), sq.v);
			output.push(manager.moveCursorString(this.x + this.width, this.y + i), sq.v);
		}
		output.push(manager.moveCursorString(this.x - 1, this.y + this.height));
		output.push(sq.bl + sq.h.repeat(this.width) + sq.br);

		manager.lastRenderedColor = {fg: colorString, bg: 0};
		manager.lastRenderedLocation = {x: this.x + this.width, y: this.y + this.height};

		process.stdout.write(output.join(''));
	}
}

module.exports = BufferManager;
