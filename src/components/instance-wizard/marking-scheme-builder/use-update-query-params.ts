import { useCallback } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useMarkingSchemeStore } from "./state";

export function useUpdateQueryParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useCallback(
    (flag?: string, submission?: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (flag !== undefined) params.set("flag", flag);
      else params.delete("flag");

      if (submission !== undefined) params.set("submission", submission);
      else params.delete("submission");

      router.replace(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );
}

export function useTabPosition() {
  const updateQueryParams = useUpdateQueryParams();

  const { flags, selectedFlagIndex, selectedSubmissionIndex, setTabPosition } =
    useMarkingSchemeStore((s) => s);

  const updateTabPosition = useCallback(
    (flagIdx: number | undefined, submissionIdx: number | undefined) => {
      const flagTitle =
        flagIdx !== undefined ? flags[flagIdx].title : undefined;

      const submissionTitle =
        flagIdx !== undefined && submissionIdx !== undefined
          ? flags[flagIdx].submissions[submissionIdx].title
          : undefined;

      setTabPosition(flagIdx, submissionIdx);
      updateQueryParams(flagTitle, submissionTitle);
    },
    [flags, setTabPosition, updateQueryParams],
  );

  return { selectedFlagIndex, selectedSubmissionIndex, updateTabPosition };
}
