package com.escape.chesslens;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.media.projection.MediaProjectionManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.speech.tts.TextToSpeech;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

/**
 * The full Chess Lens app (the same page as the website, served locally), plus the switch for
 * the floating Scan button that works over other apps.
 */
public class MainActivity extends Activity {
    private static final int REQ_FILE = 1;
    private static final int REQ_PROJECTION = 2;

    private WebView web;
    private AssetServer server;
    private ValueCallback<Uri[]> fileCallback;
    private boolean wantOverlay;
    private TextToSpeech tts;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.parseColor("#16181d"));
        server = Server.get(this);
        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#16181d"));
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        web.addJavascriptInterface(new Bridge(this), "ChessLensAndroid");
        web.setWebViewClient(new PageClient(this));
        web.setWebChromeClient(new ChromeClient(this));
        setContentView(web);
        web.loadUrl(pageUrl(getIntent()));
    }

    private String pageUrl(Intent intent) {
        boolean shot = intent != null && intent.getBooleanExtra("shot", false);
        return server.base() + "index.html" + (shot ? "?shot=1&t=" + System.currentTimeMillis() : "");
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (intent.getBooleanExtra("shot", false)) web.loadUrl(pageUrl(intent));
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (wantOverlay && Settings.canDrawOverlays(this)) {
            wantOverlay = false;
            requestProjection();
        }
        web.evaluateJavascript("window.dispatchEvent(new Event('focus'))", null);
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (tts != null) tts.shutdown();
        web.destroy();
        super.onDestroy();
    }

    private void toggleOverlay() {
        if (ScanService.running) {
            startService(new Intent(this, ScanService.class).setAction(ScanService.ACTION_STOP));
            return;
        }
        if (!Settings.canDrawOverlays(this)) {
            wantOverlay = true;
            Toast.makeText(this, "Allow Chess Lens to display over other apps, then come back.", Toast.LENGTH_LONG).show();
            startActivity(new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + getPackageName())));
            return;
        }
        requestProjection();
    }

    private void requestProjection() {
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[] { Manifest.permission.POST_NOTIFICATIONS }, 3);
        }
        MediaProjectionManager mpm = getSystemService(MediaProjectionManager.class);
        startActivityForResult(mpm.createScreenCaptureIntent(), REQ_PROJECTION);
    }

    @Override
    protected void onActivityResult(int req, int result, Intent data) {
        super.onActivityResult(req, result, data);
        if (req == REQ_FILE) {
            if (fileCallback != null) fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result, data));
            fileCallback = null;
        } else if (req == REQ_PROJECTION) {
            if (result != RESULT_OK || data == null) {
                Toast.makeText(this, "Screen sharing is needed for the floating Scan button.", Toast.LENGTH_LONG).show();
                return;
            }
            Intent svc = new Intent(this, ScanService.class).putExtra("code", result).putExtra("data", data);
            startForegroundService(svc);
            Toast.makeText(this, "Open your chess app and tap ♞", Toast.LENGTH_LONG).show();
            moveTaskToBack(true);
        }
    }

    private void say(final String text) {
        if (tts != null) {
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "move");
            return;
        }
        tts = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "move");
        });
    }

    // Static nested classes only (no inner classes): keeps the build's dex tool happy with new javac output.
    private static final class PageClient extends WebViewClient {
        private final MainActivity a;
        PageClient(MainActivity a) { this.a = a; }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
            String url = req.getUrl().toString();
            if (url.startsWith(a.server.base())) return false;
            // Lichess analysis and other links open in the browser.
            try { a.startActivity(new Intent(Intent.ACTION_VIEW, req.getUrl())); } catch (Exception ignored) { }
            return true;
        }
    }

    private static final class ChromeClient extends WebChromeClient {
        private final MainActivity a;
        ChromeClient(MainActivity a) { this.a = a; }

        @Override
        public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> cb, FileChooserParams params) {
            if (a.fileCallback != null) a.fileCallback.onReceiveValue(null);
            a.fileCallback = cb;
            try {
                Intent pick = params.createIntent();
                pick.setType("image/*");
                a.startActivityForResult(Intent.createChooser(pick, "Choose a screenshot"), REQ_FILE);
            } catch (Exception e) {
                a.fileCallback = null;
                return false;
            }
            return true;
        }
    }

    private static final class Bridge {
        private final MainActivity a;
        Bridge(MainActivity a) { this.a = a; }

        @JavascriptInterface
        public void toggleOverlay() { a.runOnUiThread(a::toggleOverlay); }

        @JavascriptInterface
        public boolean isOverlayRunning() { return ScanService.running; }

        @JavascriptInterface
        public void speak(final String text) { a.runOnUiThread(() -> a.say(text)); }

        @JavascriptInterface
        public void onResult(String json) { /* results show in the page itself */ }
    }
}
