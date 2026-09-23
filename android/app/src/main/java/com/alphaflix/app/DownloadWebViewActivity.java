package com.alphaflix.app;

import android.annotation.SuppressLint;
import android.app.DownloadManager;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.DownloadListener;
import android.webkit.URLUtil;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

public class DownloadWebViewActivity extends AppCompatActivity {
    private WebView webView;
    private String pendingMetadataJson;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        webView.setLayoutParams(new WebView.LayoutParams(WebView.LayoutParams.MATCH_PARENT, WebView.LayoutParams.MATCH_PARENT));
        setContentView(webView);

        Intent intent = getIntent();
        String url = intent.getStringExtra("url");
        pendingMetadataJson = intent.getStringExtra("metadata");
        Utils.savePendingMetadata(this, pendingMetadataJson != null ? pendingMetadataJson : "");

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setLoadsImagesAutomatically(true);

        webView.setWebViewClient(new WebViewClient());

        webView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String downloadUrl, String userAgent, String contentDisposition, String mimeType, long contentLength) {
                String filename = URLUtil.guessFileName(downloadUrl, contentDisposition, mimeType);
                enqueueDownload(downloadUrl, filename, mimeType, contentLength);
            }
        });

        if (url != null) {
            webView.loadUrl(url);
        }
    }

    private void enqueueDownload(String url, String filename, String mimeType, long length) {
        DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
        request.setTitle(filename);
        request.setDescription("AlphaFlix offline movie download");
        request.setMimeType(mimeType);
        request.allowScanningByMediaScanner();
        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
        request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "AlphaFlix/" + filename);
        request.setAllowedOverMetered(true);
        request.setAllowedOverRoaming(true);

        DownloadManager downloadManager = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
        if (downloadManager != null) {
            downloadManager.enqueue(request);
        }
    }
}
