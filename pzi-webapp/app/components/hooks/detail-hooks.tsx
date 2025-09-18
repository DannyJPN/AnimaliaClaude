import { SetURLSearchParams } from "react-router";

export function useTabSwitching(props: {
  searchParams: URLSearchParams,
  setSearchParams: SetURLSearchParams,
  defaultTab?: string
}) {
  const { searchParams, setSearchParams, defaultTab } = props;

  const selectedTab = searchParams.get("selectedTab") || defaultTab || "parameters";

  const setSelectedTab = (tab: string | number) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('selectedTab', tab.toString());

    setSearchParams(newSearchParams, {
      preventScrollReset: true,
      replace: true
    });
  };

  return {
    selectedTab,
    setSelectedTab
  };
}
