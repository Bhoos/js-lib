export default function validateArray(valueValidator) {
  return (value) => {
    if (!Array.isArray(value)) {
      return false;
    }

    return value.every(v => valueValidator(v));
  };
}
