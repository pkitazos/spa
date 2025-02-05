"use client";
import { addWeeks } from "date-fns";
import {
  ChevronDown,
  MoreHorizontalIcon,
  PenIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { cn } from "@/lib/utils";
import { slugify } from "@/lib/utils/general/slugify";

import { useCallback } from "react";
import { FlagMarkingScheme, useMarkingSchemeStore } from "./store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SidePanel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const flags = useMarkingSchemeStore((state) => state.flags);
  const selectedFlagIdx = useMarkingSchemeStore((s) => s.selectedFlagIndex);
  const selectedSubmissionIdx = useMarkingSchemeStore(
    (s) => s.selectedSubmissionIndex,
  );
  const setSelectedFlag = useMarkingSchemeStore((s) => s.setSelectedFlag);
  const setSelectedSubmission = useMarkingSchemeStore(
    (s) => s.setSelectedSubmission,
  );
  const addFlag = useMarkingSchemeStore((s) => s.addFlag);
  const addSubmission = useMarkingSchemeStore((s) => s.addSubmission);

  function handleTabChange(flagIdx: number, submissionIdx?: number) {
    const flag = flags[flagIdx];
    const flagId = slugify(flag.title);

    if (!submissionIdx && submissionIdx !== 0) {
      setSelectedFlag(flagIdx);
      setSelectedSubmission(null);

      router.push(`?flag=${flagId}`);
      return;
    }

    const submission = flag.submissions[submissionIdx];
    const submissionId = slugify(submission.title);

    setSelectedFlag(flagIdx);
    setSelectedSubmission(submissionIdx);

    router.push(`?flag=${flagId}&submission=${submissionId}`);
  }

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams],
  );

  function handleNewFlag() {
    const newFlag = {
      title: `New Flag ${flags.length + 1}`,
      submissions: [],
    };
    addFlag(newFlag);
    router.push(`?flag=${slugify(newFlag.title)}`);
    setSelectedFlag(flags.length ?? 0);
    toast.success("New flag added");
  }

  function handleNewSubmission(flag: FlagMarkingScheme) {
    const selectedFlagIndex = flags.indexOf(flag);
    addSubmission(selectedFlagIndex, {
      title: `New Submission ${flag.submissions.length + 1}`,
      components: { SUPERVISOR: [], READER: [] },
      studentSubmissionDeadline: new Date(),
      markerSubmissionDeadline: addWeeks(new Date(), 3),
    });
    router.push(`?flag=${flag.title}&submission=${slugify("New Submission")}`);
    setSelectedSubmission(flag.submissions.length ?? 0);
    toast.success(`Submission added to ${flag.title}`);
  }

  // base          "bg-slate-300/30";
  // selected      "bg-slate-300/60";
  // hover         "bg-slate-300/80";
  // action hover  "bg-slate-400/20";

  return (
    <Sidebar className="" collapsible="none">
      <SidebarHeader>
        <Button onClick={handleNewFlag} size="icon">
          <PlusIcon className="h-4 w-4" />
        </Button>
      </SidebarHeader>
      <SidebarContent className="flex flex-col gap-4 px-2">
        {flags.map((flag, flagIdx) => (
          <Collapsible
            key={`${flag.title}_${flagIdx}`}
            className="group/collapsible"
          >
            <SidebarGroup className="p-0">
              <SidebarMenuItem
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "flex h-10 w-full items-center justify-between gap-1 bg-slate-300/30 px-1.5 hover:bg-slate-300/80",
                  selectedFlagIdx === flagIdx &&
                    !selectedSubmissionIdx &&
                    selectedSubmissionIdx !== 0 &&
                    "bg-slate-300/60",
                )}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 flex-none hover:bg-slate-400/20"
                  >
                    <ChevronDown className="h-4 w-4 -rotate-90 transition-transform group-data-[state=open]/collapsible:rotate-0" />
                  </Button>
                </CollapsibleTrigger>
                <button
                  className="flex h-full w-full items-center justify-start text-sm"
                  onClick={() => handleTabChange(flagIdx)}
                >
                  {flag.title}
                </button>
                <FlagMenuIcon flagIdx={flagIdx} />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 flex-none hover:bg-slate-400/20"
                  onClick={() => handleNewSubmission(flag)}
                  // ? any way to make this onClick also toggle the collapsible?
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </SidebarMenuItem>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu className="flex flex-col gap-1.5">
                    {flag.submissions.map((submission, submissionIdx) => (
                      <SidebarMenuItem
                        key={`${flag.title}_${flagIdx}_${submission.title}_${submissionIdx}`}
                        className={cn(
                          buttonVariants({ variant: "ghost" }),
                          "flex w-full items-center justify-between gap-2 bg-slate-300/30 pl-14 pr-1.5 hover:bg-slate-300/80",
                          submissionIdx === 0 && "mt-1.5",
                          selectedFlagIdx === flagIdx &&
                            selectedSubmissionIdx === submissionIdx &&
                            "bg-slate-300/60",
                        )}
                      >
                        <button
                          className="flex h-full w-full items-center justify-start text-sm"
                          onClick={() =>
                            handleTabChange(flagIdx, submissionIdx)
                          }
                        >
                          {submission.title}
                        </button>
                        <SubmissionMenuIcon
                          flagIdx={flagIdx}
                          submissionIdx={submissionIdx}
                        />
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}

function ContextualMenuIcon({
  itemType,
}: {
  itemType: string;
  flagIdx: number;
  submissionIdx?: number;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 flex-none hover:bg-slate-400/20"
        >
          <MoreHorizontalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <button className="flex items-center gap-2 text-sm">
            <PenIcon className="h-4 w-4" />
            <span>Rename</span>
          </button>
        </DropdownMenuItem>
        <DropdownMenuItem className="bg-background text-destructive focus:bg-red-100/40 focus:text-destructive">
          <button className="flex items-center gap-2 text-sm">
            <Trash2Icon className="h-4 w-4" />
            <span>Delete {itemType}</span>
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FlagMenuIcon({ flagIdx }: { flagIdx: number }) {
  return <ContextualMenuIcon itemType="Flag" flagIdx={flagIdx} />;
}

function SubmissionMenuIcon({
  flagIdx,
  submissionIdx,
}: {
  flagIdx: number;
  submissionIdx: number;
}) {
  return (
    <ContextualMenuIcon
      itemType="Submission"
      flagIdx={flagIdx}
      submissionIdx={submissionIdx}
    />
  );
}
