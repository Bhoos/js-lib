export default function Static(type) {
  return (client, className, name) => {
    const key = `${className}::${name}`;
    return type(client, key, null);
  };
}
