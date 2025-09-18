import { useEffect, useState } from "react";
import { Link, useLocation, useOutletContext, useParams } from "react-router";
import { Card } from "~/components/ui/card";
import { FormValidationContext } from "react-aria-components";
import { ItemListNavigation } from "~/components/common/item-list-navigation";
import { loader, OrgSpeciesResultItem } from "./list";
import { SpeciesHeaderForm, SpeciesParametersCard } from "../../taxonomy-hierarchy/species/controls";
import { SelectItemType } from "~/shared/models";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

type ContextType = Awaited<ReturnType<typeof loader>>['data'];

export default function Detail() {
  const params = useParams();
  const location = useLocation();
  const outletContext = useOutletContext<ContextType>();

  const itemId = Number(params.actionParam);

  const [selectedItem, setSelectedItem] = useState<OrgSpeciesResultItem | undefined>(undefined);

  useEffect(() => {
    if (outletContext.items?.length) {
      const found = outletContext.items.find((si) => si.id === itemId);
      setSelectedItem(found);
    }
  }, [itemId, outletContext.items]);

  if (!selectedItem) return null;

  const classificationTypeOptions: SelectItemType<string, string>[] = [
    { key: "E", text: "E" },
    { key: "S", text: "S" },
  ];

  return (
    <Card className="rounded-none border bg-card text-card-foreground shadow-none">
      <div className="flex flex-col h-full">
        <FormValidationContext.Provider value={{}}>
          <fieldset disabled className="flex flex-wrap gap-2 p-2 bg-secondary">
            <SpeciesHeaderForm
              key={selectedItem.id ?? 'empty'}
              selectedItem={selectedItem}
              classificationTypeOptions={classificationTypeOptions}
              editDisabled
            />
          </fieldset>

          <div className="flex">
            <div className="grow" />
            <div className="flex gap-1 p-2">
              <Link
                to={`/records/genera/${selectedItem.taxonomyGenusId}/species/${selectedItem.id}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Karta druhu
              </Link>
            </div>
          </div>

          <fieldset className="grid grid-cols-4 gap-2 p-2" disabled>
            <SpeciesParametersCard
              key={selectedItem.id ?? 'empty'}
              selectedItem={selectedItem}
              rdbCodes={outletContext.rdbCodes}
              citeCodes={outletContext.citeCodes}
              euCodes={outletContext.euCodes}
              protectionTypes={outletContext.protectionTypes}
              editDisabled
            />
          </fieldset>

          <ItemListNavigation
            currentItem={selectedItem}
            items={outletContext.items}
            getItemLink={(itm) => {
              return `/records/exposition-hierarchy/locations/${outletContext.locationId}/species/${itm.id}${location.search}`;
            }}
          />
        </FormValidationContext.Provider>
      </div>
    </Card>
  );
}
