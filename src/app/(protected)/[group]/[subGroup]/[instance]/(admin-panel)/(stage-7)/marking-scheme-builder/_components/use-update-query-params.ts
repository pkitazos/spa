import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

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
