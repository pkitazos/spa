import {
  builtInAlgorithms,
  builtInAlgSchema,
} from "@/lib/validations/algorithm";
import { AlgorithmDTO } from "@/dto/algorithm";

// should be displayed in the order they were created, except the built-in ones which should be displayed first
/**
 *
 * @deprecated us db level sorting on createdAt
 */
export function sortAlgorithms(algorithms: AlgorithmDTO[]) {
  const customAlgs = algorithms
    .filter((a) => !builtInAlgSchema.options.includes(a.id))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  return [...builtInAlgorithms, ...customAlgs];
}
