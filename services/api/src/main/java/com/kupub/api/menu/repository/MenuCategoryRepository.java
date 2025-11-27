package com.kupub.api.menu.repository;

import com.kupub.api.menu.entity.MenuCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MenuCategoryRepository extends JpaRepository<MenuCategory, Long> {
    List<MenuCategory> findByDepartmentIdOrderByDisplayOrderAscIdAsc(Long departmentId);
    List<MenuCategory> findByDepartmentIdOrderByDisplayOrderAsc(Long departmentId);
    void deleteByDepartmentId(Long departmentId);
}

