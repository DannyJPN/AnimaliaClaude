import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useOutletContext, useParams } from "react-router";
import { ItemListNavigation } from "~/components/common/item-list-navigation";
import { buttonVariants } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { FieldError, Label } from "~/components/ui/field";
import { Input, TextField } from "~/components/ui/textfield";
import { cn } from "~/lib/utils";
import { loader } from "./districts-search-list";
import { OrganizationLevelItem } from "./models";

type ContextType = Awaited<ReturnType<typeof loader>>['data'];

export default function Detail() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const outletContext = useOutletContext<ContextType>();

  const [formKey, setFormKey] = useState(Date.now().toString());
  const actionParam = params.actionParam;

  const [selectedItem, setSelectedItem] = useState<OrganizationLevelItem | undefined>(undefined);

  const itemId = parseInt(actionParam!);

  const editDisabled = true;

  useEffect(() => {
    setSelectedItem(outletContext.items.find((si) => si.id === itemId)!);
    setFormKey(Date.now().toString());
  }, [itemId, outletContext.items]);

  if (!selectedItem) {
    return null;
  }

  return (
    <Card
      key={formKey}
      className="rounded-none border bg-card text-card-foreground shadow-none">
      <div className="flex flex-col h-full">

        <fieldset
          disabled={editDisabled}
          className="flex flex-wrap gap-2 p-2 bg-secondary">

          <TextField name="name"
            defaultValue={selectedItem.name}
            className="grow">
            <Label>Název</Label>
            <Input type="text" />
            <FieldError />
          </TextField>

        </fieldset>

        <div className="flex">
          <div className="grow"></div>
          <div className="flex gap-1 p-2">
            <Link
              to={`/records/org-hierarchy/workplaces/${selectedItem?.parentId}/districts/${selectedItem?.id}`}
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' })
              )}>
              Karta Rajonu
            </Link>
          </div>
        </div>

        <fieldset
          className="grid grid-cols-4 gap-2 p-2"
          disabled={editDisabled}>

          <TextField
            name="director"
            defaultValue={selectedItem?.director}
            className="col-span-2">
            <Label>Ředitel</Label>
            <Input type="text" />
            <FieldError />
          </TextField>

          <TextField
            name="journalApproversGroup"
            defaultValue={selectedItem?.journalApproversGroup}
            className="col-span-4">
            <Label>Kurátor AD</Label>
            <Input type="text" />
            <FieldError />
          </TextField>

          <TextField
            name="journalReadGroup"
            defaultValue={selectedItem?.journalReadGroup}
            className="col-span-4">
            <Label>View AD</Label>
            <Input type="text" />
            <FieldError />
          </TextField>

          <TextField
            name="journalContributorGroup"
            defaultValue={selectedItem?.journalContributorGroup}
            className="col-span-4">
            <Label>Editor AD</Label>
            <Input type="text" />
            <FieldError />
          </TextField>

        </fieldset>

        <ItemListNavigation
          currentItem={selectedItem}
          items={outletContext.items}
          getItemLink={(itm) => {
            return `/records/org-hierarchy/districts-search/${itm.id}${location.search}`
          }} />
      </div>
    </Card >
  );
}
