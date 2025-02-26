import { relativeComplement } from "@/lib/utils/general/set-difference";

import {
  GenerousAlgorithm,
  GreedyAlgorithm,
  GreedyGenAlgorithm,
  MinCostAlgorithm,
} from "@/config/algorithms";

// TODO: should be displayed in the order they were created, except the built-in ones which should be displayed first
export function getAlgorithmsInOrder<T extends { displayName: string }>(
  algorithmData: T[],
) {
  const builtInAlgs = [
    GenerousAlgorithm,
    GreedyAlgorithm,
    GreedyGenAlgorithm,
    MinCostAlgorithm,
  ];

  const customAlgs = relativeComplement(
    algorithmData,
    builtInAlgs,
    (a, b) => a.displayName === b.displayName,
  ).sort((a, b) => a.displayName.localeCompare(b.displayName));

  return [...builtInAlgs, ...customAlgs];
}
