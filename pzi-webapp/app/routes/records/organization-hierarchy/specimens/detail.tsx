import { useEffect, useState } from "react";
import { Link, useLocation, useOutletContext, useParams } from "react-router";
import { Card } from "~/components/ui/card";
import { TextField, Input } from "~/components/ui/textfield";
import { Label } from "~/components/ui/field";
import { cn } from "~/lib/utils";
import { TaxonomySpecimenItemWithFlatRelatedData } from "../../taxonomy-hierarchy/specimens/models";
import { SpecimenHeaderDetail } from "../../taxonomy-hierarchy/specimens/controls";
import { ItemListNavigation } from "~/components/common/item-list-navigation";
import { loader } from "./list";

type ContextType = Awaited<ReturnType<typeof loader>>['data'];

export default function Detail() {
  const params = useParams();
  const location = useLocation();
  const outletContext = useOutletContext<ContextType>();

  const itemId = Number(params.actionParam);

  const [selectedItem, setSelectedItem] = useState<TaxonomySpecimenItemWithFlatRelatedData | undefined>(undefined);

  useEffect(() => {
    if (outletContext.items?.length) {
      const found = outletContext.items.find((si) => si.id === itemId);
      setSelectedItem(found);
    }
  }, [itemId, outletContext.items]);

  if (!selectedItem) return null;

  return (
    <Card className="rounded-none border bg-card text-card-foreground shadow-none">
      <div className="flex flex-col h-full">
        <fieldset disabled className="flex flex-wrap gap-2 p-2 bg-secondary">
          <SpecimenHeaderDetail
            key={selectedItem.id ?? 'empty'}
            specimen={selectedItem} />
        </fieldset>

        <div className="flex">
          <div className="grow" />
          <div className="flex gap-1 p-2">
            <Link
              to={`/records/species/${selectedItem.speciesId}/specimens/${selectedItem.id}`}
              className={cn(
                "inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
            >
              Karta exempláře
            </Link>
          </div>
        </div>

        <fieldset className="grid grid-cols-4 gap-2 p-2" disabled>
          <TextField className="col-span-2">
            <Label>Jméno (plem. kn.)</Label>
            <Input type="text" value={selectedItem.studBookName || ""} readOnly />
          </TextField>

          <TextField className="col-span-2">
            <Label>Čís. (plem. kn.)</Label>
            <Input type="text" value={selectedItem.studBookNumber || ""} readOnly />
          </TextField>

          <TextField className="col-span-4">
            <Label>Registrace</Label>
            <Input type="text" value={selectedItem.registrationNumber || ""} readOnly />
          </TextField>

          <TextField>
            <Label>Reg. kdy</Label>
            <Input type="text" value={selectedItem.registeredDate || ""} readOnly />
          </TextField>

          <span></span>

          <TextField className="col-span-2">
            <Label>Reg. komu</Label>
            <Input type="text" value={selectedItem.registeredTo || ""} readOnly />
          </TextField>

          <span className="col-span-2 text-sm font-medium leading-none opacity-70">
            Doklady?
          </span>

          <TextField className="col-span-2">
            <Label>ČR evidence</Label>
            <Input type="text" value={selectedItem.czechregistrationNumber || ""} readOnly />
          </TextField>

          <TextField className="col-span-2">
            <Label>UELN</Label>
            <Input type="text" value={selectedItem.ueln || ""} readOnly />
          </TextField>

          <TextField className="col-span-2">
            <Label>EU permit</Label>
            <Input type="text" value={selectedItem.euPermit || ""} readOnly />
          </TextField>

          <span className="col-span-4 text-sm font-medium leading-none opacity-70">
            Platné značení
          </span>

          <TextField>
            <Label>Vrub</Label>
            <Input type="text" value={selectedItem.notch || ""} readOnly />
          </TextField>

          <TextField>
            <Label>Chip</Label>
            <Input type="text" value={selectedItem.chip || ""} readOnly />
          </TextField>

          <TextField>
            <Label>Kroužky</Label>
            <Input type="text" value={selectedItem.ringNumber || ""} readOnly />
          </TextField>

          <TextField>
            <Label>Jiné značení</Label>
            <Input type="text" value={selectedItem.otherMarking || ""} readOnly />
          </TextField>
        </fieldset>

        <ItemListNavigation
          currentItem={selectedItem}
          items={outletContext.items}
          getItemLink={(itm) => {
            return `/records/org-hierarchy/locations/${outletContext.locationId}/species/${outletContext.speciesId}/specimens/${itm.id}${location.search}`;
          }}
        />
      </div>
    </Card>
  );
}
