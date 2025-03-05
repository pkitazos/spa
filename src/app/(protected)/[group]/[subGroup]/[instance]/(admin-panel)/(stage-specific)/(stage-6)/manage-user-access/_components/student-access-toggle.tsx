"use client";
import { useState } from "react";
import { toast } from "sonner";

import { useInstanceParams } from "@/components/params-context";
import { Switch } from "@/components/ui/switch";

import { api } from "@/lib/trpc/client";

export function StudentAccessToggle({ student }: { student: boolean }) {
  const params = useInstanceParams();
  const [access, setAccess] = useState(student);

  const { mutateAsync: setAllocationAccess } =
    api.user.student.setAllocationAccess.useMutation();

  function handleToggle(access: boolean) {
    void toast.promise(
      setAllocationAccess({ params, access }).then(() => {
        setAccess(access);
      }),
      {
        success: "Successfully updated student access",
        loading: "Updating student access...",
        error: "Something went wrong",
      },
    );
  }

  return <Switch checked={access} onCheckedChange={handleToggle} />;
}
