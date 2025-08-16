import { useCallback } from "react";

import {
  type NavigateOptions,
  type PrefetchOptions,
} from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useRouter as useNextRouter } from "next/navigation";

import { type PageName } from "@/config/pages";

import { type LinkArgs, mkHref } from ".";

export function useAppRouter() {
  const nextRouter = useNextRouter();

  const prefetch = useCallback(
    <T extends PageName>(
      page: T,
      args: LinkArgs<T>,
      opts: PrefetchOptions | undefined,
    ) => {
      nextRouter.prefetch(mkHref(page, args), opts);
    },
    [nextRouter],
  );

  const push = useCallback(
    <T extends PageName>(
      page: T,
      args: LinkArgs<T>,
      opts: NavigateOptions | undefined,
    ) => {
      nextRouter.push(mkHref(page, args), opts);
    },
    [nextRouter],
  );

  const replace = useCallback(
    <T extends PageName>(
      page: T,
      args: LinkArgs<T>,
      opts: NavigateOptions | undefined,
    ) => {
      nextRouter.replace(mkHref(page, args), opts);
    },
    [nextRouter],
  );

  return {
    back: useCallback(() => nextRouter.back(), [nextRouter]),
    forward: useCallback(() => nextRouter.forward(), [nextRouter]),
    refresh: useCallback(() => nextRouter.refresh(), [nextRouter]),
    prefetch,
    push,
    replace,
  };
}
