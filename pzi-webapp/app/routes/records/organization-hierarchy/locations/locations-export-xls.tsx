import {LoaderFunctionArgs} from "react-router";
import {fetchODataList} from "~/.server/odata-api";
import {Location} from "~/routes/records/organization-hierarchy/locations/models";
import {exportToXls} from "~/.server/export-xls";
import {columnDef, columnDefVisibility, LOCATIONS_TABLE_ID} from "~/routes/records/organization-hierarchy/locations/controls";

export async function loader({ request }: LoaderFunctionArgs) {
    const [fetchError, listResult] = await fetchODataList<Location>(
        `locations?$count=true&orderby=id desc`
    );
    
    const items: Location[] = listResult?.items || [];

    return exportToXls(
        request,
        items,
        columnDef,         
        columnDefVisibility,  
        LOCATIONS_TABLE_ID,
        "export-locations"
    );
} 