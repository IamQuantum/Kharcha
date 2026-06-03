package com.tracker.features.transaction;

import com.tracker.features.auth.AppUser;
import com.tracker.features.auth.AppUserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AppUserRepository userRepository;

    public TransactionService(TransactionRepository transactionRepository, AppUserRepository userRepository) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    public Transaction createTransaction(Long userId, Transaction transactionData) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        Transaction transaction = new Transaction();
        transaction.setUser(user);
        transaction.setAmount(transactionData.getAmount());
        transaction.setMerchant(transactionData.getMerchant());
        transaction.setCategory(transactionData.getCategory());
        transaction.setTransactionDate(transactionData.getTransactionDate());
        transaction.setDescription(transactionData.getDescription());

        return transactionRepository.save(transaction);
    }

    @Transactional(readOnly = true)
    public Page<Transaction> getFilteredTransactions(Long userId, String category, String merchant,
                                                    LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        Specification<Transaction> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Rule: Must only return the logged in user's transactions
            predicates.add(cb.equal(root.get("user").get("id"), userId));

            if (category != null && !category.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("category"), category));
            }

            if (merchant != null && !merchant.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("merchant")), "%" + merchant.toLowerCase() + "%"));
            }

            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("transactionDate"), startDate));
            }

            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("transactionDate"), endDate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return transactionRepository.findAll(spec, pageable);
    }

    public Transaction updateTransaction(Long userId, Long transactionId, Transaction transactionData) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found with id: " + transactionId));

        if (!transaction.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized edit of transaction");
        }

        transaction.setAmount(transactionData.getAmount());
        transaction.setMerchant(transactionData.getMerchant());
        transaction.setCategory(transactionData.getCategory());
        transaction.setTransactionDate(transactionData.getTransactionDate());
        transaction.setDescription(transactionData.getDescription());

        return transactionRepository.save(transaction);
    }

    public void deleteTransaction(Long userId, Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found with id: " + transactionId));

        if (!transaction.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized deletion of transaction");
        }

        transactionRepository.delete(transaction);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalSpent(Long userId, LocalDateTime start, LocalDateTime end) {
        BigDecimal sum = transactionRepository.sumAmountByUserIdAndDateRange(userId, start, end);
        return sum != null ? sum : BigDecimal.ZERO;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCategoryBreakdown(Long userId, LocalDateTime start, LocalDateTime end) {
        return transactionRepository.sumByCategoryForUserAndDateRange(userId, start, end);
    }
}
