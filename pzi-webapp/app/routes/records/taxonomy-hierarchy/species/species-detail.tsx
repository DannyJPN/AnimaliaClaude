import { HeartIcon, LockIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FormValidationContext } from "react-aria-components";
import { ActionFunctionArgs, useFetcher, useLocation, useNavigate, useOutletContext, useParams, useSearchParams } from "react-router";
import { pziConfig } from "~/.server/pzi-config";
import { handleCUD } from "~/.server/records/crud-action-handler";
import { ItemListNavigation } from "~/components/common/item-list-navigation";
import { useTabSwitching } from "~/components/hooks/detail-hooks";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { cn, parseCheckboxBoolean } from "~/lib/utils";
import { SelectItemType } from "~/shared/models";
import { SpeciesActionsMenu, SpeciesHeaderForm, SpeciesNavigation, SpeciesParametersCard } from "./controls";
import { CreateMassSpecimenRecords } from "./controls/create-mass-specimen-records";
import { TaxonomySpeciesItem } from "./models";
import { loader } from './species-list';
import { SpeciesHistoryInPeriodDialog } from "./controls/species-history-dialog";
import { SpeciesCadaversInPeriodDialog } from "./controls/statistics-cadavers-table-dialog";

export async function action({ request }: ActionFunctionArgs) {
  return await handleCUD<TaxonomySpeciesItem>(
    request,
    (formData) => {
      const formDataEntries = Object.fromEntries(formData);

      const postData: Partial<TaxonomySpeciesItem> = {
        ...formDataEntries,
        id: Number(formData.get('id')),
        taxonomyGenusId: Number(formData.get('taxonomyGenusId')),
        regionId: formData.get("regionId")
          ? Number(formData.get("regionId"))
          : undefined,
        isIsb: parseCheckboxBoolean(formData, "isIsb"),
        isEep: parseCheckboxBoolean(formData, "isEep"),
        isEsb: parseCheckboxBoolean(formData, "isEsb"),
        isGenePool: parseCheckboxBoolean(formData, "isGenePool"),
        isEuFauna: parseCheckboxBoolean(formData, "isEuFauna"),
        isRegulationRequirement: parseCheckboxBoolean(formData, 'isRegulationRequirement'),
        isProtected: parseCheckboxBoolean(formData, 'isProtected'),
        isEndemic: parseCheckboxBoolean(formData, 'isEndemic'),
        isPest: parseCheckboxBoolean(formData, 'isPest')
      } as Partial<TaxonomySpeciesItem>;
      return postData;
    },
    'api/species',
    pziConfig
  );
}

type ContextType = Awaited<ReturnType<typeof loader>>['data'];

export default function SpeciesDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const outletContext = useOutletContext<ContextType>();

  const [formKey, setFormKey] = useState(Date.now().toString());
  const fetcher = useFetcher<typeof action>({ key: formKey });

  const actionParam = params.actionParam;

  const mode = actionParam === 'new'
    ? 'insert'
    : 'edit';

  const speciesId = mode === 'edit'
    ? parseInt(actionParam!)
    : Number.MIN_SAFE_INTEGER;

  const [massRecordsShown, setMasRecordsShown] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [cadaverDialogOpen, setCadaverDialogOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState<TaxonomySpeciesItem | undefined>(undefined);
  const [changingValues, setChangingValues] = useState(mode === 'insert');

  const setFocusRef = useCallback((node: HTMLInputElement | null) => {
    if (node && changingValues && mode === 'edit') {
      setTimeout(() => {
        node.focus();
      }, 0);
    }
  }, [changingValues, mode]);

  const editDisabled = !changingValues || fetcher.state !== 'idle';

  useEffect(() => {
    const actionSuccess = fetcher.state === 'idle' && fetcher.data?.success;
    if (!actionSuccess) {
      return;
    }

    setFormKey(Date.now().toString());

    switch (fetcher.data?.action) {
      case 'delete': {
        navigate(`/records/genera/${outletContext.genusId}/species${location.search}`);
        break;
      }
      case 'insert': {
        navigate(`/records/genera/${outletContext.genusId}/species/${fetcher.data.changeResult?.id}${location.search}`);
        break;
      }
    }
  }, [fetcher.state, fetcher.data]);

  const { selectedTab, setSelectedTab } = useTabSwitching({
    searchParams,
    setSearchParams,
    defaultTab: "parameters"
  });

  useEffect(() => {
    if (speciesId !== Number.MIN_SAFE_INTEGER) {
      setChangingValues(false);
      setSelectedItem(outletContext.items.find((si) => si.id === speciesId)!);
    } else {
      setChangingValues(true);
      setSelectedItem({
        id: Number.MIN_SAFE_INTEGER,
        taxonomyGenusId: outletContext.genusId,
        classificationTypeCode: [4].includes(outletContext.familyInfo?.taxonomyOrder?.taxonomyClass?.id!)
          ? 'S'
          : 'E'
      } as TaxonomySpeciesItem);
    }

    setFormKey(Date.now().toString());
  }, [speciesId, outletContext.items]);

  const classificationTypeOptions: SelectItemType<string, string>[] = [
    { key: 'E', text: 'E' },
    { key: 'S', text: 'S' }
  ];

  // This formType needs to be 'insert', 'edit', or 'new' for the header component to work correctly
  const formType = mode === 'insert'
    ? 'insert'
    : 'edit';

  if (!selectedItem) {
    return (null);
  }

  return (
    <Card
      key={`${formKey}-${changingValues}`}
      className="rounded-none border bg-card text-card-foreground shadow-none">
      <fetcher.Form method="POST" className="flex flex-col h-full">
        <FormValidationContext.Provider value={fetcher.data?.validationErrors || {}}>

          <fieldset
            disabled={editDisabled}
            className="flex flex-wrap gap-2 p-2 bg-secondary">
            <SpeciesHeaderForm
              selectedItem={selectedItem}
              classificationTypeOptions={classificationTypeOptions}
              inputRef={setFocusRef}
            />
          </fieldset>

          <div className="flex">
            <SpeciesNavigation
              genusId={selectedItem.taxonomyGenusId}
              speciesId={selectedItem.id}
              activePage="home"
              navigationsDisabled={formType === 'insert'}
            />

            <div className="flex gap-1 p-2">
              <SpeciesActionsMenu
                itemId={selectedItem!.id}
                isMenuDisabled={formType !== 'edit'}
                isZooStatusExportDisabled={selectedItem.zooStatus !== "Z" && selectedItem.zooStatus !== "D"}
                onShowHistory={() => setHistoryDialogOpen(true)}
                onShowCadaverDialog={() => setCadaverDialogOpen(true)}
                onMassRecord={() => setMasRecordsShown(true)}
              />

              <Button
                variant="outline"
                size="sm"
                onPressChange={() => { }}>
                <HeartIcon className="size-3" />
              </Button>

              <Button variant='outline'
                size="sm"
                isDisabled={changingValues || !outletContext.hasEditPermission}
                onPressChange={() => {
                  setChangingValues(true);
                }}>
                <LockIcon className="size-3" />
              </Button>
            </div>
          </div>

          <div className="flex">
            <div className="flex flex-wrap gap-1 items-center p-2 grow">
              <Button
                variant={selectedTab === "parameters" ? "default" : "outline"}
                size="sm"
                onPressChange={() => {
                  setSelectedTab("parameters");
                }}>
                Parametry
              </Button>
            </div>
          </div>

          <fieldset
            className={cn(
              'grid grid-cols-4 gap-2 p-2',
              selectedTab !== 'parameters' ? 'hidden' : ''
            )}
            disabled={editDisabled}>

            <SpeciesParametersCard
              selectedItem={selectedItem}
              rdbCodes={outletContext.rdbCodes}
              citeCodes={outletContext.citeCodes}
              euCodes={outletContext.euCodes}
              protectionTypes={outletContext.protectionTypes}
              editDisabled={editDisabled} />

          </fieldset>

          {changingValues && (
            <div className="p-2 flex gap-2">
              <Button
                variant='default'
                type="submit"
                name="formAction"
                value={mode}
                size='sm'
                isDisabled={fetcher.state !== 'idle'}>
                Uložit
              </Button>

              {mode === 'edit' && (
                <>
                  <Button
                    variant='destructive'
                    isDisabled={fetcher.state !== 'idle'}
                    size='sm'
                    type="submit"
                    name="formAction"
                    value="delete">
                    Smazat
                  </Button>

                  <Button variant='secondary'
                    size='sm'
                    isDisabled={fetcher.state !== 'idle'}
                    onPressChange={() => {
                      setChangingValues(false);
                    }}>
                    Zrušit
                  </Button>
                </>
              )}
            </div>
          )}

          <ItemListNavigation
            currentItem={selectedItem}
            items={outletContext.items}
            getItemLink={(itm) => {
              return `/records/genera/${outletContext.genusId}/species/${itm.id}${location.search}`
            }} />
        </FormValidationContext.Provider>
      </fetcher.Form>

      {massRecordsShown && (
        <CreateMassSpecimenRecords
          currentParentId={speciesId}
          onClose={() => {
            setMasRecordsShown(false);
          }} />
      )}

      {historyDialogOpen && (
        <SpeciesHistoryInPeriodDialog
          speciesId={selectedItem.id}
          isOpen={historyDialogOpen}
          onClose={() => setHistoryDialogOpen(false)}
        />
      )}

      {cadaverDialogOpen && (
        <SpeciesCadaversInPeriodDialog
          speciesId={selectedItem.id}
          isOpen={cadaverDialogOpen}
          onClose={() => setCadaverDialogOpen(false)}
        />
      )}
    </Card>
  );
}
