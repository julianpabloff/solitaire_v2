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
		let i = 0;
		while (this.stock.length > 0 && i < this.drawAmount) {
			deckStartOver = false;
			this.waste.push(this.stock.pop());
			i++;
		}
		if (this.stock.length == 0) {
			if (deckStartOver) {
				const wasteLength = this.waste.length;
				for (let i = 0; i < wasteLength; i++) this.stock.push(this.waste.pop());
			} else deckStartOver = true;
		}
		return {type: 'flipDeckUndo', path: [null, null], depth: null};
	}
	this.flipDeckUndo = function() {
		const wasteLength = this.waste.length;
		let amount = wasteLength - Math.floor((wasteLength - 1) / this.drawAmount) * this.drawAmount;
		let i = 0;
		while (this.waste.length > 0 && i < amount) {
			deckStartOver = false;
			this.stock.push(this.waste.pop());
			i++;
		}
		if (this.waste.length == 0) {
			if (deckStartOver) {
				const stockLength = this.stock.length;
				for (let i = 0; i < stockLength; i++) {
					this.waste.push(this.stock.pop());
				}
			} else deckStartOver = true;
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
	this.pileToPile = function(firstIndex, secondIndex, depth, undo = false, flipDestination = true) {
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
			if (undo && secondPile.length && flipDestination) secondPile[secondPileLength - 1].faceUp = false;
			else if (firstPile.length) firstPile[firstPile.length - 1].faceUp = true;
			return {type: 'pileToPileUndo', path: [secondIndex, firstIndex, depth == 0], depth: depthForUndoCommand};
		} return false;
	}
	this.pileToPileUndo = (path, depth) => {
		this.pileToPile(path[0], path[1], depth, true, path[2]);
	}
	this.pileToFoundation = function(pileIndex) {
		const pile = this.piles[pileIndex];
			if (!pile.length) return false;
		const card = pile[pile.length - 1];
		if (this.validSubmit(card)) {
			const foundationIndex = suitIndex(card.suit);
			this.foundations[foundationIndex].push(pile.pop());
			faceDownOnUndo = false;
			if (pile.length) {
				const cardAbove = pile[pile.length - 1];
				if (!cardAbove.faceUp) {
					faceDownOnUndo = true;
					pile[pile.length - 1].faceUp = true;
				}
			}
			return {type: 'foundationToPile', path: [foundationIndex, pileIndex, faceDownOnUndo], depth: null};
		} return false;
	}
	this.foundationToPile = function(path, depth) {
		const foundation = this.foundations[path[0]];
		const pile = this.piles[path[1]];
		if (path[2] && pile.length) pile[pile.length - 1].faceUp = false;
		pile.push(foundation.pop());
	}
	this.wasteToPile = function(index) {
		const pile = this.piles[index];
		const card = this.waste[this.waste.length - 1];
		const target = pile[pile.length - 1];
		if (this.validPair(card, target)) {
			pile.push(this.waste.pop());
			return {type: 'pileToWaste', path: [index, null], depth: null};
		} return false;
	}
	this.pileToWaste = function(path, depth) {
		const pile = this.piles[path[0]];
		this.waste.push(pile.pop());
	}
	this.wasteToFoundation = function() {
		const card = this.waste[this.waste.length - 1];
		if (this.validSubmit(card)) {
			const foundationIndex = suitIndex(card.suit);
			this.foundations[foundationIndex].push(this.waste.pop());
			return {type: 'foundationToWaste', path: [foundationIndex, null], depth: null};
		} return false;
	}
	this.foundationToWaste = function(path, depth) {
		this.waste.push(this.foundations[path[0]].pop());
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
	this.getWasteCount = () => this.waste.length < 3 ? this.waste.length : 3;
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
