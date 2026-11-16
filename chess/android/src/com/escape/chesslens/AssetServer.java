package com.escape.chesslens;

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * A tiny HTTP server on 127.0.0.1 that serves the bundled Chess Lens web app (assets/www) and
 * the latest screenshot (/shot.jpg) to the app's own WebViews. A real http:// origin means Web
 * Workers and WebAssembly (Stockfish) load exactly as they do on the website.
 * Plain Java (no Android imports) so it can be tested on a desktop JVM.
 */
public final class AssetServer {
    public interface Source {
        InputStream open(String path) throws IOException;
    }

    public static final int PREFERRED_PORT = 8723;
    private static final Map<String, String> TYPES = new HashMap<>();
    static {
        TYPES.put("html", "text/html; charset=utf-8");
        TYPES.put("js", "text/javascript; charset=utf-8");
        TYPES.put("mjs", "text/javascript; charset=utf-8");
        TYPES.put("css", "text/css; charset=utf-8");
        TYPES.put("json", "application/json");
        TYPES.put("webmanifest", "application/manifest+json");
        TYPES.put("wasm", "application/wasm");
        TYPES.put("svg", "image/svg+xml");
        TYPES.put("png", "image/png");
        TYPES.put("jpg", "image/jpeg");
        TYPES.put("bin", "application/octet-stream");
        TYPES.put("txt", "text/plain; charset=utf-8");
    }

    private final Source source;
    private final ServerSocket socket;
    private final ExecutorService pool = Executors.newCachedThreadPool();
    private final Map<String, byte[]> cache = new ConcurrentHashMap<>();
    private volatile byte[] shot;

    public AssetServer(Source source, int preferredPort) throws IOException {
        this.source = source;
        ServerSocket s;
        try {
            s = new ServerSocket(preferredPort, 50, InetAddress.getByName("127.0.0.1"));
        } catch (IOException busy) {
            s = new ServerSocket(0, 50, InetAddress.getByName("127.0.0.1"));
        }
        socket = s;
        Thread t = new Thread(this::acceptLoop, "chesslens-http");
        t.setDaemon(true);
        t.start();
    }

    public int port() { return socket.getLocalPort(); }

    public String base() { return "http://127.0.0.1:" + port() + "/"; }

    /** The newest screenshot, served at /shot.jpg. */
    public void setShot(byte[] jpeg) { shot = jpeg; }

    public void close() throws IOException {
        socket.close();
        pool.shutdownNow();
    }

    private void acceptLoop() {
        while (!socket.isClosed()) {
            try {
                Socket c = socket.accept();
                pool.execute(() -> handle(c));
            } catch (IOException e) {
                if (socket.isClosed()) return;
            }
        }
    }

    private static String readLine(InputStream in) throws IOException {
        StringBuilder sb = new StringBuilder();
        int b;
        while ((b = in.read()) != -1) {
            if (b == '\n') break;
            if (b != '\r') sb.append((char) b);
            if (sb.length() > 8192) throw new IOException("header too long");
        }
        return b == -1 && sb.length() == 0 ? null : sb.toString();
    }

    private void handle(Socket c) {
        try (Socket client = c) {
            client.setSoTimeout(15000);
            InputStream in = new BufferedInputStream(client.getInputStream());
            OutputStream out = client.getOutputStream();
            String request = readLine(in);
            if (request == null) return;
            String line;
            while ((line = readLine(in)) != null && !line.isEmpty()) { /* skip headers */ }
            String[] parts = request.split(" ");
            if (parts.length < 2) { send(out, 400, "text/plain", "bad request".getBytes(StandardCharsets.UTF_8), true); return; }
            boolean head = "HEAD".equals(parts[0]);
            if (!"GET".equals(parts[0]) && !head) { send(out, 405, "text/plain", new byte[0], !head); return; }
            String path = parts[1];
            int q = path.indexOf('?');
            if (q >= 0) path = path.substring(0, q);
            path = URLDecoder.decode(path, "UTF-8");
            while (path.startsWith("/")) path = path.substring(1);
            if (path.isEmpty() || path.endsWith("/")) path += "index.html";
            if (path.contains("..") || path.contains("\\")) { send(out, 403, "text/plain", new byte[0], !head); return; }

            if (path.equals("shot.jpg")) {
                byte[] s = shot;
                if (s == null) send(out, 404, "text/plain", new byte[0], !head);
                else send(out, 200, "image/jpeg", s, !head);
                return;
            }
            byte[] body = cache.get(path);
            if (body == null) {
                try (InputStream a = source.open(path)) {
                    body = readAll(a);
                } catch (FileNotFoundException e) {
                    send(out, 404, "text/plain", ("not found: " + path).getBytes(StandardCharsets.UTF_8), !head);
                    return;
                }
                cache.put(path, body);
            }
            int dot = path.lastIndexOf('.');
            String type = TYPES.get(dot >= 0 ? path.substring(dot + 1) : "");
            send(out, 200, type == null ? "application/octet-stream" : type, body, !head);
        } catch (IOException ignored) {
            // client went away
        }
    }

    private static byte[] readAll(InputStream in) throws IOException {
        ByteArrayOutputStream b = new ByteArrayOutputStream();
        byte[] buf = new byte[65536];
        int n;
        while ((n = in.read(buf)) > 0) b.write(buf, 0, n);
        return b.toByteArray();
    }

    private static void send(OutputStream out, int status, String type, byte[] body, boolean withBody) throws IOException {
        String reason = status == 200 ? "OK" : status == 404 ? "Not Found" : status == 403 ? "Forbidden" : status == 405 ? "Method Not Allowed" : "Bad Request";
        String head = "HTTP/1.1 " + status + " " + reason + "\r\n"
                + "Content-Type: " + type + "\r\n"
                + "Content-Length: " + body.length + "\r\n"
                + "Cache-Control: no-cache\r\n"
                + "X-Content-Type-Options: nosniff\r\n"
                + "Connection: close\r\n\r\n";
        out.write(head.getBytes(StandardCharsets.US_ASCII));
        if (withBody) out.write(body);
        out.flush();
    }
}
