package com.agendepro.user;

import com.agendepro.common.ApiResponse;
import com.agendepro.security.SecurityUtils;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import static com.agendepro.user.AuthDtos.*;

/** Porta de auth.routes.ts. */
@Tag(name = "Auth")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.login(request)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<MeResponse>> me() {
        var userId = SecurityUtils.currentUser().userId();
        return ResponseEntity.ok(ApiResponse.ok(authService.me(userId)));
    }

    @PatchMapping("/me")
    public ResponseEntity<ApiResponse<UpdateMeResponse>> updateMe(@Valid @RequestBody UpdateMeRequest request) {
        var userId = SecurityUtils.currentUser().userId();
        return ResponseEntity.ok(ApiResponse.ok(authService.updateMe(userId, request)));
    }

    @PutMapping("/password")
    public ResponseEntity<ApiResponse<MessageResponse>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        var userId = SecurityUtils.currentUser().userId();
        authService.changePassword(userId, request);
        return ResponseEntity.ok(ApiResponse.ok(new MessageResponse("Senha alterada com sucesso")));
    }
}
