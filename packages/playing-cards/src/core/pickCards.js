/**
 * An immpure function that randomly picks the given number of cards from
 * the deck, modifying the deck array while doing it.
 *
 * @param deck An array of cards. It doesn't matter what the content
 *             of the deck are. It just needs to be any array.
 * @param count The number of items to be picked
 * @returns An array of the picked cards
 * @throws Error if the deck doesn't have sufficient cards to return
 */
const pickCards = (deck, count) => {
  let size = deck.length;
  if (count > size) {
    throw new Error(`Cannot pick ${count} cards from deck of size ${size}`);
  }

  const picked = [];

  // Pick the items from the array and fill the result
  while (picked.length < count) {
    const pos = Math.floor(Math.random() * size);
    picked.push(deck[pos]);
    size -= 1;
    deck[pos] = deck[size];   // eslint-disable-line no-param-reassign
  }

  // trim out the deck array
  deck.splice(size);

  return picked;
};

export default pickCards;
