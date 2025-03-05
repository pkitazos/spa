"use client";
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
} from "react";

import { useInstanceParams } from "@/components/params-context";

import { api } from "@/lib/trpc/client";

export function useAlgorithmUtils() {
  const params = useInstanceParams();
  const utils = api.useUtils();

  function getAll() {
    utils.institution.instance.algorithm.getAll.refetch({ params });
  }

  function allStudentResults() {
    utils.institution.instance.algorithm.allStudentResults.refetch({ params });
  }

  function allSupervisorResults() {
    utils.institution.instance.algorithm.allSupervisorResults.refetch({
      params,
    });
  }

  function getAllSummaryResults() {
    utils.institution.instance.algorithm.getAllSummaryResults.refetch({
      params,
    });
  }

  function singleResult(algId: string) {
    utils.institution.instance.algorithm.singleResult.refetch({
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
  setSelectedAlgName: () => {},
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
