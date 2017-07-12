import * as Suit from './Suit';
import * as Rank from './Rank';

/**
 * Generate a deck of cards for the given number of
 * books, mans and supermans. The result is an array with all
 * the cards arranged randomly with unpredicatable id.
 *
 * If the seed parameter is provided, the cards generated becomes
 * deterministic, i.e., the same result is provided for the same
 * seed.
 */
export default (books, mans, supermans) => {
  const cards = [];

  // Create all the cards and put then in the array
  Suit.BASICS.forEach((suit) => {
    Rank.BASICS.forEach((rank) => {
      for (let i = 0; i < books; i += 1) {
        cards.push(`${rank.code}${suit.code}/${i + 1}`);
      }
    });
  });

  // Then the mans
  for (let i = 0; i < mans; i += 1) {
    cards.push(`${Rank.Man.code}${Suit.Special.code}/${i + 1}`);
  }

  // Finally the supermans
  for (let i = 0; i < supermans; i += 1) {
    cards.push(`${Rank.Superman.code}${Suit.Special.code}/${i + 1}`);
  }

  return cards;
};
