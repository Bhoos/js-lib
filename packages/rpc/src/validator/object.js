export default function validateObject(obj) {
  const validators = Object.keys(obj).map(name => ({
    name,
    validate: obj[name],
  }));

  return value => validators.every(v => v.validate(value[v.name]));
}
