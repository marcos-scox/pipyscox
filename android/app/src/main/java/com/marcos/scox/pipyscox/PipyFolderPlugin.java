package com.marcos.scox.pipyscox;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;
import androidx.activity.result.ActivityResult;
import androidx.documentfile.provider.DocumentFile;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@CapacitorPlugin(name = "PipyFolder")
public class PipyFolderPlugin extends Plugin {
    @PluginMethod
    public void pickDirectory(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION
            | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
            | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        startActivityForResult(call, intent, "directoryPicked");
    }

    @ActivityCallback
    private void directoryPicked(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            JSObject cancelled = new JSObject();
            cancelled.put("cancelled", true);
            call.resolve(cancelled);
            return;
        }
        Uri uri = data.getData();
        int flags = data.getFlags() & (Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        try {
            getContext().getContentResolver().takePersistableUriPermission(uri, flags);
            DocumentFile root = DocumentFile.fromTreeUri(getContext(), uri);
            if (root == null || !root.isDirectory()) {
                call.reject("O Android não retornou uma pasta válida.");
                return;
            }
            JSObject picked = new JSObject();
            picked.put("cancelled", false);
            picked.put("uri", uri.toString());
            picked.put("name", root.getName() == null ? "Pasta escolhida" : root.getName());
            call.resolve(picked);
        } catch (Exception e) {
            call.reject("Não foi possível manter o acesso à pasta escolhida.", e);
        }
    }

    @PluginMethod
    public void hasAccess(PluginCall call) {
        String rawUri = call.getString("uri");
        boolean granted = false;
        if (rawUri != null) {
            Uri uri = Uri.parse(rawUri);
            for (android.content.UriPermission permission : getContext().getContentResolver().getPersistedUriPermissions()) {
                if (uri.equals(permission.getUri()) && permission.isReadPermission() && permission.isWritePermission()) {
                    granted = true;
                    break;
                }
            }
        }
        JSObject result = new JSObject();
        result.put("granted", granted);
        call.resolve(result);
    }

    @PluginMethod
    public void resolvePath(PluginCall call) {
        try {
            String uri = call.getString("uri");
            String path = call.getString("path", "");
            String kind = call.getString("kind", "file");
            boolean create = Boolean.TRUE.equals(call.getBoolean("create", false));
            DocumentFile item = resolve(uri, path, kind, create);
            JSObject result = new JSObject();
            result.put("exists", item != null);
            if (item == null) {
                result.put("wrongType", hasWrongType(uri, path, kind));
            } else {
                putMetadata(result, item);
            }
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Não foi possível acessar essa pasta.", e);
        }
    }

    @PluginMethod
    public void listDirectory(PluginCall call) {
        try {
            String uri = call.getString("uri");
            String path = call.getString("path", "");
            DocumentFile directory = resolve(uri, path, "directory", false);
            if (directory == null) {
                call.reject("A pasta não existe ou não está mais disponível.");
                return;
            }
            JSArray entries = new JSArray();
            for (DocumentFile child : directory.listFiles()) {
                JSObject entry = new JSObject();
                putMetadata(entry, child);
                entries.put(entry);
            }
            JSObject result = new JSObject();
            result.put("entries", entries);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Não foi possível listar o conteúdo da pasta.", e);
        }
    }

    @PluginMethod
    public void readFile(PluginCall call) {
        try {
            DocumentFile file = resolve(call.getString("uri"), call.getString("path", ""), "file", false);
            if (file == null) {
                call.reject("O arquivo não foi encontrado na pasta.");
                return;
            }
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            try (InputStream input = getContext().getContentResolver().openInputStream(file.getUri())) {
                if (input == null) throw new IllegalStateException("O provedor não abriu o arquivo.");
                byte[] buffer = new byte[32 * 1024];
                int count;
                while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
            }
            JSObject result = new JSObject();
            result.put("data", Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP));
            result.put("name", file.getName() == null ? "arquivo" : file.getName());
            result.put("type", file.getType() == null ? "application/octet-stream" : file.getType());
            result.put("lastModified", file.lastModified());
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Não foi possível ler o arquivo da pasta.", e);
        }
    }

    @PluginMethod
    public void writeFile(PluginCall call) {
        try {
            DocumentFile file = resolve(call.getString("uri"), call.getString("path", ""), "file", true);
            if (file == null) {
                call.reject("Não foi possível criar o arquivo na pasta.");
                return;
            }
            String encoded = call.getString("data", "");
            byte[] bytes = Base64.decode(encoded, Base64.DEFAULT);
            try (OutputStream output = getContext().getContentResolver().openOutputStream(file.getUri(), "wt")) {
                if (output == null) throw new IllegalStateException("O provedor não abriu o arquivo para gravação.");
                output.write(bytes);
                output.flush();
            }
            JSObject result = new JSObject();
            putMetadata(result, file);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Não foi possível gravar o arquivo na pasta.", e);
        }
    }

    @PluginMethod
    public void deletePath(PluginCall call) {
        try {
            DocumentFile file = resolveAny(call.getString("uri"), call.getString("path", ""));
            if (file != null && !deleteRecursively(file)) {
                call.reject("O provedor não permitiu excluir esse item.");
                return;
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Não foi possível excluir esse item da pasta.", e);
        }
    }

    private DocumentFile resolve(String rawUri, String rawPath, String expectedKind, boolean create) throws Exception {
        if (rawUri == null) throw new IllegalArgumentException("URI da pasta ausente.");
        DocumentFile current = DocumentFile.fromTreeUri(getContext(), Uri.parse(rawUri));
        if (current == null || !current.isDirectory()) throw new IllegalStateException("A pasta escolhida não está disponível.");
        List<String> parts = pathParts(rawPath);
        if (parts.isEmpty()) return "directory".equals(expectedKind) ? current : null;
        for (int i = 0; i < parts.size(); i++) {
            String name = parts.get(i);
            boolean last = i == parts.size() - 1;
            DocumentFile child = current.findFile(name);
            if (child == null && create) {
                child = (!last || "directory".equals(expectedKind))
                    ? current.createDirectory(name)
                    : current.createFile(mimeType(name), name);
            }
            if (child == null) return null;
            if ((!last || "directory".equals(expectedKind)) && !child.isDirectory()) return null;
            if (last && "file".equals(expectedKind) && !child.isFile()) return null;
            current = child;
        }
        return current;
    }

    private DocumentFile resolveAny(String rawUri, String rawPath) throws Exception {
        if (rawUri == null) throw new IllegalArgumentException("URI da pasta ausente.");
        DocumentFile current = DocumentFile.fromTreeUri(getContext(), Uri.parse(rawUri));
        if (current == null || !current.isDirectory()) throw new IllegalStateException("A pasta escolhida não está disponível.");
        for (String name : pathParts(rawPath)) {
            current = current.findFile(name);
            if (current == null) return null;
        }
        return current;
    }

    private boolean hasWrongType(String uri, String path, String expectedKind) {
        try {
            DocumentFile item = resolveAny(uri, path);
            return item != null && (("directory".equals(expectedKind) && !item.isDirectory())
                || ("file".equals(expectedKind) && !item.isFile()));
        } catch (Exception ignored) {
            return false;
        }
    }

    private List<String> pathParts(String path) {
        List<String> parts = new ArrayList<>();
        if (path == null || path.isEmpty()) return parts;
        for (String part : path.split("/")) {
            if (part.isEmpty()) continue;
            if (".".equals(part) || "..".equals(part)) throw new IllegalArgumentException("Caminho inválido.");
            parts.add(part);
        }
        return parts;
    }

    private String mimeType(String name) {
        int dot = name.lastIndexOf('.');
        if (dot >= 0 && dot < name.length() - 1) {
            String ext = name.substring(dot + 1).toLowerCase(Locale.ROOT);
            String type = android.webkit.MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext);
            if (type != null) return type;
        }
        return "application/octet-stream";
    }

    private void putMetadata(JSObject target, DocumentFile file) {
        target.put("name", file.getName() == null ? "" : file.getName());
        target.put("kind", file.isDirectory() ? "directory" : "file");
        target.put("size", file.length());
        target.put("lastModified", file.lastModified());
        target.put("type", file.getType() == null ? "application/octet-stream" : file.getType());
    }

    private boolean deleteRecursively(DocumentFile item) {
        if (item.isDirectory()) {
            for (DocumentFile child : item.listFiles()) {
                if (!deleteRecursively(child)) return false;
            }
        }
        return item.delete();
    }
}
