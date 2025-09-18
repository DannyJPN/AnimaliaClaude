import {LoaderFunctionArgs} from "react-router";
import {fetchODataList } from "~/.server/odata-api";
import {exportToXls} from "~/.server/export-xls";
import {Partners} from "~/routes/lists/partners/models";
import {columnDef, columnDefVisibility, PARTNERS_TABLE_ID} from "~/routes/lists/partners/controls";

export async function loader({ request }: LoaderFunctionArgs) {
    const [fetchError, listResult] = await fetchODataList<Partners>(
        `partners?$count=true&orderby=id desc`
    );

    const items: Partners[] = listResult?.items || [];

    return exportToXls(
        request,
        items,
        columnDef,
        columnDefVisibility,
        PARTNERS_TABLE_ID,
        "export-partners"
    );
}