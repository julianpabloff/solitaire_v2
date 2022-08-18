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
	}

	// Colors
	this.fg = 1 << 24;
	this.bg = 1 << 24;
	this.lastRenderedColor = {fg: 1 << 24, bg: 1 << 24};
	this.lastRenderedLocation = {x: 0, y: 0};
	// 0000 0000 0000 0000 0000 0000 - 24 bit
	const hexToRGB = hex => { return {r: hex >> 16, g: (hex >> 8) & 0xFF, b: hex & 0xFF} };
	const hexToString = hex => {
		const rgb = hexToRGB(hex);
		return '\x1b[38;2;' + rgb.r.toString() + ';' + rgb.g.toString() + ';' + rgb.b.toString() + 'm';
	}

	this.setFg = hex => this.fg = hex;
	this.setBg = hex => this.bg = hex;
	this.setColor = (fgHex, bgHex) => { this.fg = fgHex; this.bg = bgHex };

	const hexPresent = hex => !(hex >> 24);
	const fgHexToString = hex => '\x1b[38;2;' + (hex >> 16).toString() + ';' + ((hex >> 8) & 0xFF).toString() + ';' + (hex & 0xFF).toString() + 'm';
	const bgHexToString = hex => '\x1b[48;2;' + (hex >> 16).toString() + ';' + ((hex >> 8) & 0xFF).toString() + ';' + (hex & 0xFF).toString() + 'm';
	const resetColorString = '\x1b[0m';
	const moveCursorString = (x, y) => '\x1b[' + (y + 1).toString() + ';' + (x + 1).toString() + 'H';

	// Compatability with 256 color terminals
	const hexTo256Color = hex => {
		const options = [0, 95, 135, 175, 215, 255];
		const findClosest = num => {
			let lastDelta = num;
			let i = 1;
			while (i < 6) {
				const delta = Math.abs(num - options[i]);
				if (delta > lastDelta) return options[i - 1];
				lastDelta = delta;
				i++;
			}
			return options[i - 1];
		}
		const rgb = hexToRGB(hex);
		const closestR = findClosest(rgb.r);
		const closestG = findClosest(rgb.g);
		const closestB = findClosest(rgb.b);
		let code = 16 + 36 * options.indexOf(closestR) + 6 * options.indexOf(closestG) + options.indexOf(closestB);
		if (rgb.r == rgb.g && rgb.r == rgb.b) { // Greyscale specification (last codes of 256 colors)
			const greyOptions = [];
			for (let i = 232; i < 256; i++) greyOptions.push(8 + 10 * (i - 232));
			const currentDelta = Math.abs(rgb.r - closestR);
			let minDelta = currentDelta;
			let mindex = 0;
			let foundSmallerDelta = false;
			for (let i = 0; i < greyOptions.length; i++) {
				const delta = Math.abs(rgb.r - greyOptions[i]);
				if (delta < minDelta) {
					minDelta = delta;
					mindex = i;
					foundSmallerDelta = true;
				} else if (foundSmallerDelta) {
					code = 232 + mindex;
					break;
				}
			}
		}
		return code;
	}
	const fg256ToString = code => '\x1b[38;5;' + code.toString() + 'm';
	const bg256ToString = code => '\x1b[48;5;' + code.toString() + 'm';

	// Compatability with 8 color terminals
	const hexToHSV = hex => {
		const rgb = hexToRGB(hex);
		const r = rgb.r / 255;
		const g = rgb.g / 255;
		const b = rgb.b / 255;
		const min = Math.min(r, g, b);
		const max = Math.max(r, g, b);
		const delta = max - min;

		let hue;
		if (delta == 0) hue = 0;
		else if (max == r) hue = 60 * (((g - b) / delta + 6) % 6);
		else if (max == g) hue = 60 * ((b - r) / delta + 2);
		else hue = 60 * ((r - g) / delta + 4);
		const sat = (max == 0) ? 0 : delta / max;
		const val = max;

		return {h: hue, s: sat, v: val};
	}
	const hexTo8Color = hex => {
		const hsv = hexToHSV(hex);
		const hue = hsv.h;
		let color;
		if (hsv.s < 0.15) {
			if (hsv.v < 0.6) color = 'black';
			else color = 'white';
		}
		else if (hue < 30) color = 'red';
		else if (hue < 90) color = 'yellow';
		else if (hue < 150) color = 'green';
		else if (hue < 210) color = 'cyan';
		else if (hue < 270) color = 'blue';
		else if (hue < 330) color = 'magenta';
		else color = 'red';

		const colorMap = { black: 1, red: 2, green: 3, yellow: 4, blue: 5, magenta: 6, cyan: 7, white: 8 };
		return colorMap[color];
	}
	const fg8ToString = code => '\x1b[' + (29 + code).toString() + 'm';
	const bg8ToString = code => '\x1b[' + (39 + code).toString() + 'm';

	// Buffer print output
	this.colorMode = 0; // 0: 24 bit color, 1: 256 color mode, 2: 8 color mode
	const ansiColorString = [
		{ fg: hex => fgHexToString(hex), bg: hex => bgHexToString(hex) },
		{ fg: hex => fg256ToString(hexTo256Color(hex)), bg: hex => bg256ToString(hexTo256Color(hex)) },
		{ fg: hex => fg8ToString(hexTo8Color(hex)), bg: hex => bg8ToString(hexTo8Color(hex)) }
	];
	this.addToOutput = function(output, code, fg, bg, x, y, colorMode = this.colorMode) {
		if (fg != this.lastRenderedColor.fg || bg != this.lastRenderedColor.bg) {
			if (fg >> 24 || bg >> 24) output.push(resetColorString);
			if (hexPresent(fg)) output.push(ansiColorString[colorMode].fg(fg));
			if (hexPresent(bg)) output.push(ansiColorString[colorMode].bg(bg));
		}
		this.lastRenderedColor = {fg: fg, bg: bg};
		const char = String.fromCharCode(code);
		const last = this.lastRenderedLocation;
		if (!(last.y == y && last.x == x - 1)) output.push(moveCursorString(x, y));
		output.push(char);
		this.lastRenderedLocation = {x: x, y: y};
	}

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
		let output = { code: 0, fg: 1 << 24, bg: 1 << 24 };
		for (const buffer of zArray) {
			const index = buffer.screenToIndex(x, y);
			if (found && index != null) {
				const code = buffer.previous[index];
				const fgHex = buffer.prevFg[index];
				const bgHex = buffer.prevBg[index];
				if (code) output.code = code;
				if (hexPresent(fgHex)) output.fg = fgHex;
				if (hexPresent(bgHex)) output.bg = bgHex;
				if (output.code && hexPresent(output.fg) && hexPresent(output.bg)) break;
			}
			if (buffer.id == target.id) found = true;
		}
		if (output.code || hexPresent(output.fg) || hexPresent(output.bg)) return output;
		return false;
	}
	this.somethingBelow = function(target, x, y) {
		const zArray = this.gatherBuffersOnScreen();
		if (zArray.length < 2) return false;
		let found = false;
		let output = { code: 0, fg: 1 << 24, bg: 1 << 24 };
		for (let i = zArray.length - 1; i >= 0; i--) {
			const buffer = zArray[i];
			const index = buffer.screenToIndex(x, y);
			if (found && index != null) {
				const code = buffer.previous[index];
				const fgHex = buffer.prevFg[index];
				const bgHex = buffer.prevBg[index];
				if (code && !output.code) output.code = code;
				if (hexPresent(fgHex) && output.fg >> 24) output.fg = fgHex;
				if (hexPresent(bgHex) && output.bg >> 24) output.bg = bgHex;
				if (output.code && hexPresent(output.fg) && hexPresent(output.bg)) break;
			}
			if (buffer.id == target.id) found = true;
		}
		if (output.code || hexPresent(output.fg) || hexPresent(output.bg)) return output;
		return false;
	}
	this.generateScreen = function(screen = this.screen, usePrevious = false) {
		const zArray = this.gatherBuffersOnScreen(screen);
		const output = [];
		this.lastRenderedColor = {fg: 1 << 24, bg: 1 << 24};
		const dataLookup = {}
		if (usePrevious) { dataLookup.code = 'previous'; dataLookup.fg = 'prevFg'; dataLookup.bg = 'prevBg'; }
		else { dataLookup.code = 'current'; dataLookup.fg = 'fg'; dataLookup.bg = 'bg'; }
		for (let i = 0; i < screenSize; i++) {
			const x = i % screenWidth; const y = Math.floor(i / screenWidth);
			const point = { code: 0, fg: 1 << 24, bg: 1 << 24 };
			for (let j = zArray.length - 1; j >= 0; j--) {
				const buffer = zArray[j];
				const index = buffer.screenToIndex(x, y);
				if (index == null) continue;
				const code = buffer[dataLookup.code][index];
				const fgHex = buffer[dataLookup.fg][index];
				const bgHex = buffer[dataLookup.bg][index];
				if (!usePrevious) {
					buffer.previous[index] = code;
					buffer.prevFg[index] = fgHex;
					buffer.prevBg[index] = bgHex;
				}
				if (!code && fgHex << 24 && bgHex << 24) continue;
				if (code && !point.code) {
					point.code = code;
					this.codes[i] = code;
				}
				if (hexPresent(fgHex) && point.fg >> 24) {
					point.fg = fgHex;
					this.fg[i] = fgHex;
				}
				if (hexPresent(bgHex) && point.bg >> 24) {
					point.bg = bgHex;
					this.bg[i] = bgHex;
				}
				if (output.code && hexPresent(output.fg) && hexPresent(output.bg)) break;
			}
			if (output.code || hexPresent(output.fg) || hexPresent(output.bg))
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
			const point = { code: 0, fg: 1 << 24, bg: 1 << 24 };
			const codeOnScreen = this.codes[i];
			const fgOnScreen = this.fg[i];
			const bgOnScreen = this.bg[i];
			for (let j = zArray.length - 1; j >= 0; j--) {
				const buffer = zArray[j];
				const index = buffer.screenToIndex(x, y);
				if (index == null) continue;
				let code, fgHex, bgHex;
				if (buffer.screen == 'all') {
					code = buffer.previous[index];
					fgHex = buffer.prevFg[index];
					bgHex = buffer.prevBg[index];
				} else {
					code = buffer.current[index];
					fgHex = buffer.fg[index];
					bgHex = buffer.bg[index];
					buffer.previous[index] = code;
					buffer.prevFg[index] = fgHex;
					buffer.prevBg[index] = bgHex;
				}
				if (!code && fgHex >> 24 && bgHex >> 24) continue;
				if (code && !point.code) point.code = code;
				if (hexPresent(fgHex) && point.fg >> 24) point.fg = fgHex;
				if (hexPresent(bgHex) && point.bg >> 24) point.bg = bgHex;
				if (point.code && hexPresent(point.fg) && hexPresent(point.bg)) break;
			}
			if (point.code || hexPresent(point.fg) || hexPresent(point.bg)) {
				newCodes[i] = point.code;
				newFg[i] = point.fg;
				newBg[i] = point.bg;
				this.addToOutput(output, point.code, point.fg, point.bg, x, y);
			} else if (codeOnScreen) {
				this.addToOutput(output, 32, 1 << 24, 1 << 24, x, y);
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
		let output = [];
		for (const buffer of buffersToRender) output = output.concat(buffer.render(true, false));
		process.stdout.write(output.join(''));
	}
	let renderQueue = [];
	this.addToRenderQueue = (buffer, clearLastFrame = true) => renderQueue = renderQueue.concat(buffer.render(clearLastFrame, false));
	this.executeRenderQueue = () => {
		process.stdout.write(renderQueue.join(''));
		renderQueue = [];
	}
}

const DisplayBuffer = function(x, y, width, height, manager, screen, zIndex = 0) {
	this.screen = screen;
	this.zIndex = zIndex;
	this.transparent = true;
	this.enforceChanged = true;
	this.colorMode = manager.colorMode;
	this.reset = function() {
		this.current = new Uint16Array(this.size);
		this.previous = new Uint16Array(this.size);
		this.fg = new Uint32Array(this.size);
		this.bg = new Uint32Array(this.size);
		this.prevFg = new Uint32Array(this.size);
		this.prevBg = new Uint32Array(this.size);
		this.fg.fill(1 << 24);
		this.bg.fill(1 << 24);
		this.prevFg.fill(1 << 24);
		this.prevBg.fill(1 << 24);
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
	this.coordinateIndex = (x, y) => (y * this.width) + x;
	this.indexToScreen = index => { return {x: this.x + (index % this.width), y: this.y + Math.floor(index / this.width)} }
	this.screenToIndex = function(x, y) {
		if (x < this.x || x >= this.x + this.width || y < this.y || y >= this.y + this.height) return null;
		return ((y - this.y) * this.width) + x - this.x;
	}

	// Writing to buffer
	let cursorIndex = 0;
	this.print = function(string, index, fg, bg) {
		const foreground = fg != null ? fg : manager.fg;
		const background = bg != null ? bg : manager.bg;
		for (let i = 0; i < string.length; i++) {
			this.current[index + i] = string.charCodeAt(i);
			this.fg[index + i] = foreground;
			this.bg[index + i] = background;
		}
		cursorIndex = index + string.length;
		if (cursorIndex > this.size) cursorIndex = 0;
		this.changed = true;
	}
	this.cursorTo = function(x, y) {
		cursorIndex = this.coordinateIndex(x, y);
		return this;
	}
	this.write = function(string, fg = null, bg = null) {
		this.print(string, cursorIndex, fg, bg);
		return this;
	}
	this.draw = function(string, x, y, fg = null, bg = null) {
		const index = this.coordinateIndex(x, y);
		this.print(string, index, fg, bg);
		return this;
	}
	this.clearDraw = function() {
		this.current = new Uint16Array(this.size);
		this.fg.fill(1 << 24);
		this.bg.fill(1 << 24);
		this.changed = true;
	}
	this.clearPrevious = function() {
		this.previous = new Uint16Array(this.size);
		this.prevFg.fill(1 << 24);
		this.prevBg.fill(1 << 24);
		this.changed = true;
	}
	this.moveToPrevious = function(index, code, fg, bg) {
		this.current[index] = 0;
		this.fg[index] = 1 << 24;
		this.bg[index] = 1 << 24;
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
					drawingFg = 1 << 24;
					drawingBg = 1 << 24;
				}
			} else if (bgHex >> 24 && this.transparent) { // Character present but no background color
				const below = manager.somethingBelow(this, x, y);
				if (below) drawingBg = below.bg;
			}
			const above = manager.somethingAbove(this, x, y);
			if (code != prevCode || fgHex != prevFgHex || bgHex != prevBgHex) {
				let draw = !above.code;
				if (above.code && above.bg >> 24) {
					drawingCode = above.code;
					// Uses the code and color of the above point, but preserves the background of this buffer's point
					drawingFg = above.fg;
					draw = true;
				}
				if (draw) {
					manager.addToOutput(output, drawingCode, drawingFg, drawingBg, x, y, this.colorMode);
					manager.save(drawingCode, drawingFg, drawingBg, x, y);
				}
			}
			this.moveToPrevious(i, code, fgHex, bgHex);
		}
		this.changed = false;
		// const outputString = output.join('');
		if (execute) process.stdout.write(output.join(''));
		else return output;
	}
	this.paint = function() {
		this.render(false);
		return this;
	}
	this.reRender = function() {
		this.current = new Uint16Array(this.previous);
		this.fg = new Uint32Array(this.prevFg);
		this.bg = new Uint32Array(this.prevBg);
		this.previous.fill(0);
		this.prevFg.fill(1 << 24);
		this.prevBg.fill(1 << 24);
		this.changed = true;
		this.render();
	}
	this.fill = function(hex, char = ' ', foregroundHex = null) {
		const tempBg = manager.bg;
		this.current.fill(char.charCodeAt(0));
		manager.setBg(hex);
		if (foregroundHex) manager.setFg(foregroundHex);
		this.bg.fill(hex);
		manager.setBg(tempBg);
		this.changed = true;
		return this;
	}
	this.fillNew = function(hex, setColor = true) {
		this.current.fill(32);
		this.bg.fill(hex);
		if (setColor) manager.setBg(hex);
		this.changed = true;
		return this;
	}
	this.clear = function() {
		this.clearDraw();
		this.changed = true;
		this.render();
		// this.empty = true;
	}
	this.outline = function(color = null) {
		const sq = {tl: '┌', h: '─', tr: '┐', v: '│', bl: '└', br: '┘'};
		if (color) manager.setFg(color);
		this.draw(sq.tl + sq.h.repeat(this.width - 2) + sq.tr, 0, 0);
		for (let i = 1; i < this.height - 1; i++)
		this.draw(sq.v, 0, i).draw(sq.v, this.end, i);
		this.draw(sq.bl + sq.h.repeat(this.width - 2) + sq.br, 0, this.bottom);
		return this;
	}
	this.simpleMove = (x, y) => { this.x = x; this.y = y };
}

module.exports = BufferManager;
