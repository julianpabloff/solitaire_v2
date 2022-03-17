const GameDisplay = function(d) {
	const cardWidth = 14;
	const cardHeight = 10;
	const margin = 4;
	const totalWidth = 122;

	const findPileX = (index) => { return cardX + (cardWidth + margin) * index; }

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
	const stock = d.buffer.new(cardX, topY, cardWidth, cardHeight);
	const drawStock = function() {
		drawCardBack(stock, 0, 0);
		return stock;
	}
	// FOUNDATIONS
	const foundations = d.buffer.new(foundationsX[0], topY, cardWidth * 4 + margin * 3, cardHeight);
	const drawFoundations = function() {
		for (let i = 0; i < 4; i++) {
			const x = (cardWidth + margin) * i;
			drawCardSpot(foundations, x, 0);
		}
		return foundations;
	}
	// PILES
	const piles = [];
	for (let i = 0; i < 7; i++) piles.push(d.buffer.new(cardX + (cardWidth + margin) * i, cardY, cardWidth, d.height - cardY));
	const drawPiles = function(pilesData) {
		drawCard(piles[0], pilesData[0][0], 0, 0);
	}
	// NAVIGATION
	const navigation = d.buffer.new(cardX, topY - 2, totalWidth, 15, 2);

	const debug = d.buffer.new(0, 1, d.width, 7, 1);
	this.debug = function(piles) {
		for (let i = 0; i < piles.length; i++) {
			debug.cursorTo(1, i);
			const cards = piles[i];
			for (const card of cards) {
				d.setColor(card.suit);
				const cardString = card.value.toString() + card.suit + ' ';
				debug.write(cardString);
			}
		}
		debug.render();
	}

	this.start = function(data) {
		drawFoundations().simpleRender();
		drawStock().simpleRender();
		// for (const pile of piles) pile.fill('red').simpleRender();
		drawPiles(data.piles);
		for (const pile of piles) pile.simpleRender();
		// navigation.outline('green');
	}
}

module.exports = GameDisplay;