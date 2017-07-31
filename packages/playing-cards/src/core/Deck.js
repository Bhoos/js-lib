import generateDeck from './generateDeck';
import pickCards from './pickCards';
import round from './round';

class Deck {
  constructor(books = 1, manCount = 0, supermanCount = 0) {
    this.cards = generateDeck(books, manCount, supermanCount);
  }

  /**
   * Pick one of the card (randomly) from the deck
   */
  pick() {
    return pickCards(this.cards, 1)[0];
  }

  /**
   * Get a number of cards (randomly) from the deck
   * @param {number} count The number of cards to retrieve
   */
  getCards(count) {
    return pickCards(this.cards, count);
  }

  /**
   * Pick a card (randomly) from the deck without removing
   * it.
   */
  peek() {
    const idx = round(Math.random() * this.cards.length);
    const card = this.cards[idx];
    return {
      card,
      remove() {
        if (this.cards[idx] === card) {
          return this.cards.splice(idx, 1)[0];
        }

        const cIdx = this.cards.findIndex(c => c === card);
        if (cIdx >= 0) {
          return this.cards.splice(cIdx, 1)[0];
        }
        return null;
      },
    };
  }
}

export default Deck;
