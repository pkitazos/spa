"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PAGES } from "@/config/pages";

import { ChangePreferenceButton } from "@/components/change-preference-button";
import {
  useInstanceParams,
  usePathInInstance,
} from "@/components/params-context";
import { ToastSuccessCard } from "@/components/toast-success-card";
import { buttonVariants } from "@/components/ui/button";

import { api } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { type StudentPreferenceType } from "@/lib/validations/student-preference";

export function StudentPreferenceButton({
  projectId,
  defaultStatus,
}: {
  projectId: string;
  defaultStatus: StudentPreferenceType;
}) {
  const router = useRouter();
  const params = useInstanceParams();
  const { getPath } = usePathInInstance();

  const { mutateAsync: updateAsync } =
    api.user.student.preference.update.useMutation();

  async function handleChange(preferenceType: StudentPreferenceType) {
    void toast.promise(
      updateAsync({ params, projectId, preferenceType }).then(() =>
        router.refresh(),
      ),
      {
        loading: `Updating preference for Project ${projectId}...`,
        error: "Something went wrong",
        success: (
          <ToastSuccessCard
            message="Successfully updated project preference"
            action={
              <Link
                href={getPath(PAGES.myPreferences.href)}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "flex h-full w-34 text-nowrap items-center gap-2 self-end py-3 text-xs",
                )}
              >
                {PAGES.myPreferences.title}
              </Link>
            }
          />
        ),
      },
    );
  }

  return (
    <ChangePreferenceButton
      buttonLabelType="dynamic"
      defaultStatus={defaultStatus}
      changeFunction={handleChange}
    />
  );
}
