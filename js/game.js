const Game = function() {
	let cards = [];
	const suits = ['h', 'c', 'd', 's'];
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
