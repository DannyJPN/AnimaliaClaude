import { ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { fetchODataList } from "~/.server/odata-api";
import { SelectItemType } from "~/shared/models";

const requestSchema = z.object({
  query: z.string().default('')
});

type LocationItem = {
  id: number;
  name: string;
};

export async function action({ request }: ActionFunctionArgs) {
  const requestBody = await request.json();
  const { query } = requestSchema.parse(requestBody);

  if (query.length < 1) {
    return Response.json([]);
  }

  let filterConditions = [];

  if (query.length >= 1) {
    filterConditions.push(`contains(name, '${query}')`);
  }

  const filterParam = filterConditions.join(' and ');
  const [error, result] = await fetchODataList<LocationItem>(
    `Locations?$filter=${filterParam}&$orderby=name&$top=15`
  );

  const items: LocationItem[] = result?.items || [];

  const locationResults: SelectItemType<number, string>[] = items.map((item) => ({
    key: item.id,
    text: item.name
  }));

  return Response.json(locationResults);
}
