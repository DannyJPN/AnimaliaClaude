import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useOutletContext, useParams } from "react-router";
import { ItemListNavigation } from "~/components/common/item-list-navigation";
import { Card } from "~/components/ui/card";
import { FieldError, Label } from "~/components/ui/field";
import { Input, TextArea, TextField } from "~/components/ui/textfield";
import { loader } from "./locations-search-list";
import type { ExpositionLocationSearchResultItem } from "./locations-search-list";
import { ComboboxItem, JollyComboBox } from "~/components/ui/combobox";
import { Checkbox } from "react-aria-components";
import { SelectItemType } from "~/shared/models";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

type ContextType = Awaited<ReturnType<typeof loader>>['data'];

const locationTypeOptions: SelectItemType<number, string>[] = [
  { key: 0, text: "0" },
  { key: 1, text: "1" },
  { key: 2, text: "2" },
];

export default function Detail() {
  const params = useParams();
  const location = useLocation();

  const outletContext = useOutletContext<ContextType>();

  const [formKey, setFormKey] = useState(Date.now().toString());
  const actionParam = params.actionParam;

  const [selectedItem, setSelectedItem] = useState<ExpositionLocationSearchResultItem | undefined>(undefined);

  const itemId = parseInt(actionParam!);

  useEffect(() => {
    setSelectedItem(outletContext.items.find((si) => si.id === itemId)!);
    setFormKey(Date.now().toString());
  }, [itemId, outletContext.items]);

  if (!selectedItem) {
    return null;
  }

  return (
    <Card
      key={`${formKey}`}
      className="rounded-none border bg-card text-card-foreground shadow-none"
    >
      <fieldset
        disabled
        className="flex flex-wrap gap-2 p-2 bg-secondary"
      >
        <JollyComboBox
          name="expositionSetId"
          label="Expoziční celek"
          defaultItems={[
            {
              key: selectedItem.expositionSet?.id,
              text: selectedItem.expositionSet?.name ?? 'Neznámý celek',
            },
          ]}
          defaultSelectedKey={selectedItem.expositionSet?.id}
          allowsEmptyCollection={false}
          isLoading={false}
          isDisabled
          className="grow"
        >
          {(item) => <ComboboxItem key={item.key}>{item.text}</ComboboxItem>}
        </JollyComboBox>

        <JollyComboBox
          name="organizationLevelId"
          label="Rajony"
          defaultItems={[
            {
              key: selectedItem.organizationLevel?.id,
              text: selectedItem.organizationLevel?.name ?? 'Neznámý rajon',
            },
          ]}
          defaultSelectedKey={selectedItem.organizationLevel?.id}
          allowsEmptyCollection={false}
          isLoading={false}
          isDisabled
          className="grow"
        >
          {(item) => (
            <ComboboxItem key={item.key}>
              {item.text}
            </ComboboxItem>
          )}
        </JollyComboBox>

      </fieldset>

      <div className="flex">
        <div className="grow"></div>
        <div className="flex gap-1 p-2">
          <Link
            to={`/records/exposition-hierarchy/sets/${selectedItem?.expositionSetId}/locations/${selectedItem?.id}`}
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' })
            )}>
            Karta Lokace
          </Link>
        </div>
      </div>

      <fieldset className="grid grid-cols-4 gap-2 p-2" disabled>
        <TextField
          name="name"
          defaultValue={selectedItem.name}
          className="col-span-2"
        >
          <Label>Název</Label>
          <Input type="text" readOnly />
          <FieldError />
        </TextField>

        <TextField
          name="objectNumber"
          defaultValue={selectedItem.objectNumber?.toString()}
          className="col-span-1"
        >
          <Label>Číslo objektu</Label>
          <Input type="number" readOnly />
          <FieldError />
        </TextField>

        <TextField
          name="roomNumber"
          defaultValue={selectedItem.roomNumber?.toString()}
          className="col-span-1"
        >
          <Label>Číslo místnosti</Label>
          <Input type="number" readOnly />
          <FieldError />
        </TextField>

        <div className="col-span-full" />

        <div className="col-span-1">
          <JollyComboBox
            name="locationTypeCode"
            label="Typ umístění"
            defaultItems={locationTypeOptions}
            defaultSelectedKey={selectedItem.locationTypeCode}
            allowsEmptyCollection={false}
            isLoading={false}
            isDisabled
          >
            {(item) => <ComboboxItem key={item.key}>{item.text}</ComboboxItem>}
          </JollyComboBox>
          <FieldError />
        </div>

        <TextField
          name="areaM2"
          defaultValue={selectedItem.areaM2?.toString()}
          className="col-span-1"
        >
          <Label>Plocha (m²)</Label>
          <Input type="number" readOnly />
          <FieldError />
        </TextField>

        <TextField
          name="capacityM3"
          defaultValue={selectedItem.capacityM3?.toString()}
          className="col-span-1"
        >
          <Label>Kapacita (m³)</Label>
          <Input type="number" readOnly />
          <FieldError />
        </TextField>

        <div>
          <Label>Dostupné pro návštěvníky</Label>
          <div className="h-8 flex items-center justify-center">
            <Checkbox
              aria-label="availableForVisitors"
              name="availableForVisitors"
              defaultSelected={selectedItem.availableForVisitors}
              isDisabled
            />
          </div>
        </div>

        <div className="col-span-full" />

        <TextField
          name="note"
          defaultValue={selectedItem.note}
          className="col-span-full"
        >
          <Label>Poznámka</Label>
          <TextArea readOnly />
          <FieldError />
        </TextField>

        <input type="hidden" name="id" defaultValue={selectedItem.id} />
      </fieldset>

      <ItemListNavigation
        currentItem={selectedItem}
        items={outletContext.items}
        getItemLink={(itm) => {
          return `/records/exposition-hierarchy/locations-search/${itm.id}${location.search}`
        }}
      />
    </Card>
  );
}
