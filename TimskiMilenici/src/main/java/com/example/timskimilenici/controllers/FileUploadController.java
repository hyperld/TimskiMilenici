package com.example.timskimilenici.controllers;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/uploads")
public class FileUploadController {

    private static final Pattern UNSAFE_FILENAME = Pattern.compile(".*[\\\\/:*?\"<>|].*");

    private final Path root;

    public FileUploadController(@Value("${app.upload-dir:uploads}") String uploadDir) {
        Path base = Paths.get(uploadDir);
        this.root = base.isAbsolute() ? base : Paths.get(System.getProperty("user.dir")).resolve(base);
        try {
            if (!Files.exists(this.root)) {
                Files.createDirectories(this.root);
            }
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize upload folder: " + this.root, e);
        }
    }

    /**
     * Upload a file (e.g. image from laptop). Accepts multipart form with "file".
     * Returns JSON with "url" pointing to the served file.
     */
    @PostMapping
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "Please select a file to upload.");
            return ResponseEntity.badRequest().body(err);
        }
        try {
            if (!Files.exists(this.root)) {
                Files.createDirectories(this.root);
            }
            String original = file.getOriginalFilename();
            if (original == null) original = "file";
            // Sanitize: keep only last path segment and strip unsafe chars
            String safeName = original;
            if (original.contains("/") || original.contains("\\")) {
                safeName = original.substring(Math.max(original.lastIndexOf('/'), original.lastIndexOf('\\')) + 1);
            }
            if (UNSAFE_FILENAME.matcher(safeName).matches()) {
                safeName = safeName.replaceAll("[\\\\/:*?\"<>|]", "_");
            }
            String filename = UUID.randomUUID().toString() + "_" + safeName;
            Path target = this.root.resolve(filename);
            Files.copy(file.getInputStream(), target);

            Map<String, String> response = new HashMap<>();
            response.put("url", "http://localhost:8080/api/uploads/" + filename);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "Could not store the file. Error: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> getFile(@PathVariable String filename) {
        try {
            Path file = root.resolve(filename).normalize();
            if (!file.startsWith(root)) {
                throw new RuntimeException("Invalid file path");
            }
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() || resource.isReadable()) {
                String contentType = Files.probeContentType(file);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                throw new RuntimeException("Could not read the file!");
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Error: " + e.getMessage());
        } catch (IOException e) {
            throw new RuntimeException("Error: " + e.getMessage());
        }
    }
}
