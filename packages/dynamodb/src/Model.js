import generateGet from './generators/generateGet';
import generatePut from './generators/generatePut';
import generateUpdate from './generators/generateUpdate';
import generateDelete from './generators/generateDelete';
import generateQuery from './generators/generateQuery';

export default DB => (name, primary, sort) => ({
  get: generateGet(DB, name, { primary, sort }),
  put: generatePut(DB, name, { primary, sort }),
  update: generateUpdate(DB, name, { primary, sort }),
  delete: generateDelete(DB, name, { primary, sort }),
  query: generateQuery(DB, name, { primary, sort }),
});
