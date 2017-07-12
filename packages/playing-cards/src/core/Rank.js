const rankByCodes = {};
const basicRanks = [];

class Rank {
  constructor(id, value, symbol, name, code) {
    Object.defineProperties(this, {
      id: { value: id },
      value: { value },
      symbol: { value: symbol },
      name: { value: name },
      code: { value: code },
    });

    // Keep track of all the ranks
    rankByCodes[code] = this;

    // Keep all the rank (A-K) in basicRanks
    if (id >= 1 && id <= 13) {
      basicRanks.push(this);
    }
  }

  next() {
    return basicRanks[this.id % 13];
  }

  prev() {
    return basicRanks[(this.id + 11) % 13];
  }
}

export const None = new Rank(0, 0, '?', 'NULL', '0');
export const Ace = new Rank(1, 14, 'A', 'Ace', '1');
export const Two = new Rank(2, 2, '2', 'Two', '2');
export const Three = new Rank(3, 3, '3', 'Three', '3');
export const Four = new Rank(4, 4, '4', 'Four', '4');
export const Five = new Rank(5, 5, '5', 'Five', '5');
export const Six = new Rank(6, 6, '6', 'Six', '6');
export const Seven = new Rank(7, 7, '7', 'Seven', '7');
export const Eight = new Rank(8, 8, '8', 'Eight', '8');
export const Nine = new Rank(9, 9, '9', 'Nine', '9');
export const Ten = new Rank(10, 10, '=', 'Ten', 'T');
export const Jack = new Rank(11, 11, 'J', 'Jack', 'J');
export const Queen = new Rank(12, 12, 'Q', 'Queen', 'Q');
export const King = new Rank(13, 13, 'K', 'King', 'K');
export const Man = new Rank(15, 15, '+', 'Man', 'M');
export const Superman = new Rank(16, 16, '*', 'Superman', 'S');

export const BASICS = basicRanks;
export const getByCode = code => rankByCodes[code];
