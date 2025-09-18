import { useState } from "react";
import { DialogOverlay, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { FileDownIcon } from "lucide-react";
import { useFileDownload } from "~/components/hooks/use-file-download";
import DateRangePicker from "~/components/ui/daterangepicker";
import { CadaverPartner } from "../models";

export function CadaverPartnersDialog({
  partner,
  isOpen,
  onClose
}: {
  partner: CadaverPartner;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const { isDownloading, downloadFile } = useFileDownload();

  const handleDownload = async () => {

    const params = new URLSearchParams({
      dateFrom: dateFrom,
      dateTo: dateTo,
      mode: "kadaverTab",
      locationId: partner.id.toString()
    });

    const fileUrl = `/print-reports/zoology/statistics-cadavers-in-period?${new URLSearchParams(params as any).toString()}`;

    await downloadFile(fileUrl);

    onClose();
  };

  return (
    <DialogOverlay isOpen={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tabulka zázn. kadáver v období pro místo: {partner.keyword}</DialogTitle>
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
            isDisabled={!dateFrom || !dateTo || isDownloading}
          >
            <FileDownIcon className="size-3 mr-2" />
            Generovat report
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogOverlay>
  );
}
