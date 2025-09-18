import { HeartIcon, LockIcon, SettingsIcon, FileDownIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FormValidationContext } from "react-aria-components";
import { ActionFunctionArgs, useFetcher, useLocation, useNavigate, useOutletContext, useParams, useSearchParams } from "react-router";
import { pziConfig } from "~/.server/pzi-config";
import { handleCUD } from "~/.server/records/crud-action-handler";
import { ItemListNavigation } from "~/components/common/item-list-navigation";
import { useTabSwitching } from "~/components/hooks/detail-hooks";
import { useAutocomplete } from "~/components/hooks/use-autocomplete";
import { useFileDownload } from "~/components/hooks/use-file-download";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { ComboboxItem, JollyComboBox } from "~/components/ui/combobox";
import { FieldError, Label } from "~/components/ui/field";
import { Menu, MenuHeader, MenuItem, MenuPopover, MenuSection, MenuTrigger } from "~/components/ui/menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { JollySelect, SelectItem } from "~/components/ui/select";
import { Input, TextArea, TextField } from "~/components/ui/textfield";
import { cn, parseCheckboxBoolean, parseOptionalNumber } from "~/lib/utils";
import { SpecimenNavigation } from "./controls";
import { TaxonomySpecimenItem, TaxonomySpecimenItemWithFlatRelatedData } from "./models";
import { action as copyAction } from './operations/copy-specimen';
import { loader } from './specimen-list';
import { SpeciesCadaversInPeriodDialog } from "../species/controls/statistics-cadavers-table-dialog";

export async function action({ request }: ActionFunctionArgs) {
  return await handleCUD<TaxonomySpecimenItem>(
    request,
    (formData) => {
      const formDataEntries = Object.fromEntries(formData);

      const postData: Partial<TaxonomySpecimenItem> = {
        ...formDataEntries,
        speciesId: parseOptionalNumber(formData, 'speciesId'),
        accessionNumber: parseOptionalNumber(formData, 'accessionNumber'),
        isHybrid: parseCheckboxBoolean(formData, 'isHybrid'),
        fatherId: parseOptionalNumber(formData, 'fatherId'),
        motherId: parseOptionalNumber(formData, 'motherId'),
      } as Partial<TaxonomySpecimenItem>;
      return postData;
    },
    'api/specimens',
    pziConfig
  );
}

type ContextType = Awaited<ReturnType<typeof loader>>['data'];

export default function SpecimenDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const outletContext = useOutletContext<ContextType>();

  // NOTE: This page is reused during multiple page loads, so we need to make sure unique fetcher / forms are used
  const [formKey, setFormKey] = useState(Date.now().toString());
  const fetcher = useFetcher<typeof action>({ key: formKey });
  const copyFetcher = useFetcher<typeof copyAction>({ key: formKey + "_cf" });

  const actionParam = params.actionParam;

  const mode = actionParam === 'new'
    ? 'insert'
    : 'edit';

  const specimenId = mode === 'edit'
    ? parseInt(actionParam!)
    : Number.MIN_SAFE_INTEGER;

  const [selectedItem, setSelectedItem] = useState<TaxonomySpecimenItemWithFlatRelatedData | undefined>(undefined);

  const [changingValues, setChangingValues] = useState(false);
  const [forceEditFromSession, setForceEditFromSession] = useState(false);
  const [cadaverDialogOpen, setCadaverDialogOpen] = useState(false);

  const setFocusRef = useCallback((node: HTMLInputElement | null) => {
    if (node && changingValues && mode === 'edit') {
      setTimeout(() => {
        node.focus();
      }, 0);
    }
  }, [changingValues, mode]);

  const editDisabled = !changingValues || fetcher.state !== 'idle';

  const handleCopySpecimen = (itemId: number) => {
    const copyFormData = new FormData();
    copyFormData.append('specimenId', itemId.toString());

    copyFetcher.submit(copyFormData, {
      action: '/records/specimens/operations/copy-specimen',
      method: 'POST'
    });
  };

  const handlePartialCopySpecimen = (itemId: number) => {
    const copyFormData = new FormData();
    copyFormData.append('specimenId', itemId.toString());

    copyFetcher.submit(copyFormData, {
      action: '/records/specimens/operations/partial-copy-specimen',
      method: 'POST'
    });
  };

  useEffect(() => {
    const actionSuccess = copyFetcher.state === 'idle' && copyFetcher.data?.success;
    if (!actionSuccess) {
      return;
    }

    const newId = copyFetcher.data?.changeResult?.id;

    if (newId) {
      sessionStorage.setItem('specimen-force-edit', '1');
      navigate(`/records/species/${outletContext.speciesId}/specimens/${newId}${location.search}`);
    }
  }, [copyFetcher.state, copyFetcher.data]);

  useEffect(() => {
    const isForceEdit = sessionStorage.getItem('specimen-force-edit') === '1';
    if (isForceEdit) {
      setForceEditFromSession(true);
      sessionStorage.removeItem('specimen-force-edit');
    } else {
      setForceEditFromSession(false);
    }
  }, [location.key]);

  useEffect(() => {
    const actionSuccess = fetcher.state === 'idle' && fetcher.data?.success;
    if (!actionSuccess) {
      return;
    }

    setFormKey(Date.now().toString());

    switch (fetcher.data?.action) {
      case 'delete': {
        navigate(`/records/species/${outletContext.speciesId}/specimens${location.search}`);
      }
      case 'insert': {
        navigate(`/records/species/${outletContext.speciesId}/specimens/${fetcher.data.changeResult?.id}${location.search}`);
      }
    }
  }, [fetcher.state, fetcher.data]);

  const { selectedTab, setSelectedTab } = useTabSwitching({
    searchParams,
    setSearchParams,
    defaultTab: "identification"
  });

  useEffect(() => {
    const item = outletContext.items.find((si) => si.id === specimenId);

    if (specimenId !== Number.MIN_SAFE_INTEGER && item) {
      setSelectedItem(item);

      if (forceEditFromSession) {
        setChangingValues(true);
        setForceEditFromSession(false);
      } else {
        setChangingValues(false);
      }
    } else if (specimenId === Number.MIN_SAFE_INTEGER) {
      const maxAccessionNumber = (outletContext.items.at(1)?.accessionNumber || 0) + 1;
      setSelectedItem({
        id: Number.MIN_SAFE_INTEGER,
        speciesId: outletContext.speciesId,
        accessionNumber: maxAccessionNumber + 1,
        classificationTypeCode: outletContext.speciesInfo?.classificationTypeCode,
        father_species_id: outletContext.speciesInfo?.id,
        father_species_name: outletContext.speciesInfo?.nameLat,
        mother_species_id: outletContext.speciesInfo?.id,
        mother_species_name: outletContext.speciesInfo?.nameLat,
      });

      setChangingValues(true);
    }

    setFormKey(Date.now().toString());
  }, [specimenId, outletContext.items, forceEditFromSession]);

  const fatherSpeciesAutocomplete = useAutocomplete<number>(
    '/records/specimens/autocomplete-species'
  );

  const fatherAutocomplete = useAutocomplete<number>(
    '/records/specimens/autocomplete-specimen'
  );

  const motherSpeciesAutocomplete = useAutocomplete<number>(
    '/records/specimens/autocomplete-species'
  );

  const motherAutocomplete = useAutocomplete<number>(
    '/records/specimens/autocomplete-specimen'
  );

  useEffect(() => {
  if (!selectedItem) return;

  // === FATHER ===
  if (selectedItem.father_species_id) {
    // Save previous parameters (if exists)
    fatherAutocomplete.setAdditionalQueryParams(prev => ({
      ...prev,
      speciesId: selectedItem.father_species_id!.toString(),
      genderTypeCode: 'M',
    }));
  }

  fatherAutocomplete.setDefaultValues(
    selectedItem.fatherId,
    selectedItem.father
      ? [{ key: selectedItem.fatherId!, text: selectedItem.father_displayName! }]
      : []
  );

  // Reset text and key, start fetch with parameters set above
  fatherAutocomplete.setFilterText('');
  fatherAutocomplete.setSelectedKey(undefined);

  fatherSpeciesAutocomplete.setDefaultValues(
    selectedItem.father_species_id,
    selectedItem.father_species_id
      ? [{ key: selectedItem.father_species_id!, text: selectedItem.father_species_name! }]
      : []
  );

  // === MOTHER ===
  if (selectedItem.mother_species_id) {
    motherAutocomplete.setAdditionalQueryParams(prev => ({
      ...prev,
      speciesId: selectedItem.mother_species_id!.toString(),
      genderTypeCode: 'F',
    }));
  }

  motherAutocomplete.setDefaultValues(
    selectedItem.motherId,
    selectedItem.mother
      ? [{ key: selectedItem.motherId!, text: selectedItem.mother_displayName! }]
      : []
  );

  motherAutocomplete.setFilterText('');
  motherAutocomplete.setSelectedKey(undefined);

  motherSpeciesAutocomplete.setDefaultValues(
    selectedItem.mother_species_id,
    selectedItem.mother_species_id
      ? [{ key: selectedItem.mother_species_id!, text: selectedItem.mother_species_name! }]
      : []
  );
}, [selectedItem]);

  if (!selectedItem) {
    return (null);
  }

  return (
    <Card
      key={`${formKey}-${changingValues}`}
      className="rounded-none border bg-card text-card-foreground shadow-none">

      <fetcher.Form
        method="POST">
        <FormValidationContext.Provider value={fetcher.data?.validationErrors || {}}>

          {/* header form */}
          <fieldset
            disabled={editDisabled}
            className="flex flex-wrap gap-2 p-2 bg-secondary">

            <TextField
              name="accessionNumber"
              defaultValue={selectedItem?.accessionNumber?.toString()}
              className="w-16">
              <Label>Přír. č.</Label>
              <Input type="number" autoFocus={true} ref={setFocusRef} />
              <FieldError />
            </TextField>

            <JollyComboBox
              name="genderTypeCode"
              label="Poh."
              defaultItems={outletContext.genderTypes}
              defaultSelectedKey={selectedItem?.genderTypeCode}
              className="w-16"
              isLoading={false}>
              {(item) => <ComboboxItem key={item.key} >{item.text}</ComboboxItem>}
            </JollyComboBox>

            <TextField
              name="name"
              defaultValue={selectedItem?.name}
              className="grow">
              <Label>Domácí jméno</Label>
              <Input type="text" />
              <FieldError />
            </TextField>

            <TextField
              name="zims"
              defaultValue={selectedItem?.zims}
              className="w-24">
              <Label>ZIMS</Label>
              <Input type="text" />
              <FieldError />
            </TextField>

            <JollyComboBox
              name="classificationTypeCode"
              label="Typ"
              defaultItems={outletContext.classificationTypeOptions}
              defaultSelectedKey={selectedItem?.classificationTypeCode}
              className="w-16"
              isLoading={false}>
              {(item) => <ComboboxItem key={item.key} >{item.text}</ComboboxItem>}
            </JollyComboBox>

            <div>
              <Label>Hybrid</Label>
              <div className="h-8 flex items-center">
                <Checkbox
                  aria-label="Hybrid"
                  name="isHybrid"
                  defaultSelected={selectedItem?.isHybrid}
                  isDisabled={editDisabled}>
                </Checkbox>
              </div>
            </div>
          </fieldset>

          {/* navigation */}
          <div className="flex">
            <SpecimenNavigation
              speciesId={outletContext.speciesId}
              specimenId={selectedItem?.id || -1}
              activePage="home"
              navigationsDisabled={mode === 'insert'} />

            <div className="flex gap-1 p-2">
              <ActionsMenu
                itemId={selectedItem?.id || -1}
                speciesId={selectedItem?.speciesId || -1}
                isDisabled={mode === 'insert'}
                onCopyItem={handleCopySpecimen}
                onPartialCopyItem={handlePartialCopySpecimen}
                onShowCadaverDialog={() => setCadaverDialogOpen(true)}
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

          {/* tabs */}
          <div className="flex">
            <div className="flex flex-wrap gap-1 items-center p-2 grow">
              <Button
                variant={selectedTab === "identification" ? "default" : "outline"}
                size="sm"
                onPressChange={() => {
                  setSelectedTab("identification");
                }}>
                Identifikace
              </Button>

              <Button
                variant={selectedTab === "origin" ? "default" : "outline"}
                size="sm"
                onPressChange={() => {
                  setSelectedTab("origin");
                }}>
                Původ
              </Button>

              <Button
                variant={selectedTab === "note" ? "default" : "outline"}
                size="sm"
                onPressChange={() => {
                  setSelectedTab("note");
                }}>
                Poznámka
              </Button>

              <Button
                variant={selectedTab === "images" ? "default" : "outline"}
                size="sm"
                onPressChange={() => {
                  setSelectedTab("images");
                }}>
                Obrázky
              </Button>
            </div>
          </div>

          {/* Identification Tab */}
          <fieldset
            className={cn(
              'grid grid-cols-4 gap-2 p-2',
              selectedTab !== 'identification' ? 'hidden' : ''
            )}
            disabled={editDisabled}>
            {selectedItem && (
              <>
                <TextField
                  name="studBookName"
                  defaultValue={selectedItem.studBookName || ""}
                  className="col-span-2">
                  <Label>Jméno (plem. kn.)</Label>
                  <Input type="text" />
                  <FieldError />
                </TextField>

                <TextField
                  name="studBookNumber"
                  defaultValue={selectedItem.studBookNumber || ""}
                  className="col-span-2">
                  <Label>Čís. (plem. kn.)</Label>
                  <Input type="text" />
                  <FieldError />
                </TextField>

                <TextField
                  name="registrationNumber"
                  defaultValue={selectedItem.registrationNumber || ""}
                  className="col-span-4">
                  <Label>Registrace</Label>
                  <Input type="text" />
                  <FieldError />
                </TextField>

                <TextField
                  name="registeredDate"
                  defaultValue={selectedItem.registeredDate}>
                  <Label>Reg. kdy</Label>
                  <Input type="text" />
                  <FieldError />
                </TextField>

                <span></span>

                <TextField
                  name="registeredTo"
                  defaultValue={selectedItem.registeredTo}
                  className="col-span-2">
                  <Label>Reg. komu</Label>
                  <Input type="text" />
                  <FieldError />
                </TextField>


                <span
                  className="col-span-2 text-sm font-medium leading-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-70 group-data-[invalid]:text-destructive">
                  Doklady?
                </span>

                <TextField
                  name="czechregistrationNumber"
                  defaultValue={selectedItem.czechregistrationNumber || ""}
                  className="col-span-2">
                  <Label>ČR evidence</Label>
                  <Input type="text" />
                  <FieldError />
                </TextField>

                <TextField
                  name="ueln"
                  defaultValue={selectedItem.ueln || ""}
                  className="col-span-2">
                  <Label>UELN</Label>
                  <Input type="text" />
                  <FieldError />
                </TextField>

                <TextField
                  name="euPermit"
                  defaultValue={selectedItem.euPermit || ""}
                  className="col-span-2">
                  <Label>EU permit</Label>
                  <Input type="text" />
                  <FieldError />
                </TextField>

                <span
                  className="col-span-4 text-sm font-medium leading-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-70 group-data-[invalid]:text-destructive">
                  Platné značení
                </span>

                <TextField
                  name="notch"
                  defaultValue={selectedItem.notch}
                  isDisabled={true}>
                  <Label>Vrub</Label>
                  <Input type="text" />
                  <FieldError />
                </TextField>

                <TextField
                  name="chip"
                  defaultValue={selectedItem.chip}
                  isDisabled={true}>
                  <Label>Chip</Label>
                  <Input type="text" />
                  <FieldError />
                </TextField>

                <TextField
                  name="ringNumber"
                  defaultValue={selectedItem.ringNumber}
                  isDisabled={true}>
                  <Label>Kroužky</Label>
                  <Input type="text" />
                  <FieldError />
                </TextField>

                <TextField
                  name="otherMarking"
                  defaultValue={selectedItem.otherMarking}
                  isDisabled={true}>
                  <Label>Jiné značení</Label>
                  <Input type="text" />
                  <FieldError />
                </TextField>
              </>
            )}
          </fieldset>

          {/* Origin Tab */}
          <fieldset
            className={cn(
              'grid grid-cols-4 gap-2 p-2',
              selectedTab !== 'origin' ? 'hidden' : ''
            )}
            disabled={editDisabled}>
            {selectedItem && (
              <>
                <TextField
                  name="birthDate"
                  defaultValue={selectedItem.birthDate || ""}
                  className="col-span-2">
                  <Label>Datum nar.</Label>
                  <Input type="text" />
                  <FieldError />
                </TextField>

                <TextField
                  name="birthPlace"
                  defaultValue={selectedItem.birthPlace || ""}
                  className="col-span-2">
                  <Label>Místo nar.</Label>
                  <Input type="text" />
                  <FieldError />
                </TextField>

                <JollyComboBox
                  name="birthMethod"
                  label="Způsob nar."
                  defaultItems={outletContext.birthMethodTypes}
                  defaultSelectedKey={selectedItem?.birthMethod}
                  allowsEmptyCollection
                  className="col-span-2"
                  isLoading={false}>
                  {(item) => <ComboboxItem key={item.key} >{item.text}</ComboboxItem>}
                </JollyComboBox>

                <JollyComboBox
                  name="rearing"
                  label="Odchov"
                  defaultItems={outletContext.rearingTypes}
                  defaultSelectedKey={selectedItem?.rearing}
                  allowsEmptyCollection
                  className="col-span-2"
                  isLoading={false}>
                  {(item) => <ComboboxItem key={item.key} >{item.text}</ComboboxItem>}
                </JollyComboBox>

                {/* === FATHER === */}

                <JollyComboBox
                  name="father_species_id"
                  label="Otec (druh)"
                  items={fatherSpeciesAutocomplete.items}
                  onSelectionChange={(k) => {
                    // Only reset father autocomplete if species actually changed
                    const newSpeciesId = k as number;
                    const currentSpeciesId = fatherSpeciesAutocomplete.selectedKey;
                    
                    fatherSpeciesAutocomplete.setSelectedKey(newSpeciesId);
                    
                    // Only reset related autocomplete if species changed
                    if (newSpeciesId !== currentSpeciesId) {
                      fatherAutocomplete.setAdditionalQueryParams(prev => ({
                        ...(prev || {}),
                        speciesId: newSpeciesId?.toString() || '',
                        genderTypeCode: 'M'
                      }));

                      fatherAutocomplete.setDefaultValues(undefined, []);
                      fatherAutocomplete.setFilterText('');
                      fatherAutocomplete.setSelectedKey(undefined);
                    }
                  }}
                  onInputChange={(v) => {
                    fatherSpeciesAutocomplete.setFilterText(v);
                  }}
                  defaultSelectedKey={selectedItem?.father_species_id}
                  allowsEmptyCollection
                  isLoading={fatherSpeciesAutocomplete.loadingState !== 'idle'}
                >
                  {(item) => <ComboboxItem key={item.key} >{item.text}</ComboboxItem>}
                </JollyComboBox>

                <JollyComboBox
                  name="fatherId"
                  label="Otec"
                  items={fatherAutocomplete.items}
                  onSelectionChange={(k) => {
                    fatherAutocomplete.setSelectedKey(k as number);
                  }}
                  onInputChange={(v) => {
                    fatherAutocomplete.setFilterText(v);
                  }}
                  defaultSelectedKey={selectedItem?.fatherId}
                  allowsEmptyCollection
                  isLoading={fatherAutocomplete.loadingState !== 'idle'}
                >
                  {(item) => <ComboboxItem key={item.key} >{item.text}</ComboboxItem>}
                </JollyComboBox>

                <TextField
                  name="fatherZims"
                  defaultValue={selectedItem.fatherZims || ""}>
                  <Label>Otec ZIMS</Label>
                  <Input type="text" />
                  <FieldError />
                </TextField>

                <span></span>
                
                {/* === MOTHER === */}

                <JollyComboBox
                  name="mother_species_id"
                  label="Matka (druh)"
                  items={motherSpeciesAutocomplete.items}
                  onSelectionChange={(k) => {
                    // Only reset mother autocomplete if species actually changed
                    const newSpeciesId = k as number;
                    const currentSpeciesId = motherSpeciesAutocomplete.selectedKey;
                    
                    motherSpeciesAutocomplete.setSelectedKey(newSpeciesId);
                    
                    // Only reset related autocomplete if species changed
                    if (newSpeciesId !== currentSpeciesId) {
                      motherAutocomplete.setAdditionalQueryParams(prev => ({
                        ...(prev || {}),
                        speciesId: newSpeciesId?.toString() || '',
                        genderTypeCode: 'F'
                      }));

                      motherAutocomplete.setDefaultValues(undefined, []);
                      motherAutocomplete.setFilterText('');
                      motherAutocomplete.setSelectedKey(undefined);
                    }
                  }}
                  onInputChange={(v) => {
                    motherSpeciesAutocomplete.setFilterText(v);
                  }}
                  defaultSelectedKey={selectedItem?.mother_species_id}
                  allowsEmptyCollection
                  isLoading={motherSpeciesAutocomplete.loadingState !== 'idle'}
                >
                  {(item) => <ComboboxItem key={item.key} >{item.text}</ComboboxItem>}
                </JollyComboBox>

                <JollyComboBox
                  name="motherId"
                  label="Matka"
                  items={motherAutocomplete.items}
                  onSelectionChange={(k) => {
                    motherAutocomplete.setSelectedKey(k as number);
                  }}
                  onInputChange={(v) => {
                    motherAutocomplete.setFilterText(v);
                  }}
                  defaultSelectedKey={selectedItem?.motherId}
                  allowsEmptyCollection
                  isLoading={motherAutocomplete.loadingState !== 'idle'}
                >
                  {(item) => <ComboboxItem key={item.key} >{item.text}</ComboboxItem>}
                </JollyComboBox>

                <TextField
                  name="motherZims"
                  defaultValue={selectedItem.motherZims || ""}>
                  <Label>Matka ZIMS</Label>
                  <Input type="text" />
                  <FieldError />
                </TextField>

                <span></span>
              </>
            )}
          </fieldset>

          {/* Note Tab */}
          <fieldset
            className={cn(
              'grid grid-cols-4 gap-2 p-2',
              selectedTab !== 'note' ? 'hidden' : ''
            )}
            disabled={editDisabled}>
            {selectedItem && (
              <>
                <TextField
                  name="note"
                  defaultValue={selectedItem.note}
                  className="col-span-4">
                  <Label>Poznámka</Label>
                  <label>{selectedItem.note}</label>
                  <TextArea />
                  <FieldError />
                </TextField>

                <input type='hidden' name='id' value={selectedItem.id} />
                <input type='hidden' name='speciesId' value={selectedItem.speciesId} />
              </>
            )}
          </fieldset>

          {/* NOTE: in this case, there are no form elements, so we can ignore rendering at all*/}
          {selectedTab === 'images' && (
            <div className="grid grid-cols-2 gap-2 p-2 min-h-16">
              {selectedItem.images?.map((img) => {
                return (
                  <div key={img.id}
                    className="flex mb-4 justify-center col-span-2 md:col-span-1">
                    <img src={`/api/specimen-image/${img.id}`}
                      alt={`obrazek-${img.id}`}
                      className="max-h-64 max-w-full" />
                  </div>
                );
              })}
            </div>
          )}

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
              return `/records/species/${outletContext.speciesId}/specimens/${itm.id}${location.search}`
            }} />

        </FormValidationContext.Provider>
      </fetcher.Form>

      {cadaverDialogOpen && (
        <SpeciesCadaversInPeriodDialog
          speciesId={selectedItem.speciesId}
          isOpen={cadaverDialogOpen}
          onClose={() => setCadaverDialogOpen(false)}
        />
      )}
    </Card>
  );
}

type OriginType = { code: string; note?: string };

function SpecimenEUPermitDialog({ specimenId, onClose }: { specimenId: number, onClose: () => void }) {
  const { isDownloading, downloadFile } = useFileDownload();
  const [originTypes, setOriginTypes] = useState<OriginType[]>([]);
  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch('/api/origin-types');
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted) setOriginTypes(data as OriginType[]);
      } catch { /* noop */ }
    })();
    return () => { isMounted = false; };
  }, []);

  const handleDownload = async () => {
    const params: Record<string, string> = {
      specimenId: specimenId.toString(),
    };
    if (selectedOrigin) params.origin = selectedOrigin;

    await downloadFile(`/print-reports/specimen/specimen-registered-eu-permit?${new URLSearchParams(params).toString()}`);
    onClose();
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>EU permit – výběr původu</DialogTitle>
      </DialogHeader>
      <div className="p-4 space-y-4">
        <JollySelect
          label="Původ"
          selectedKey={selectedOrigin ?? undefined}
          onSelectionChange={(key) => setSelectedOrigin(key as string)}
          items={originTypes}
        >
          {(item: OriginType) => (
            <SelectItem key={item.code} id={item.code}>
              {item.note ? `${item.code}|${item.note}` : item.code}
            </SelectItem>
          )}
        </JollySelect>
      </div>
      <div className="p-2 pt-0 flex justify-end">
        <Button
          type="button"
          aria-label="Generovat EU permit"
          variant='default'
          size="sm"
          onPress={handleDownload}
          isDisabled={isDownloading}
        >
          <FileDownIcon className="size-3 mr-2" />
          Generovat EU permit
        </Button>
      </div>
    </DialogContent>
  );
}

export function ActionsMenu({ itemId, speciesId, isDisabled, onShowCadaverDialog, onCopyItem, onPartialCopyItem: onCopyPartialItem }: {
  itemId: number,
  speciesId: number,
  isDisabled: boolean,
  onShowCadaverDialog: () => void,
  onCopyItem: (itemId: number) => void,
  onPartialCopyItem: (itemId: number) => void
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  return (
    <>
      <MenuTrigger>
        <Button
          aria-label="Akce"
          size="sm"
          variant="outline"
          isDisabled={isDisabled} >
          <SettingsIcon className="size-3" />
        </Button>
        <MenuPopover>
          <Menu>
            <MenuSection>
              <MenuHeader>Akce</MenuHeader>
              <MenuItem onAction={() => onCopyItem(itemId)}>Plná kopie</MenuItem>
              <MenuItem onAction={() => onCopyPartialItem(itemId)}>Částečná kopie</MenuItem>
            </MenuSection>
            <MenuSection>
              <MenuHeader>Sestavy</MenuHeader>
              <MenuItem href={`/print-reports/specimen/specimen-card?specimenId=${itemId}`} target="_blank">Karta exempláře</MenuItem>
              <MenuItem href={`/print-reports/specimen/specimen-card-cr-evidence?specimenId=${itemId}`} target="_blank">ČR evidence</MenuItem>
              <MenuItem href={`/print-reports/specimen/specimen-registration?specimenId=${itemId}`} target="_blank">Registrace</MenuItem>
              <MenuItem onAction={() => setIsDialogOpen(true)}>EU permit…</MenuItem>
              <MenuItem href={`/print-reports/specimen/specimen-descendants?specimenId=${itemId}`} target="_blank">Potomci</MenuItem>
              <MenuItem href={`/print-reports/specimen/specimen-genealogy?specimenId=${itemId}`} target="_blank">Rodokmen</MenuItem>
              <MenuItem href={`/print-reports/species/species-in-zoo/${speciesId}`} target="_blank">Druh v zoo</MenuItem>
              <MenuItem onAction={onShowCadaverDialog}>Kadáver v období pro druh</MenuItem>
            </MenuSection>
          </Menu>
        </MenuPopover>
      </MenuTrigger>
      <DialogTrigger isOpen={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <SpecimenEUPermitDialog specimenId={itemId} onClose={() => setIsDialogOpen(false)} />
      </DialogTrigger>
    </>
  );
}
