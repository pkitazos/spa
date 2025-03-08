import { SidebarProvider } from "@/components/ui/sidebar";

import { CentrePanel } from "./_components/centre-panel";
import { SidePanel } from "./_components/side-panel";
import { MarkingSchemeStoreProvider } from "./_components/state";
import { Classification, State } from "./_components/state/store";

type SearchParams = { [key: string]: string | undefined };

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
