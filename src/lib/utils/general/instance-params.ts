import { InstanceParams } from "@/lib/validations/params";

// Both of these should probably be on the instance DO

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
