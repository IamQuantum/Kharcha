package com.tracker.features.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
public class UserSettingsController {

    private final UserSettingsRepository userSettingsRepository;

    public UserSettingsController(UserSettingsRepository userSettingsRepository) {
        this.userSettingsRepository = userSettingsRepository;
    }

    @GetMapping
    public ResponseEntity<UserSettings> getSettings(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        UserSettings settings = userSettingsRepository.findByUserId(userPrincipal.getId())
                .orElseThrow(() -> new RuntimeException("Settings not found for user: " + userPrincipal.getId()));
        return ResponseEntity.ok(settings);
    }

    @PutMapping
    public ResponseEntity<UserSettings> updateSettings(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody Map<String, Object> updates) {
        UserSettings settings = userSettingsRepository.findByUserId(userPrincipal.getId())
                .orElseThrow(() -> new RuntimeException("Settings not found for user: " + userPrincipal.getId()));

        if (updates.containsKey("monthlyIncome")) {
            settings.setMonthlyIncome(new BigDecimal(updates.get("monthlyIncome").toString()));
        }
        if (updates.containsKey("currency")) {
            settings.setCurrency(updates.get("currency").toString());
        }

        UserSettings savedSettings = userSettingsRepository.save(settings);
        return ResponseEntity.ok(savedSettings);
    }
}
