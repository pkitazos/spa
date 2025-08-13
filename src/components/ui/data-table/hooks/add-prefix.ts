export function addPrefix(param: string, prefix?: string) {
  return prefix ? `${prefix}-${param}` : param;
}
