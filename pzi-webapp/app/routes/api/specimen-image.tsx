import { LoaderFunctionArgs } from "react-router";
import { fetchODataList } from "~/.server/odata-api";

export async function loader({ params }: LoaderFunctionArgs) {
  const imageId = params.imageId;

  const [fetchError, listResult] = await fetchODataList<{ image: string, contentType: string }>(
    `SpecimenImages?$count=true&$filter=id eq ${imageId}`
  );

  if (!listResult?.items || listResult.items.length === 0) {
    throw new Response('', { status: 404 });
  }

  const imageData = listResult.items[0];
  const imageBuffer = Buffer.from(imageData.image, 'base64');

  return new Response(imageBuffer, {
    status: 200,
    headers: {
      "Content-Type": imageData.contentType || "image/png"
    }
  });
}
