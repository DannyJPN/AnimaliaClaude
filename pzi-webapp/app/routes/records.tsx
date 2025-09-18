import { redirectDocument } from "react-router";

export async function loader() {
  return redirectDocument("/records/phyla/1/classes");
}
