import PlayingCard from '../core/PlayingCard';

/**
 * Search for all tunnellas within the given array of PlayingCards
 *
 * @param {array} PlayingCards List of PlayingCard ids (['2H/1', '1Q/2', ...])
 * @returns {array} array of array of PlayingCards
 */
const searchTunnellas = (PlayingCards) => {
  const source = PlayingCards.map(PlayingCard.getByCode);
  source.sort(PlayingCard.comparator);

  const tunnellas = [];
  let tunnella = null;
  source.reduce((prev, curr) => {
    if (!tunnella || !curr.equals(prev)) {
      tunnella = [curr];
    } else {
      tunnella.push(curr);
      if (tunnella.length === 3) {
        tunnellas.push(tunnella.map(card => card.id));
        tunnella = null;
      }
    }

    return curr;
  });

  return tunnellas;
};

export default searchTunnellas;
