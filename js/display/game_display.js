const GameDisplay = function(d) {
	const cardWidth = 14;
	const cardHeight = 10;
	const margin = 4;
	const totalWidth = 122;

	const findPileX = index => cardX + (cardWidth + margin) * index;
	const relativePileX = index => (cardWidth + margin) * index;

	const pauseText = ['RESUME', 'NEW GAME', 'SETTINGS', 'SAVE && QUIT'];

	this.setSize = function() {
		cardX = Math.floor((d.width - (cardWidth + margin) * 7 + margin) / 2);
		cardY = Math.floor((d.height - cardHeight) / 2);
		topY = cardY - cardHeight - margin;
		foundationsX = [];
		pauseDimensions = {
			w: 18,
			h: pauseText.length + 5,
			x: d.centerWidth(18),
			// y: d.centerHeight(pauseText.length + 5)
			y: cardY
		}
		for (let i = 0; i < 4; i++) {
			foundationsX.push(findPileX(3 + i));
		}
	}
	let cardX, cardY, topY, foundationsX, pauseDimensions;
	this.setSize();

	const cardSuits = {
		'h' : ['  _  _  ', ' / \\/ \\ ', ' \\    / ', '  \\  /  ', '   \\/   '],
		'c' : ['   __   ', ' _|  |_ ', '[      ]', '[__  __]', '   /\\   '],
		'd' : ['        ', '   /\\   ', '  /  \\  ', '  \\  /  ', '   \\/   '],
		's' : ['   /\\   ', '  /  \\  ', ' /    \\ ', ' \\_/\\_/ ', '   /\\   '],
	}
	const cardVals = [null,'A','2','3','4','5','6','7','8','9','10','J','Q','K'];
	const cardSuitChars = {'h': '♥', 'c': '♣', 'd': '♦', 's': '♠'};
	const drawCardSpot = function(buffer, x, y) {
		d.setColor('tab');
		for (let i = 0; i < cardHeight; i++) buffer.draw('░'.repeat(cardWidth), x, i);
	}
	const drawCardBack = function(buffer, x, y) {
		d.setColor('bac');
		d.drawSquare(buffer, x, y, cardWidth, cardHeight, false);
		for (let i = 1; i < 9; i += 2) {
			buffer.draw('· · · · · · ', x + 1, y + i);
			buffer.draw(' · · · · · ·', x + 1, y + i + 1);
		}
	}
	const drawCard = function(buffer, card, x, y) {
		if (!card.faceUp) { drawCardBack(buffer, x, y); return; }
		d.setColor(card.suit);
		d.drawSquare(buffer, x, y, cardWidth, cardHeight);
		for (let i = 0; i < 5; i++) buffer.draw(cardSuits[card.suit][i], x + 3, y + 2 + i);
		const value = cardVals[card.value].toString();
		buffer.draw(value, x + 2, y + 1).draw(value, x + 12 - value.length, y + 8);
	}
	// STOCK
	const stock = d.buffer.new(cardX, topY, cardWidth * 2 + margin * 3, cardHeight, 1, 'game');
	const drawStock = function(cards) {
		if (cards.length == 0) drawCardSpot(stock, 0, 0);
		else drawCardBack(stock, 0, 0);
	}
	// WASTE
	const drawWaste = function(cards) {
		const waste = [];
		const cardsLength = cards.length;
		let i = 0;
		while (i < 3 && i < cardsLength) {
			waste.unshift(cards[cardsLength - 1 - i]);
			i++;
		}
		for (let c = 0; c < waste.length; c++) {
			drawCard(stock, waste[c], cardWidth + margin * (c + 1), 0);
		}
	}
	// FOUNDATIONS
	const foundations = d.buffer.new(foundationsX[0], topY, cardWidth * 4 + margin * 3, cardHeight, 1, 'game');
	const drawFoundations = function(foundationsData) {
		for (let i = 0; i < 4; i++) {
			const x = (cardWidth + margin) * i;
			const foundation = foundationsData[i];
			const foundationLength = foundation.length;
			if (foundationLength) {
				drawCard(foundations, foundation[foundationLength - 1], x, 0);
			} else drawCardSpot(foundations, x, 0);
		}
	}
	// PILES
	const piles = [];
	for (let i = 0; i < 7; i++)
		piles.push(d.buffer.new(cardX + (cardWidth + margin) * i - 2, cardY, cardWidth + 4, d.height - cardY + 1, 1, 'game'));
	const drawPiles = function(pilesData, buffer) {
		const underToModeIndex = buffer.length == 2 && buffer[0].type == 'pile' && buffer[1].type != 'pause' ? buffer[0].index : null;
		maxPileDepth = 0;
		for (let i = 0; i < pilesData.length; i++) {
			const cards = pilesData[i];
			const cardsLength = cards.length;
			if (cardsLength) {
				let faceUpCount = 0;
				for (let j = 0; j < cardsLength; j++) {
					const card = cards[j];
					if (pileFaceUpDepths[i] == null && card.faceUp) pileFaceUpDepths[i] = j;
					const elevateCard = card.faceUp && underToModeIndex == i && faceUpCount >= buffer[0].depth;
					drawCard(piles[i], card, 2 + elevateCard, 2 * j - elevateCard + 1);
					faceUpCount += card.faceUp;
				}
				if (maxPileDepth < cardsLength) maxPileDepth = cardsLength;
			}
			else piles[i].clearDraw();
		}
	}
	const pileFaceUpDepths = [];
	let maxPileDepth = 0;
	// NAVIGATION
	const navigation = d.buffer.new(cardX, topY - 2, totalWidth, 15, 2, 'game');
	const drawController = function(buffer) {
		let cursor = ' '.repeat(cardWidth);
		const cursorY = navigation.bottom;
		const drawCursor = function(bufferElement) {
			let x, y;
			if (bufferElement.type == 'pile') {
				x = relativePileX(bufferElement.index);
				y = navigation.bottom;
			} else { // if bufferElement.type == 'waste'
				x = relativePileX(1) + (bufferElement.depth - 1) * 4;
				y = 0;
			}
			navigation.draw(cursor, x, y);
		}
		d.setColor('cur');
		const toMode = buffer.length == 2 && buffer[1].type != 'pause';
		drawCursor(buffer[toMode | 0]);
		if (toMode) {
			d.setColor('tom');
			if (d.theme['cur'][1] == d.theme['tom'][1]) { // Check for same color, like in pipboy theme
				d.setColor('tab');
				cursor = '░'.repeat(cardWidth);
			}
			drawCursor(buffer[0]);
		}
	}

	// DEBUG
	const debugLeft = d.buffer.new(2, 1, 37, 25, 3, 'game');
	const debugTop = d.buffer.new(52, 1, 51, 8, 3, 'game');
	const debugRight = d.buffer.new(d.width - 39, 1, 37, 40, 3, 'game');
	const drawDebug = function(cardData, buffer) {
		const foundationsDebugY = 2 + maxPileDepth;
		d.setColor('tab');
		debugLeft.draw('STOCK', 0, 0).draw('PILES', 10, 0).draw('FOUNDATIONS', 10, foundationsDebugY);
		// debugTop.draw('FOUNDATIONS', 0, 0);
		function drawCardDebug(card, x, y, faceUp = true) {
			if (faceUp) {
				d.setColor(card.suit);
				const cardString = card.value.toString() + card.suit;
				debugLeft.draw(cardString + ' '.repeat(3 - cardString.length), x, y);
			} else {
				d.setColor('tab');
				debugLeft.draw('░░░', x, y);
			}
		}
		for (let i = 0; i < cardData.stock.length; i++) drawCardDebug(cardData.stock[i], 0, 1 + i);
		for (let i = 0; i < cardData.waste.length; i++) drawCardDebug(cardData.waste[i], 4, 1 + i);
		for (let i = 0; i < cardData.piles.length; i++) {
			const cards = cardData.piles[i];
			for (let c = 0; c < cards.length; c++) drawCardDebug(cards[c], 4 * i + 10, 1 + c);
		}
		for (let i = 0; i < cardData.foundations.length; i++) {
			const cards = cardData.foundations[i];
			const x = 10 + 4 * i;
			if (cards.length)
				for (let c = 0; c < cards.length; c++) drawCardDebug(cards[c], x, foundationsDebugY + 1 + c);
			else drawCardDebug(null, x, foundationsDebugY + 1, false);
		}

		debugTop.draw('CONTROLLER', 0, 0, ...d.theme['tab']);
		debugTop.draw('type', 0, 2).draw('index', 0, 3).draw('depth', 0, 4);
		const accentColor = [d.theme['accent'], d.theme['tab'][1]];
		d.buffer.setColor(...accentColor);
		debugTop.draw(buffer[0].type, 5, 2).draw(buffer[0].index.toString(), 6, 3);
		debugTop.draw(buffer[0].depth.toString(), 6, 4);

		if (buffer.length > 1) {
			d.setColor('tab');
			debugTop.draw('-->', 10, 3);
			debugTop.draw('type', 16, 2).draw('index', 16, 3).draw('depth', 16, 4);
			d.buffer.setColor(...accentColor);
			debugTop.draw(buffer[1].type, 21, 2).draw(buffer[1].index.toString(), 22, 3);
			debugTop.draw(buffer[1].depth.toString(), 22, 4);
		}

		// Undo
		debugRight.load();
		d.setColor('tab');
		debugRight.draw('HISTORY (command reversed for undo)', 0, 0);
	}
	this.debugPileCounts = function(pileCounts) {
		d.setColor('tab');
		debugTop.draw('pile counts ', 15, 0);
		d.buffer.setFg(d.theme['accent']);
		for (const count of pileCounts) {
			debugTop.write(count.toString() + ' ');
		}
	}
	this.debugWasteCount = function(wasteCount) {
		d.setColor('tab');
		debugTop.draw('waste count ', 15, 1);
		d.buffer.setFg(d.theme['accent']);
		debugTop.write(wasteCount.toString());
	}
	this.debugCommand = function(commandType, ran) {
		d.setColor('tab');
		debugTop.draw('submitted ', 0, 6);
		d.buffer.setFg(d.theme['accent']);
		debugTop.write(commandType);
		d.setColor('tab');
		debugTop.draw('ran ', 0, 7);
		d.buffer.setFg(d.theme['accent']);
		debugTop.write(ran.toString());
	}
	this.debugUndoCommand = function(undoSteps) {
		d.setColor('tab');
		const divider = '-'.repeat(debugRight.width);
		debugRight.draw(divider, 0, 1);
		let j = 0;
		for (let i = undoSteps.length - 1; i >= 0; i--) {
			if (j > 11) break;
			const command = undoSteps[i];
			// d.setColor(...accentColor);
			const y = 2 + 3 * j;
			debugRight.fillArea(0, y + 1, debugRight.width, 2, 'none');
			d.setColor('tab');
			debugRight.draw(command.type, 0, y).draw('index', 0, y + 1);
			d.buffer.setFg(d.theme['accent']);
			debugRight.draw(command.path[0] == null ? '-' : command.path[0].toString(), 6, y + 1);
			d.setColor('tab');
			debugRight.draw('--> index', 8, y + 1);
			d.buffer.setFg(d.theme['accent']);
			debugRight.draw(command.path[1] == null ? '-' : command.path[1].toString(), 18, y + 1);
			d.setColor('tab');
			debugRight.draw('depth', 23, y + 1);
			d.buffer.setFg(d.theme['accent']);
			const depthString = command.depth == null ? '-' : command.depth.toString() ;
			debugRight.draw(depthString, 29, y + 1);
			if (command.path[2] != undefined) debugRight.draw(command.path[2].toString(), 28, y);
			d.setColor('tab');
			if (command.path[2] != undefined) debugRight.draw('flip', 23, y);
			debugRight.draw(divider, 0, y + 2);
			j++;
		}
		debugRight.save();
	}

	// PAUSE
	const pause = d.buffer.new(pauseDimensions.x, pauseDimensions.y, pauseDimensions.w, pauseDimensions.h, 5, 'game');
	pause.transparent = false;
	// const pauseOverlay = d.buffer.new(0, 0, d.width, d.height, 4, 'game');
	pause.enforceChanged = false;
	// pauseOverlay.enforceChanged = false;
	const drawPause = function(index) {
		// pauseOverlay.fill('none', '.', 'white');
		d.setColor('txt');
		d.drawSquare(pause, 0, 0, pause.width, pause.height, true);
		for (let i = 0; i < pauseText.length; i++) {
			if (i == index) d.setColor('txtcur');
			else d.setColor('txt');
			const text = pauseText[i];
			const spacing = Math.floor((pause.width - text.length - 2) / 2);
			const output = ' '.repeat(spacing) + text + ' '.repeat(spacing);
			pause.draw(output, 1, 1 + 2 * i);
		}
	}

	this.draw = function(cardData, buffer) {
		drawFoundations(cardData.foundations);
		drawStock(cardData.stock);
		drawWaste(cardData.waste);
		drawPiles(cardData.piles, buffer);
		drawController(buffer);
		// drawDebug(cardData, buffer);
		if (buffer.length == 2 && buffer[1].type == 'pause') drawPause(buffer[1].index);
	}
		// Change to just render the buffers you need to - it feels slow
	// Perhaps build it into the buffer using a changed boolean on the draw function
	this.update = function(cardData, buffer) {
		const start = Date.now();
		this.draw(cardData, buffer);
		stock.render();
		foundations.render();
		for (const pile of piles) pile.render();
		navigation.render();
		// debugLeft.render();
		// debugTop.render();
		// debugRight.render();
		// d.buffer.groupRender(pause, pauseOverlay);
		pause.render();
		// pauseOverlay.render();
		// debugLeft.outline('red');
		// debugRight.outline('red');
		// d.debug((Date.now() - start).toString());
	}
	this.resize = function() {
		this.setSize();
		stock.simpleMove(cardX, topY);
		foundations.simpleMove(foundationsX[0], topY);
		for (let i = 0; i < 7; i++) piles[i].simpleMove(cardX + (cardWidth + margin) * i - 2, cardY);
		navigation.simpleMove(cardX, topY - 2);
		debugRight.simpleMove(d.width - 39, 1);
		pause.simpleMove(pauseDimensions.x, pauseDimensions.y);
	}
}

module.exports = GameDisplay;
