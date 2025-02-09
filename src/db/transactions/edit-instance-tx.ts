import { expand } from "@/lib/utils/general/instance-params";
import { setDiff } from "@/lib/utils/general/set-difference";
import { UpdatedInstance } from "@/lib/validations/instance-form";
import { InstanceParams } from "@/lib/validations/params";

import { DB } from "@/db/types";

// Complex procedure for sure
// I think the source of the complexity comes down to
// not following SRP
// How many things does this function do?
// Arguably, there should be a separate Tx for "setInstanceFlags"
// And a corresopnding procedure maybe...
// For sure though, this function does many things
// and has many reasons to change
export async function editInstanceTx(
  db: DB,
  { flags, tags, ...updatedData }: UpdatedInstance,
  params: InstanceParams,
) {
  await db.$transaction(async (tx) => {
    await tx.allocationInstance.update({
      where: {
        instanceId: {
          allocationGroupId: params.group,
          allocationSubGroupId: params.subGroup,
          id: params.instance,
        },
      },
      data: updatedData,
    });

    const currentInstanceFlags = await tx.flag.findMany({
      where: expand(params),
    });

    const newInstanceFlags = setDiff(
      flags,
      currentInstanceFlags,
      (a) => a.title,
    );
    const staleInstanceFlags = setDiff(
      currentInstanceFlags,
      flags,
      (a) => a.title,
    );

    await tx.flag.deleteMany({
      where: {
        ...expand(params),
        title: { in: staleInstanceFlags.map((f) => f.title) },
      },
    });

    await tx.flag.createMany({
      data: newInstanceFlags.map((f) => ({
        ...expand(params),
        title: f.title,
        description: "",
      })),
    });

    const currentInstanceTags = await tx.tag.findMany({
      where: expand(params),
    });

    const newInstanceTags = setDiff(tags, currentInstanceTags, (a) => a.title);
    const staleInstanceTags = setDiff(
      currentInstanceTags,
      tags,
      (a) => a.title,
    );

    await tx.tag.deleteMany({
      where: {
        ...expand(params),
        title: { in: staleInstanceTags.map((t) => t.title) },
      },
    });

    await tx.tag.createMany({
      data: newInstanceTags.map((t) => ({ ...expand(params), title: t.title })),
    });
  });
}
