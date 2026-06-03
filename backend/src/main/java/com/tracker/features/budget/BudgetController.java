package com.tracker.features.budget;

import com.tracker.features.auth.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @GetMapping
    public ResponseEntity<List<Budget>> getBudgets(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<Budget> budgets = budgetService.getBudgetsForUser(userPrincipal.getId());
        return ResponseEntity.ok(budgets);
    }

    @PostMapping
    public ResponseEntity<Budget> setBudget(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody Map<String, Object> payload) {
        
        String category = (String) payload.get("category");
        BigDecimal limit = new BigDecimal(payload.get("limitAmount").toString());

        Budget updated = budgetService.createOrUpdateBudget(userPrincipal.getId(), category, limit);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/performance")
    public ResponseEntity<List<Map<String, Object>>> getPerformance(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<Map<String, Object>> performance = budgetService.getBudgetPerformance(userPrincipal.getId());
        return ResponseEntity.ok(performance);
    }
}
