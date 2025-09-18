import { Form, SetURLSearchParams, useNavigate } from "react-router";
import { useTableColumnFiltersManagement } from "~/components/hooks/use-table-column-filters-management";
import { Button } from "~/components/ui/button";
import { DialogContent, DialogOverlay } from "~/components/ui/dialog";
import { Label } from "~/components/ui/field";
import { Input, TextField } from "~/components/ui/textfield";

type FiltersProps = {
  setFiltersDisplayed: (displayed: boolean) => void,
  activeTableColumnFilters: Record<string, string[]>,
  searchParams: URLSearchParams,
  setSearchParams: SetURLSearchParams,
};

export function Filters({
  setFiltersDisplayed,
  activeTableColumnFilters,
  searchParams,
  setSearchParams
}: FiltersProps) {
  const navigate = useNavigate();

  const { tableColumnFilters, updateTableColumnFilters, setFilterParamsToQuery, clearFilterParamsInQuery } = useTableColumnFiltersManagement({
    activeTableColumnFilters
  });

  return (
    <DialogOverlay
      isOpen={true}
      onOpenChange={() => {
        setFiltersDisplayed(false);
      }}>

      <DialogContent
        side="left" className="w-full sm:max-w-[375px] overflow-scroll">

        <Form
          className="grid grid-cols-1"
          onSubmit={(evt) => {
            evt.preventDefault();

            setFilterParamsToQuery(searchParams, (newSearchParams) => {
              setFiltersDisplayed(false);

              navigate(`/lists/contracts?${newSearchParams.toString()}`, {
                replace: true
              });
            });
          }}>

          <TextField
            className="w-full"
            name="number"
            value={tableColumnFilters['number']?.at(0) || ''}
            onChange={(value) => {
              updateTableColumnFilters('number', value ? [value] : undefined);
            }}>
            <Label>Číslo</Label>
            <Input type="text" />
          </TextField>

          <TextField
            className="w-full"
            name="year"
            value={tableColumnFilters['year']?.at(0) || ''}
            onChange={(value) => {
              updateTableColumnFilters('year', value ? [value] : undefined);
            }}>
            <Label>Rok</Label>
            <Input type="number" />
          </TextField>

          <div className="flex gap-2 mt-4">
            <Button
              type="submit"
              size="sm">
              Filtrovat
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onPressChange={() => {
                clearFilterParamsInQuery(searchParams, (newSearchParams) => {
                  setFiltersDisplayed(false);

                  navigate(`/lists/contracts?${newSearchParams.toString()}`, {
                    replace: true
                  });
                });
              }}>
              Zrušit filtry
            </Button>
          </div>

        </Form>
      </DialogContent>
    </DialogOverlay>

  );
}