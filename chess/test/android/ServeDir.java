import com.escape.chesslens.AssetServer;

import java.io.File;
import java.io.FileInputStream;
import java.nio.file.Files;

/** Test harness: serve a directory with the app's AssetServer, with a given screenshot as /shot.jpg. */
public class ServeDir {
    public static void main(String[] args) throws Exception {
        final File root = new File(args[0]);
        AssetServer s = new AssetServer(path -> new FileInputStream(new File(root, path)), 0);
        if (args.length > 1) s.setShot(Files.readAllBytes(new File(args[1]).toPath()));
        System.out.println(s.port());
        System.out.flush();
        // new screenshot paths arrive on stdin, one per line
        java.io.BufferedReader in = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));
        String line;
        while ((line = in.readLine()) != null) {
            s.setShot(Files.readAllBytes(new File(line.trim()).toPath()));
            System.out.println("shot");
            System.out.flush();
        }
    }
}
