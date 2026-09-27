package com.agendepro.publicapi;

import com.agendepro.appointment.AppointmentDtos;
import com.agendepro.catalog.ServiceOfferingDtos;
import com.agendepro.common.ApiResponse;
import com.agendepro.common.AppException;
import com.agendepro.product.ProductDtos;
import com.agendepro.product.ProductService;
import com.agendepro.tenant.Tenant;
import com.agendepro.tenant.TenantRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import static com.agendepro.publicapi.PublicDtos.*;

/** Porta de public.routes.ts — /api/public/**, sem autenticação. */
@Tag(name = "Public")
@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final PublicService publicService;
    private final ProductService productService;
    private final TenantRepository tenantRepository;

    @GetMapping("/login-data")
    public ResponseEntity<ApiResponse<List<LoginDataTenant>>> loginData() {
        return ResponseEntity.ok(ApiResponse.ok(publicService.getLoginData()));
    }

    @PostMapping("/register/business")
    public ResponseEntity<ApiResponse<BusinessRegisterResponse>> registerBusiness(@Valid @RequestBody BusinessRegisterRequest request) {
        var result = publicService.registerBusiness(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(result));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<TenantPublicResponse>> getTenant(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.ok(publicService.getTenantBySlug(slug)));
    }

    @GetMapping("/{slug}/services")
    public ResponseEntity<ApiResponse<List<ServiceOfferingDtos.ServiceResponse>>> services(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.ok(publicService.getPublicServices(slug)));
    }

    @GetMapping("/{slug}/professionals")
    public ResponseEntity<ApiResponse<List<ProfessionalPublicResponse>>> professionals(
            @PathVariable String slug, @RequestParam(required = false) UUID serviceId) {
        return ResponseEntity.ok(ApiResponse.ok(publicService.getPublicProfessionals(slug, serviceId)));
    }

    @GetMapping("/{slug}/availability")
    public ResponseEntity<ApiResponse<List<String>>> availability(
            @PathVariable String slug,
            @RequestParam UUID professionalId,
            @RequestParam(required = false) String serviceId,
            @RequestParam(required = false) String serviceIds,
            @RequestParam String date
    ) {
        var data = publicService.getAvailableSlots(slug, professionalId, serviceId, serviceIds, date);
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @PostMapping("/{slug}/booking")
    public ResponseEntity<ApiResponse<List<AppointmentDtos.AppointmentResponse>>> booking(
            @PathVariable String slug, @Valid @RequestBody BookingRequest request) {
        var created = publicService.createPublicBooking(slug, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
    }

    @GetMapping("/{slug}/products")
    public ResponseEntity<ApiResponse<List<ProductDtos.ProductResponse>>> products(@PathVariable String slug) {
        Tenant tenant = tenantRepository.findBySlug(slug).orElseThrow(() -> AppException.notFound("Tenant não encontrado"));
        return ResponseEntity.ok(ApiResponse.ok(productService.listPublic(tenant.getId())));
    }

    @PostMapping("/{slug}/login/client")
    public ResponseEntity<ApiResponse<ClientAuthResponse>> loginClient(@PathVariable String slug, @Valid @RequestBody ClientLoginRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(publicService.loginPublicClient(slug, request)));
    }

    @PostMapping("/{slug}/register/client")
    public ResponseEntity<ApiResponse<MessageResponse>> registerClient(@PathVariable String slug, @Valid @RequestBody ClientRegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(publicService.registerPublicClient(slug, request)));
    }

    @PostMapping("/{slug}/register-and-book")
    public ResponseEntity<ApiResponse<RegisterAndBookResponse>> registerAndBook(
            @PathVariable String slug, @Valid @RequestBody RegisterAndBookRequest request) {
        var result = publicService.registerAndBook(slug, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(result));
    }

    @PostMapping("/{slug}/register/professional")
    public ResponseEntity<ApiResponse<ProfessionalRegisterResponse>> registerProfessional(
            @PathVariable String slug, @Valid @RequestBody ProfessionalRegisterRequest request) {
        var result = publicService.registerPublicProfessional(slug, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(result));
    }

    @PostMapping("/{slug}/auth/google")
    public ResponseEntity<ApiResponse<ClientAuthResponse>> googleAuth(@PathVariable String slug, @Valid @RequestBody GoogleAuthRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(publicService.googleAuthPublicClient(slug, request)));
    }

    @GetMapping("/{slug}/my-appointments")
    public ResponseEntity<ApiResponse<List<AppointmentDtos.AppointmentResponse>>> myAppointments(
            @PathVariable String slug, @RequestParam UUID clientId) {
        return ResponseEntity.ok(ApiResponse.ok(publicService.getClientAppointments(slug, clientId)));
    }

    @PatchMapping("/{slug}/appointments/{id}/cancel")
    public ResponseEntity<ApiResponse<MessageResponse>> cancel(
            @PathVariable String slug, @PathVariable UUID id, @Valid @RequestBody CancelBookingRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(publicService.cancelPublicAppointment(slug, id, request)));
    }

    @GetMapping("/{slug}/verify-email")
    public ResponseEntity<ApiResponse<ClientAuthResponse>> verifyEmail(@PathVariable String slug, @RequestParam String token) {
        return ResponseEntity.ok(ApiResponse.ok(publicService.verifyClientEmail(slug, token)));
    }

    @PostMapping("/{slug}/resend-verification")
    public ResponseEntity<ApiResponse<MessageResponse>> resendVerification(
            @PathVariable String slug, @Valid @RequestBody ResendVerificationRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(publicService.resendVerificationEmail(slug, request)));
    }
}
