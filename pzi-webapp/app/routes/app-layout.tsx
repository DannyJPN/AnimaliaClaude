import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HomeIcon, MenuIcon, UserIcon } from "lucide-react";
import React from "react";
import { I18nProvider } from "react-aria";
import { Toaster } from "react-hot-toast";
import { data, Link, LoaderFunctionArgs, Outlet, ShouldRevalidateFunctionArgs, UIMatch, useLoaderData, useMatches, useNavigation } from "react-router";
import { apiCall } from '~/.server/api-actions';
import { getUserSession, requireLoggedInUser } from "~/.server/user-session";
import { Button, buttonVariants } from "~/components/ui/button";
import { DialogContent, DialogOverlay, DialogTrigger } from "~/components/ui/dialog";
import { Menu, MenuItem, MenuPopover, MenuTrigger } from "~/components/ui/menu";
import { cn } from "~/lib/utils";
import { DOCUMENTATION_DEPARTMENT, hasOneOfPermissions, JOURNAL_ACCESS, LISTS_EDIT, LISTS_VIEW, RECORDS_EDIT, RECORDS_VIEW } from "~/shared/permissions";

function MenuLink(props: {
  to: string,
  matches: UIMatch[],
  children: React.ReactElement,
  onClick: () => void
}) {
  const isActive = props.matches.some(m => m.pathname.startsWith(props.to));

  return (
    <Link
      className={cn(
        buttonVariants({ variant: "link", size: 'sm' }),
        isActive ? 'font-bold' : ''
      )}
      to={props.to}
      onClick={props.onClick}
    >{props.children}
    </Link>
  );
}

function MainMenuLinks({ closeDialog, userPermissions }: {
  closeDialog: (() => void),
  userPermissions: string[]
}) {
  const matches = useMatches();

  return (
    <ul className="flex flex-col md:flex-row">
      <li>
        <MenuLink
          matches={matches}
          onClick={closeDialog}
          to="/">
          <HomeIcon className="size-4" />
        </MenuLink>
      </li>

      {hasOneOfPermissions(userPermissions, [JOURNAL_ACCESS, DOCUMENTATION_DEPARTMENT]) && (
        <li>
          <MenuLink
            matches={matches}
            onClick={closeDialog}
            to="/journal">
            <span>Deník</span>
          </MenuLink>
        </li>
      )}

      {hasOneOfPermissions(userPermissions, [RECORDS_VIEW, RECORDS_EDIT, DOCUMENTATION_DEPARTMENT]) && (
        <li>
          <MenuLink
            matches={matches}
            onClick={closeDialog}
            to="/records">
            <span>Evidence</span>
          </MenuLink>
        </li>
      )}

      {hasOneOfPermissions(userPermissions, [DOCUMENTATION_DEPARTMENT, LISTS_EDIT, LISTS_VIEW]) && (
        <li>
          <MenuLink
            matches={matches}
            onClick={closeDialog}
            to="/lists/contracts">
            <span>Seznamy</span>
          </MenuLink>
        </li>
      )}

      {hasOneOfPermissions(userPermissions, [DOCUMENTATION_DEPARTMENT]) && (
        <li>
          <MenuLink
            matches={matches}
            onClick={closeDialog}
            to="/print-exports">
            <span>Sestavy</span>
          </MenuLink>
        </li>
      )}

      {hasOneOfPermissions(userPermissions, [DOCUMENTATION_DEPARTMENT, RECORDS_VIEW, RECORDS_EDIT]) && (
        <li>
          <MenuLink
            matches={matches}
            onClick={closeDialog}
            to="/exemplar-list">
            <span>Exempláře</span>
          </MenuLink>
        </li>
      )}

    </ul>
  );
}

export function shouldRevalidate(args: ShouldRevalidateFunctionArgs) {
  return false;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);

  const session = await getUserSession(request);

  let apiVersion = "N/A";
  try {
    const apiResponse = await apiCall('api/version/short', 'GET');
    if (apiResponse.ok) {
      const data = await apiResponse.json();
      apiVersion = data.version;
    }
  } catch (error) {
    console.error("Failed to fetch API version:", error);
  }

  return data({
    userName: session.get('userName'),
    visibleTaxonomyStatuses: session.get('visibleTaxonomyStatuses'),
    taxonomySearchBy: session.get('taxonomySearchBy'),
    permissions: session.get('permissions') || [],
    uiVersion: {
      short: process.env.APP_VERSION_SHORT,
      full: process.env.APP_VERSION_FULL
    },
    apiVersion: apiVersion
  });
}

const queryClient = new QueryClient()

export default function AppLayout() {
  const navigation = useNavigation();
  const isNavigating = Boolean(navigation.location);
  const loaderData = useLoaderData() as Awaited<ReturnType<typeof loader>>["data"];

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen w-full flex-col">

        <header className="sticky top-0 flex h-10 items-center gap-2 border-b bg-background px-2 bg-white z-10">

          <nav className="hidden grow flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:text-sm">
            <MainMenuLinks closeDialog={() => { }} userPermissions={loaderData.permissions} />
          </nav>

          <DialogTrigger>

            <Button variant="outline"
              className="shrink-0 md:hidden w-8 h-8 p-0"
              size="sm">
              <MenuIcon className="size-4" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>

            <DialogOverlay>
              <DialogContent side="left" className="sm:max-w-sm">
                {({ close }) => (
                  <nav className="grid gap-2 text-lg font-medium">
                    <MainMenuLinks closeDialog={close} userPermissions={loaderData.permissions} />
                  </nav>
                )}
              </DialogContent>
            </DialogOverlay>
          </DialogTrigger>

          <div className="grow"></div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">UI: {loaderData.uiVersion.short} | API: {loaderData.apiVersion}</span>
            <MenuTrigger>

              <Button
                variant="outline"
                size="sm"
                className="w-8 h-8 p-0">
                <UserIcon className="size-4" />
              </Button>

              <MenuPopover>
                <Menu>
                  <MenuItem>
                    <UserIcon className="size-4" /> {loaderData.userName}
                  </MenuItem>
                  <MenuItem href="/user-settings">Nastavení</MenuItem>
                  <MenuItem href="/logout">Odhlásit</MenuItem>
                </Menu>
              </MenuPopover>

            </MenuTrigger>
          </div>

        </header>

        <main className="flex flex-1 flex-col">

          {isNavigating && (
            <span className="absolute top-9 right-0 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
            </span>
          )}
          <I18nProvider locale="cs-CZ">
            <Outlet />
          </I18nProvider>
        </main>
      </div >

      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}