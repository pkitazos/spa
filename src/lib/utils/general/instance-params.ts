import { InstanceParams, PageParams } from "@/lib/validations/params";

// TODO Both of these should probably be on the instance DO

export function expand(params: InstanceParams, instanceId?: string) {
  return {
    allocationGroupId: params.group,
    allocationSubGroupId: params.subGroup,
    allocationInstanceId: instanceId ?? params.instance,
  };
}

export function toInstanceId(params: InstanceParams, instanceId?: string) {
  return {
    allocationGroupId: params.group,
    allocationSubGroupId: params.subGroup,
    id: instanceId ?? params.instance,
  };
}

export function toProjectParams(params: InstanceParams, projectId: string) {
  return { ...params, projectId };
}

export function toPP(params: PageParams) {
  return {
    group: params.group,
    subGroup: params.subGroup,
    instance: params.instance,
    projectId: params.id,
  };
}
