const APK_DOWNLOAD_URL = '/apk/AlphaFlix.apk';

export async function downloadAlphaFlixApk(onProgress = () => {}) {
  const response = await fetch(APK_DOWNLOAD_URL);
  if (!response.ok) {
    throw new Error(`APK download failed with status ${response.status}`);
  }

  const totalBytes = Number(response.headers.get('content-length'));
  const reader = response.body?.getReader();
  let apkBlob;

  if (reader) {
    const chunks = [];
    let receivedBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      receivedBytes += value.length;
      onProgress(totalBytes > 0 ? Math.min(99, Math.round((receivedBytes / totalBytes) * 100)) : null);
    }

    apkBlob = new Blob(chunks, { type: 'application/vnd.android.package-archive' });
  } else {
    apkBlob = await response.blob();
  }

  const link = document.createElement('a');
  const downloadUrl = URL.createObjectURL(apkBlob);
  link.href = downloadUrl;
  link.download = 'AlphaFlix.apk';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);

  onProgress(100);
}
