package com.escape.chesslens;

import android.content.Context;
import android.content.res.AssetManager;

import java.io.IOException;

/** One AssetServer per app process, serving assets/www. */
final class Server {
    private static AssetServer instance;

    static synchronized AssetServer get(Context ctx) {
        if (instance == null) {
            final AssetManager assets = ctx.getApplicationContext().getAssets();
            try {
                instance = new AssetServer(path -> assets.open("www/" + path), AssetServer.PREFERRED_PORT);
            } catch (IOException e) {
                throw new IllegalStateException("could not start the local web server", e);
            }
        }
        return instance;
    }

    private Server() {}
}
