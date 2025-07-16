"use client";

import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useState,
} from "react";

import { useInstanceParams } from "@/components/params-context";

import { api } from "@/lib/trpc/client";

export function useAlgorithmUtils() {
  const params = useInstanceParams();
  const utils = api.useUtils();

  async function getAll() {
    await utils.institution.instance.algorithm.getAll.refetch({ params });
  }

  async function allStudentResults() {
    await utils.institution.instance.algorithm.allStudentResults.refetch({
      params,
    });
  }

  async function allSupervisorResults() {
    await utils.institution.instance.algorithm.allSupervisorResults.refetch({
      params,
    });
  }

  async function getAllSummaryResults() {
    await utils.institution.instance.algorithm.getAllSummaryResults.refetch({
      params,
    });
  }

  async function singleResult(algId: string) {
    await utils.institution.instance.algorithm.singleResult.refetch({
      algId,
      params,
    });
  }

  return {
    getAll,
    allStudentResults,
    allSupervisorResults,
    getAllSummaryResults,
    singleResult,
  };
}

type AlgorithmContextProps = {
  selectedAlgName: string | undefined;
  setSelectedAlgName: Dispatch<SetStateAction<string | undefined>>;
};

export const AlgorithmContext = createContext<AlgorithmContextProps>({
  selectedAlgName: undefined,
  setSelectedAlgName: () => {
    return;
  },
});

export function AlgorithmProvider({
  selectedAlgName: currentValue,
  children,
}: {
  selectedAlgName: string | undefined;
  children: ReactNode;
}) {
  const [selectedAlgName, setSelectedAlgName] = useState(currentValue);

  return (
    <AlgorithmContext.Provider value={{ selectedAlgName, setSelectedAlgName }}>
      {children}
    </AlgorithmContext.Provider>
  );
}

export function useSelectedAlgorithm() {
  const ctx = useContext(AlgorithmContext);
  if (!ctx) throw new Error("Missing AlgorithmProvider in the tree");
  return ctx;
}
