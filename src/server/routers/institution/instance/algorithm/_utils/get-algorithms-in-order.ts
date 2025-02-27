import {
  AlgorithmDTO,
  builtInAlgorithms,
  builtInAlgSchema,
} from "@/lib/validations/algorithm";

// MOVE
// should be displayed in the order they were created, except the built-in ones which should be displayed first
export function sortAlgorithms(algorithms: AlgorithmDTO[]) {
  const customAlgs = algorithms
    .filter((a) => !builtInAlgSchema.options.includes(a.id))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  return [...builtInAlgorithms, ...customAlgs];
}
