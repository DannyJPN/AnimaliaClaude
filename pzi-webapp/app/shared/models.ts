export type SelectItemType<TKey, TText> = {
  key: TKey,
  text: TText
};

export type ChangeActionResult<TItem, TFormData> = {
  action: 'insert' | 'edit' | 'delete',
  success: boolean,
  formValues: TFormData,
  changeResult: TItem | undefined,
  validationErrors: Record<string, string[]> | undefined,
  validationWarnings: Record<string, string[]> | undefined
}

export type EnumerationType = {
  code: string,
  displayName: string
};

export type TableSettings = {
  columnVisibility?: Record<string, boolean>,
  columnOrder?: string[],
  pageSize?: number
};
