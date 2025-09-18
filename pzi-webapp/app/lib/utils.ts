import { clsx, type ClassValue } from "clsx"
import { MRT_ColumnDef, MRT_RowData } from "material-react-table";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeNumberValue(v: number | undefined | null) {
  return v === null
    ? undefined
    : v;
}

export function parseOptionalNumber(formData: FormData, formKey: string) {
  return formData.get(formKey)
    ? Number(formData.get(formKey))
    : undefined;
}

export function parseCheckboxBoolean(formData: FormData, formKey: string) {
  return formData.get(formKey) === 'on' ? true : false;
}

export function getFullDefaultVisibility<TItem extends MRT_RowData>(allColumns: MRT_ColumnDef<TItem>[], visibleColumns: string[]) {
  return allColumns.reduce((acc, curr) => {
    acc[curr.accessorKey!] = visibleColumns.includes(curr.accessorKey!);

    return acc;
  }, {} as Record<string, boolean>);
}
