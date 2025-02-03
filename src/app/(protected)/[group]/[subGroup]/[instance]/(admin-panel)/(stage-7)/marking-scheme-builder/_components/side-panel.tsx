"use client";
import { addWeeks } from "date-fns";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { slugify } from "@/lib/utils/general/slugify";

import { FlagMarkingScheme, useMarkingSchemeStore } from "./store";

export function SidePanel({ onNewFlag }: { onNewFlag: () => void }) {
  const router = useRouter();
  const flags = useMarkingSchemeStore((state) => state.flags);
  const selectedFlagIndex = useMarkingSchemeStore((s) => s.selectedFlagIndex);
  const setSelectedFlag = useMarkingSchemeStore((s) => s.setSelectedFlag);
  const selectedSubmissionIndex = useMarkingSchemeStore(
    (s) => s.selectedSubmissionIndex,
  );
  const setSelectedSubmission = useMarkingSchemeStore(
    (s) => s.setSelectedSubmission,
  );
  const addSubmission = useMarkingSchemeStore((s) => s.addSubmission);

  function handleChangeTab(flag: FlagMarkingScheme) {
    router.push(`?flag=${flag.title}`);
    setSelectedFlag(flags.indexOf(flag));
    setSelectedSubmission(null);
    console.log(flag);
  }

  function handleNewSubmission(flag: FlagMarkingScheme) {
    const selectedFlagIndex = flags.indexOf(flag);
    addSubmission(selectedFlagIndex, {
      title: `New Submission`,
      components: { SUPERVISOR: [], READER: [] },
      studentSubmissionDeadline: new Date(),
      markerSubmissionDeadline: addWeeks(new Date(), 3),
    });
    router.push(`?flag=${flag.title}&submission=${slugify("New Submission")}`);
    setSelectedSubmission(flag.submissions.length ?? 0);
    console.log(selectedSubmissionIndex);
    toast.success(`Submission added to ${flag.title}`);
  }

  return (
    <div className="w-64 border-r px-2">
      <div className="py-2">
        <Button onClick={onNewFlag} size="icon">
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {flags.map((flag, i) => (
          <div
            key={i}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "h-12 justify-start pr-1",
              selectedFlagIndex === i && "bg-accent",
            )}
          >
            <div className="flex w-full items-center justify-between">
              <button
                className="flex h-12 w-full items-center justify-start"
                onClick={() => handleChangeTab(flag)}
              >
                {flag.title}
              </button>
              <Button
                size="icon"
                variant="ghost"
                className="hover:bg-slate-300"
                onClick={() => handleNewSubmission(flag)}
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
