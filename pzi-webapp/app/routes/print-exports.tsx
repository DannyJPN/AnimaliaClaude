import { redirectDocument } from "react-router";

export async function loader() {
  return redirectDocument("/print-exports/reports-list");
}
