package com.agendepro.payment;

import com.agendepro.appointment.Appointment;
import com.agendepro.appointment.AppointmentRepository;
import com.agendepro.appointment.AppointmentStatus;
import com.agendepro.client.Client;
import com.agendepro.client.ClientRepository;
import com.agendepro.common.ApiResponse;
import com.agendepro.common.AppException;
import com.agendepro.tenant.Tenant;
import com.agendepro.tenant.TenantRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Tag(name = "Payment")
@RestController
@RequiredArgsConstructor
public class PaymentController {

    private final AppointmentRepository appointmentRepository;
    private final ClientRepository clientRepository;
    private final TenantRepository tenantRepository;
    private final MercadoPagoService mercadoPagoService;

    // ─── Criar pagamento Pix ───────────────────────────────────────────────────

    @PostMapping("/api/public/{slug}/appointments/{id}/pay/pix")
    @Transactional
    public ResponseEntity<ApiResponse<PixPaymentResponse>> createPixPayment(
            @PathVariable String slug,
            @PathVariable UUID id,
            @Valid @RequestBody CreatePixRequest request) {

        Tenant tenant = resolveTenant(slug);
        Appointment appt = appointmentRepository
                .findByIdAndTenantIdAndClientId(id, tenant.getId(), request.clientId())
                .orElseThrow(() -> AppException.notFound("Agendamento não encontrado"));

        if (appt.getStatus() == AppointmentStatus.CANCELLED) {
            throw new AppException("Agendamento cancelado não pode ser pago", 400, "ALREADY_CANCELLED");
        }
        if (appt.getStatus() == AppointmentStatus.COMPLETED) {
            throw new AppException("Agendamento já concluído", 400, "ALREADY_COMPLETED");
        }
        if ("approved".equals(appt.getPaymentStatus())) {
            throw new AppException("Agendamento já pago", 400, "ALREADY_PAID");
        }

        // Reutiliza QR existente se ainda não expirou
        if (appt.getPaymentId() != null && "pending".equals(appt.getPaymentStatus())
                && appt.getPaymentExpiresAt() != null && appt.getPaymentExpiresAt().isAfter(Instant.now())) {
            return ResponseEntity.ok(ApiResponse.ok(new PixPaymentResponse(
                    appt.getPaymentId(), appt.getPaymentQrCode(), appt.getPaymentQrCodeBase64(),
                    appt.getPaymentStatus(), appt.getPaymentExpiresAt().toString())));
        }

        Client client = clientRepository.findById(appt.getClientId())
                .orElseThrow(() -> AppException.notFound("Cliente não encontrado"));

        MercadoPagoService.PixPaymentResult result = mercadoPagoService.createPixPayment(appt, client, tenant);

        Instant expiresAt = ZonedDateTime.parse(result.expiresAt(), DateTimeFormatter.ISO_OFFSET_DATE_TIME)
                .toInstant();

        appt.setPaymentId(result.paymentId());
        appt.setPaymentStatus("pending");
        appt.setPaymentQrCode(result.qrCode());
        appt.setPaymentQrCodeBase64(result.qrCodeBase64());
        appt.setPaymentExpiresAt(expiresAt);
        appointmentRepository.save(appt);

        return ResponseEntity.ok(ApiResponse.ok(new PixPaymentResponse(
                result.paymentId(), result.qrCode(), result.qrCodeBase64(), "pending", result.expiresAt())));
    }

    // ─── Consultar status do pagamento (polling do frontend) ──────────────────

    @GetMapping("/api/public/{slug}/appointments/{id}/payment-status")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<PaymentStatusResponse>> getPaymentStatus(
            @PathVariable String slug,
            @PathVariable UUID id,
            @RequestParam UUID clientId) {

        Tenant tenant = resolveTenant(slug);
        Appointment appt = appointmentRepository
                .findByIdAndTenantIdAndClientId(id, tenant.getId(), clientId)
                .orElseThrow(() -> AppException.notFound("Agendamento não encontrado"));

        return ResponseEntity.ok(ApiResponse.ok(new PaymentStatusResponse(appt.getPaymentStatus(), appt.getPaymentId())));
    }

    // ─── Webhook Mercado Pago ──────────────────────────────────────────────────

    @PostMapping("/api/webhooks/mercadopago")
    @Transactional
    public ResponseEntity<Void> handleWebhook(
            HttpServletRequest servletRequest,
            @RequestBody(required = false) Map<String, Object> body) {

        // MP envia: ?type=payment&data.id=<payment_id>
        String type = servletRequest.getParameter("type");
        String paymentId = servletRequest.getParameter("data.id");

        // Fallback: payload JSON {"action":"payment.updated","data":{"id":"..."}}
        if (paymentId == null && body != null) {
            Object dataObj = body.get("data");
            if (dataObj instanceof Map<?, ?> dataMap) {
                Object idVal = dataMap.get("id");
                paymentId = idVal != null ? idVal.toString() : null;
            }
            if (type == null) type = (String) body.get("action");
        }

        if (paymentId == null) return ResponseEntity.ok().build();
        if (type != null && !type.startsWith("payment")) return ResponseEntity.ok().build();

        final String resolvedPaymentId = paymentId;
        Optional<Appointment> apptOpt = appointmentRepository.findByPaymentId(resolvedPaymentId);
        if (apptOpt.isEmpty()) {
            log.debug("[payment] webhook: agendamento não encontrado para payment_id={}", resolvedPaymentId);
            return ResponseEntity.ok().build();
        }

        Appointment appt = apptOpt.get();
        Tenant tenant = tenantRepository.findById(appt.getTenantId()).orElse(null);
        if (tenant == null) return ResponseEntity.ok().build();

        try {
            String status = mercadoPagoService.getPaymentStatus(tenant, resolvedPaymentId);
            if (status != null && !status.equals(appt.getPaymentStatus())) {
                appt.setPaymentStatus(status);
                if ("approved".equals(status)) {
                    appt.setStatus(AppointmentStatus.CONFIRMED);
                    log.info("[payment] Pix aprovado: appt={} payment_id={}", appt.getId(), resolvedPaymentId);
                }
                appointmentRepository.save(appt);
            }
        } catch (Exception ex) {
            log.warn("[payment] webhook: erro ao verificar payment_id={}: {}", resolvedPaymentId, ex.getMessage());
        }

        return ResponseEntity.ok().build();
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private Tenant resolveTenant(String slug) {
        return tenantRepository.findBySlug(slug)
                .orElseThrow(() -> AppException.notFound("Estabelecimento não encontrado"));
    }

    // ─── DTOs ─────────────────────────────────────────────────────────────────

    public record CreatePixRequest(@NotNull UUID clientId) {
    }

    public record PixPaymentResponse(String paymentId, String qrCode, String qrCodeBase64,
                                      String status, String expiresAt) {
    }

    public record PaymentStatusResponse(String status, String paymentId) {
    }
}
