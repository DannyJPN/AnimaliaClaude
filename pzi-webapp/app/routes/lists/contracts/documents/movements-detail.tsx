import { Card } from "~/components/ui/card";
import { useLocation, useOutletContext, useParams, useFetcher, } from "react-router";
import { useEffect, useState } from "react";
import { DocumentMovement } from "../models";
import { loader } from "./movements-list";
import { Input, TextArea, TextField } from "~/components/ui/textfield";
import { Label } from "~/components/ui/field";
import { ItemListNavigation } from "~/components/common/item-list-navigation";
import { FormValidationContext } from "react-aria-components";
import { ContractsNavigation } from "../navigation";

type ContextType = Awaited<ReturnType<typeof loader>>['data'];

export default function MovementDetail() {
  const params = useParams();
  const location = useLocation();
  const outletContext = useOutletContext<ContextType>();

  const [formKey, setFormKey] = useState(Date.now().toString());

  const actionParam = params.actionParam;
  const itemId = actionParam ? Number(actionParam) : Number.MIN_SAFE_INTEGER;
  
  const [selectedItem, setSelectedItem] = useState<DocumentMovement | undefined>(undefined);

  useEffect(() => {
    if (itemId !== Number.MIN_SAFE_INTEGER && outletContext.items?.length) {
      const foundItem = outletContext.items.find((si: DocumentMovement) => si.id === itemId);
      setSelectedItem(foundItem);
    }
    
    setFormKey(Date.now().toString());
  }, [itemId, outletContext.items, outletContext.contractId]);
  
  if (!selectedItem) {
    return null;
  }

  return (
    <Card 
      key={formKey}
      className="rounded-none border bg-card text-card-foreground shadow-none"
    >
      <div className="flex flex-col h-full">
        <FormValidationContext.Provider key={formKey} value={{}}>

          <fieldset
            disabled
            className="flex flex-wrap gap-2 p-2 bg-secondary min-h-[72px]"
          >
            {/* Empty fieldset to match the height of the MRT toolbar */}
          </fieldset>

          <div className="flex">
            <ContractsNavigation
              contractId={Number(outletContext.contractId)}
              activePage="movements"
            />
          </div>

          <fieldset className="grid grid-cols-4 gap-2 p-2" disabled>
            <TextField className="col-span-2">
              <Label>Datum pohybu</Label>
              <Input type="text" value={selectedItem?.date || ""} readOnly />
            </TextField>

            <TextField className="col-span-2">
              <Label>Účetní datum</Label>
              <Input type="text" value={selectedItem?.accountingDate || ""} readOnly />
            </TextField>

            <TextField className="col-span-2">
              <Label>Počet v Zoo</Label>
              <Input type="text" value={selectedItem?.quantity || ""} readOnly />
            </TextField>

            <TextField className="col-span-2">
              <Label>Počet v pohybu</Label>
              <Input type="text" value={selectedItem?.quantityActual || ""} readOnly />
            </TextField>

            <TextField className="col-span-2">
              <Label>Přírůstek</Label>
              <Input type="text" value={selectedItem?.incrementReasonName || ""} readOnly />
            </TextField>

            <TextField className="col-span-2">
              <Label>Úbytek</Label>
              <Input type="text" value={selectedItem?.decrementReasonName || ""} readOnly />
            </TextField>

            <TextField className="col-span-2">
              <Label>Místo</Label>
              <Input type="text" value={selectedItem?.locationName || ""} readOnly />
            </TextField>

            <TextField className="col-span-2">
              <Label>Pohlaví skupiny M,F[,U]</Label>
              <Input type="text" value={selectedItem?.gender || ""} readOnly />
            </TextField>

            <TextField className="col-span-2">
              <Label>Cena [Kč]</Label>
              <Input type="text" value={selectedItem?.price || ""} readOnly />
            </TextField>

            <TextField className="col-span-2">
              <Label>Obchodní cena [Kč]</Label>
              <Input type="text" value={selectedItem?.priceFinal || ""} readOnly />
            </TextField>

            <TextField className="col-span-4">
              <Label>Poznámka</Label>
              <TextArea value={selectedItem?.note || ""} readOnly />
            </TextField>

            <TextField className="col-span-2">
              <Label>Smlouva</Label>
              <Input type="text" value={selectedItem?.name || ""} readOnly />
            </TextField>

            <TextField className="col-span-2">
              <Label>Poznámka ke smlouvě</Label>
              <TextArea value={selectedItem?.contractNote || ""} readOnly />
            </TextField>
          </fieldset>

          <ItemListNavigation
            currentItem={selectedItem}
            items={outletContext.items}
            getItemLink={(itm) => {
              return `/lists/contracts/${outletContext.contractId}/movements/${itm.id}${location.search}`;
            }}
          />
        </FormValidationContext.Provider>
      </div>
    </Card>
  );
}
