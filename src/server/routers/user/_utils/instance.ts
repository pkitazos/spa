import {
  GroupParams,
  InstanceParams,
  SubGroupParams,
} from "@/lib/validations/params";
import { InstanceDisplayData } from "@/lib/validations/spaces";

import { PrismaTransactionClient } from "@/db";

export async function getInstancesForGroups(
  db: PrismaTransactionClient,
  groups: GroupParams[],
) {
  const groupInstances: InstanceParams[] = [];
  for (const g of groups) {
    const instances = await db.allocationInstance.findMany({
      where: {
        allocationGroupId: g.group,
      },
      select: { id: true, allocationSubGroupId: true, displayName: true },
    });

    groupInstances.push(
      ...instances.map((instance) => ({
        group: g.group,
        subGroup: instance.allocationSubGroupId,
        instance: instance.id,
      })),
    );
  }
  return groupInstances;
}

export async function getInstancesForSubGroups(
  db: PrismaTransactionClient,
  subGroups: SubGroupParams[],
) {
  const subGroupInstances: InstanceParams[] = [];
  for (const s of subGroups) {
    const instances = await db.allocationInstance.findMany({
      where: {
        allocationGroupId: s.group,
        allocationSubGroupId: s.subGroup,
      },
      select: { id: true },
    });

    subGroupInstances.push(
      ...instances.map(({ id }) => ({
        group: s.group,
        subGroup: s.subGroup,
        instance: id,
      })),
    );
  }
  return subGroupInstances;
}

export async function getDisplayNameMap(db: PrismaTransactionClient) {
  const displayNameData = await db.allocationInstance.findMany({
    select: {
      id: true,
      displayName: true,
      allocationSubGroup: {
        select: {
          id: true,
          displayName: true,
          allocationGroup: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
      },
    },
  });

  const displayNameMap = displayNameData.reduce(
    (acc, instance) => {
      const instanceHash =
        instance.id +
        instance.allocationSubGroup.id +
        instance.allocationSubGroup.allocationGroup.id;

      return {
        ...acc,
        [instanceHash]: {
          group: {
            id: instance.allocationSubGroup.allocationGroup.id,
            displayName:
              instance.allocationSubGroup.allocationGroup.displayName,
          },
          subGroup: {
            id: instance.allocationSubGroup.id,
            displayName: instance.allocationSubGroup.displayName,
          },
          instance: {
            id: instance.id,
            displayName: instance.displayName,
          },
        },
      };
    },
    {} as Record<string, InstanceDisplayData>,
  );

  return (params: InstanceParams) => {
    const instanceHash = params.instance + params.subGroup + params.group;
    return displayNameMap[instanceHash];
  };
}
