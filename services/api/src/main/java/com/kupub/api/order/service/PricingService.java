package com.kupub.api.order.service;

import com.kupub.api.department.dto.settings.DepartmentSettingsDto;
import com.kupub.api.department.dto.settings.PricingSettings;
import com.kupub.api.department.service.DepartmentSettingsService;
import com.kupub.api.order.dto.PriceBreakdown;
import com.kupub.api.order.entity.OrderItem;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 가격 계산 서비스
 */
@Service
public class PricingService {

    private final DepartmentSettingsService settingsService;

    public PricingService(DepartmentSettingsService settingsService) {
        this.settingsService = settingsService;
    }

    /**
     * 가격 계산
     * 
     * @param departmentId 학과 ID
     * @param items 주문 아이템 목록
     * @param discountCode 할인 코드 (선택)
     * @return 가격 내역
     */
    public PriceBreakdown calculate(Long departmentId, List<OrderItem> items, String discountCode) {
        DepartmentSettingsDto settings = settingsService.getSettingsDto(departmentId);
        PricingSettings pricing = settings.pricing();

        // 1. 메뉴 소계
        int subtotal = items.stream()
                .mapToInt(OrderItem::getSubtotal)
                .sum();

        // 2. 테이블비
        int tableFee = pricing != null && pricing.tableFee() != null ? pricing.tableFee() : 0;

        // 3. 콜키지
        int corkage = 0; // 콜키지 미사용

        // 4. 할인
        int discount = calculateDiscount(pricing, discountCode);

        // 5. 총액
        int total = subtotal + tableFee + corkage + discount;
        if (total < 0) total = 0;

        return new PriceBreakdown(subtotal, tableFee, corkage, discount, total);
    }

    /**
     * 소계만 계산 (설정 없이)
     */
    public int calculateSubtotal(List<OrderItem> items) {
        return items.stream()
                .mapToInt(OrderItem::getSubtotal)
                .sum();
    }

    /**
     * 할인 계산
     */
    private int calculateDiscount(PricingSettings pricing, String discountCode) {
        if (pricing == null || pricing.discounts() == null || pricing.discounts().isEmpty()) {
            return 0;
        }

        if (discountCode == null || discountCode.isBlank()) {
            return 0;
        }

        // 조건에 맞는 할인 찾기
        return pricing.discounts().stream()
                .filter(d -> d.condition() != null && d.condition().equals(discountCode))
                .mapToInt(d -> d.amount() != null ? d.amount() : 0)
                .sum();
    }
}

