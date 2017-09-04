# @bhoos/redis
Redis javascript object wrapper

# Installation
> `$ npm install @bhoos/js-redis`

# Usage
```javascript
import Redis from '@bhoos/js-redis';

Redis.config = {
  host: 127.0.0.1,  // Default
  port: 6379,       // Default
}

// Create class signature
class SomeClass extends Redis {}
class AnotherClass extends Redis {}

const cache = Redis.bind({
  'some-class': SomeClass,    // Simple class (Hash only)
  // A complex class with list, set, sortedset and a ttl of 1 day
  'another-class': Redis.$(AnotherClass).myList('myList').Set('mySet').SortedSet('mySortedSet').TTL(86400)
});

// Creating objects
const obj = await cache.SomeClass.create('id-1', { attr1: 'One', ... });
obj.set('attr2', 'Two');
obj.set('attr3', 'Three');
obj.get('attr2');   // Equals two
await obj.update();   // The changes is not written to Redis server before this

await obj.remove();   // Remove the object from redis server

// Other functions
const obj = await cache.AnotherClass.create('id-1', { attr1: 'one' });
// The object is created with list, set and sortedSet defined during binding

// List operations
await obj.myList.add(1);
await obj.myList.add(2);
await obj.myList.size(); // returns 2
await obj.myList.getAll();  // returns the whole array
await obj.myList.get(1);    // return value from specific index
await obj.myList.set(1, 'One'); // set value for specific index on list

// Set operations
await obj.mySet.add(1);   // returns 1 (number of items);
await obj.mySet.add(2);   // returns 2 (number of items);
await obj.mySet.add(2);   // returns 2 (number of items);
await obj.mySet.size();  // returns 2
await obj.mySet.getAll();  // return the whole set as array
await obj.mySet.remove(1);  // removes the specific item
await obj.mySet.contains(2);  // check if specific item exists

// SortedSet operations
await obj.mySortedSet.add('One', 1);  // Add item wih corresponding store
await obj.mySortedSet.add('Two', 2); 
await obj.mySortedSet.add('Two', 2.5);  // Can also update the store of existing item
await obj.mySortedSet.size(); // Get the size of the set
await obj.mySortedSet.getAll(); // Retrieve the set as an array (sorted)
await obj.mySortedSet.getScore('Two');  // Retrieve the score value for the given item
// use filter to retreive range values from the sorted set (orderd by score)
const filter = obj.mySortedSet.filter(); // create a filter
await filter.get(); // Retrieves all the value as no range is defined
await filter.start(1).get(); // Retrieves all the value with score greater than or equal 1
await filter.end(1).get();  // Retrieves all values with score less than or equal 1
await filter.end(2, false).get(); // Retrieves all values with score less than 2
// can also be done in reverse order (descending) by score
const rFilter = obj.mySortedSet.filter(true);  // set reverse flag
await rFilter.get();  // Retrieves all value in descending order
await rFilter.start(4).get(); // All values less than or equal to 4
await rFilter.end(1).get();   // All values greater than 1
await rFilter.start(4).end(1).get();  // All values between 4 and 1 inclusive
await rFilter.start(4, false).end(1, false).get();  // All values betwen 4 and 1 exclusive


```

# Notes
The TTL values are applied to the primary hash as well as all the dependent data
structures.

When the primary hash is removed, all the associated data structures (list, set, 
sortedSet are) are also removed.

The objects are stored in the redis server with the following naming convention
> `<name of class>:<id>`  


The data structures are stored as  
> `<name of class>:<id>:<name of the structure>`  
