import {LoaderFunctionArgs} from "react-router";
import {fetchODataList } from "~/.server/odata-api";
import {exportToXls} from "~/.server/export-xls";
import {Zoos} from "~/routes/lists/zoos/models";
import {columnDef, columnDefVisibility, ZOOS_TABLE_ID} from "~/routes/lists/zoos/controls";

export async function loader({ request }: LoaderFunctionArgs) {
    const [fetchError, listResult] = await fetchODataList<Zoos>(
        `zoos?$count=true&orderby=id desc`
    );

    const items: Zoos[] = listResult?.items || [];

    return exportToXls(
        request,
        items,
        columnDef,
        columnDefVisibility,
        ZOOS_TABLE_ID,
        "export-zoos"
    );
}
