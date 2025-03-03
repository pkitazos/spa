// TODO add docs
// move
export function adjustTarget(unstableTarget: number, targetModifier: number) {
  return Math.max(unstableTarget + targetModifier, 0);
}

export function adjustUpperBound(
  unstableUpperBound: number,
  upperBoundModifier: number,
) {
  return Math.max(unstableUpperBound + upperBoundModifier, 0);
}
