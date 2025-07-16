import { SidebarProvider } from "@/components/ui/sidebar";

import { type Classification, type State } from "./state/store";

import { CentrePanel } from "./centre-panel";
import { SidePanel } from "./side-panel";
import { MarkingSchemeStoreProvider } from "./state";

type SearchParams = Record<string, string | undefined>;

export async function MarkingSchemeBuilder({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const initialState = getInitialState(searchParams);

  return (
    <MarkingSchemeStoreProvider initialState={initialState}>
      <SidebarProvider className="relative">
        <div className="flex w-full">
          <SidePanel />
          <CentrePanel />
        </div>
      </SidebarProvider>
    </MarkingSchemeStoreProvider>
  );
}

function getInitialState(searchParams: SearchParams): State {
  const flags: Classification[] = []; // call trpc procedure here

  const flagIdx = flags.findIndex((f) => f.title === searchParams.flag);

  if (flagIdx === -1) {
    return {
      flags,
      selectedFlagIndex: undefined,
      selectedSubmissionIndex: undefined,
    };
  }

  const submissionIdx = flags[flagIdx].submissions.findIndex(
    (s) => s.title === searchParams.submission,
  );

  return {
    flags,
    selectedFlagIndex: flagIdx,
    selectedSubmissionIndex: submissionIdx !== -1 ? submissionIdx : undefined,
  };
}
