import { ChevronRightIcon, FileDownIcon, PlusIcon } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button, buttonVariants } from "~/components/ui/button";
import { Select, SelectItem, SelectListBox, SelectPopover, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Menu, MenuItem, MenuPopover, MenuTrigger } from "~/components/ui/menu";
import React from "react";
import { Link, SetURLSearchParams } from "react-router";
import { MRT_RowData, MRT_ShowHideColumnsButton, MRT_TableInstance } from "material-react-table";
import { LocationsSearchForm } from "~/components/records/locations-search-form";
import { Tooltip } from "~/components/ui/tooltip";

export type ExpHierarchyBreadcrumbsProps = {
  levels: {
    area?: { id: number, name?: string };
    set?: { id: number, name?: string };
    location?: { id: number, name?: string };
    specie?: { id: number, name?: string, nameSub?: string };

    currentPage: { nameMain?: string, nameSub?: string };
  };
};

const LevelsList = ["root", "area", "set", "location", "specie"] as const;
type ExpositionLevel = typeof LevelsList[number];

function getCurrentExpositionLevel({ levels }: ExpHierarchyBreadcrumbsProps): ExpositionLevel {
  const propsToCheck = ["specie", "location", "set", "area"] as const;
  const firstSet = propsToCheck.find(p => levels[p]);
  return firstSet ?? "root";
}

export function ExpositionHierarchyBreadcrumbs(props: ExpHierarchyBreadcrumbsProps) {
  const levels = props.levels;
  const currentLevel = getCurrentExpositionLevel(props);
  const levelIndex = LevelsList.findIndex(el => el === currentLevel);

  const links: {
    key: ExpositionLevel;
    link: string;
    name?: string;
    nameSub?: string;
  }[] = [];

  if (levelIndex > 0) {
    links.push({
      key: "area",
      link: `/records/exposition-hierarchy/areas/${levels.area?.id}`,
      name: levels.area?.name,
      nameSub: undefined
    });
  }

  if (levelIndex > 1) {
    links.push({
      key: "set",
      link: `/records/exposition-hierarchy/areas/${levels.area?.id}/sets/${levels.set?.id}`,
      name: levels.set?.name,
      nameSub: undefined
    });
  }

  if (levelIndex > 2) {
    links.push({
      key: "location",
      link: `/records/exposition-hierarchy/sets/${levels.set?.id}/locations/${levels.location?.id}`,
      name: levels.location?.name,
      nameSub: undefined
    });
  }

  if (levelIndex > 3) {
    links.push({
      key: "specie",
      link: `/records/exposition-hierarchy/locations/${levels.set?.id}/species/${levels.location?.id}`,
      name: levels.specie?.name,
      nameSub: levels.specie?.nameSub
    });
  }

  return (
    <div className="w-full flex @container">
      <div className="flex items-center">
        <Select aria-label="Hierarchy" defaultSelectedKey="E">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectPopover>
            <SelectListBox>
              <SelectItem id="O" href="/records/org-hierarchy/departments">O</SelectItem>
              <SelectItem id="Z" href="/records/phyla">Z</SelectItem>
              <SelectItem id="E" href="/records/exposition-hierarchy/areas">E</SelectItem>
            </SelectListBox>
          </SelectPopover>
        </Select>

        {links.length > 0 && (
          <span><ChevronRightIcon className="size-4" /></span>
        )}
      </div>

      {/* Short */}
      <div className="flex @xl:hidden flex-wrap grow items-center">
        {links.length > 1 && (
          <>
            <MenuTrigger>
              <button className={cn(buttonVariants({ variant: "link", size: "sm" }), "px-1")}>...</button>
              <MenuPopover>
                <Menu>
                  {links.slice(0, -1).map((lnk) => (
                    <MenuItem key={lnk.key} href={lnk.link}>
                      {lnk.name}
                    </MenuItem>
                  ))}
                </Menu>
              </MenuPopover>
            </MenuTrigger>
            <span><ChevronRightIcon className="size-4" /></span>
          </>
        )}

        {links.length > 0 && (
          <Link
            to={links.at(-1)!.link}
            className={cn(buttonVariants({ variant: "link", size: "sm" }), "px-1 flex-col text-left")}
          >
            <span>{links.at(-1)!.name}</span>
          </Link>
        )}
      </div>

      {/* Full */}
      <div className="hidden @xl:flex flex-wrap grow items-center">
        {links.map((lnk, i) => (
          <React.Fragment key={lnk.key}>
            <Link
              to={lnk.link}
              className={cn(buttonVariants({ variant: "link", size: "sm" }), "px-1 flex-col text-left")}
            >
              <span className="max-w-32 truncate text-ellipsis">{lnk.name}</span>
            </Link>
            {i < links.length - 1 && (
              <span><ChevronRightIcon className="size-4" /></span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Current Page */}
      <div className="flex flex-col items-center justify-center">
        {levels.currentPage?.nameMain && (
          <span className="text-md whitespace-nowrap font-medium text-primary">
            {levels.currentPage.nameMain}
          </span>
        )}
        {levels.currentPage.nameSub && (
          <span className="text-sm whitespace-nowrap font-medium text-primary">
            {levels.currentPage.nameSub}
          </span>
        )}
      </div>
    </div>
  );
}

export type ExpositionHierarchyGridHeaderProps<TItem extends MRT_RowData> = {
  table: MRT_TableInstance<TItem>,
  searchParams: URLSearchParams,
  setSearchParams: SetURLSearchParams,
  breadcrumbProps: ExpHierarchyBreadcrumbsProps,
  noNewItem?: boolean,
  onNewItem?: () => void,
  onExport?: () => void,
  isExporting?: boolean,
  additionalButtons?: React.ReactNode,
};

export function ExpositionHierarchyGridHeader<TItem extends MRT_RowData>(
  { table, breadcrumbProps, searchParams, setSearchParams, noNewItem,
    onNewItem, onExport, isExporting, additionalButtons
  }: ExpositionHierarchyGridHeaderProps<TItem>
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
        <ExpositionHierarchyBreadcrumbs {...breadcrumbProps} />
      </div>

      <div className="w-full flex-1 sm:flex sm:flex-row p-2 gap-4">
        <LocationsSearchForm />

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
