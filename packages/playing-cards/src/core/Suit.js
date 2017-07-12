const suitByCodes = {};
const basicSuits = ['S', 'H', 'C', 'D'];
const alterSuits = ['C', 'D', 'S', 'H'];
const inverseSuits = ['H', 'S', 'D', 'C'];

class Suit {
  constructor(id, sn, symbol, name, code) {
    Object.defineProperties(this, {
      id: { value: id },
      sn: { value: sn },
      symbol: { value: symbol },
      name: { value: name },
      code: { value: code },
    });

    suitByCodes[code] = this;
  }

  isSpecial() {
    return this.id === 0;
  }

  get alter() {
    return suitByCodes[alterSuits[this.sn]];
  }

  get inverse() {
    return suitByCodes[inverseSuits[this.sn]];
  }
}

export const Spade = new Suit(1, 0, '♠', 'spade', 'S');
export const Heart = new Suit(2, 1, '♥', 'heart', 'H');
export const Club = new Suit(4, 2, '♣', 'club', 'C');
export const Diamond = new Suit(8, 3, '♦', 'diamond', 'D');

export const Special = new Suit(0, 4, '', 'special', '_');

export const BASICS = basicSuits.map(code => suitByCodes[code]);
export const ALL = BASICS.concat(Special);
export const getByCode = code => suitByCodes[code];
