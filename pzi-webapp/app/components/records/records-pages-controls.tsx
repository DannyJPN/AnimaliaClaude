import { ChevronRightIcon, FileDownIcon, PlusIcon } from "lucide-react";
import { MRT_RowData, MRT_ShowHideColumnsButton, MRT_TableInstance } from "material-react-table";
import React from "react";
import { Link, SetURLSearchParams } from "react-router";
import { cn } from "~/lib/utils";
import { Button, buttonVariants } from "../ui/button";
import { Menu, MenuItem, MenuPopover, MenuTrigger } from "../ui/menu";
import { Select, SelectItem, SelectListBox, SelectPopover, SelectTrigger, SelectValue } from "../ui/select";
import { SpeciesSearchForm } from "./species-search-form";
import { Tooltip } from "../ui/tooltip";

export type TaxonomyRecordsLevels = {
  type: 'Z',

  phylum?: { id: number, nameLat?: string, nameCz?: string },
  class?: { id: number, nameLat?: string, nameCz?: string },
  order?: { id: number, nameLat?: string, nameCz?: string },
  family?: { id: number, nameLat?: string, nameCz?: string },
  genus?: { id: number, nameLat?: string, nameCz?: string },
  species?: { id: number, nameLat?: string, nameCz?: string },
  specimen?: { id: number },
  currentPage: { nameLat?: string, nameCz?: string, link?: string }
}

export type RecordsBreadcrumbsProps = {
  hierarchyType: 'Z',
  levels: TaxonomyRecordsLevels
};

const TaxonomyLevelsList = ['root', 'phylum', 'class', 'order', 'family', 'genus', 'species', 'specimen'] as const;

type TaxonomyLevels = typeof TaxonomyLevelsList[number];

function getCurrentTaxonomyLevel(levels: TaxonomyRecordsLevels): TaxonomyLevels {
  const propsToCheck = ['specimen', 'species', 'genus', 'family', 'order', 'class', 'phylum'] as const;

  const firstSetProp = propsToCheck.find(p => levels[p]);

  return firstSetProp || 'root';
}

export function RecordBreadcrumbCurrentLevel(props: { nameLat?: string, nameCz?: string, link?: string }) {
  const content = (
    <>
      {props.nameLat && (
        <span className="text-md whitespace-nowrap font-medium text-primary">
          {props.nameLat}
        </span>
      )}
      {props.nameCz && (
        <span className="text-sm whitespace-nowrap font-medium text-primary">
          {props.nameCz}
        </span>
      )}
    </>
  );

  return props.link ? (
    <Link
      to={props.link}
      className="flex flex-col items-start px-2 hover:underline text-left"
    >
      {content}
    </Link>
  ) : (
    <div className="flex flex-col items-start px-2 text-left">
      {content}
    </div>
  );
}

export function RecordsBreadcrumbs({ levels }: RecordsBreadcrumbsProps) {
  const currentLevel = getCurrentTaxonomyLevel(levels);

  const levelIndex = TaxonomyLevelsList.findIndex(tl => tl === currentLevel);

  const rootLink = levels.phylum
    ? `/records/phyla/${levels.phylum.id}`
    : `/records/phyla`;

  const taxonomyLinks: {
    key: TaxonomyLevels,
    link: string,
    nameLat?: string,
    nameCz?: string
  }[] = [];

  if (levelIndex > 0) {
    taxonomyLinks.push({
      key: 'phylum',
      link: `/records/phyla/${levels.phylum?.id}`,
      nameCz: levels.phylum?.nameCz,
      nameLat: levels.phylum?.nameLat
    });
  }

  if (levelIndex > 1) {
    taxonomyLinks.push({
      key: 'class',
      link: `/records/phyla/${levels.phylum?.id}/classes/${levels.class?.id}`,
      nameCz: levels.class?.nameCz,
      nameLat: levels.class?.nameLat
    });
  }

  if (levelIndex > 2) {
    taxonomyLinks.push({
      key: 'order',
      link: `/records/classes/${levels.class?.id}/orders/${levels.order?.id}`,
      nameCz: levels.order?.nameCz,
      nameLat: levels.order?.nameLat
    });
  }

  if (levelIndex > 3) {
    taxonomyLinks.push({
      key: 'family',
      link: `/records/orders/${levels.order?.id}/families/${levels.family?.id}`,
      nameCz: levels.family?.nameCz,
      nameLat: levels.family?.nameLat
    });
  }

  if (levelIndex > 4) {
    taxonomyLinks.push({
      key: 'genus',
      link: `/records/families/${levels.family?.id}/genera/${levels.genus?.id}`,
      nameCz: levels.genus?.nameCz,
      nameLat: levels.genus?.nameLat
    });
  }

  if (levelIndex > 5) {
    taxonomyLinks.push({
      key: 'species',
      link: `/records/genera/${levels.genus?.id}/species/${levels.species?.id}`,
      nameCz: levels.species?.nameCz,
      nameLat: levels.species?.nameLat
    });
  }

  return (
    <div className="w-full flex @container">

      <div className="flex items-center">
        <Select
          aria-label="Hierarchy"
          defaultSelectedKey='Z'>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectPopover>
            <SelectListBox>
              <SelectItem id="Z" href={rootLink}>
                Z
              </SelectItem>
              <SelectItem id="o" href='/records/org-hierarchy/departments'>
                O
              </SelectItem>
              <SelectItem id="E" href='/records/exposition-hierarchy/areas'>
                E
              </SelectItem>
            </SelectListBox>
          </SelectPopover>
        </Select>

        {taxonomyLinks.length > 0 && (
          <span>
            <ChevronRightIcon className="size-4" />
          </span>
        )}
      </div>

      <div className="flex @xl:hidden flex-wrap grow items-center">

        {taxonomyLinks.length > 1 && (
          <>
            <MenuTrigger>
              <Button
                size="sm"
                variant="link">
                ...
              </Button>
              <MenuPopover>
                <Menu>
                  {taxonomyLinks.map((tl, i) => {
                    if (i === taxonomyLinks.length - 1) {
                      return (null);
                    }

                    return (
                      <MenuItem key={tl.key} href={tl.link} >{
                        [tl.nameLat, tl.nameCz].filter(e => e).join(' / ')
                      }</MenuItem>
                    );
                  })}
                </Menu>
              </MenuPopover>
            </MenuTrigger>

            <span>
              <ChevronRightIcon className="size-4" />
            </span>
          </>
        )}

        {taxonomyLinks.length > 0 && (
          <Link
            to={taxonomyLinks.at(-1)!.link}
            className={cn(buttonVariants({ variant: "link", size: 'sm' }), "px-1 flex-col text-left")}>
            <span>{taxonomyLinks.at(-1)!.nameLat}</span>
            <span>{taxonomyLinks.at(-1)!.nameCz}</span>
          </Link>
        )}
      </div>

      <div className="hidden @xl:flex flex-wrap grow items-center">
        {taxonomyLinks.map((tl, i) => {
          return (
            <React.Fragment
              key={tl.key}>
              <Link
                to={tl.link}
                className={cn(buttonVariants({ variant: "link", size: 'sm' }), "px-1 flex-col text-left")}>
                <span className="max-w-32 truncate text-ellipsis">{tl.nameLat}</span>
                <span className="max-w-32 truncate text-ellipsis">{tl.nameCz}</span>
              </Link>

              {i < taxonomyLinks.length - 1 && (
                <span>
                  <ChevronRightIcon className="size-4" />
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex flex-col items-center justify-center">
        {levels.currentPage && (
          <RecordBreadcrumbCurrentLevel
            nameCz={levels.currentPage?.nameCz}
            nameLat={levels.currentPage?.nameLat}
            link={levels.currentPage.link} />
        )}
      </div>
    </div>
  );
}

export type RecordsPageGridHeaderProps<TItem extends MRT_RowData> = {
  table: MRT_TableInstance<TItem>,
  searchParams: URLSearchParams,
  setSearchParams: SetURLSearchParams,
  breadcrumbProps: RecordsBreadcrumbsProps,
  noNewItem?: boolean,
  additionalButtons?: React.ReactNode,
  onNewItem?: () => void,
  onExport?: () => void,
  isExporting?: boolean
};

export function RecordsPageGridHeader<TItem extends MRT_RowData>({
  table, breadcrumbProps, searchParams, setSearchParams, noNewItem,
  additionalButtons, onNewItem, onExport, isExporting
}: RecordsPageGridHeaderProps<TItem>) {
  const newItemHandler = onNewItem
    ? onNewItem
    : () => {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('selectedKey', 'newItem');

      setSearchParams(newSearchParams);
    };

  return (
    <div className="@container">
      <div className="min-h-[72px] w-full content-center flex-wrap p-2 bg-secondary">
        <RecordsBreadcrumbs {...breadcrumbProps} />
      </div>

      <div className="w-full flex-1 sm:flex sm:flex-row p-2 gap-4">
        <SpeciesSearchForm />

        <div className="flex flex-row-reverse gap-1 content-center items-center">
          {!noNewItem && (
            <Tooltip content="Přidat nový">
              <Button
                variant="outline"
                size="sm"
                onPress={newItemHandler}>
                <PlusIcon className="size-3" />
              </Button>
            </Tooltip>
          )}

          <MRT_ShowHideColumnsButton
            className={cn("custom-showhide-icon")}
            table={table}>
          </MRT_ShowHideColumnsButton>

          {onExport && (
            <Tooltip content="Exportovat záznamy">
              <Button
                variant="outline"
                size="sm"
                onPress={onExport}
                isDisabled={isExporting}
                aria-label="Exportovat do XLS">
                <FileDownIcon className="size-3" />
              </Button>
            </Tooltip>
          )}

          {additionalButtons}
        </div>
      </div>
    </div>
  );
}
