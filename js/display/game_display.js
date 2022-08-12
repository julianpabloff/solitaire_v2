const GameDisplay = function(d) {
	const cardWidth = 14;
	const cardHeight = 10;
	const margin = 4;
	const totalWidth = 122;

	const findPileX = index => cardX + (cardWidth + margin) * index;
	const relativePileX = index => (cardWidth + margin) * index;

	this.setSize = function() {
		cardX = Math.floor((d.width - (cardWidth + margin) * 7 + margin) / 2);
		cardY = Math.floor((d.height - cardHeight) / 2);
		topY = cardY - cardHeight - margin;
		testX = d.centerWidth(totalWidth);
		foundationsX = [];
		for (let i = 0; i < 4; i++) {
			foundationsX.push(findPileX(3 + i));
		}
	}
	let cardX, cardY, topY, foundationsX, testX;
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
		piles.push(d.buffer.new(cardX + (cardWidth + margin) * i, cardY, cardWidth, d.height - cardY, 1, 'game'));
	const drawPiles = function(pilesData) {
		for (let i = 0; i < pilesData.length; i++) {
			const cards = pilesData[i];
			if (cards.length)
			for (let j = 0; j < cards.length; j++) drawCard(piles[i], cards[j], 0, 2 * j);
			else piles[i].clearDraw();
		}
	}
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
			} else {// bufferElement.type == 'waste'
				x = relativePileX(1) + (bufferElement.depth - 1) * 4;
				y = 0;
			}
			navigation.draw(cursor, x, y);
		}
		d.setColor('cur');
		// navigation.draw(cursor, relativePileX(buffer[buffer.length == 2 | 0].index), cursorY);
		drawCursor(buffer[buffer.length == 2 | 0]);
		if (buffer.length == 2) {
			d.setColor('tom');
			if (d.theme['cur'][1] == d.theme['tom'][1]) { // Check for same color, like in pipboy theme
				d.setColor('tab');
				cursor = '░'.repeat(cardWidth);
			}
			// navigation.draw(cursor, relativePileX(buffer[0].index), cursorY);
			drawCursor(buffer[0]);
		}
	}

	// DEBUG
	const debugLeft = d.buffer.new(2, 1, 37, 25, 3, 'game');
	const debugTop = d.buffer.new(52, 1, 51, 8, 3, 'game');
	const debugRight = d.buffer.new(d.width - 39, 1, 37, 40, 3, 'game');
	const drawDebug = function(cardData, buffer) {
		d.setColor('tab');
		debugLeft.draw('STOCK', 0, 0).draw('PILES', 10, 0).draw('FOUNDATIONS', 10, 9);
		// debugTop.draw('FOUNDATIONS', 0, 0);
		function drawCardDebug(card, x, y) {
			d.setColor(card.suit);
			const cardString = card.value.toString() + card.suit;
			debugLeft.draw(cardString + ' '.repeat(3 - cardString.length), x, y);
		}
		for (let i = 0; i < cardData.stock.length; i++) drawCardDebug(cardData.stock[i], 0, 1 + i);
		for (let i = 0; i < cardData.waste.length; i++) drawCardDebug(cardData.waste[i], 4, 1 + i);
		for (let i = 0; i < cardData.piles.length; i++) {
			const cards = cardData.piles[i];
			for (let c = 0; c < cards.length; c++) drawCardDebug(cards[c], 4 * i + 10, 1 + c);
		}
		for (let i = 0; i < cardData.foundations.length; i++) {
			const cards = cardData.foundations[i];
			for (let c = 0; c < cards.length; c++) drawCardDebug(cards[c], 4 * i + 10, 10 + c);
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

	this.draw = function(cardData, buffer) {
		drawDebug(cardData, buffer);
		drawFoundations(cardData.foundations);
		drawStock(cardData.stock);
		drawWaste(cardData.waste);
		drawPiles(cardData.piles);
		drawController(buffer);
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
		debugLeft.render();
		debugTop.render();
		debugRight.render();
		// debugLeft.outline('red');
		// debugRight.outline('red');
		// d.debug((Date.now() - start).toString());
	}
	this.up = function() {
	}
	this.resize = function() {
		this.setSize();
		stock.simpleMove(cardX, topY);
		foundations.simpleMove(foundationsX[0], topY);
		for (let i = 0; i < 7; i++) piles[i].simpleMove(cardX + (cardWidth + margin) * i, cardY);
		navigation.simpleMove(cardX, topY - 2);
		debugRight.simpleMove(d.width - 39, 1);
	}
}

module.exports = GameDisplay;
