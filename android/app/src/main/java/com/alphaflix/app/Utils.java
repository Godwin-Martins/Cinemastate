package com.alphaflix.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import androidx.core.content.FileProvider;
import java.io.File;

public class Utils {
    private static final String PREF_NAME = "AlphaFlixDownloadPrefs";
    private static final String KEY_PENDING_METADATA = "pending_metadata";
    private static final String KEY_PENDING_DOWNLOADS = "pending_downloads";

    public static Uri getUriForFile(Context context, File file) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            return FileProvider.getUriForFile(context, context.getPackageName() + ".fileprovider", file);
        }
        return Uri.fromFile(file);
    }

    public static void savePendingMetadata(Context context, String metadataJson) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_PENDING_METADATA, metadataJson).apply();
    }

    public static String getPendingMetadata(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        return prefs.getString(KEY_PENDING_METADATA, "");
    }

    public static void savePendingDownload(Context context, String downloadJson) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        String existing = prefs.getString(KEY_PENDING_DOWNLOADS, "[]");
        try {
            org.json.JSONArray array = new org.json.JSONArray(existing);
            array.put(new org.json.JSONObject(downloadJson));
            prefs.edit().putString(KEY_PENDING_DOWNLOADS, array.toString()).apply();
        } catch (Exception e) {
            prefs.edit().putString(KEY_PENDING_DOWNLOADS, "[" + downloadJson + "]").apply();
        }
    }

    public static String getPendingDownloads(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        return prefs.getString(KEY_PENDING_DOWNLOADS, "[]");
    }

    public static void clearPendingDownloads(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        prefs.edit().remove(KEY_PENDING_DOWNLOADS).apply();
    }
}
