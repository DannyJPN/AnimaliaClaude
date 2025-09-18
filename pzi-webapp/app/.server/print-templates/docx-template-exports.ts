import { createReport } from 'docx-templates';
import fs from 'fs/promises';
import path from "node:path";
import { pziConfig } from "../pzi-config";

export async function renderDocxPrintExport(templateName: string, data: Record<string, string>, config = pziConfig) {
  const templatePath = path.join(config.PRINT_TEMPATES_FOLDER, templateName);

  const template = await fs.readFile(templatePath);

  const buffer = await createReport({
    template,
    data,
    cmdDelimiter: ['{{', '}}'],
    noSandbox: true,
    failFast: false
  });

  return buffer;
}
