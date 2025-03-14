"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useInstanceParams } from "@/components/params-context";
import { Button } from "@/components/ui/button";

import { api } from "@/lib/trpc/client";

import { StageButton } from "./stage-button";

import { stageSchema } from "@/db/types";
import { CHAPTER } from "@/config/config/stage";

import { Stage } from "@/db/types";

export function StageControl({ stage }: { stage: Stage }) {
  const params = useInstanceParams();
  const router = useRouter();
  const stages = stageSchema.options;
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [confirmedIdx, setConfirmedIdx] = useState(stages.indexOf(stage) + 1);

  const utils = api.useUtils();
  const refetchTabs = utils.institution.instance.getHeaderTabs.refetch;

  const { mutateAsync } = api.institution.instance.setStage.useMutation();

  const handleConfirmation = (idx: number) => {
    toast.promise(
      mutateAsync({ params, stage: stages[idx - 1]! }).then(() => {
        setSelectedIdx(-1);
        setConfirmedIdx(idx);
        router.refresh();
        refetchTabs();
      }),
      {
        loading: "Updating Stage...",
        error: "Something went wrong",
        success: "Success",
      },
    );
  };
  return (
    <div className="mx-16 mt-12 flex justify-between px-6">
      <ol className="grid w-full grid-cols-2">
        <div className="col-span-1 flex flex-col gap-7">
          {Object.values(CHAPTER.ALLOCATION).map((stage, i) => (
            <StageButton
              key={stage.id}
              title={stage.displayName}
              num={i + 1}
              selectedIdx={selectedIdx}
              confirmedIdx={confirmedIdx}
              setSelectedIdx={setSelectedIdx}
            />
          ))}
        </div>
        <div className="col-span-1 flex flex-col gap-7">
          {Object.values(CHAPTER.MARKING).map((stage, i) => (
            <StageButton
              key={stage.id}
              title={stage.displayName}
              num={i + Object.values(CHAPTER.ALLOCATION).length + 1}
              selectedIdx={selectedIdx}
              confirmedIdx={confirmedIdx}
              setSelectedIdx={setSelectedIdx}
            />
          ))}
        </div>
      </ol>
      <Button
        className="w-40 self-end"
        disabled={selectedIdx === -1}
        onClick={() => handleConfirmation(selectedIdx)}
      >
        Change Stage
      </Button>
    </div>
  );
}
