const Game = function() {
	let cards = [];
	const suits = ['h', 'c', 'd', 's'];
	const suitIndex = suit => suits.indexOf(suit);
	this.piles = [];
	this.stock = [];
	this.waste = [];
	this.foundations = [];
	this.drawAmount = 1;

	for (let suit of suits) {
		for (let i = 1; i < 14; i++) {
			cards.push(new Card(suit, i));
		}
	}
	this.shuffle = function() {
		for (let i in cards) {
			randomIndex = Math.floor(Math.random() * cards.length);
			let temp = cards[i];
			cards[i] = cards[randomIndex];
			cards[randomIndex] = temp;
		}
		return this;
	}
	this.dealCards = function() {
		let cardsIndex = 0;
		for (let i = 0; i < 7; i++) { // 7 piles
			if (i < 4) this.foundations.push([]);
			this.piles.push([]);
			for (let j = 0; j < i + 1; j++) { // with increasing amounts
				if (j < i) cards[cardsIndex].faceUp = false;
				else cards[cardsIndex].faceUp = true;
				this.piles[i].push(cards[cardsIndex]);
				cardsIndex++;
			}
		}
		for (let i = cardsIndex; i < cards.length; i++) {
			cards[i].faceUp = true;
			this.stock.push(cards[i]);
		}
		return this;
	}
	let deckStartOver = false;
	this.flipDeck = function(forward = true) { // I hate the repetitiveness of this function
		if (forward) {
			let i = 0;
			while (this.stock.length > 0 && i < this.drawAmount) {
				deckStartOver = false;
				this.waste.push(this.stock.pop());
				i++;
			}
			this.wasteVisible = this.wasteVisible + (this.waste.length <= 3);

			if (this.stock.length == 0) {
				if (deckStartOver) {
					let wasteLength = this.waste.length;
					for (let i = 0; i < wasteLength; i++) {
						this.stock.push(this.waste.pop());
					}
					this.wasteVisible = 0;
				} else deckStartOver = true;
			}
		} else { // I have yet to implement this.wasteVisible because undoing isn't a thing yet
			let amount = this.waste.length - Math.floor((this.waste.length - 1) / this.drawAmount) * this.drawAmount;
			let i = 0;
			while (this.waste.length > 0 && i < amount) {
				deckStartOver = false;
				this.stock.push(this.waste.pop());
				i++;
			}
			if (this.waste.length == 0) {
				if (deckStartOver) {
					let stockLength = this.stock.length;
					for (let i = 0; i < stockLength; i++) {
						this.waste.push(this.stock.pop());
					}
				} else deckStartOver = true;
			}
		}
	}
	this.validPair = function(card, target) {
		if (!card) return false;
		if (!target) return (card.value == 13);
		if (card.value == 1) return false;
		return suitIndex(card.suit) % 2 != suitIndex(target.suit) % 2 && card.value + 1 == target.value;
	}
	this.validSubmit = function(card) {
		const cardSuitIndex = suitIndex(card.suit);
		const foundation = this.foundations[cardSuitIndex];
		if (!foundation.length) {
			if (card.value == 1) return true;
			else return false;
		}
		const target = foundation[foundation.length - 1];
		if (card.value == target.value + 1) return true;
		else return false;
	}
	this.pileToPile = function(firstIndex, secondIndex, depth, undo = false) {
		const firstPile = this.piles[firstIndex];
		const secondPile = this.piles[secondIndex];

		let absoluteDepth = 0;
		if (undo) absoluteDepth = depth;
		else {
			for (const card of firstPile) {
				if (card.faceUp) break;
				absoluteDepth++;
			}
			absoluteDepth += depth;
		}

		const secondPileLength = secondPile.length;
		if (undo || this.validPair(firstPile[absoluteDepth], secondPile[secondPileLength - 1])) {
			const depthForUndoCommand = secondPileLength ? secondPileLength : 0;
			this.piles[secondIndex] = secondPile.concat(firstPile.splice(absoluteDepth, firstPile.length - absoluteDepth));
			if (undo && secondPile.length) secondPile[secondPileLength - 1].faceUp = false;
			else if (firstPile.length) firstPile[firstPile.length - 1].faceUp = true;
			return {type: 'pileToPile', path: [secondIndex, firstIndex], depth: depthForUndoCommand};
		}
		return false;
	}
	this.pileToPile.undo = (path, depth) => {
		this.pileToPile(path[0], path[1], depth, true);
	}
	this.pileToFoundation = function(index) {
		const pile = this.piles[index];
		if (!pile.length) return false;
		const card = pile[pile.length - 1];
		if (this.validSubmit(card)) {
		// if (true) {
			const foundationIndex = suitIndex(card.suit);
			this.foundations[foundationIndex].push(pile.pop());
			if (pile.length) pile[pile.length - 1].faceUp = true;
			return {type: 'foundationToPile', path: [foundationIndex, index], depth: null};
		}
		return false;
	}
	this.getPileData = function() {
		let output = [];
		for (let pile of this.piles) {
			let count = 0;
			for (let card of pile)
				if (card.faceUp) count++;
			output.push(count);
		}
		return output;
	}
	this.getData = function() {
		return {
			stock: this.stock,
			waste: this.waste,
			foundations: this.foundations,
			piles: this.piles,
		}
	}
}

const Card = function(suit, value) {
	this.suit = suit;
	this.value = value;
	this.faceUp = true;

	this.flip = function() {
		if (this.faceUp == false) this.faceUp = true;
		else this.faceUp = false;
	}
}

module.exports = Game;
