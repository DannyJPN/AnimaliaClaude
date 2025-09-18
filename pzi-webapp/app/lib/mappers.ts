import { EnumerationType, SelectItemType } from "~/shared/models";

export function enumerationsToSelects(items?: EnumerationType[]) {
  return (items || []).map((item) => {
    return { key: item.code, text: item.displayName } as SelectItemType<string, string>;
  });
}
