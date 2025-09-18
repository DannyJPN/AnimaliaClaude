import { LoaderFunctionArgs } from "react-router";
import { fetchODataList } from "~/.server/odata-api";

type OriginType = {
  code: string;
  displayName: string;
  sort: number;
  note?: string;
};

export async function loader({ }: LoaderFunctionArgs) {
  const [originTypesError, originTypesResult] = await fetchODataList<OriginType>(
    'origintypes?$orderby=sort'
  );

  if (originTypesError) {
    throw new Response("Failed to load origin types", { status: 500 });
  }

  return Response.json(originTypesResult?.items || []);
}
