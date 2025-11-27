package com.kupub.api.menu.controller;

import com.kupub.api.common.dto.ApiResponse;
import com.kupub.api.department.entity.Department;
import com.kupub.api.department.service.DepartmentService;
import com.kupub.api.menu.dto.*;
import com.kupub.api.menu.repository.MenuCategoryRepository;
import com.kupub.api.menu.repository.MenuRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/{dept}/menus")
@CrossOrigin(origins = "*")
public class PublicMenuController {

    private final DepartmentService departmentService;
    private final MenuCategoryRepository categoryRepository;
    private final MenuRepository menuRepository;

    public PublicMenuController(DepartmentService departmentService,
                                MenuCategoryRepository categoryRepository,
                                MenuRepository menuRepository) {
        this.departmentService = departmentService;
        this.categoryRepository = categoryRepository;
        this.menuRepository = menuRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<MenuResponse>> getMenus(@PathVariable("dept") String deptSlug) {
        Department dept = departmentService.getActiveBySlug(deptSlug);
        
        var categories = categoryRepository.findByDepartmentIdOrderByDisplayOrderAscIdAsc(dept.getId())
                .stream().map(MenuCategoryDto::from).toList();
        var menus = menuRepository.findByDepartmentIdOrderByDisplayOrderAscIdAsc(dept.getId())
                .stream().map(MenuDto::from).toList();

        var response = new MenuResponse(
                new MenuResponse.DeptInfo(dept.getId(), dept.getSlug(), dept.getName()),
                categories, menus);

        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}

