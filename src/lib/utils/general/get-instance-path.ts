import { type InstanceParams } from "@/lib/validations/params";

// TODO Should live on DTO
export function formatParamsAsPath(instanceParams: InstanceParams) {
  const { group, subGroup, instance } = instanceParams;
  return `/${group}/${subGroup}/${instance}`;
}
