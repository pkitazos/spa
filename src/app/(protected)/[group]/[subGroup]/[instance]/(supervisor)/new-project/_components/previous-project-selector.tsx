"use client";

import { CirclePlusIcon } from "lucide-react";

import { spacesLabels } from "@/config/spaces";

import { type SupervisorDTO, type ProjectDTO } from "@/dto";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { type InstanceParams } from "@/lib/validations/params";

export function PreviousProjectSelector({
  data,
}: {
  data: {
    instanceParams: InstanceParams;
    project: ProjectDTO;
    supervisor: SupervisorDTO;
  }[];
}) {
  return (
    <Dialog>
      <DialogTrigger>
        <Button variant="outline" size="lg" className="w-full">
          <CirclePlusIcon className="mr-2 h-4 w-4" />
          <span>Copy Details from previous project</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-full flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>
            Find Project from existing or previous instance
          </DialogTitle>

          <DialogDescription>
            If you choose to copy details from a project from a previous{" "}
            {spacesLabels.instance.full} you will still need to manually fill in
            the tags and flags. Flags and tags from a previous{" "}
            {spacesLabels.instance.full} will not be copied.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
