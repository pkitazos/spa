export function fuzzyMatch(searchTerm: string, target: string) {
  const search = searchTerm.toLowerCase();
  const text = target.toLowerCase();

  let searchIndex = 0;
  let textIndex = 0;

  while (searchIndex < search.length && textIndex < text.length) {
    if (search[searchIndex] === text[textIndex]) {
      searchIndex++;
    }
    textIndex++;
  }

  return searchIndex === search.length;
}
