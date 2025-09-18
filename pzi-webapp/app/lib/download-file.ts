import fileSaver from 'file-saver';

export async function downloadFileFromUrl(fileUrl: string, onStart = () => { }, onFinish = () => { }, onError = (error?: Error) => {}) {
  
  onStart();

  try {
    const fetchResult = await fetch(fileUrl, {
      method: 'GET'
    });

    if (!fetchResult.ok) {
      throw Error(`Error occured, status ${fetchResult.status}`);
    }

    const contentDisposition = fetchResult.headers.get('Content-Disposition');
    const fileName = contentDisposition?.split('filename=')?.[1]?.replaceAll('"', '');
    const blob = await fetchResult.blob();

    fileSaver.saveAs(blob, fileName);
  } catch (err) {
    onError(err as Error);
  }

  onFinish();
}
