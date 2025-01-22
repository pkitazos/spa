import {
  GenerousAlgorithm,
  GreedyAlgorithm,
  GreedyGenAlgorithm,
  MinCostAlgorithm,
} from "@/content/algorithms";

export function getBuiltInAlgorithm(algName: string) {
  switch (algName) {
    case GenerousAlgorithm.algName:
      return GenerousAlgorithm;

    case GreedyAlgorithm.algName:
      return GreedyAlgorithm;

    case GreedyGenAlgorithm.algName:
      return GreedyGenAlgorithm;

    case MinCostAlgorithm.algName:
      return MinCostAlgorithm;

    default:
      return undefined;
  }
}
