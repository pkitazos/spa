import {
  type AlgorithmInstanceParams,
  type InstanceParams,
  type PageParams,
  type ProjectParams,
} from "@/lib/validations/params";

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

export function toAlgID(params: AlgorithmInstanceParams) {
  return { algorithmId: params.algConfigId, ...expand(params) };
}

// TODO figure this out later

export function toPP1(params: PageParams) {
  return {
    group: params.group,
    subGroup: params.subGroup,
    instance: params.instance,
    projectId: params.id,
  };
}

export function toPP2(params: ProjectParams) {
  return { ...expand(params), id: params.projectId };
}

export function toPP3(params: InstanceParams, projectId: string) {
  return { ...params, projectId };
}
