import { useState } from "react";
import { DialogOverlay, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { FileDownIcon } from "lucide-react";
import { useFileDownload } from "~/components/hooks/use-file-download";
import DateRangePicker from "~/components/ui/daterangepicker";

export function SpeciesCadaversInPeriodDialog({
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
    
    const params = {
      dateFrom: dateFrom,
      dateTo: dateTo,
      mode: "kadaverTab",
      speciesId: speciesId 
    };
    
    const fileUrl = `/print-reports/zoology/statistics-cadavers-in-period?${new URLSearchParams({...params, mode: "kadaverTab"} as any).toString()}`;

    await downloadFile(fileUrl);
    
    onClose();
  };

  return (
    <DialogOverlay isOpen={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Druh v období</DialogTitle>
        </DialogHeader>

          <div className="space-y-2">
            <DateRangePicker
              from={dateFrom}
              to={dateTo}
              onChange={(from, to) => {
                setDateFrom(from);
                setDateTo(to);
              }}
            />
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
