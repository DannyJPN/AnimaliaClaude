import { useState } from "react";
import toast from "react-hot-toast";
import { downloadFileFromUrl } from "~/lib/download-file";

export function useFileDownload() {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadFile = async (fileUrl: string) => {
    await downloadFileFromUrl(
      fileUrl,
      () => {
        setIsDownloading(true);
      },
      () => {
        setIsDownloading(false);
      },
      () => {
        toast.error('Nastala chyba při stahování.');
      })
  };

  return {
    isDownloading, 
    downloadFile
  };
}
