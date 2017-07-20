# DynamoDB wrapper
A simple wrapper around aws-sdk dynamodb library 
with Promises.

# Installation
> `$ npm install --save @bhoos/js-dynamodb`

# Usage
## Creating tables
```javascript
import { createTable, Key } from '@bhoos/js-dynamodb';

createTable('Users', Key.String('id'));
createTable('Movies', Key.Number('year'), Key.String('id'));
```
*`createTable` is a one time operation for any application. Its
best to use it separately in some sort ot setup scripts*

## Reading, Writing data
```javascript
import { generateModel } from '@bhoos/js-dynamodb';

// Create a User Model with ites name and primary key
const User = generateModel('Users', 'id');

// Create a Movie Model with its name and composite primary key
const Movie = generateModel('Movies', 'year', 'title');

// The get, put, update, delete and query operations are available
// on the generated model

// Retrieve user data with id 'jdoe'
User.get('id, name, password', 'jdoe'); 

// Retreive with composite key
Movie.get('year, title, budget', 2017, 'Big Bang');

// Insert a new user record. If a primary key exists, the operation fails
User.put({ id: 'jdoe', name: 'John Doe', password: '*****' });

// Update name of 'jdoe' to 'Jane Doe'. Check out the updateItem documentation
// on aws sdk for more update options (SET/ADD/REMOVE)
User.update('SET #name=:name', null, { name: 'name' }, { name: 'Jane Doe' }, 'jdoe');

// Update conditionally, increments counter by 1 only when the the previous
// value for counter is 20. Returns false if the condition fails otherwise
// returns true.
User.update('SET counter = counter + :val', 'counter = :prev', null, {
  val: 1,
  prev: 20,
}, 'jdoe');

// Delete a record
User.delete('jdoe');
Movies.delete(2015, 'Big Bang');

// Query records based on sort key
// Query is pointless without a sort key

// Retrieve all movies released in year 2015
Movies.query(2015, null, 'year, title, budget', null, null, null);

// Retreive all movies released in year 2015 with big budget
Movies.query(2015, null, 'year, title, buget', 'budget > :budget', null, {
  budget: 20000000,
});

```