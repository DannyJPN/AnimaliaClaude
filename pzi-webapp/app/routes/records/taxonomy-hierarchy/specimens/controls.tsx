import { HomeIcon } from "lucide-react";
import { MRT_RowData, MRT_TableInstance } from "material-react-table";
import { Link, SetURLSearchParams } from "react-router";
import { RecordsPageGridHeader } from "~/components/records/records-pages-controls";
import { Button, buttonVariants } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { ComboboxItem, JollyComboBox } from "~/components/ui/combobox";
import { FieldError, Label } from "~/components/ui/field";
import { Menu, MenuItem, MenuPopover, MenuTrigger } from "~/components/ui/menu";
import { Input, TextField } from "~/components/ui/textfield";
import { cn } from "~/lib/utils";
import { SelectItemType } from "~/shared/models";
import { TaxonomyPhylumInfoItem } from "../models";
import { TaxonomyFamilyInfoItem, TaxonomySpecimenInfoItem } from "./models";

export function SpecimenNavigation(props: {
  speciesId: number,
  specimenId: number,
  activePage: 'home' | 'movements' | 'placements' | 'records' | 'markings' | 'cadavers' | 'documents' | 'images',
  navigationsDisabled?: boolean
}) {
  const buttonDefs = [
    {
      page: 'home',
      link: `/records/species/${props.speciesId}/specimens/${props.specimenId}`,
      children: (<><HomeIcon className="size-4" /></>)
    },
    {
      page: 'movements',
      link: `/records/specimens/${props.specimenId}/movements`,
      text: 'Pohyby'
    },
    {
      page: 'placements',
      link: `/records/specimens/${props.specimenId}/specimen-placements`,
      text: 'Umístění'
    },
    {
      page: 'records',
      link: `/records/specimens/${props.specimenId}/records`,
      text: 'Zaznamy'
    },
    {
      page: 'markings',
      link: `/records/specimens/${props.specimenId}/markings`,
      text: 'Značení'
    },
    {
      page: 'documents',
      link: `/records/specimens/${props.specimenId}/documents`,
      text: 'Doklady'
    },
    {
      page: 'cadavers',
      link: `/records/specimens/${props.specimenId}/cadavers`,
      text: 'Kadaver'
    },
    {
      page: 'images',
      link: `/records/specimens/${props.specimenId}/images`,
      text: 'Obrázky'
    }
  ];

  const activeButtonDef = buttonDefs.find((bd) => bd.page === props.activePage)!;

  return (
    <div className="grow @container">
      <div className="hidden flex-wrap gap-1 items-center p-2 grow @lg:flex">
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
      <div className="flex p-2 @lg:hidden">
        <MenuTrigger>
          <Button
            size="sm"
            variant="default">
            {activeButtonDef.children ? (activeButtonDef.children) : (<>{activeButtonDef.text}</>)}
          </Button>
          <MenuPopover>
            <Menu>
              {buttonDefs.map((bd) => {
                return (
                  <MenuItem
                    key={bd.page}
                    href={bd.link}
                    isDisabled={props.navigationsDisabled}>
                    {bd.children ? (bd.children) : (<>{bd.text}</>)}
                  </MenuItem>
                );
              })}
            </Menu>
          </MenuPopover>
        </MenuTrigger>
      </div>
    </div>
  );
}

export type SpecimenChildRecordsGridHeaderProps<TItem extends MRT_RowData> = {
  table: MRT_TableInstance<TItem>,
  phylumInfo?: TaxonomyPhylumInfoItem,
  familyInfo?: TaxonomyFamilyInfoItem,
  specimenInfo?: TaxonomySpecimenInfoItem,
  currentPageName: string,
  searchParams: URLSearchParams,
  setSearchParams: SetURLSearchParams,
  noNewItem: boolean,
  onNewItem?: () => void,
  onExport?: () => void,
  isExporting?: boolean,
};

export function SpecimenChildRecordsGridHeader<TItem extends MRT_RowData>(
  { table, phylumInfo, familyInfo, specimenInfo, searchParams, setSearchParams, noNewItem, onNewItem, onExport, isExporting }: SpecimenChildRecordsGridHeaderProps<TItem>
) {

  const breadcrumbProps = {
    hierarchyType: 'Z' as const,

    levels: {
      type: 'Z' as const,
      phylum: {
        id: phylumInfo!.id,
        nameLat: phylumInfo!.nameLat,
        nameCz: phylumInfo!.nameCz
      },
      class: {
        id: familyInfo!.taxonomyOrder!.taxonomyClass!.id,
        nameLat: familyInfo!.taxonomyOrder!.taxonomyClass!.nameLat,
        nameCz: familyInfo!.taxonomyOrder!.taxonomyClass!.nameCz
      },
      order: {
        id: familyInfo!.taxonomyOrder!.id,
        nameLat: familyInfo!.taxonomyOrder!.nameLat,
        nameCz: familyInfo!.taxonomyOrder!.nameCz
      },
      family: {
        id: familyInfo!!.id,
        nameLat: familyInfo!!.nameLat,
        nameCz: familyInfo!!.nameCz
      },
      genus: {
        id: specimenInfo!.species!.taxonomyGenus!.id,
        nameLat: specimenInfo!.species!.taxonomyGenus!.nameLat,
        nameCz: specimenInfo!.species!.taxonomyGenus!.nameCz,
      },
      species: {
        id: specimenInfo!.species!.id,
        nameLat: specimenInfo!.species!.nameLat,
        nameCz: specimenInfo!.species!.nameCz,
      },
      currentPage: {
        nameLat: undefined,
        nameCz: 'Exempláře',
        link: `/records/species/${specimenInfo!.speciesId}/specimens/${specimenInfo!.id}`
      }
    }
  };

  return (
    <RecordsPageGridHeader
      table={table}
      searchParams={searchParams}
      setSearchParams={setSearchParams}
      breadcrumbProps={breadcrumbProps}
      noNewItem={noNewItem}
      onNewItem={onNewItem}
      onExport={onExport}
      isExporting={isExporting}
    />
  );
}

export type SpecimenHeaderDetailProps = {
  specimen: TaxonomySpecimenInfoItem
};

export function SpecimenHeaderDetail(props: SpecimenHeaderDetailProps) {
  const classificationTypeOptions: SelectItemType<string, string>[] = [
    { key: 'E', text: 'E' },
    { key: 'S', text: 'S' }
  ];

  const specimenGenderTypes: SelectItemType<string, string>[] = [
    { key: props.specimen.genderTypeCode!, text: props.specimen.genderTypeCode! }
  ];

  return (
    <>
      <TextField
        defaultValue={props.specimen.accessionNumber?.toString()}
        className="w-16"
        isDisabled={true}>
        <Label>Přír. č.</Label>
        <Input type="number" />
        <FieldError />
      </TextField>

      <TextField
        name="zims"
        defaultValue={props.specimen.zims}
        className="w-24"
        isDisabled={true}>
        <Label>ZIMS</Label>
        <Input type="text" />
        <FieldError />
      </TextField>

      <JollyComboBox
        label="Poh."
        defaultItems={specimenGenderTypes}
        defaultSelectedKey={props.specimen.genderTypeCode}
        className="w-16"
        isLoading={false}
        isDisabled={true}>
        {(item) => <ComboboxItem key={item.key} >{item.text}</ComboboxItem>}
      </JollyComboBox>

      <TextField
        defaultValue={props.specimen.name}
        className="grow"
        isDisabled={true}>
        <Label>Domácí jméno</Label>
        <Input type="text" />
        <FieldError />
      </TextField>

      <JollyComboBox
        label="Typ"
        defaultItems={classificationTypeOptions}
        defaultSelectedKey={props.specimen?.classificationTypeCode}
        className="w-16"
        isLoading={false}
        isDisabled={true}>
        {(item) => <ComboboxItem key={item.key} >{item.text}</ComboboxItem>}
      </JollyComboBox>

      <div>
        <Label>Hybrid</Label>
        <div className="h-8 flex items-center">
          <Checkbox
            aria-label="Hybrid"
            defaultSelected={props.specimen.isHybrid}
            isDisabled={true}>
          </Checkbox>
        </div>
      </div>
    </>
  )
}
