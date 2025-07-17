"use client";

import { useState } from "react";

import { toast } from "sonner";

import { useInstanceParams } from "@/components/params-context";
import { Switch } from "@/components/ui/switch";

import { api } from "@/lib/trpc/client";

export function UnitOpenToggle({
  unitOfAssessmentId,
  open,
}: {
  unitOfAssessmentId: string;
  open: boolean;
}) {
  const params = useInstanceParams();
  const [access, setAccess] = useState(open);

  const { mutateAsync: setIsOpen } =
    api.institution.instance.setUnitOfAssessmentAccess.useMutation();

  function handleToggle(access: boolean) {
    void toast.promise(
      setIsOpen({ params, unitOfAssessmentId, open: access }).then((title) => {
        setAccess(access);
        return { access, title };
      }),
      {
        success: ({ access, title }) =>
          access ? `Opened ${title}` : `Closed ${title}`,
        loading: "Updating Unit of Assessment state...",
        error: "Something went wrong",
      },
    );
  }

  return <Switch checked={access} onCheckedChange={handleToggle} />;
}
