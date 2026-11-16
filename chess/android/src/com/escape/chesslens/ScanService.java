package com.escape.chesslens;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.hardware.display.DisplayManager;
import android.hardware.display.VirtualDisplay;
import android.media.Image;
import android.media.ImageReader;
import android.media.projection.MediaProjection;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.IBinder;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.util.DisplayMetrics;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;

/**
 * The floating scanner. Keeps a screen-capture stream open (one Android permission prompt),
 * shows a draggable ♞ button over every app, and on tap: hides itself, grabs the current
 * screen, hands it to a hidden copy of the Chess Lens page (which finds the board, reads it
 * and runs Stockfish) and shows the best move in a small card at the top of the screen.
 */
public class ScanService extends Service {
    static final String ACTION_STOP = "com.escape.chesslens.STOP";
    static volatile boolean running;

    private static final String CHANNEL = "scanner";

    private final Object lock = new Object();
    private Handler main;
    private HandlerThread imageThread;
    private WindowManager wm;
    private MediaProjection projection;
    private VirtualDisplay display;
    private ImageReader reader;
    private Image latest;
    private int capW, capH;

    private TextView bubble;
    private WindowManager.LayoutParams bubbleLp;
    private LinearLayout card;
    private TextView cardBest, cardEval, cardSub, cardLines;
    private WebView web;
    private boolean webReady;
    private boolean busy;
    private TextToSpeech tts;

    @Override
    public IBinder onBind(Intent intent) { return null; }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null || ACTION_STOP.equals(intent.getAction())) {
            stopSelf();
            return START_NOT_STICKY;
        }
        if (projection != null) return START_NOT_STICKY;
        main = new Handler(Looper.getMainLooper());
        wm = getSystemService(WindowManager.class);
        goForeground();

        int code = intent.getIntExtra("code", 0);
        Intent data = intent.getParcelableExtra("data");
        MediaProjectionManager mpm = getSystemService(MediaProjectionManager.class);
        try {
            projection = mpm.getMediaProjection(code, data);
        } catch (Exception e) {
            projection = null;
        }
        if (projection == null) {
            stopSelf();
            return START_NOT_STICKY;
        }
        projection.registerCallback(new StopWatcher(this), main);

        startCapture();
        showBubble();
        buildCard();
        startPage();
        running = true;
        return START_NOT_STICKY;
    }

    /* ---------------------------------------------------------------- notification */

    private void goForeground() {
        NotificationManager nm = getSystemService(NotificationManager.class);
        nm.createNotificationChannel(new NotificationChannel(CHANNEL, "Floating scanner", NotificationManager.IMPORTANCE_LOW));
        PendingIntent stop = PendingIntent.getService(this, 1,
                new Intent(this, ScanService.class).setAction(ACTION_STOP), PendingIntent.FLAG_IMMUTABLE);
        PendingIntent open = PendingIntent.getActivity(this, 2,
                new Intent(this, MainActivity.class), PendingIntent.FLAG_IMMUTABLE);
        Notification n = new Notification.Builder(this, CHANNEL)
                .setSmallIcon(android.R.drawable.ic_menu_search)
                .setContentTitle("Chess Lens scanner is on")
                .setContentText("Tap ♞ over your chess app to see the best move.")
                .setContentIntent(open)
                .addAction(new Notification.Action.Builder(null, "Stop", stop).build())
                .setOngoing(true)
                .build();
        if (Build.VERSION.SDK_INT >= 29) startForeground(1, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION);
        else startForeground(1, n);
    }

    /* ---------------------------------------------------------------- capture */

    @SuppressWarnings("deprecation")
    private void startCapture() {
        DisplayMetrics m = new DisplayMetrics();
        wm.getDefaultDisplay().getRealMetrics(m);
        float k = Math.min(1f, 1600f / Math.max(m.widthPixels, m.heightPixels));
        capW = Math.round(m.widthPixels * k) & ~1;
        capH = Math.round(m.heightPixels * k) & ~1;
        imageThread = new HandlerThread("chesslens-capture");
        imageThread.start();
        Handler h = new Handler(imageThread.getLooper());
        reader = ImageReader.newInstance(capW, capH, PixelFormat.RGBA_8888, 3);
        // Always hold on to the newest frame: a static screen sends no new frames.
        reader.setOnImageAvailableListener(r -> {
            Image img;
            try { img = r.acquireLatestImage(); } catch (IllegalStateException e) { return; }
            if (img == null) return;
            synchronized (lock) {
                if (latest != null) latest.close();
                latest = img;
            }
        }, h);
        display = projection.createVirtualDisplay("ChessLens", capW, capH, m.densityDpi,
                DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR, reader.getSurface(), null, h);
    }

    private byte[] grabJpeg() {
        synchronized (lock) {
            if (latest == null) return null;
            Image.Plane p = latest.getPlanes()[0];
            ByteBuffer buf = p.getBuffer();
            int ps = p.getPixelStride(), rs = p.getRowStride();
            int bw = rs / ps;
            int w = latest.getWidth(), h = latest.getHeight();
            Bitmap full = Bitmap.createBitmap(bw, h, Bitmap.Config.ARGB_8888);
            buf.rewind();
            if (buf.remaining() < bw * h * 4) {
                ByteBuffer padded = ByteBuffer.allocate(bw * h * 4);
                padded.put(buf);
                padded.rewind();
                buf = padded;
            }
            full.copyPixelsFromBuffer(buf);
            Bitmap shot = bw == w ? full : Bitmap.createBitmap(full, 0, 0, w, h);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            shot.compress(Bitmap.CompressFormat.JPEG, 93, out);
            if (shot != full) shot.recycle();
            full.recycle();
            return out.toByteArray();
        }
    }

    /* ---------------------------------------------------------------- floating views */

    private int dp(float v) {
        return Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics()));
    }

    private WindowManager.LayoutParams overlayParams(int w, int h, int extraFlags) {
        WindowManager.LayoutParams lp = new WindowManager.LayoutParams(w, h,
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | extraFlags,
                PixelFormat.TRANSLUCENT);
        lp.gravity = Gravity.TOP | Gravity.START;
        return lp;
    }

    private void showBubble() {
        bubble = new TextView(this);
        bubble.setText("♞");
        bubble.setTextColor(Color.WHITE);
        bubble.setTextSize(TypedValue.COMPLEX_UNIT_SP, 28);
        bubble.setGravity(Gravity.CENTER);
        GradientDrawable bg = new GradientDrawable();
        bg.setShape(GradientDrawable.OVAL);
        bg.setColor(Color.parseColor("#3f8a22"));
        bg.setStroke(dp(3), Color.WHITE);
        bubble.setBackground(bg);
        bubble.setElevation(dp(6));
        int size = dp(58);
        bubbleLp = overlayParams(size, size, 0);
        DisplayMetrics m = getResources().getDisplayMetrics();
        bubbleLp.x = m.widthPixels - size - dp(10);
        bubbleLp.y = (int) (m.heightPixels * 0.62f);
        bubble.setOnTouchListener(new Dragger(this));
        wm.addView(bubble, bubbleLp);
    }

    private TextView text(float sp, int color, boolean bold) {
        TextView t = new TextView(this);
        t.setTextSize(TypedValue.COMPLEX_UNIT_SP, sp);
        t.setTextColor(color);
        if (bold) t.setTypeface(Typeface.DEFAULT_BOLD);
        return t;
    }

    private Button button(String label, View.OnClickListener l) {
        Button b = new Button(this);
        b.setText(label);
        b.setAllCaps(false);
        b.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        b.setTextColor(Color.WHITE);
        GradientDrawable bg = new GradientDrawable();
        bg.setCornerRadius(dp(9));
        bg.setColor(Color.parseColor("#2c313b"));
        b.setBackground(bg);
        b.setPadding(dp(10), 0, dp(10), 0);
        b.setMinHeight(dp(36));
        b.setMinimumHeight(dp(36));
        b.setOnClickListener(l);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, dp(38), 1f);
        lp.setMarginEnd(dp(6));
        b.setLayoutParams(lp);
        return b;
    }

    private void buildCard() {
        card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setPadding(dp(14), dp(10), dp(14), dp(10));
        GradientDrawable bg = new GradientDrawable();
        bg.setCornerRadius(dp(16));
        bg.setColor(Color.parseColor("#F01f2229"));
        card.setBackground(bg);
        card.setElevation(dp(8));

        LinearLayout top = new LinearLayout(this);
        top.setGravity(Gravity.CENTER_VERTICAL);
        cardBest = text(26, Color.WHITE, true);
        cardEval = text(15, Color.parseColor("#c9cdd6"), true);
        cardEval.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        cardEval.setPadding(dp(10), 0, 0, 0);
        View spacer = new View(this);
        TextView close = text(20, Color.parseColor("#9aa1b0"), false);
        close.setText("✕");
        close.setPadding(dp(12), 0, dp(4), 0);
        close.setOnClickListener(v -> card.setVisibility(View.GONE));
        top.addView(cardBest);
        top.addView(cardEval);
        top.addView(spacer, new LinearLayout.LayoutParams(0, 1, 1f));
        top.addView(close);
        card.addView(top);

        cardSub = text(14, Color.parseColor("#c9cdd6"), false);
        card.addView(cardSub);
        cardLines = text(12, Color.parseColor("#9aa1b0"), false);
        cardLines.setTypeface(Typeface.MONOSPACE);
        cardLines.setPadding(0, dp(4), 0, dp(6));
        card.addView(cardLines);

        LinearLayout row = new LinearLayout(this);
        row.addView(button("Other side to move", v -> js("window.chessLensToggleTurn && window.chessLensToggleTurn()")));
        row.addView(button("Flip board", v -> js("window.chessLensFlip && window.chessLensFlip()")));
        row.addView(button("Fix in app", v -> {
            card.setVisibility(View.GONE);
            startActivity(new Intent(this, MainActivity.class).putExtra("shot", true).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        }));
        card.addView(row);
        card.setVisibility(View.GONE);

        DisplayMetrics m = getResources().getDisplayMetrics();
        WindowManager.LayoutParams lp = overlayParams(m.widthPixels - dp(16), WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL);
        lp.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;
        lp.y = dp(28);
        wm.addView(card, lp);
    }

    private void showCard(String best, String eval, String sub, String lines) {
        cardBest.setText(best);
        cardEval.setText(eval);
        cardEval.setVisibility(eval.isEmpty() ? View.GONE : View.VISIBLE);
        cardSub.setText(sub);
        cardSub.setVisibility(sub.isEmpty() ? View.GONE : View.VISIBLE);
        cardLines.setText(lines);
        cardLines.setVisibility(lines.isEmpty() ? View.GONE : View.VISIBLE);
        card.setVisibility(View.VISIBLE);
    }

    /* ---------------------------------------------------------------- hidden page */

    private void startPage() {
        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        web.addJavascriptInterface(new Bridge(this), "ChessLensAndroid");
        // 1×1 px and untouchable: present (so it keeps running) but invisible.
        WindowManager.LayoutParams lp = overlayParams(1, 1, WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE);
        wm.addView(web, lp);
        web.loadUrl(Server.get(this).base() + "index.html?overlay=1");
    }

    private void js(String code) {
        if (web != null) web.evaluateJavascript(code, null);
    }

    private void scan() {
        if (busy) return;
        if (!webReady) {
            showCard("Starting…", "", "Chess Lens is loading the engine. Tap ♞ again in a second.", "");
            return;
        }
        busy = true;
        // Hide our own views so they aren't in the picture, give the screen a moment to redraw.
        bubble.setVisibility(View.INVISIBLE);
        card.setVisibility(View.GONE);
        main.postDelayed(() -> {
            byte[] jpeg = grabJpeg();
            bubble.setVisibility(View.VISIBLE);
            bubble.setText("…");
            if (jpeg == null) {
                done();
                showCard("No picture yet", "", "Screen sharing hasn't delivered a frame yet. Try again.", "");
                return;
            }
            Server.get(this).setShot(jpeg);
            showCard("Reading board…", "", "", "");
            js("window.chessLensScan('/shot.jpg?t=" + System.currentTimeMillis() + "')");
            main.postDelayed(() -> { if (busy) done(); }, 30000);
        }, 260);
    }

    private void done() {
        busy = false;
        bubble.setText("♞");
    }

    private void handleResult(String json) {
        try {
            JSONObject o = new JSONObject(json);
            String type = o.optString("type");
            switch (type) {
                case "ready":
                    webReady = true;
                    break;
                case "info":
                case "done": {
                    String side = "w".equals(o.optString("turn")) ? "White to move" : "Black to move";
                    StringBuilder lines = new StringBuilder();
                    JSONArray arr = o.optJSONArray("lines");
                    for (int i = 0; arr != null && i < Math.min(3, arr.length()); i++) {
                        if (i > 0) lines.append('\n');
                        lines.append(arr.optString(i));
                    }
                    String sub = o.optString("desc") + " · " + side;
                    if ("done".equals(type)) {
                        if (o.optInt("doubt") > 0) sub += " · check the outlined squares in the app";
                    } else {
                        sub += " · depth " + o.optInt("depth");
                    }
                    showCard(o.optString("best"), o.optString("eval"), sub, lines.toString());
                    if ("done".equals(type)) done();
                    break;
                }
                case "noboard":
                    done();
                    showCard("No board found", "", "Make sure the whole chessboard is on the screen, then tap ♞.", "");
                    break;
                case "illegal":
                    done();
                    showCard("Couldn't read it", "", "That position isn't legal (" + o.optString("why") + "). Tap “Fix in app” to correct the pieces.", "");
                    break;
                case "gameover":
                    done();
                    showCard("Game over", "", o.optString("text"), "");
                    break;
                case "error":
                    done();
                    showCard("Something went wrong", "", o.optString("message"), "");
                    break;
                default:
                    break;
            }
        } catch (Exception ignored) {
            done();
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
    private static final class Bridge {
        private final ScanService s;
        Bridge(ScanService s) { this.s = s; }

        @JavascriptInterface
        public void onResult(final String json) { s.main.post(() -> s.handleResult(json)); }

        @JavascriptInterface
        public boolean isOverlayRunning() { return running; }

        @JavascriptInterface
        public void toggleOverlay() { /* not used by the hidden page */ }

        @JavascriptInterface
        public void speak(final String text) { s.main.post(() -> s.say(text)); }
    }

    private static final class StopWatcher extends MediaProjection.Callback {
        private final ScanService s;
        StopWatcher(ScanService s) { this.s = s; }

        @Override
        public void onStop() { s.main.post(s::stopSelf); }
    }

    /** Drag the ♞ button anywhere; a tap without dragging scans. */
    private static final class Dragger implements View.OnTouchListener {
        private final ScanService s;
        private float downX, downY;
        private int startX, startY;
        private boolean moved;
        Dragger(ScanService s) { this.s = s; }

        @Override
        public boolean onTouch(View v, MotionEvent e) {
            switch (e.getActionMasked()) {
                case MotionEvent.ACTION_DOWN:
                    downX = e.getRawX(); downY = e.getRawY();
                    startX = s.bubbleLp.x; startY = s.bubbleLp.y;
                    moved = false;
                    return true;
                case MotionEvent.ACTION_MOVE:
                    float dx = e.getRawX() - downX, dy = e.getRawY() - downY;
                    if (Math.abs(dx) + Math.abs(dy) > s.dp(8)) moved = true;
                    if (moved) {
                        s.bubbleLp.x = startX + (int) dx;
                        s.bubbleLp.y = startY + (int) dy;
                        s.wm.updateViewLayout(s.bubble, s.bubbleLp);
                    }
                    return true;
                case MotionEvent.ACTION_UP:
                    if (!moved) s.scan();
                    return true;
                default:
                    return false;
            }
        }
    }

    /* ---------------------------------------------------------------- teardown */

    @Override
    public void onDestroy() {
        running = false;
        try { if (bubble != null) wm.removeView(bubble); } catch (Exception ignored) { }
        try { if (card != null) wm.removeView(card); } catch (Exception ignored) { }
        try { if (web != null) { wm.removeView(web); web.destroy(); } } catch (Exception ignored) { }
        if (display != null) display.release();
        synchronized (lock) {
            if (latest != null) latest.close();
            latest = null;
        }
        if (reader != null) reader.close();
        if (projection != null) projection.stop();
        if (imageThread != null) imageThread.quitSafely();
        if (tts != null) tts.shutdown();
        super.onDestroy();
    }
}
