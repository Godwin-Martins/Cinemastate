package com.alphaflix.app;

import android.app.DownloadManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.webkit.MimeTypeMap;

import androidx.annotation.NonNull;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginAnnotation;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

@CapacitorPlugin(
    name = "DownloadManagerPlugin",
    permissions = {
        @Permission(strings = {android.Manifest.permission.INTERNET}, alias = "internet"),
        @Permission(strings = {android.Manifest.permission.READ_EXTERNAL_STORAGE}, alias = "read"),
        @Permission(strings = {android.Manifest.permission.WRITE_EXTERNAL_STORAGE}, alias = "write")
    }
)
public class DownloadManagerPlugin extends Plugin {
    private BroadcastReceiver downloadReceiver;
    private JSObject pendingMetadata;

    @Override
    public void load() {
        downloadReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (DownloadManager.ACTION_DOWNLOAD_COMPLETE.equals(intent.getAction())) {
                    long downloadId = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
                    if (downloadId == -1) {
                        return;
                    }
                    reportDownloadComplete(downloadId);
                }
            }
        };
        getContext().registerReceiver(downloadReceiver, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE));
    }

    @Override
    public void handleOnDestroy() {
        if (downloadReceiver != null) {
            getContext().unregisterReceiver(downloadReceiver);
            downloadReceiver = null;
        }
    }

    @PluginMethod
    public void setPendingMetadata(PluginCall call) {
        pendingMetadata = new JSObject();
        pendingMetadata.put("title", call.getString("title", "AlphaFlix Download"));
        pendingMetadata.put("posterUrl", call.getString("posterUrl", ""));
        pendingMetadata.put("sourceUrl", call.getString("sourceUrl", ""));
        pendingMetadata.put("itemType", call.getString("itemType", "media"));
        pendingMetadata.put("episodeNumber", call.getInt("episodeNumber", -1));
        call.resolve();
    }

    @PluginMethod
    public void openNativeWebView(PluginCall call) {
        String url = call.getString("url");
        if (url == null) {
            call.reject("URL required");
            return;
        }

        Intent intent = new Intent(getContext(), DownloadWebViewActivity.class);
        intent.putExtra("url", url);
    String metadataJson = pendingMetadata != null ? pendingMetadata.toString() : "";
    intent.putExtra("metadata", metadataJson);
    Utils.savePendingMetadata(getContext(), metadataJson);

        JSObject result = new JSObject();
        result.put("success", true);
        call.resolve(result);
    }

    @PluginMethod
    public void deleteFile(PluginCall call) {
        String filePath = call.getString("filePath");
        if (filePath == null) {
            call.reject("filePath required");
            return;
        }

        File file = new File(filePath);
        boolean deleted = file.exists() && file.delete();
        JSObject result = new JSObject();
        result.put("success", deleted);
        call.resolve(result);
    }

    @PluginMethod
    public void checkFileExists(PluginCall call) {
        String filePath = call.getString("filePath");
        boolean exists = false;
        if (filePath != null) {
            File file = new File(filePath);
            exists = file.exists();
        }
        JSObject result = new JSObject();
        result.put("exists", exists);
        call.resolve(result);
    }

    @PluginMethod
    public void openFile(PluginCall call) {
        String filePath = call.getString("filePath");
        if (filePath == null) {
            call.reject("filePath required");
            return;
        }

        File file = new File(filePath);
        if (!file.exists()) {
            call.reject("File does not exist");
            return;
        }

        Uri uri = Utils.getUriForFile(getContext(), file);
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(uri, getMimeType(filePath));
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);

        try {
            getContext().startActivity(intent);
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Unable to open file: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getPendingDownloads(PluginCall call) {
        String pending = Utils.getPendingDownloads(getContext());
        JSObject result = new JSObject();
        result.put("pending", pending);
        Utils.clearPendingDownloads(getContext());
        call.resolve(result);
    }

    @PluginMethod
    public void getDownloadUrl(PluginCall call) {
        String filePath = call.getString("filePath");
        JSObject result = new JSObject();
        result.put("url", filePath != null ? filePath : "");
        call.resolve(result);
    }

    private void reportDownloadComplete(long downloadId) {
        DownloadManager downloadManager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
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
                    download.put("posterUrl", pendingMetadata != null ? pendingMetadata.getString("posterUrl") : "");
                    download.put("sourceUrl", pendingMetadata != null ? pendingMetadata.getString("sourceUrl") : "");
                    download.put("itemType", pendingMetadata != null ? pendingMetadata.getString("itemType") : "media");
                    download.put("episodeNumber", pendingMetadata != null ? pendingMetadata.getInteger("episodeNumber", -1) : -1);

                    JSObject event = new JSObject();
                    event.put("download", download);
                    notifyListeners("downloadComplete", event, true);
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

    private String getMimeType(String url) {
        String type = null;
        String extension = MimeTypeMap.getFileExtensionFromUrl(url);
        if (extension != null) {
            type = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension.toLowerCase());
        }
        if (type == null) {
            type = "video/mp4";
        }
        return type;
    }
}
