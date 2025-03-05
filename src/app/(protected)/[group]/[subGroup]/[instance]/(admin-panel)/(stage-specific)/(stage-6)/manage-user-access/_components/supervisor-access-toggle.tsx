"use client";
import { useState } from "react";
import { toast } from "sonner";

import { useInstanceParams } from "@/components/params-context";
import { Switch } from "@/components/ui/switch";

import { api } from "@/lib/trpc/client";

export function SupervisorAccessToggle({
  supervisor,
}: {
  supervisor: boolean;
}) {
  const params = useInstanceParams();
  const [access, setAccess] = useState(supervisor);

  const { mutateAsync: setAllocationAccess } =
    api.user.supervisor.setAllocationAccess.useMutation();

  function handleToggle(access: boolean) {
    void toast.promise(
      setAllocationAccess({ params, access }).then(() => {
        setAccess(access);
      }),
      {
        success: "Successfully updated supervisor access",
        loading: "Updating supervisor access...",
        error: "Something went wrong",
      },
    );
  }

  return <Switch checked={access} onCheckedChange={handleToggle} />;
}
