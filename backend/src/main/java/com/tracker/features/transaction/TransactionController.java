package com.tracker.features.transaction;

import com.tracker.features.auth.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping
    public ResponseEntity<Transaction> create(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody Transaction transactionData) {
        Transaction created = transactionService.createTransaction(userPrincipal.getId(), transactionData);
        return ResponseEntity.ok(created);
    }

    @GetMapping
    public ResponseEntity<Page<Transaction>> getFiltered(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String merchant,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "transactionDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction) {

        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Transaction> transactions = transactionService.getFilteredTransactions(
                userPrincipal.getId(), category, merchant, startDate, endDate, pageable);
        return ResponseEntity.ok(transactions);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Transaction> update(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id,
            @RequestBody Transaction transactionData) {
        Transaction updated = transactionService.updateTransaction(userPrincipal.getId(), id, transactionData);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id) {
        transactionService.deleteTransaction(userPrincipal.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        // Default to current month boundaries
        LocalDateTime start = startDate;
        LocalDateTime end = endDate;
        if (start == null || end == null) {
            LocalDate now = LocalDate.now();
            start = now.withDayOfMonth(1).atStartOfDay();
            end = now.withDayOfMonth(now.lengthOfMonth()).atTime(LocalTime.MAX);
        }

        BigDecimal totalSpent = transactionService.getTotalSpent(userPrincipal.getId(), start, end);
        List<Map<String, Object>> categoryBreakdown = transactionService.getCategoryBreakdown(userPrincipal.getId(), start, end);

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalSpent", totalSpent);
        summary.put("categoryBreakdown", categoryBreakdown);
        summary.put("startDate", start);
        summary.put("endDate", end);

        return ResponseEntity.ok(summary);
    }
}
