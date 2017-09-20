import { Basic, List, Map, SortedSet, Set } from './dataStructures';
import Static from './Static';

class RedisHelper {
  constructor(Class) {
    this.Class = Class;
    this.children = {};
    this.statics = {};
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

  TTL(milliseconds) {
    this.ttl = milliseconds;
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

  Static(name) {
    this.statics[name] = Static(Basic);
    return this;
  }

  StaticSet(name) {
    this.statics[name] = Static(Set);
    return this;
  }

  StaticMap(name) {
    this.statics[name] = Static(Map);
    return this;
  }

  StaticList(name) {
    this.statics[name] = Static(List);
    return this;
  }

  StaticSortedSet(name) {
    this.statics[name] = Static(SortedSet);
    return this;
  }

  getClassName() {
    return this.Class.name;
  }
}

export default RedisHelper;
