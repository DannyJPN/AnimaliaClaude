import { ChevronRightIcon, FileDownIcon, PlusIcon } from "lucide-react";
import { MRT_RowData, MRT_ShowHideColumnsButton, MRT_TableInstance } from "material-react-table";
import React from "react";
import { Link, SetURLSearchParams } from "react-router";
import { Button, buttonVariants } from "~/components/ui/button";
import { Menu, MenuItem, MenuPopover, MenuTrigger } from "~/components/ui/menu";
import { Select, SelectItem, SelectListBox, SelectPopover, SelectTrigger, SelectValue } from "~/components/ui/select";
import { cn } from "~/lib/utils";
import { DistrictsSearchForm } from "./districts-search-form";
import { Tooltip } from "~/components/ui/tooltip";

export type OrgHierarchyBreadcrumbsProps = {
  levels: {
    department?: { id: number, name?: string },
    workplace?: { id: number, name?: string },
    district?: { id: number, name?: string },
    location?: { id: number, name?: string },
    species?: { id: number, nameMain?: string, nameSub?: string },

    currentPage: { nameMain?: string, nameSub?: string }
  }
};

const OrgLevelsList = ['root', 'department', 'workplace', 'district', 'location', 'species'] as const;

type OrganizationLevels = typeof OrgLevelsList[number];

function getCurrentTaxonomyLevel({ levels }: OrgHierarchyBreadcrumbsProps): OrganizationLevels {
  const propsToCheck = ['species', 'location', 'district', 'workplace', 'department'] as const;

  const firstSetProp = propsToCheck.find(p => levels[p]);

  return firstSetProp || 'root';
}


export function OrganizationHierarchyBreadcrumbs(props: OrgHierarchyBreadcrumbsProps) {
  const currentLevel = getCurrentTaxonomyLevel(props);
  const levelIndex = OrgLevelsList.findIndex(ol => ol === currentLevel);
  const levels = props.levels;

  const links: {
    key: OrganizationLevels,
    link: string,
    nameMain?: string,
    nameSub?: string
  }[] = [];

  if (levelIndex > 0) {
    links.push({
      key: 'department',
      link: `/records/org-hierarchy/departments/${levels.department?.id}`,
      nameMain: levels.department?.name,
      nameSub: undefined
    });
  }

  if (levelIndex > 1) {
    links.push({
      key: 'workplace',
      link: `/records/org-hierarchy/departments/${levels.department?.id}/workplaces/${levels.workplace?.id}`,
      nameMain: levels.workplace?.name,
      nameSub: undefined
    });
  }

  if (levelIndex > 2) {
    links.push({
      key: 'district',
      link: `/records/org-hierarchy/workplaces/${levels.workplace?.id}/districts/${levels.district?.id}`,
      nameMain: levels.district?.name,
      nameSub: undefined
    });
  }

  if (levelIndex > 3) {
    links.push({
      key: 'location',
      link: `/records/org-hierarchy/districts/${levels.district?.id}/locations/${levels.location?.id}`,
      nameMain: levels.location?.name,
      nameSub: undefined
    });
  }

  if (levelIndex > 4) {
    links.push({
      key: 'species',
      link: `/records/org-hierarchy/locations/${levels.location?.id}/species/${levels.species?.id}`,
      nameMain: levels.species?.nameMain,
      nameSub: levels.species?.nameSub
    });
  }

  return (
    <div className="w-full flex @container">

      <div className="flex items-center">
        <Select
          aria-label="Hierarchy"
          defaultSelectedKey='O'>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectPopover>
            <SelectListBox>
              <SelectItem id="O" href='/records/org-hierarchy/departments'>
                O
              </SelectItem>
              <SelectItem id="Z" href='/records/phyla'>
                Z
              </SelectItem>
              <SelectItem id="E" href='/records/exposition-hierarchy/areas'>
                E
              </SelectItem>
            </SelectListBox>
          </SelectPopover>
        </Select>

        {links.length > 0 && (
          <span>
            <ChevronRightIcon className="size-4" />
          </span>
        )}

      </div>

      <div className="flex @xl:hidden flex-wrap grow items-center">

        {links.length > 1 && (
          <>
            <MenuTrigger>
              <Button
                size="sm"
                variant="link">
                ...
              </Button>
              <MenuPopover>
                <Menu>
                  {links.map((lnk, i) => {
                    if (i === links.length - 1) {
                      return (null);
                    }

                    return (
                      <MenuItem key={lnk.key} href={lnk.link} >{
                        [lnk.nameMain, lnk.nameSub].filter(e => e).join(' / ')
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

        {links.length > 0 && (
          <Link
            to={links.at(-1)!.link}
            className={cn(buttonVariants({ variant: "link", size: 'sm' }), "px-1 flex-col text-left")}>
            <span>{links.at(-1)!.nameMain}</span>
            <span>{links.at(-1)!.nameSub}</span>
          </Link>
        )}
      </div>

      <div className="hidden @xl:flex flex-wrap grow items-center">
        {links.map((lnk, i) => {
          return (
            <React.Fragment
              key={lnk.key}>
              <Link
                to={lnk.link}
                className={cn(buttonVariants({ variant: "link", size: 'sm' }), "px-1 flex-col text-left")}>
                <span className="max-w-32 truncate text-ellipsis">{lnk.nameMain}</span>
                <span className="max-w-32 truncate text-ellipsis">{lnk.nameSub}</span>
              </Link>

              {i < links.length - 1 && (
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
          <>
            {levels.currentPage.nameMain && (
              <span className="text-md whitespace-nowrap font-medium text-primary">
                {levels.currentPage.nameMain}
              </span>
            )}
            {levels.currentPage.nameSub && (
              <span className="text-sm whitespace-nowrap font-medium text-primary">
                {levels.currentPage.nameSub}
              </span>
            )}
          </>
        )}
      </div>


    </div>
  );
}

export type OrganizationHierarchyGridHeaderProps<TItem extends MRT_RowData> = {
  table: MRT_TableInstance<TItem>,
  searchParams: URLSearchParams,
  setSearchParams: SetURLSearchParams,
  breadcrumbProps: OrgHierarchyBreadcrumbsProps,
  noNewItem?: boolean,
  onNewItem?: () => void,
  onExport?: () => void,
  isExporting?: boolean,
  additionalButtons?: React.ReactNode,
};

export function OrganizationHierarchyGridHeader<TItem extends MRT_RowData>(
  { table, breadcrumbProps, searchParams, setSearchParams, noNewItem,
    onNewItem, onExport, isExporting, additionalButtons
  }: OrganizationHierarchyGridHeaderProps<TItem>
) {
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
        <OrganizationHierarchyBreadcrumbs {...breadcrumbProps} />
      </div>

      <div className="w-full flex-1 sm:flex sm:flex-row p-2 gap-4">
        <DistrictsSearchForm />

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
