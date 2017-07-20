
interface Attribute {
  name: string,
  type: string,
}

interface Key {
  String(name: string):Attribute;
  Number(name: string):Attribute;
};

interface Model {
  get(attributes:string, partitionValue, sortValue):Promise<object>;
  put(item:object):Promise<boolean>;
  update(updateExpression:string, condition: string, names: object, values: object, partitionValue, sortValue):Promise<boolean>;
  query(partitionValue:(string|number), sortCondition:string, attributes:string, filter?:string, names?:object, values?:object):Promise<object[]>;
  delete(partitionValue, sortValue):Promise<boolean>;
};

module DynamoDB {
  export function createTable(name: string, primary: Attribute, sort?: Attribute, readUnits = 5, writeUnits = 1);

  export var Key:Key,

  export function generateModel(name, primaryKey:string, sortKey?: string):Model;
}

export = DynamoDB;
