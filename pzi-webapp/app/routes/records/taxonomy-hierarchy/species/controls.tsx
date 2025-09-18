import { CircleEllipsisIcon, HeartIcon, HomeIcon, LockIcon } from "lucide-react";
import { Link } from "react-router";
import { Button, buttonVariants } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { ComboboxItem, JollyComboBox } from "~/components/ui/combobox";
import { FieldError, Label } from "~/components/ui/field";
import { Menu, MenuHeader, MenuItem, MenuPopover, MenuSection, MenuTrigger } from "~/components/ui/menu";
import { Input, TextArea, TextField } from "~/components/ui/textfield";
import { cn } from "~/lib/utils";
import { SelectItemType } from "~/shared/models";
import { TaxonomySpeciesItem } from "./models";
import { useCallback } from "react";

export function SpeciesNavigation(props: {
  genusId: number,
  speciesId: number,
  activePage: 'home' | 'documents' | 'records',
  navigationsDisabled?: boolean
}) {
  const buttonDefs = [
    {
      page: 'home',
      link: `/records/genera/${props.genusId}/species/${props.speciesId}`,
      children: (<><HomeIcon className="size-4" /></>)
    },
    {
      page: 'documents',
      link: `/records/species/${props.speciesId}/documents`,
      text: 'Doklady'
    },
    {
      page: 'records',
      link: `/records/species/${props.speciesId}/records`,
      text: 'Záznamy'
    }
  ];

  return (
    <div className="grow @container">
      <div className="flex flex-wrap gap-1 items-center p-2 grow">
        {buttonDefs.map((bd) => {
          return (
            <Link
              key={bd.page}
              to={bd.link}
              className={cn(
                buttonVariants({ variant: bd.page === props.activePage ? 'default' : 'outline', size: 'sm' }),
                {
                  'pointer-events-none': props.navigationsDisabled
                }
              )}>
              {bd.children ? (bd.children) : (<>{bd.text}</>)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function SpeciesActionsMenu({ itemId, isMenuDisabled, isZooStatusExportDisabled, onMassRecord, onShowHistory, onShowCadaverDialog }: 
  { itemId: number, 
    isMenuDisabled: boolean, 
    isZooStatusExportDisabled: boolean, 
    onMassRecord: () => void,
    onShowHistory: () => void,
    onShowCadaverDialog: () => void
  }) 
{

  return (
    <MenuTrigger>
      <Button
        aria-label="Akce"
        size="icon"
        variant="outline"
        className="text-xs p-0 w-8 h-8 bg-transparent"
        isDisabled={isMenuDisabled}>
        <CircleEllipsisIcon className="size-3" />
      </Button>
      <MenuPopover>
        <Menu>
          <MenuSection>
            <MenuHeader>Navigace</MenuHeader>
            <MenuItem href={`/records/species/${itemId}/specimens`}>Exempláře</MenuItem>
            <MenuItem href={`/records/species/${itemId}/records`}>Záznamy</MenuItem>
            <MenuItem href={`/records/species/${itemId}/documents`}>Doklady</MenuItem>
          </MenuSection>
          <MenuSection>
            <MenuHeader>Sestavy</MenuHeader>
            <MenuItem href={`/print-reports/species/species-history/${itemId}`} target="_blank">Historie druhu</MenuItem>
            <MenuItem href={`/print-reports/species/species-in-zoo/${itemId}`} 
              target="_blank"
              isDisabled={isZooStatusExportDisabled}>
                Druh v zoo</MenuItem>
            <MenuItem onAction={onShowHistory}>Druh v období</MenuItem>
            <MenuItem onAction={onShowCadaverDialog}>Kadáver v období pro druh</MenuItem>
          </MenuSection>
          <MenuSection>
            <MenuHeader>Akce</MenuHeader>
            <MenuItem
              onAction={() => {
                onMassRecord();
              }}>Hromadný výkon</MenuItem>
          </MenuSection>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  );
};

export function SpeciesHeaderForm(
  { selectedItem, classificationTypeOptions, editDisabled, inputRef }: {
    selectedItem: TaxonomySpeciesItem | undefined,
    classificationTypeOptions: SelectItemType<string, string>[]
    editDisabled?: boolean,
    inputRef?: React.Ref<HTMLInputElement>
  }
) {
  if (!selectedItem) {
    return (null);
  }

  return (
    <>
      <TextField
        name="code"
        defaultValue={selectedItem.code}
        className="w-16">
        <Label>Kód</Label>
        <Input type="text" autoFocus={true} ref={inputRef} />
        <FieldError />
      </TextField>

      <TextField
        className="w-48 grow"
        name="nameLat"
        defaultValue={selectedItem.nameLat}>
        <Label>Latinsky</Label>
        <Input type="text" />
        <FieldError />
      </TextField>

      <TextField
        className="w-48 grow"
        name="nameCz"
        defaultValue={selectedItem.nameCz}>
        <Label>Česky</Label>
        <Input type="text" />
        <FieldError />
      </TextField>

      <JollyComboBox
        name="classificationTypeCode"
        label="Typ"
        defaultItems={classificationTypeOptions}
        defaultSelectedKey={selectedItem?.classificationTypeCode}
        allowsEmptyCollection
        isLoading={false}
        isDisabled={editDisabled}
        className="w-16">
        {(item) => <ComboboxItem key={item.key} >{item.text}</ComboboxItem>}
      </JollyComboBox>
    </>
  );
}

export function SpeciesParametersCard(
  { selectedItem, rdbCodes, citeCodes, euCodes, protectionTypes, editDisabled }: {
    selectedItem: TaxonomySpeciesItem | undefined,
    rdbCodes: SelectItemType<string, string>[],
    citeCodes: SelectItemType<string, string>[],
    euCodes: SelectItemType<string, string>[],
    protectionTypes: SelectItemType<string, string>[],
    editDisabled: boolean
  }
) {
  if (!selectedItem) {
    return (null);
  }

  return (
    <>
      <TextField
        name="card"
        defaultValue={selectedItem.card}
        className="col-span-2">
        <Label>Čís. karty</Label>
        <Input type="text" />
        <FieldError />
      </TextField>

      <JollyComboBox
        name="rdbCode"
        label="Kód RDB"
        defaultItems={rdbCodes}
        defaultSelectedKey={selectedItem.rdbCode}
        allowsEmptyCollection
        isLoading={false}
        isDisabled={editDisabled}>
        {(item) => <ComboboxItem key={item.key} >{item.text}</ComboboxItem>}
      </JollyComboBox>

      <div>
        <Label>Reg. pov.</Label>
        <div className="h-8 flex items-center">
          <Checkbox
            aria-label="Reg. pov."
            name="isRegulationRequirement"
            defaultSelected={selectedItem.isRegulationRequirement}
            isDisabled={editDisabled}>
          </Checkbox>
        </div>
      </div>

      <JollyComboBox
        name="citeTypeCode"
        label="Kód CITES"
        defaultItems={citeCodes}
        defaultSelectedKey={selectedItem.citeTypeCode}
        allowsEmptyCollection
        isLoading={false}
        isDisabled={editDisabled}>
        {(item) => <ComboboxItem key={item.key} >{item.text}</ComboboxItem>}
      </JollyComboBox>

      <JollyComboBox
        name="euCode"
        label="Kód EU"
        defaultItems={euCodes}
        defaultSelectedKey={selectedItem.euCode}
        allowsEmptyCollection
        isLoading={false}
        isDisabled={editDisabled}>
        {(item) => <ComboboxItem key={item.key} >{item.text}</ComboboxItem>}
      </JollyComboBox>

      <JollyComboBox
        name="protectionType"
        label="ČR"
        defaultItems={protectionTypes}
        defaultSelectedKey={selectedItem.protectionType}
        allowsEmptyCollection
        isLoading={false}
        isDisabled={editDisabled}>
        {(item) => <ComboboxItem key={item.key} >{item.text}</ComboboxItem>}
      </JollyComboBox>

      <div>
        <Label>ISB</Label>
        <div className="h-8 flex items-center">
          <Checkbox
            aria-label="ISB"
            name="isIsb"
            defaultSelected={selectedItem.isIsb}
            isDisabled={editDisabled}>
          </Checkbox>
        </div>
      </div>

      <div>
        <Label>EEP</Label>
        <div className="h-8 flex items-center">
          <Checkbox
            aria-label="EEP"
            name="isEep"
            defaultSelected={selectedItem.isEep}
            isDisabled={editDisabled}>
          </Checkbox>
        </div>
      </div>

      <div>
        <Label>ESB</Label>
        <div className="h-8 flex items-center">
          <Checkbox
            aria-label="ESB"
            name="isEsb"
            defaultSelected={selectedItem.isEsb}
            isDisabled={editDisabled}>
          </Checkbox>
        </div>
      </div>

      <div>
        <Label>GENOFOND</Label>
        <div className="h-8 flex items-center">
          <Checkbox
            aria-label="GENOFOND"
            name="isGenePool"
            defaultSelected={selectedItem.isGenePool}
            isDisabled={editDisabled}>
          </Checkbox>
        </div>
      </div>

      <div>
        <Label>EU fauna</Label>
        <div className="h-8 flex items-center">
          <Checkbox
            aria-label="EU fauna"
            name="isEuFauna"
            defaultSelected={selectedItem.isEuFauna}
            isDisabled={editDisabled}>
          </Checkbox>
        </div>
      </div>

      <TextField
        className="col-span-2"
        name="synonyms"
        defaultValue={selectedItem.synonyms}>
        <Label>Synonyma</Label>
        <TextArea />
        <FieldError />
      </TextField>

      <TextField
        className="col-span-2"
        name="description"
        defaultValue={selectedItem.description}>
        <Label>Popis</Label>
        <TextArea />
        <FieldError />
      </TextField>

      <TextField
        className="col-span-2"
        name="nameEn"
        defaultValue={selectedItem.nameEn}>
        <Label>Anglicky</Label>
        <Input type="text" />
        <FieldError />
      </TextField>

      <TextField
        className="col-span-2"
        name="nameSk"
        defaultValue={selectedItem.nameSk}>
        <Label>Slovensky</Label>
        <Input type="text" />
        <FieldError />
      </TextField>

      <TextField
        name="note"
        defaultValue={selectedItem.note}
        className="col-span-4">
        <Label>Poznámka</Label>
        <TextArea />
        <FieldError />
      </TextField>

      <input type='hidden' name='id' value={selectedItem.id} />
      <input type='hidden' name='taxonomyGenusId' value={selectedItem.taxonomyGenusId} />
    </>
  );
}