package com.tracker.features.budget;

import com.tracker.features.auth.AppUser;
import com.tracker.features.auth.AppUserRepository;
import com.tracker.features.transaction.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final AppUserRepository userRepository;
    private final TransactionRepository transactionRepository;

    public BudgetService(BudgetRepository budgetRepository,
                         AppUserRepository userRepository,
                         TransactionRepository transactionRepository) {
        this.budgetRepository = budgetRepository;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
    }

    public Budget createOrUpdateBudget(Long userId, String category, BigDecimal limitAmount) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        Budget budget = budgetRepository.findByUserIdAndCategory(userId, category)
                .orElse(new Budget(user, category, limitAmount));
        
        budget.setLimitAmount(limitAmount);
        return budgetRepository.save(budget);
    }

    @Transactional(readOnly = true)
    public List<Budget> getBudgetsForUser(Long userId) {
        return budgetRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getBudgetPerformance(Long userId) {
        List<Budget> budgets = budgetRepository.findByUserId(userId);
        List<Map<String, Object>> performanceList = new ArrayList<>();

        LocalDate today = LocalDate.now();
        LocalDateTime startOfMonth = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime endOfMonth = today.withDayOfMonth(today.lengthOfMonth()).atTime(LocalTime.MAX);

        int currentDay = today.getDayOfMonth();
        int totalDays = today.lengthOfMonth();

        // Fetch category breakdown
        List<Map<String, Object>> spendings = transactionRepository.sumByCategoryForUserAndDateRange(userId, startOfMonth, endOfMonth);
        Map<String, BigDecimal> spendMap = new HashMap<>();
        for (Map<String, Object> spend : spendings) {
            String category = (String) spend.get("category");
            BigDecimal amount = (BigDecimal) spend.get("amount");
            spendMap.put(category, amount != null ? amount : BigDecimal.ZERO);
        }

        for (Budget budget : budgets) {
            BigDecimal spent = spendMap.getOrDefault(budget.getCategory(), BigDecimal.ZERO);
            BigDecimal limit = budget.getLimitAmount();
            BigDecimal remaining = limit.subtract(spent);

            // Calculate ideal burn rate up to today: (Limit / Total Days) * Current Day
            BigDecimal idealBurn = limit
                    .multiply(new BigDecimal(currentDay))
                    .divide(new BigDecimal(totalDays), 2, RoundingMode.HALF_UP);

            // Trajectory check: Alert if spending exceeds ideal burn rate and is not already zero limit
            boolean warning = limit.compareTo(BigDecimal.ZERO) > 0 && spent.compareTo(idealBurn) > 0;
            
            // Percentage exhausted
            BigDecimal percentage = BigDecimal.ZERO;
            if (limit.compareTo(BigDecimal.ZERO) > 0) {
                percentage = spent.multiply(new BigDecimal(100)).divide(limit, 2, RoundingMode.HALF_UP);
            }

            Map<String, Object> item = new HashMap<>();
            item.put("id", budget.getId());
            item.put("category", budget.getCategory());
            item.put("limitAmount", limit);
            item.put("spentAmount", spent);
            item.put("remainingAmount", remaining);
            item.put("percentageExhausted", percentage);
            item.put("idealBurnRate", idealBurn);
            item.put("isOverBurnRate", warning);

            performanceList.add(item);
        }

        return performanceList;
    }
}
