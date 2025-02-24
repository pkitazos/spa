// MOVE to data object

export function formatProfile(profile: number[]) {
  while (profile[profile.length - 1] === 0) profile.pop();
  return profile.length === 0 ? "-" : `(${profile.join(", ")})`;
}

export function formatWeight(weight: number) {
  return Number.isNaN(weight) ? "-" : weight;
}

export function formatSize(size: number) {
  return Number.isNaN(size) ? "-" : size;
}
