import * as Rank from './Rank';
import * as Suit from './Suit';

class PlayingCard {
  constructor(id, rank, suit) {
    Object.defineProperties(this, {
      id: { value: id },
      rank: { value: rank },
      suit: { value: suit },
    });
  }

  get code() {
    return this.rank.code + this.suit.code;
  }

  equals(other) {
    return this.rank === other.rank && this.suit === other.suit;
  }

  toString() {
    return this.suit.symbol + this.rank.symbol;
  }

  next() {
    const rank = this.rank.next();
    const id = rank.code + this.suit.code;
    return new PlayingCard(id, rank, this.suit);
  }

  prev() {
    const rank = this.rank.prev();
    const id = rank.code + this.suit.code;
    return new PlayingCard(id, rank, this.suit);
  }

  isSpecial() {
    return this.suit.isSpecial();
  }
}

/**
 * @param {string} PlayingCardId The unique code of the following format
 *                        to generate a PlayingCard instance:
 *                        <Rank Code><suit Code>/<ID>
 *                        Ex: 2H/2, 3Q/1, TC/3, etc.
 */
PlayingCard.getByCode = code => (
  new PlayingCard(code, Rank.getByCode(code[0]), Suit.getByCode(code[1]))
);

PlayingCard.comparator = (a, b) => (
  a.suit.id === b.suit.id ? (a.rank.id - b.rank.id) : a.suit.id - b.suit.id
);

PlayingCard.comparatorRanked = (a, b) => (
  a.rank.id === b.rank.id ? (a.suit.id - b.suit.id) : a.rank.id - b.rank.id
);

export default PlayingCard;
