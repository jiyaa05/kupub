package com.kupub.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    @Value("${upload.path:uploads}")
    private String uploadPath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 업로드된 파일을 /uploads/** 경로로 서빙
        Path uploadDir = Paths.get(uploadPath).toAbsolutePath();
        String uploadLocation = "file:" + uploadDir.toString() + "/";

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadLocation);
    }
}

