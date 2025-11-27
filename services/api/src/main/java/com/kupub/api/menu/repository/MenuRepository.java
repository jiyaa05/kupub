package com.kupub.api.menu.repository;

import com.kupub.api.menu.entity.Menu;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MenuRepository extends JpaRepository<Menu, Long> {
    List<Menu> findByDepartmentIdOrderByDisplayOrderAscIdAsc(Long departmentId);
    void deleteByDepartmentId(Long departmentId);
}

