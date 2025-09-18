import { useEffect, useState } from "react";
import { Link, useLocation, useOutletContext, useParams } from "react-router";
import { ItemListNavigation } from "~/components/common/item-list-navigation";
import { buttonVariants } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { SelectItemType } from "~/shared/models";
import { loader, SpeciesSearchResultItem } from "./species-search-list";
import { SpeciesHeaderForm, SpeciesParametersCard } from "./species/controls";

type ContextType = Awaited<ReturnType<typeof loader>>['data'];

const classificationTypeOptions: SelectItemType<string, string>[] = [
  { key: 'E', text: 'E' },
  { key: 'S', text: 'S' }
];

export default function Detail() {
  const params = useParams();
  const location = useLocation();

  const outletContext = useOutletContext<ContextType>();

  const actionParam = params.actionParam;
  const itemId = parseInt(actionParam!);

  const [formKey, setFormKey] = useState(Date.now().toString());
  const [selectedItem, setSelectedItem] = useState<SpeciesSearchResultItem | undefined>(undefined);

  useEffect(() => {
    setSelectedItem(outletContext.items.find((si) => si.id === itemId)!);
    setFormKey(Date.now().toString());
  }, [itemId, outletContext.items])

  if (!selectedItem) {
    return null;
  }

  return (
    <Card
      key={formKey}
      className="rounded-none border bg-card text-card-foreground shadow-none">
      <div className="flex flex-col h-full">

        <fieldset
          disabled={true}
          className="flex flex-wrap gap-2 p-2 bg-secondary">
          <SpeciesHeaderForm
            selectedItem={selectedItem}
            classificationTypeOptions={classificationTypeOptions}
          />
        </fieldset>

        <div className="flex">
          <div className="grow"></div>
          <div className="flex gap-1 p-2">
            <Link
              to={`/records/genera/${selectedItem?.taxonomyGenus?.id}/species/${selectedItem?.id}`}
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' })
              )}>
              Karta druhu
            </Link>
            <Link
              to={`/records/species/${selectedItem?.id}/specimens`}
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' })
              )}>
              Exempláře
            </Link>
          </div>
        </div>

        <fieldset
          className={cn(
            'grid grid-cols-4 gap-2 p-2',
          )}
          disabled={true}>

          <SpeciesParametersCard
            selectedItem={selectedItem}
            rdbCodes={outletContext.rdbCodes}
            citeCodes={outletContext.citeCodes}
            euCodes={outletContext.euCodes}
            protectionTypes={outletContext.protectionTypes}
            editDisabled={true} />
        </fieldset>

        <ItemListNavigation
          currentItem={selectedItem}
          items={outletContext.items}
          getItemLink={(itm) => {
            return `/records/species-search/${itm.id}${location.search}`
          }} />
      </div>
    </Card>
  );
}
