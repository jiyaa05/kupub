package com.kupub.api.upload;

import com.kupub.api.common.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
@CrossOrigin(origins = "*")
public class FileUploadController {

    private static final Logger log = LoggerFactory.getLogger(FileUploadController.class);

    @Value("${upload.path:uploads}")
    private String uploadPath;

    @Value("${upload.base-url:/uploads}")
    private String baseUrl;

    /**
     * 이미지 업로드
     */
    @PostMapping("/image")
    public ResponseEntity<ApiResponse<UploadResponse>> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "category", defaultValue = "general") String category) {

        log.debug("POST /api/upload/image category={} filename={}", category, file.getOriginalFilename());

        // 파일 검증
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("EMPTY_FILE", "파일이 비어있습니다."));
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("INVALID_TYPE", "이미지 파일만 업로드 가능합니다."));
        }

        // 파일 크기 제한 (5MB)
        if (file.getSize() > 5 * 1024 * 1024) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("FILE_TOO_LARGE", "파일 크기는 5MB 이하여야 합니다."));
        }

        try {
            // 디렉토리 생성
            Path uploadDir = Paths.get(uploadPath, category);
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            // 파일명 생성 (UUID + 확장자)
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String newFilename = UUID.randomUUID().toString() + extension;

            // 파일 저장
            Path filePath = uploadDir.resolve(newFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // URL 생성
            String fileUrl = baseUrl + "/" + category + "/" + newFilename;

            log.info("File uploaded: {} -> {}", originalFilename, fileUrl);

            return ResponseEntity.ok(ApiResponse.ok(new UploadResponse(fileUrl, newFilename)));

        } catch (IOException e) {
            log.error("Failed to upload file", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("UPLOAD_FAILED", "파일 업로드에 실패했습니다."));
        }
    }

    /**
     * 여러 이미지 업로드
     */
    @PostMapping("/images")
    public ResponseEntity<ApiResponse<UploadResponse[]>> uploadImages(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "category", defaultValue = "general") String category) {

        UploadResponse[] results = new UploadResponse[files.length];

        for (int i = 0; i < files.length; i++) {
            MultipartFile file = files[i];
            ResponseEntity<ApiResponse<UploadResponse>> response = uploadImage(file, category);
            if (response.getBody() != null && response.getBody().getData() != null) {
                results[i] = response.getBody().getData();
            }
        }

        return ResponseEntity.ok(ApiResponse.ok(results));
    }

    public record UploadResponse(String url, String filename) {}
}

