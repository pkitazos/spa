export function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

export function fetchRandomItemFromArray<T>(array: T[]): {
  item: T;
  remaining: T[];
} {
  if (array.length === 0) {
    throw new Error("Array must not be empty");
  }

  const index = getRandomInt(array.length);
  return { item: array[index], remaining: array.toSpliced(index, 1) };
}
