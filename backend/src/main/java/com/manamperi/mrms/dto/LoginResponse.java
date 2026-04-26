package com.manamperi.mrms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private String token;
    @Builder.Default private String type = "Bearer";
    private Long userId;
    private String username;
    private String fullName;
    private String role;
}
