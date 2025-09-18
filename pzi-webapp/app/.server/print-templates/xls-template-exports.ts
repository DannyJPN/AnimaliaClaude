import exceljs from "exceljs";
import { pziConfig } from "../pzi-config";
import path from "node:path";

export type TemplateCell = {
  style: Partial<exceljs.Style>,
  value: string | number | null,
  originalAddress: string
};

export type TemplateBlock = {
  blockName: string,
  rows: TemplateCell[][],
  originalMerges: string[],
  columnWidths: number[],
  columnHidden?: boolean[]
};

export async function prepareTemplateBlocks(templateName: string, templateWorksheet: string, config = pziConfig) {
  const templatePath = path.join(pziConfig.PRINT_TEMPATES_FOLDER, templateName);

  const wb = new exceljs.Workbook();

  await wb.xlsx.readFile(templatePath);
  const ws = wb.getWorksheet(templateWorksheet)!;

  const templateBlocks: TemplateBlock[] = [];
  let currentBlock: string = '';
  let currentBlockLastColumn: number = 0;

  // NOTE: Row range is defined by print area. We need to use it and then fall back to rowcount defined in worksheet.
  let rowCount = ws.rowCount;

  if (ws.pageSetup.printArea) {
    const lastPrintAreaCell = ws.pageSetup.printArea.split(':').at(-1);
    if (lastPrintAreaCell) {
      const rowMatch = lastPrintAreaCell.match(/[0-9]+$/);
      if (rowMatch) {
        rowCount = parseInt(rowMatch[0], 10);
      }
    }
  }

  for (let r = 1; r <= rowCount; r++) {
    const rowBlock = ws.getCell(r, 1).text;

    const isNewBlock = currentBlock !== rowBlock
      && rowBlock !== '';

    if (isNewBlock) {
      currentBlock = rowBlock;

      let lastCol = 2;
      let foundBlock = false;
      while (lastCol <= ws.columnCount) {
        const cellText = ws.getCell(r, lastCol).text;
        if (cellText === rowBlock) {
          foundBlock = true;
          break;
        }
        lastCol++;
      }

      if (!foundBlock) {
        lastCol = ws.columnCount;
      }

      currentBlockLastColumn = lastCol - 1;

      if (currentBlockLastColumn < 2) {
        currentBlockLastColumn = 2;
      }

      const columnWidths: number[] = [];
      const columnHidden: boolean[] = [];
      for (let c = 2; c <= currentBlockLastColumn; c++) {
        const col = ws.getColumn(c);
        if (col) {
          columnWidths.push(col.width || 8.43);
          columnHidden.push(!!col.hidden);
        } else {
          columnWidths.push(8.43);
          columnHidden.push(false);
        }
      }

      const newBlock = {
        blockName: rowBlock,
        rows: [] as any[],
        originalMerges: [] as string[],
        columnWidths,
        columnHidden
      };
      templateBlocks.push(newBlock);
    }

    const templateRowCells: TemplateCell[] = [];

    for (let c = 2; c <= currentBlockLastColumn; c++) {
      const cell = ws.getCell(r, c);

      const originalCellValue = cell.value; // Value from exceljs
      const formula = cell.formula;
      let finalValueForTemplateCell: string | number | null;

      if (formula) {
        finalValueForTemplateCell = `=${formula}`;
      } else {
        if (typeof originalCellValue === 'string' || typeof originalCellValue === 'number') {
          finalValueForTemplateCell = originalCellValue;
        } else {
          // If originalCellValue is not string/number (e.g., RichText, Date, boolean, null, error)
          const textRepresentation = cell.text;
          if (textRepresentation && typeof textRepresentation === 'string') {
            finalValueForTemplateCell = textRepresentation;
          } else {
            finalValueForTemplateCell = null;
          }
        }
      }

      const cellCopyValue = {
        style: cell.style,
        value: finalValueForTemplateCell,
        originalAddress: cell.address
      };

      if (cell.isMerged) {
        const mergeStart = ws.model.merges.find(m => m.startsWith(`${cell.address}:`));
        if (mergeStart) {
          templateBlocks.at(-1)?.originalMerges.push(mergeStart);
        }
      }

      templateRowCells.push(cellCopyValue);
    }

    templateBlocks.at(-1)?.rows.push(templateRowCells);
  }

  return templateBlocks;
}

export type BlockData = {
  blockName: string,
  data: Record<string, string | number>,
  applyBlockUpdates?: (ctx: { ws: exceljs.Worksheet, blockLastRow: number }) => void
}

export async function renderPrintExport(templateBlocks: TemplateBlock[], blockDataRows: BlockData[]) {
  const workbook = new exceljs.Workbook();

  const worksheets: exceljs.Worksheet[] = [];

  let currentRow: number = 1;

  for (const blockDataRow of blockDataRows) {
    if (blockDataRow.blockName === 'NEW_SHEET') {
      const sheetName = blockDataRow.data["SHEET_NAME"] as string;
      const newSheet = workbook.addWorksheet(sheetName);

      worksheets.push(newSheet);
      currentRow = 1;

      continue;
    }

    let worksheet = worksheets.at(-1);

    if (!worksheet) {
      worksheets.push(workbook.addWorksheet());
      worksheet = worksheets.at(0)!;
    }

    // Get template block and set column widths
    const templateBlock = templateBlocks.find(tb => tb.blockName === blockDataRow.blockName)!;
    templateBlock.columnWidths.forEach((width, index) => {
      const col = worksheet.getColumn(index + 1);
      col.width = width;
      if (templateBlock.columnHidden?.[index]) {
        col.hidden = true;
      }
    });

    const templateKeys = Object.entries(blockDataRow.data).map(([k, v]) => {
      return {
        dataKey: k,
        templateKey: `%(${k})`,
        value: v
      };
    });
    const merges = templateBlock.originalMerges.reduce((acc, curr) => {
      acc[curr] = { start: '', end: '' };
      return acc;
    }, {} as Record<string, { start: string, end: string }>);

    for (const templateRow of templateBlock.rows) {
      let currentCell: number = 1;

      for (const templateCell of templateRow) {

        const cell = worksheet.getCell(currentRow, currentCell);
        cell.style = templateCell.style;

        const cellValue = templateCell.value;

        if (typeof cellValue === 'string') {
          if (cellValue.startsWith('=')) {
            cell.value = { formula: cellValue };
          } else {
            const matchingTemplates = templateKeys.filter(({ templateKey }) =>
              templateKey && cellValue.includes(templateKey)
            );

            if (matchingTemplates.length === 1 && cellValue.trim() === matchingTemplates[0].templateKey) {
              cell.value = matchingTemplates[0].value;
            } else {
              let result = cellValue;
              for (const { templateKey, value } of templateKeys) {
                if (templateKey && result.includes(templateKey)) {
                  const replacementString = (value !== null && value !== undefined) ? String(value) : '';
                  result = result.replaceAll(templateKey, replacementString);
                }
              }
              cell.value = result;
            }
          }
        } else {
          // For non-string cellValue (e.g., numbers or null from template), assign directly
          cell.value = cellValue;
        }

        const mergeStart = templateBlock.originalMerges.find((om) => om.startsWith(`${templateCell.originalAddress}:`));
        const mergeEnd = templateBlock.originalMerges.find((om) => om.endsWith(`:${templateCell.originalAddress}`));

        if (mergeStart) {
          merges[mergeStart].start = cell.address;
        }

        if (mergeEnd) {
          merges[mergeEnd].end = cell.address;
        }

        currentCell += 1;
      }

      currentRow += 1;
    }

    for (const merge of Object.values(merges)) {
      worksheet.mergeCells(`${merge.start}:${merge.end}`);
    } 

    if (blockDataRow.applyBlockUpdates) {
      blockDataRow.applyBlockUpdates({
        ws: worksheet,
        blockLastRow: currentRow - 1
      });
    }
  }

  if (worksheets.length === 0) {
    workbook.addWorksheet();
  }

  return [workbook] as const;
}
