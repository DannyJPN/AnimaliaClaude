import { redirectDocument } from "react-router";

export async function loader() {
  //return redirectDocument("/journal/bio-data");
  return redirectDocument("/journal/journal-entries");
}