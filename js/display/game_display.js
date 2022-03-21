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
	const drawFoundations = function() {
		for (let i = 0; i < 4; i++) {
			const x = (cardWidth + margin) * i;
			drawCardSpot(foundations, x, 0);
		}
	}
	// PILES
	const piles = [];
	for (let i = 0; i < 7; i++)
		piles.push(d.buffer.new(cardX + (cardWidth + margin) * i, cardY, cardWidth, d.height - cardY, 1, 'game'));
	const drawPiles = function(pilesData) {
		for (let i = 0; i < pilesData.length; i++) {
			const cards = pilesData[i];
			for (let j = 0; j < cards.length; j++) drawCard(piles[i], cards[j], 0, 2 * j);
		}
	}
	// NAVIGATION
	const navigation = d.buffer.new(cardX, topY - 2, totalWidth, 15, 2, 'game');
	const drawController = function(buffer) {
		const cursor = ' '.repeat(cardWidth);
		const cursorY = navigation.bottom;
		d.setColor('cur');
		navigation.draw(cursor, relativePileX(buffer.index), cursorY);
	}

	// DEBUG
	const debugLeft = d.buffer.new(2, 1, 37, 25, 3, 'game');
	const debugTop = d.buffer.new(42, 1, 51, 8, 3, 'game');
	const debugRight = d.buffer.new(d.width - 39, 1, 37, 20, 3, 'game');
	const drawDebug = function(data) {
		d.setColor('tab');
		debugLeft.draw('STOCK', 0, 0).draw('PILES', 10, 0);
		// debugTop.draw('FOUNDATIONS', 0, 0);
		function drawCardDebug(card, x, y) {
			d.setColor(card.suit);
			const cardString = card.value.toString() + card.suit;
			debugLeft.draw(cardString + ' '.repeat(3 - cardString.length), x, y);
		}
		for (let i = 0; i < data.stock.length; i++) drawCardDebug(data.stock[i], 0, 1 + i);
		for (let i = 0; i < data.waste.length; i++) drawCardDebug(data.waste[i], 4, 1 + i);
		for (let i = 0; i < data.piles.length; i++) {
			const cards = data.piles[i];
			for (let c = 0; c < cards.length; c++) drawCardDebug(cards[c], 4 * i + 10, 1 + c);
		}
		// d.buffer.setBg('green');
		// for (let i = 0; i < 4; i++) {
		// 	for (let j = 0; j < 13; j++) debugTop.draw('   ', 4 * j, 1 + i * 2);
		// }

		debugRight.draw('CONTROLLER', 0, 0, ...d.theme['tab']).draw('TO MODE:', 0, 2);
		debugRight.draw('true', 9, 2, ...d.theme['tom']);
	}

	this.draw = function(data) {
		drawDebug(data.cards);
		drawFoundations();
		drawStock(data.cards.stock);
		drawWaste(data.cards.waste);
		drawPiles(data.cards.piles);
		drawController(data.buffer);
	}
	this.update = function(data) {
		this.draw(data);
		stock.render();
		foundations.render();
		for (const pile of piles) pile.render();
		navigation.render();
		debugLeft.render();
		debugTop.render();
		// debugLeft.outline('red');
		debugRight.outline('red');
	}
	this.up = function() {
	}
}

module.exports = GameDisplay;
