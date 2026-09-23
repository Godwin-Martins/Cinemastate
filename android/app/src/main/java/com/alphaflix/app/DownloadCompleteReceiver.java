package com.alphaflix.app;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import androidx.annotation.NonNull;

import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginHandle;

public class DownloadCompleteReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (DownloadManager.ACTION_DOWNLOAD_COMPLETE.equals(intent.getAction())) {
            long downloadId = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
            if (downloadId != -1) {
                reportDownloadComplete(context, downloadId);
            }
        }
    }

    private void reportDownloadComplete(Context context, long downloadId) {
        DownloadManager downloadManager = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
        if (downloadManager == null) {
            return;
        }

        DownloadManager.Query query = new DownloadManager.Query().setFilterById(downloadId);
        Cursor cursor = null;
        try {
            cursor = downloadManager.query(query);
            if (cursor != null && cursor.moveToFirst()) {
                String uriString = cursor.getString(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_LOCAL_URI));
                String title = cursor.getString(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TITLE));
                int status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
                long size = cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES));

                if (status == DownloadManager.STATUS_SUCCESSFUL && uriString != null) {
                    JSObject download = new JSObject();
                    download.put("id", String.valueOf(downloadId));
                    download.put("title", title != null ? title : "AlphaFlix Download");
                    download.put("filePath", uriString.replace("file://", ""));
                    download.put("fileSize", size);
                    download.put("downloadedAt", String.valueOf(System.currentTimeMillis()));
                    download.put("status", "completed");

                    String metadataJson = Utils.getPendingMetadata(context);
                    if (metadataJson != null && !metadataJson.isEmpty()) {
                        download.put("metadata", metadataJson);
                    }

                    Utils.savePendingDownload(context, download.toString());
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (cursor != null) {
                cursor.close();
            }
        }
    }
}
