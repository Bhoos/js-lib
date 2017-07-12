/**
 * A fast algorithm for counting the number of
 * dublees in the given array of Cards. The array
 * of cards is assumed to be sorted and of a single
 * Suit
 */
const countDublees = (cards) => {
  let count = 0;
  for (let i = 0; i < cards.length - 1; i += 1) {
    if (cards[i].rank === cards[i + 1].rank) {
      count += 1;
      i += 1;
    }
  }

  return count;
};

export default countDublees;
