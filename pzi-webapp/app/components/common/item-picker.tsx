import { DeleteIcon, SearchIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "~/lib/utils";
import { SelectItemType } from "~/shared/models";
import { Button } from "../ui/button";
import { ComboboxInput } from "../ui/combobox";
import { FieldGroup, Label } from "../ui/field";
import { ListBox, ListBoxItem } from "../ui/list-box";
import { Popover } from "../ui/popover";
import { SearchField, SearchFieldClear, SearchFieldInput } from "../ui/searchfield";

export type ItemPickerProps<TKey extends (number | string)> = {
  label: string,
  placeholder: string,
  name: string,
  selectedItem: SelectItemType<TKey, string> | undefined,
  selectedItemChanged: (item: SelectItemType<TKey, string> | undefined) => void,
  filteredItems: SelectItemType<TKey, string>[],
  onFilterChanged: (filter: string | undefined) => void,
  changesDisabled?: boolean,
  className?: string
};

export function ItemPicker<TKey extends (number | string)>(props: ItemPickerProps<TKey>) {
  const [pickerShown, setPickerShown] = useState(false);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!pickerShown) {
      props.onFilterChanged(undefined);
    }
  }, [pickerShown]);

  return (
    <>
      <div ref={triggerRef} className={props.className}>
        <Label>{props.label}</Label>

        <FieldGroup
          className="p-0"
          onClick={() => {
            if (props.changesDisabled) {
              return;
            }
            setPickerShown(true);
          }}
          onKeyDown={(evt) => {
            if (props.changesDisabled) {
              return;
            }

            if (evt.code === 'ArrowDown') {
              setPickerShown(true);
            }
          }}>
          <ComboboxInput placeholder={props.placeholder} readOnly value={props.selectedItem?.text || ''} />
          {!props.changesDisabled && (
            <Button
              variant="ghost"
              size="sm"
              onPressChange={() => props.selectedItemChanged(undefined)}>
              <DeleteIcon className="size-4 px-0" />
            </Button>
          )}
        </FieldGroup>
      </div>

      <input type="hidden" name={props.name} value={props.selectedItem?.key || ''} />

      {pickerShown && (
        <Popover
          aria-label="Vyber zaznamu"
          className={cn("p-2 bg-popover overflow-auto")}
          isOpen={true}
          containerPadding={50}
          triggerRef={triggerRef}
          onOpenChange={() => {
            setPickerShown(false);
          }}>

          <SearchField
            autoFocus
            aria-label="Filtr zaznamů"
            onChange={props.onFilterChanged}>
            <FieldGroup className="w-full">
              <SearchIcon aria-hidden className="size-4 text-muted-foreground" />
              <SearchFieldInput placeholder="" />
              <SearchFieldClear>
                <XIcon aria-hidden className="size-4" />
              </SearchFieldClear>
            </FieldGroup>
          </SearchField>

          {props.filteredItems?.length > 0 && (
            <ListBox
              aria-label="Seznam zaznamu"
              className={cn("mt-2")}>
              {props.filteredItems?.map((ol) => {
                return (
                  <ListBoxItem
                    key={ol.key}
                    onAction={() => {
                      setPickerShown(false);
                      props.selectedItemChanged(ol);
                    }}
                  >
                    {ol.text}
                  </ListBoxItem>
                );
              })}
            </ListBox>
          )}
        </Popover>
      )}
    </>
  );
}
