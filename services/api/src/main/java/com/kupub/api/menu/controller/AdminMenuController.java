package com.kupub.api.menu.controller;

import com.kupub.api.common.dto.ApiResponse;
import com.kupub.api.common.exception.NotFoundException;
import com.kupub.api.department.service.DepartmentService;
import com.kupub.api.menu.dto.*;
import com.kupub.api.menu.entity.Menu;
import com.kupub.api.menu.entity.MenuCategory;
import com.kupub.api.menu.repository.MenuCategoryRepository;
import com.kupub.api.menu.repository.MenuRepository;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/{dept}/admin/menus")
@CrossOrigin(origins = "*")
public class AdminMenuController {

    private static final Logger log = LoggerFactory.getLogger(AdminMenuController.class);

    private final DepartmentService departmentService;
    private final MenuRepository menuRepository;
    private final MenuCategoryRepository categoryRepository;

    public AdminMenuController(DepartmentService departmentService,
                               MenuRepository menuRepository,
                               MenuCategoryRepository categoryRepository) {
        this.departmentService = departmentService;
        this.menuRepository = menuRepository;
        this.categoryRepository = categoryRepository;
    }

    // 메뉴 생성
    @PostMapping
    public ResponseEntity<ApiResponse<MenuDto>> createMenu(
            @PathVariable("dept") String deptSlug,
            @Valid @RequestBody MenuCreateRequest request) {
        
        log.debug("POST /api/{}/admin/menus", deptSlug);
        
        Long deptId = departmentService.getBySlug(deptSlug).getId();

        if (request.categoryId() != null) {
            MenuCategory category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new NotFoundException("Category", request.categoryId()));
            if (!category.getDepartmentId().equals(deptId)) {
                throw new NotFoundException("Category", request.categoryId());
            }
        }
        
        Menu menu = new Menu();
        menu.setDepartmentId(deptId);
        menu.setCategoryId(request.categoryId());
        menu.setName(request.name());
        menu.setPrice(request.price());
        menu.setDescription(request.description());
        menu.setImageUrl(request.imageUrl());
        menu.setDisplayOrder(request.displayOrder() != null ? request.displayOrder() : 0);
        menu.setSoldOut(false);
        
        Menu saved = menuRepository.save(menu);
        log.info("Menu created: id={} name={}", saved.getId(), saved.getName());
        
        return ResponseEntity.ok(ApiResponse.ok(MenuDto.from(saved)));
    }

    // 메뉴 수정
    @PatchMapping("/{menuId}")
    public ResponseEntity<ApiResponse<MenuDto>> updateMenu(
            @PathVariable("dept") String deptSlug,
            @PathVariable("menuId") Long menuId,
            @Valid @RequestBody MenuUpdateRequest request) {
        
        log.debug("PATCH /api/{}/admin/menus/{}", deptSlug, menuId);
        
        Long deptId = departmentService.getBySlug(deptSlug).getId();
        Menu menu = menuRepository.findById(menuId)
                .orElseThrow(() -> new NotFoundException("Menu", menuId));

        if (!menu.getDepartmentId().equals(deptId)) {
            throw new NotFoundException("Menu", menuId);
        }

        if (request.categoryId() != null) {
            MenuCategory category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new NotFoundException("Category", request.categoryId()));
            if (!category.getDepartmentId().equals(deptId)) {
                throw new NotFoundException("Category", request.categoryId());
            }
        }
        
        if (request.categoryId() != null) menu.setCategoryId(request.categoryId());
        if (request.name() != null) menu.setName(request.name());
        if (request.price() != null) menu.setPrice(request.price());
        if (request.description() != null) menu.setDescription(request.description());
        if (request.imageUrl() != null) menu.setImageUrl(request.imageUrl());
        if (request.displayOrder() != null) menu.setDisplayOrder(request.displayOrder());
        if (request.soldOut() != null) menu.setSoldOut(request.soldOut());
        
        Menu saved = menuRepository.save(menu);
        log.info("Menu updated: id={}", saved.getId());
        
        return ResponseEntity.ok(ApiResponse.ok(MenuDto.from(saved)));
    }

    // 메뉴 삭제
    @DeleteMapping("/{menuId}")
    public ResponseEntity<ApiResponse<Void>> deleteMenu(
            @PathVariable("dept") String deptSlug,
            @PathVariable("menuId") Long menuId) {
        
        log.debug("DELETE /api/{}/admin/menus/{}", deptSlug, menuId);
        
        Long deptId = departmentService.getBySlug(deptSlug).getId();
        Menu menu = menuRepository.findById(menuId)
                .orElseThrow(() -> new NotFoundException("Menu", menuId));
        if (!menu.getDepartmentId().equals(deptId)) {
            throw new NotFoundException("Menu", menuId);
        }
        
        menuRepository.delete(menu);
        log.info("Menu deleted: id={}", menuId);
        
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    // 카테고리 목록
    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getCategories(
            @PathVariable("dept") String deptSlug) {
        
        Long deptId = departmentService.getBySlug(deptSlug).getId();
        List<MenuCategory> categories = categoryRepository.findByDepartmentIdOrderByDisplayOrderAsc(deptId);
        
        return ResponseEntity.ok(ApiResponse.ok(
                categories.stream().map(CategoryDto::from).toList()
        ));
    }

    // 카테고리 생성
    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<CategoryDto>> createCategory(
            @PathVariable("dept") String deptSlug,
            @Valid @RequestBody CategoryCreateRequest request) {
        
        Long deptId = departmentService.getBySlug(deptSlug).getId();
        
        MenuCategory category = new MenuCategory();
        category.setDepartmentId(deptId);
        category.setName(request.name());
        category.setDisplayOrder(request.displayOrder() != null ? request.displayOrder() : 0);
        
        MenuCategory saved = categoryRepository.save(category);
        
        return ResponseEntity.ok(ApiResponse.ok(CategoryDto.from(saved)));
    }

    // 카테고리 수정
    @PatchMapping("/categories/{categoryId}")
    public ResponseEntity<ApiResponse<CategoryDto>> updateCategory(
            @PathVariable("dept") String deptSlug,
            @PathVariable("categoryId") Long categoryId,
            @Valid @RequestBody CategoryUpdateRequest request) {
        
        Long deptId = departmentService.getBySlug(deptSlug).getId();
        MenuCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new NotFoundException("Category", categoryId));
        if (!category.getDepartmentId().equals(deptId)) {
            throw new NotFoundException("Category", categoryId);
        }
        
        if (request.name() != null) category.setName(request.name());
        if (request.displayOrder() != null) category.setDisplayOrder(request.displayOrder());
        
        MenuCategory saved = categoryRepository.save(category);
        
        return ResponseEntity.ok(ApiResponse.ok(CategoryDto.from(saved)));
    }

    // 카테고리 삭제
    @DeleteMapping("/categories/{categoryId}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(
            @PathVariable("dept") String deptSlug,
            @PathVariable("categoryId") Long categoryId) {
        
        Long deptId = departmentService.getBySlug(deptSlug).getId();
        MenuCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new NotFoundException("Category", categoryId));
        if (!category.getDepartmentId().equals(deptId)) {
            throw new NotFoundException("Category", categoryId);
        }
        
        categoryRepository.delete(category);
        
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}

