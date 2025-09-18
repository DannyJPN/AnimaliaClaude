import { useState } from "react";
import { DialogOverlay, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input, TextField } from "~/components/ui/textfield";
import { FieldError, Label } from "~/components/ui/field";
import { FileDownIcon } from "lucide-react";
import { useFileDownload } from "~/components/hooks/use-file-download";
import DateRangePicker from "~/components/ui/daterangepicker";

export function SpeciesHistoryInPeriodDialog({
  speciesId,
  isOpen,
  onClose
}: {
  speciesId: number;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const { isDownloading, downloadFile } = useFileDownload();

  const handleDownload = async () => {

    const params = new URLSearchParams({
      fromDate: dateFrom,
      toDate: dateTo
    });

    const fileUrl = `/print-reports/species/species-history/${speciesId}?${new URLSearchParams({...params, mode: "kadaverTab"} as any).toString()}`;

    await downloadFile(fileUrl);

    onClose();
  };

  return (
    <DialogOverlay isOpen={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Druh v období</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <TextField name="dateFrom">
            <Label>Datum od</Label>
            <Input
              type="text"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <FieldError />
          </TextField>

          <TextField name="dateTo">
            <Label>Datum do</Label>
            <Input
              type="text"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
            <FieldError />
          </TextField>
        </div>

        <DialogFooter className="pt-4">
          <Button variant="outline" onPress={onClose}>Zrušit</Button>
          <Button
            onPress={handleDownload}
            isDisabled={!dateFrom || !dateTo}
          >
            <FileDownIcon className="size-3 mr-2" />
            Generovat report
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogOverlay>
  );
}
