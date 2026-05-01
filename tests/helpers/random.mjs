export function withMockedRandom(values, fn) {
  const original = Math.random;
  let index = 0;
  Math.random = () => {
    const value = values[index] ?? values[values.length - 1] ?? 0.5;
    index += 1;
    return value;
  };

  try {
    return fn();
  } finally {
    Math.random = original;
  }
}

export function withConstantRandom(value, fn) {
  return withMockedRandom([value], fn);
}
