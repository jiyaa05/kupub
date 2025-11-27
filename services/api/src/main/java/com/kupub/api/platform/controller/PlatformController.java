package com.kupub.api.platform.controller;

import com.kupub.api.common.dto.ApiResponse;
import com.kupub.api.common.exception.BadRequestException;
import com.kupub.api.common.exception.NotFoundException;
import com.kupub.api.department.entity.Department;
import com.kupub.api.department.entity.DepartmentSettings;
import com.kupub.api.department.repository.DepartmentRepository;
import com.kupub.api.department.repository.DepartmentSettingsRepository;
import com.kupub.api.menu.repository.MenuCategoryRepository;
import com.kupub.api.menu.repository.MenuRepository;
import com.kupub.api.order.repository.OrderItemRepository;
import com.kupub.api.order.repository.OrderRepository;
import com.kupub.api.reservation.repository.ReservationRepository;
import com.kupub.api.session.repository.GuestSessionRepository;
import com.kupub.api.table.repository.TableRepository;
import com.kupub.api.user.entity.User;
import com.kupub.api.user.entity.UserRole;
import com.kupub.api.user.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/platform")
@CrossOrigin(origins = "*")
public class PlatformController {

    private static final Logger log = LoggerFactory.getLogger(PlatformController.class);

    private final DepartmentRepository departmentRepository;
    private final DepartmentSettingsRepository settingsRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    // Cascade 삭제용 Repository들
    private final MenuRepository menuRepository;
    private final MenuCategoryRepository menuCategoryRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ReservationRepository reservationRepository;
    private final GuestSessionRepository guestSessionRepository;
    private final TableRepository tableRepository;

    public PlatformController(DepartmentRepository departmentRepository,
                              DepartmentSettingsRepository settingsRepository,
                              UserRepository userRepository,
                              PasswordEncoder passwordEncoder,
                              MenuRepository menuRepository,
                              MenuCategoryRepository menuCategoryRepository,
                              OrderRepository orderRepository,
                              OrderItemRepository orderItemRepository,
                              ReservationRepository reservationRepository,
                              GuestSessionRepository guestSessionRepository,
                              TableRepository tableRepository) {
        this.departmentRepository = departmentRepository;
        this.settingsRepository = settingsRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.menuRepository = menuRepository;
        this.menuCategoryRepository = menuCategoryRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.reservationRepository = reservationRepository;
        this.guestSessionRepository = guestSessionRepository;
        this.tableRepository = tableRepository;
    }

    // =========================================================================
    // 학과 관리
    // =========================================================================

    @GetMapping("/departments")
    public ResponseEntity<ApiResponse<List<DepartmentDto>>> getDepartments() {
        List<Department> departments = departmentRepository.findAll();
        return ResponseEntity.ok(ApiResponse.ok(
                departments.stream().map(DepartmentDto::from).toList()
        ));
    }

    @PostMapping("/departments")
    public ResponseEntity<ApiResponse<DepartmentDto>> createDepartment(
            @Valid @RequestBody CreateDepartmentRequest request) {
        
        log.debug("POST /api/platform/departments slug={}", request.slug());

        // 중복 체크
        if (departmentRepository.findBySlug(request.slug()).isPresent()) {
            throw new BadRequestException("DUPLICATE_SLUG", "이미 존재하는 슬러그입니다.");
        }

        // 학과 생성
        Department dept = new Department();
        dept.setSlug(request.slug());
        dept.setName(request.name());
        dept.setActive(true);
        dept = departmentRepository.save(dept);

        // 기본 설정 생성
        DepartmentSettings settings = new DepartmentSettings();
        settings.setDepartmentId(dept.getId());
        settings.setDataJson(getDefaultSettingsJson());
        settingsRepository.save(settings);

        log.info("Department created: id={} slug={}", dept.getId(), dept.getSlug());

        return ResponseEntity.ok(ApiResponse.ok(DepartmentDto.from(dept)));
    }

    @PatchMapping("/departments/{id}")
    public ResponseEntity<ApiResponse<DepartmentDto>> updateDepartment(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> request) {
        
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Department", id));

        if (request.containsKey("name")) {
            dept.setName((String) request.get("name"));
        }
        if (request.containsKey("active")) {
            dept.setActive((Boolean) request.get("active"));
        }

        dept = departmentRepository.save(dept);
        return ResponseEntity.ok(ApiResponse.ok(DepartmentDto.from(dept)));
    }

    // =========================================================================
    // 사용자 관리
    // =========================================================================

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserDto>>> getUsers() {
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(ApiResponse.ok(
                users.stream().map(UserDto::from).toList()
        ));
    }

    @PostMapping("/users")
    public ResponseEntity<ApiResponse<UserDto>> createUser(
            @Valid @RequestBody CreateUserRequest request) {
        
        log.debug("POST /api/platform/users username={}", request.username());

        // 중복 체크
        if (userRepository.findByUsername(request.username()).isPresent()) {
            throw new BadRequestException("DUPLICATE_USERNAME", "이미 존재하는 아이디입니다.");
        }

        User user = new User();
        user.setUsername(request.username());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setDepartmentId(request.departmentId());
        user.setRole(UserRole.valueOf(request.role()));
        user.setEnabled(request.enabled() == null ? Boolean.TRUE : request.enabled());

        try {
            user = userRepository.save(user);
        } catch (Exception e) {
            log.error("Failed to create user", e);
            String msg = e.getMessage() != null ? e.getMessage() : "계정 생성에 실패했습니다.";
            throw new BadRequestException("CREATE_USER_FAILED", msg);
        }
        log.info("User created: id={} username={} role={}", user.getId(), user.getUsername(), user.getRole());

        return ResponseEntity.ok(ApiResponse.ok(UserDto.from(user)));
    }

    @PatchMapping("/users/{id}")
    public ResponseEntity<ApiResponse<UserDto>> updateUser(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> request) {
        
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User", id));

        if (request.containsKey("enabled")) {
            user.setEnabled((Boolean) request.get("enabled"));
        }
        if (request.containsKey("password")) {
            user.setPassword(passwordEncoder.encode((String) request.get("password")));
        }
        if (request.containsKey("departmentId")) {
            Object deptId = request.get("departmentId");
            user.setDepartmentId(deptId != null ? ((Number) deptId).longValue() : null);
        }
        if (request.containsKey("role")) {
            user.setRole(UserRole.valueOf((String) request.get("role")));
        }

        user = userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.ok(UserDto.from(user)));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable("id") Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User", id));
        
        // SUPER_ADMIN은 삭제 불가
        if (user.getRole() == UserRole.SUPER_ADMIN) {
            throw new BadRequestException("CANNOT_DELETE_SUPER_ADMIN", "총관리자 계정은 삭제할 수 없습니다.");
        }
        
        userRepository.delete(user);
        log.info("User deleted: id={} username={}", id, user.getUsername());
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @DeleteMapping("/departments/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> deleteDepartment(@PathVariable("id") Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Department", id));
        
        log.info("Deleting department cascade: id={} slug={}", id, dept.getSlug());
        
        // 1. 주문 아이템 삭제 (주문 ID 기반)
        var orders = orderRepository.findByDepartmentId(id);
        for (var order : orders) {
            orderItemRepository.deleteByOrderId(order.getId());
        }
        
        // 2. 주문 삭제
        orderRepository.deleteByDepartmentId(id);
        
        // 3. 세션 삭제
        guestSessionRepository.deleteByDepartmentId(id);
        
        // 4. 예약 삭제
        reservationRepository.deleteByDepartmentId(id);
        
        // 5. 테이블 삭제
        tableRepository.deleteByDepartmentId(id);
        
        // 6. 메뉴 삭제
        menuRepository.deleteByDepartmentId(id);
        
        // 7. 메뉴 카테고리 삭제
        menuCategoryRepository.deleteByDepartmentId(id);
        
        // 8. 설정 삭제
        settingsRepository.deleteByDepartmentId(id);
        
        // 9. 연결된 사용자의 departmentId를 null로 설정
        userRepository.findAll().stream()
                .filter(u -> id.equals(u.getDepartmentId()))
                .forEach(u -> {
                    u.setDepartmentId(null);
                    userRepository.save(u);
                });
        
        // 10. 학과 삭제
        departmentRepository.delete(dept);
        
        log.info("Department deleted with all related data: id={} slug={}", id, dept.getSlug());
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // =========================================================================
    // DTOs
    // =========================================================================

    public record DepartmentDto(Long id, String slug, String name, Boolean active) {
        public static DepartmentDto from(Department d) {
            return new DepartmentDto(d.getId(), d.getSlug(), d.getName(), d.getActive());
        }
    }

    public record UserDto(Long id, String username, Long departmentId, String role, Boolean enabled) {
        public static UserDto from(User u) {
            return new UserDto(u.getId(), u.getUsername(), u.getDepartmentId(), u.getRole().name(), u.getEnabled());
        }
    }

    public record CreateDepartmentRequest(@NotBlank String slug, @NotBlank String name) {}
    public record CreateUserRequest(
            @NotBlank String username,
            @NotBlank String password,
            Long departmentId,
            @NotBlank String role,
            Boolean enabled
    ) {}

    // =========================================================================
    // Helper
    // =========================================================================

    private String getDefaultSettingsJson() {
        return """
        {
            "branding": { "primaryColor": "#6366F1", "logoUrl": null },
            "flow": {
                "entryModes": ["reservation"],
                "showOnboarding": true,
                "requireReservationForFirstOrder": false,
                "allowAdditionalOrder": true,
                "showPaymentPage": true
            },
            "reservation": {
                "startTime": "18:00",
                "endTime": "23:00",
                "intervalMinutes": 30,
                "durationMinutes": 60,
                "maxPeople": 6
            },
            "payment": {
                "method": "transfer",
                "bankName": "",
                "accountNumber": "",
                "accountHolder": ""
            },
            "pricing": {
                "tableFee": 0,
                "corkage": 0,
                "discounts": []
            },
            "onboarding": [],
            "reservationClosed": []
        }
        """;
    }
}
