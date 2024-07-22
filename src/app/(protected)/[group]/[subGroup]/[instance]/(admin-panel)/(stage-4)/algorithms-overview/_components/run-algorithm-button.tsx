"use client";
import { InfoIcon } from "lucide-react";
import { toast } from "sonner";

import { useInstanceParams } from "@/components/params-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { api } from "@/lib/trpc/client";
import { Algorithm } from "@/lib/validations/algorithm";

export function RunAlgorithmButton({
  algorithm,
  custom = false,
}: {
  algorithm: Algorithm;
  custom?: boolean;
}) {
  const params = useInstanceParams();
  const utils = api.useUtils();

  const refetch = () =>
    utils.institution.instance.algorithm.singleResult.refetch({
      algName: algorithm.algName,
      params,
    });

  const { isPending, mutateAsync: runAlgAsync } =
    api.institution.instance.algorithm.run.useMutation();

  const Info = custom ? Flags : Description;

  async function handleRun() {
    void toast.promise(
      runAlgAsync({ params, algorithm })
        // .catch((err) => toast.error(err.message))
        .then(refetch),
      {
        loading: "Running...",
        error: "Something went wrong",
        success: "Success",
      },
    );
  }

  return (
    <div className="flex justify-between gap-5">
      <p className="flex items-center gap-2">
        {algorithm.displayName} - <Info algorithm={algorithm} />
      </p>
      <Button disabled={isPending} onClick={handleRun}>
        run
      </Button>
    </div>
  );
}

function Description({ algorithm }: { algorithm: Algorithm }) {
  return (
    <Popover>
      <PopoverTrigger>
        <InfoIcon className="h-4 w-4 stroke-slate-400" />
      </PopoverTrigger>
      <PopoverContent>{algorithm.description}</PopoverContent>
    </Popover>
  );
}

function Flags({ algorithm }: { algorithm: Algorithm }) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="">
        {algorithm.flag1}
      </Badge>
      {algorithm.flag2 && (
        <Badge variant="outline" className="">
          {algorithm.flag2}
        </Badge>
      )}
      {algorithm.flag3 && (
        <Badge variant="outline" className="">
          {algorithm.flag3}
        </Badge>
      )}
    </div>
  );
}
