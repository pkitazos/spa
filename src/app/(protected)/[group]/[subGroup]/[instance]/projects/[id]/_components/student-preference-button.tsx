"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ChangePreferenceButton } from "@/components/change-preference-button";
import {
  useInstanceParams,
  useInstancePath,
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
  const instancePath = useInstancePath();

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
                href={`${instancePath}/my-preferences`}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "flex h-full w-max items-center gap-2 self-end py-3 text-xs",
                )}
              >
                view &quot;My Preferences&quot;
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
