import { useState } from "react";
import { DialogOverlay, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { FileDownIcon } from "lucide-react";
import { useFileDownload } from "~/components/hooks/use-file-download";
import { CadaverPartner } from "../models";
import { ZooFormatDateField } from "~/components/ui/zoo-format-datefield";

export function MovementsByPartnerDialog({ partner, isOpen, onClose }: { partner: CadaverPartner, isOpen: boolean, onClose: () => void }) {
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');

    const { isDownloading, downloadFile } = useFileDownload();

    const handleDownload = async () => {
        if (!dateFrom || !dateTo) return;

        const params = new URLSearchParams({
            minDate: dateFrom,
            maxDate: dateTo,
            partnerId: partner.id.toString()
        });

        await downloadFile(`/print-reports/zoology/movement-in-zoo-by-partner?${new URLSearchParams(params).toString()}`);
       
        onClose();
    };

    return (
      <DialogOverlay isOpen={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pohyb podle partnerů: {partner.keyword}</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <ZooFormatDateField
              name="dateFrom"
              value={dateFrom}
              onChange={setDateFrom}
              label="Datum od"
            />

            <ZooFormatDateField
              name="dateTo"
              value={dateTo}
              onChange={setDateTo}
              label="Datum do"
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