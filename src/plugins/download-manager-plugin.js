import { registerPlugin } from '@capacitor/core';

export const DownloadManagerPlugin = registerPlugin('DownloadManagerPlugin', {
  web: () => ({
    async setPendingMetadata(_options) {
      return { success: true };
    },
    async openNativeWebView(_options) {
      return { success: false, message: 'Native WebView not available in web mode.' };
    },
    async deleteFile(_options) {
      return { success: false };
    },
    async checkFileExists(_options) {
      return { exists: false };
    },
    async openFile(_options) {
      return { success: false };
    },
    async getDownloadUrl(_options) {
      return { url: _options?.filePath || '' };
    },
    addListener: () => ({ remove: () => {} }),
  }),
});
