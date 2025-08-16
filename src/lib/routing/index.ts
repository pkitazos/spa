import { type PageName, PAGES } from "@/config/pages";

export type LinkArgs<T extends PageName> = Parameters<
  (typeof PAGES)[T]["mkUrl"]
>[0];
type LinkFactory<T extends PageName> = (_: LinkArgs<T>) => string;

export function mkHref<T extends PageName>(type: T, linkArgs: LinkArgs<T>) {
  return (PAGES[type].mkUrl as LinkFactory<T>)(linkArgs);
}

export { AppLink } from "./link";
export { useAppRouter } from "./router";
