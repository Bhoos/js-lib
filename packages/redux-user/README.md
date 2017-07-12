const nullCards = new Array(21).fill(null);

// playerReducer (specific user)  
case DEAL:                                                  
  {                                                              
    cards: personalize((userId) => userId === state.id ? action.personalized[state.id].cards : nullCards),
  }

case THROW_CARD: {
  cards: personalize(userId => userId === state.id ? action.per)

}

// playerReducer (other user)
case DEAL:
  {
    cards: new Array(21).fill(null),
  }

case THROW_CARD:
  {
    cards: this.state.cards.filter() || cards.slice(cards.length - 1),
  }
case PICK_CHOICE:
case PICK_DECK:
  {
    cards: this.state.cards.concat(action.payload.card) || this.state.cards.concat(null);
  }

START_GAME:
  players: action.payload.players
  joker: action.payload.joker || null


type: START_GAME,
payload: {
  players: action.payload.players.map(playerReducer(state, action)),
},
protected: {

}

```javascript
const gameReducer = (state, action) {
  switch(action.type) {
    case 'START_GAME':
      return {
        ...state,
        joker: action.payload.joker,
        turnNumber: 0,
        players: action.payload.players.map(id => playerReducer({ id }, action)),
      };

    case 'THROW_CARD':

  }
}

const playerReducer = (state, action) {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...state,
        cards: [],
        shown: [],
        picked: null,
        thrown: null,
      };

    case 'DEAL':
      return {
        ...state,
        cards: action.private[state.id].cards,
      };

    case 'THROW': 
      return {
        ...state,
        cards: state.cards.filter(c => c != action.payload.card),
        thrown: action.payload.card,
      };

    case 'PICK_DECK':
      return {
        ...state,
        cards: state.cards.concat(action.payload.card),
        picked: 'deck',
      };

    case 'PICK_CHOICE':
      return {
        ...state,
        cards: state.cards.concat(action.payload.card),
        picked: action.payload.card,
      };
      
    case 'SHOW':
      return {
        ...state,
        cards: state.cards.filter(c => action.payload.groups.some(cards => cards.includes(c))),
        shown: action.payload.groups,
      }
  }
}
```