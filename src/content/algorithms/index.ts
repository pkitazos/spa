import { AlgorithmFlag } from "@prisma/client";

import { Algorithm } from "@/lib/validations/algorithm";

// TODO: change algName to id

export const GenerousAlgorithm = {
  algName: "generous",
  displayName: "Generous",
  description:
    "Produces a matching that has maximum cardinality, and subject to this, minimises the number of Rth choices, and subject to this, minimises the number of (R-1)th choices, etc., where R is the maximum length of a preference list.",
  flag1: AlgorithmFlag.MAXSIZE,
  flag2: AlgorithmFlag.GEN,
  flag3: AlgorithmFlag.LSB,
  targetModifier: 0,
  upperBoundModifier: 0,
  maxRank: -1,
} satisfies Algorithm;

export const GreedyAlgorithm = {
  algName: "greedy",
  displayName: "Greedy",
  description:
    "Produces a matching that has maximum cardinality, and subject to this, maximises the number of first choices, and subject to this, maximises the number of second choices, etc.",
  flag1: AlgorithmFlag.MAXSIZE,
  flag2: AlgorithmFlag.GRE,
  flag3: AlgorithmFlag.LSB,
  targetModifier: 0,
  upperBoundModifier: 0,
  maxRank: -1,
} satisfies Algorithm;

export const MinCostAlgorithm = {
  algName: "minimum-cost",
  displayName: "Minimum Cost",
  description:
    "Produces a maximum cardinality matching that has minimum cost, where the cost of a matching is the sum, taken over all matched students, of the rank of each student's assigned project in their preference list.",
  flag1: AlgorithmFlag.MAXSIZE,
  flag2: AlgorithmFlag.MINCOST,
  flag3: AlgorithmFlag.LSB,
  targetModifier: 0,
  upperBoundModifier: 0,
  maxRank: -1,
} satisfies Algorithm;

export const GreedyGenAlgorithm = {
  algName: "greedy-generous",
  displayName: "Greedy-Generous",
  description:
    "Produces a greedy maximum matching relative to the first k elements on every student's preference list, where k is the maximum integer such that some agent obtains their kth choice project in a generous maximum matching.",
  flag1: AlgorithmFlag.MAXSIZE,
  flag2: AlgorithmFlag.GRE,
  flag3: AlgorithmFlag.LSB,
  targetModifier: 0,
  upperBoundModifier: 0,
  maxRank: -1,
} satisfies Algorithm;
