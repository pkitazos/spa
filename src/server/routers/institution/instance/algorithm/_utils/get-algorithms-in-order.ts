import { relativeComplement } from "@/lib/utils/general/set-difference";

import {
  GenerousAlgorithm,
  GreedyAlgorithm,
  GreedyGenAlgorithm,
  MinCostAlgorithm,
} from "@/config/algorithms";

export function getAlgorithmsInOrder<T extends { algName: string }>(
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
    (a, b) => a.algName === b.algName,
  ).sort((a, b) => a.algName.localeCompare(b.algName));

  return [...builtInAlgs, ...customAlgs];
}
