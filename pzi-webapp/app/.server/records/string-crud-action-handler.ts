import { data } from "react-router";
import { apiDelete, apiEdit, apiInsert } from "../api-actions";
import { pziConfig } from "../pzi-config";
import { getUserName } from "../user-session";

export async function handleStringCUD<TItem extends { code: string }>(
  request: Request,
  parsePostData: (formData: FormData) => Partial<TItem>,
  apiUrl: string,
  config = pziConfig
) {
  const userName = await getUserName(request);
  const formData = await request.formData();

  const formAction = String(formData.get('formAction'));
  const postData = parsePostData(formData);

  switch (formAction) {
    case 'insert': {
      const result = await apiInsert<TItem, Partial<TItem>>(
        apiUrl,
        postData,
        userName!,
        config
      );

      return data(result);
    }

    case 'edit': {
      const result = await apiEdit<TItem, Partial<TItem>>(
        `${apiUrl}/${postData.code}`, // Changed from postData.id to postData.code
        postData,
        userName!,
        config
      );

      return data(result);
    }

    case 'delete': {
      const result = await apiDelete<TItem, Partial<TItem>>(
        `${apiUrl}/${postData.code}`, // Changed from postData.id to postData.code
        postData,
        userName!,
        config
      );

      return data(result);
    }

    default: {
      throw new Error('Unsupported action');
    }
  }
}
