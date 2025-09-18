import { HomeIcon } from "lucide-react";
import { Link } from "react-router";
import { Button, buttonVariants } from "~/components/ui/button";
import { Menu, MenuItem, MenuPopover, MenuTrigger } from "~/components/ui/menu";
import { cn } from "~/lib/utils";

export function ContractsNavigation(props: {
  contractId: number,
  activePage: 'home' | 'movements' | 'actions',
  navigationsDisabled?: boolean
}) {
  const buttonDefs = [
    {
      page: 'home',
      link: `/lists/contracts/${props.contractId}`,
      children: (<><HomeIcon className="size-4" /></>)
    },
    {
      page: 'movements',
      link: `/lists/contracts/${props.contractId}/movements`,
      text: 'Pohyby'
    },
    {
      page: 'actions',
      link: `/lists/contracts/${props.contractId}/actions`,
      text: 'Úkony'
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