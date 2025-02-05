"use client";
import { addWeeks } from "date-fns";
import {
  ChevronDown,
  MoreHorizontalIcon,
  PenIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
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

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useMarkingSchemeStore } from "./state";
import { useUpdateQueryParams } from "./use-update-query-params";

export function SidePanel() {
  const updateQueryParams = useUpdateQueryParams();

  const {
    flags,
    selectedFlagIndex,
    selectedSubmissionIndex,
    setTabPosition,
    createFlag,
    deleteFlag,
    createSubmission,
    deleteSubmission,
  } = useMarkingSchemeStore((s) => s);

  function handleTabChange(flagIdx: number, submissionIdx?: number) {
    const flag = flags[flagIdx];

    if (submissionIdx === undefined) {
      setTabPosition(flagIdx, undefined);

      updateQueryParams(flag.title, undefined);
      return;
    }

    setTabPosition(flagIdx, submissionIdx);

    updateQueryParams(flag.title, flag.submissions[submissionIdx].title);
  }

  function handleRemoveFlag(flagIdx: number) {
    deleteFlag(flagIdx);
    if (selectedFlagIndex === flagIdx) {
      setTabPosition(undefined, undefined);

      updateQueryParams(undefined, undefined);
    }
    toast.success("Flag removed");
  }

  function handleRemoveSubmission(flagIdx: number, submissionIdx: number) {
    deleteSubmission(flagIdx, submissionIdx);
    if (
      selectedFlagIndex === flagIdx &&
      selectedSubmissionIndex === submissionIdx
    ) {
      setTabPosition(flagIdx, undefined);

      updateQueryParams(flags[flagIdx].title, undefined);
    }
    toast.success("Submission removed");
  }

  function handleNewFlag() {
    const newFlag = {
      title: `New Flag ${flags.length + 1}`,
      submissions: [],
    };

    createFlag(newFlag);
    setTabPosition(flags.length, undefined);

    updateQueryParams(newFlag.title, undefined);
    toast.success("New flag created");
  }

  function handleNewSubmission(flagIdx: number) {
    const flag = flags[flagIdx];

    const newSubmission = {
      title: `New Submission ${flag.submissions.length + 1}`,
      components: { SUPERVISOR: [], READER: [] },
      studentSubmissionDeadline: new Date(),
      markerSubmissionDeadline: addWeeks(new Date(), 3),
    };

    createSubmission(flagIdx, newSubmission);
    setTabPosition(flagIdx, flag.submissions.length);

    updateQueryParams(flag.title, newSubmission.title);
    toast.success(`Submission created for ${flag.title}`);
  }

  // base          "bg-slate-300/30";
  // selected      "bg-slate-300/60";
  // hover         "bg-slate-300/80";
  // action hover  "bg-slate-400/20";

  return (
    <Sidebar className="w-[17rem] flex-none pt-6" collapsible="none">
      <SidebarHeader className="mb-5 flex flex-row items-center justify-between px-2">
        <Input placeholder="Search flags" className="w-full" />
        <Button className="flex-none" onClick={handleNewFlag} size="icon">
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
                  selectedFlagIndex === flagIdx &&
                    !selectedSubmissionIndex &&
                    selectedSubmissionIndex !== 0 &&
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
                <FlagMenuIcon
                  flagIdx={flagIdx}
                  removalHandler={handleRemoveFlag}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 flex-none hover:bg-slate-400/20"
                  onClick={() => handleNewSubmission(flagIdx)}
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
                          selectedFlagIndex === flagIdx &&
                            selectedSubmissionIndex === submissionIdx &&
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
                          removalHandler={handleRemoveSubmission}
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
  flagIdx,
  submissionIdx,
  removalHandler,
}: {
  itemType: string;
  flagIdx: number;
  submissionIdx?: number;
  removalHandler: (flagIdx: number, submissionIdx?: number) => void;
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
          <button
            className="flex items-center gap-2 text-sm"
            onClick={() => removalHandler(flagIdx, submissionIdx)}
          >
            <Trash2Icon className="h-4 w-4" />
            <span>Delete {itemType}</span>
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FlagMenuIcon({
  flagIdx,
  removalHandler,
}: {
  flagIdx: number;
  removalHandler: (flagIdx: number) => void;
}) {
  return (
    <ContextualMenuIcon
      itemType="Flag"
      flagIdx={flagIdx}
      removalHandler={removalHandler}
    />
  );
}

function SubmissionMenuIcon({
  flagIdx,
  submissionIdx,
  removalHandler,
}: {
  flagIdx: number;
  submissionIdx: number;
  removalHandler: (flagIdx: number, submissionIdx: number) => void;
}) {
  return (
    <ContextualMenuIcon
      itemType="Submission"
      flagIdx={flagIdx}
      submissionIdx={submissionIdx}
      removalHandler={() => removalHandler(flagIdx, submissionIdx)}
    />
  );
}

function deleteSubmission(flagIdx: number, submissionIdx: number) {
  throw new Error("Function not implemented.");
}
// const createQueryString = useCallback(
//   (name: string, value: string) => {
//     const params = new URLSearchParams(searchParams.toString());
//     params.set(name, value);

//     return params.toString();
//   },
//   [searchParams],
// );
