"use client";

import { useState } from "react";

import { addWeeks } from "date-fns";
import {
  ChevronDown,
  MoreHorizontalIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import { type Classification } from "./state/store";

import { useMarkingSchemeStore } from "./state";
import {
  useTabPosition,
  useUpdateQueryParams,
} from "./use-update-query-params";

export function SidePanel() {
  const updateQueryParams = useUpdateQueryParams();
  const { flags, createFlag, setTabPosition } = useMarkingSchemeStore((s) => s);

  function handleNewFlag() {
    const newFlag = { title: `New Flag ${flags.length + 1}`, submissions: [] };

    createFlag(newFlag);
    setTabPosition(flags.length, undefined);
    updateQueryParams(newFlag.title, undefined);
    toast.success("New flag created");
  }

  return (
    <Sidebar
      className="w-68 flex-none bg-background pt-6"
      collapsible="none"
    >
      <SidebarHeader className="mb-5 flex flex-row items-center justify-between px-2">
        <Button
          variant="outline"
          className="flex w-full items-center gap-2"
          onClick={handleNewFlag}
        >
          <PlusIcon className="h-4 w-4" />
          <span>New Flag</span>
        </Button>
      </SidebarHeader>
      <SidebarContent className="flex flex-col gap-4 px-2">
        {flags.map((flag, flagIdx) => (
          <CollapsibleClassificationTab
            key={`${flag.title}_${flagIdx}`}
            flag={flag}
            flagIdx={flagIdx}
          />
        ))}
      </SidebarContent>
    </Sidebar>
  );
}

function CollapsibleClassificationTab({
  flag,
  flagIdx,
}: {
  flag: Classification;
  flagIdx: number;
}) {
  const updateQueryParams = useUpdateQueryParams();
  const { selectedFlagIndex, selectedSubmissionIndex, updateTabPosition } =
    useTabPosition();
  const {
    flags,
    deleteFlag,
    createSubmission,
    deleteSubmission,
    setTabPosition,
  } = useMarkingSchemeStore((s) => s);

  const [open, setOpen] = useState<boolean | undefined>(undefined);

  function handleRemoveFlag(flagIdx: number) {
    deleteFlag(flagIdx);
    if (selectedFlagIndex === flagIdx) {
      updateTabPosition(undefined, undefined);
    } else if (selectedFlagIndex !== undefined && selectedFlagIndex > flagIdx) {
      updateTabPosition(selectedFlagIndex - 1, undefined);
    }
    toast.success("Flag removed");
  }

  function handleRemoveSubmission(flagIdx: number, submissionIdx: number) {
    deleteSubmission(flagIdx, submissionIdx);
    if (selectedFlagIndex !== flagIdx) {
      toast.success("Submission removed");
      return;
    }

    if (selectedSubmissionIndex === submissionIdx) {
      updateTabPosition(flagIdx, undefined);
    } else if (
      selectedSubmissionIndex !== undefined &&
      selectedSubmissionIndex > submissionIdx
    ) {
      updateTabPosition(flagIdx, selectedSubmissionIndex - 1);
    }
    toast.success("Submission removed");
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

  return (
    <Collapsible
      key={`${flag.title}_${flagIdx}`}
      className="group/collapsible"
      open={open}
    >
      <SidebarGroup className="p-0">
        <SidebarMenuItem
          className={cn(
            "flex w-full items-center justify-between gap-1 rounded-md px-1.5 py-1.5 hover:bg-slate-300/80",
            selectedFlagIndex === flagIdx &&
              selectedSubmissionIndex === undefined &&
              "bg-slate-300/60",
          )}
        >
          <CollapsibleTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 flex-none hover:bg-slate-400/20"
              onClick={() => setOpen(undefined)}
            >
              <ChevronDown className="h-4 w-4 -rotate-90 transition-transform group-data-[state=open]/collapsible:rotate-0" />
            </Button>
          </CollapsibleTrigger>
          <button
            className="flex h-full w-full items-center justify-start text-sm font-medium"
            onClick={() => updateTabPosition(flagIdx, undefined)}
          >
            {flag.title}
          </button>
          <FlagMenuIcon flagIdx={flagIdx} removalHandler={handleRemoveFlag} />
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 flex-none hover:bg-slate-400/20"
            onClick={() => {
              handleNewSubmission(flagIdx);
              setOpen(true);
            }}
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
                    "flex w-full items-center justify-between gap-2 rounded-md py-1.5 pl-14 pr-8.5 hover:bg-slate-300/80",
                    submissionIdx === 0 && "mt-1.5",
                    selectedFlagIndex === flagIdx &&
                      selectedSubmissionIndex === submissionIdx &&
                      "bg-slate-300/60",
                  )}
                >
                  <button
                    className="flex h-full w-full items-center justify-start text-sm font-medium"
                    onClick={() => updateTabPosition(flagIdx, submissionIdx)}
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
          className="h-6 w-6 flex-none hover:bg-slate-400/20"
        >
          <MoreHorizontalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
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
