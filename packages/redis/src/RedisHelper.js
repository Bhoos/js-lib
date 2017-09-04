import { List, Map, SortedSet, Set } from './dataStructures';

class RedisHelper {
  constructor(Class) {
    this.Class = Class;
    this.children = {};
  }

  addChildren(name, method) {
    if (this.children[name]) {
      throw new Error(`A datastructure named ${name} has already been added`);
    }
    this.children[name] = method;
  }

  setName(name) {
    this.name = name;
    return this;
  }

  getName() {
    return this.name;
  }

  TTL(seconds) {
    this.ttl = seconds;
    return this;
  }

  List(name) {
    this.addChildren(name, List);
    return this;
  }

  Map(name) {
    this.addChildren(name, Map);
    return this;
  }

  SortedSet(name) {
    this.addChildren(name, SortedSet);
    return this;
  }

  Set(name) {
    this.addChildren(name, Set);
    return this;
  }

  getClassName() {
    return this.Class.name;
  }
}

export default RedisHelper;
