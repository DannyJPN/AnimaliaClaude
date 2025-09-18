import { FastForwardIcon, RewindIcon, StepBackIcon, StepForwardIcon } from "lucide-react";
import { Button } from "../ui/button";
import { useNavigate } from "react-router";

export type ItemListNavigationStringProps<TItem extends { id: string }> = {
  currentItem: TItem | undefined,
  items: TItem[] | undefined,
  getItemLink: (item: TItem) => string
};

export function ItemListNavigationString<TItem extends { id: string }>(props: ItemListNavigationStringProps<TItem>) {
  const navigate = useNavigate();

  const currentItemIndex = (props.items || []).findIndex(({ id }) => id === props.currentItem?.id);

  const firstItem = props.items?.at(0);
  const lastItem = props.items?.at(-1);

  const prevIndex = currentItemIndex - 1;
  const nextIndex = currentItemIndex + 1;

  const prevItem = prevIndex < 0
    ? undefined
    : props.items?.at(prevIndex);

  const nextItem = nextIndex > (props.items?.length || 0)
    ? undefined
    : props.items?.at(nextIndex);

  const firstUrl = firstItem ? props.getItemLink(firstItem) : undefined;
  const lastUrl = lastItem ? props.getItemLink(lastItem) : undefined;
  const prevUrl = prevItem ? props.getItemLink(prevItem) : undefined;
  const nexttUrl = nextItem ? props.getItemLink(nextItem) : undefined;

  return (
    <div
      className="flex gap-2 justify-center grow p-2">

      <Button
        variant="outline"
        size="sm"
        isDisabled={!firstUrl}
        onPress={() => {
          navigate(firstUrl!, { replace: true });
        }}>
        <RewindIcon className="size-4" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        isDisabled={!prevUrl}
        onPress={() => {
          navigate(prevUrl!, { replace: true });
        }}>
        <StepBackIcon className="size-4" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        isDisabled={!nexttUrl}
        onPress={() => {
          navigate(nexttUrl!, { replace: true });
        }}>
        <StepForwardIcon className="size-4" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        isDisabled={!lastUrl}
        onPress={() => {
          navigate(lastUrl!, { replace: true });
        }}>
        <FastForwardIcon className="size-4" />
      </Button>

    </div>
  );
}
