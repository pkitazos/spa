import { type ChangeEvent } from "react";
import { useFormContext } from "react-hook-form";

import { toast } from "sonner";

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { flagsAssessmentSchema, type WizardFormData } from "../instance-wizard";

export function UploadJsonArea() {
  const form = useFormContext<WizardFormData>();

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const fileList = event.target.files ?? [];
    if (fileList.length > 1) throw Error("Too many files uploaded!");

    const [file] = fileList;
    const contents = await file.text();

    const res = flagsAssessmentSchema.safeParse(JSON.parse(contents));

    if (res.success) {
      form.setValue("flags", res.data);
      toast.success("Config parsed successfully");
    } else {
      form.setError("flags", {
        message:
          "Errors at:" +
          res.error.issues
            .map((a) => `${a.path.join(".")}: ${a.message}`)
            .join("\n"),
      });
      toast.error("Issues in config file");
    }
  }

  return (
    <FormField
      control={form.control}
      name="flags"
      render={() => (
        <FormItem className="flex flex-col">
          <FormControl>
            <Input
              className="w-56 cursor-pointer"
              type="file"
              accept=".json"
              onChange={(e) => handleFileChange(e)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
