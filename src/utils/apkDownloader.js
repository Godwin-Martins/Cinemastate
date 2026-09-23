const APK_DOWNLOAD_URL = '/apk/AlphaFlix.apk';

export async function downloadAlphaFlixApk() {
  const link = document.createElement('a');
  link.href = APK_DOWNLOAD_URL;
  link.download = 'AlphaFlix.apk';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();

  return true;
}
