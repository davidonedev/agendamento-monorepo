package com.agendepro.payment;

import com.agendepro.appointment.Appointment;
import com.agendepro.client.Client;
import com.agendepro.common.AppException;
import com.agendepro.tenant.Tenant;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Slf4j
@Service
public class MercadoPagoService {

    private static final String MP_BASE = "https://api.mercadopago.com";
    private static final ZoneId SAO_PAULO = ZoneId.of("America/Sao_Paulo");

    @Value("${app.mercadopago.access-token:}")
    private String defaultAccessToken;

    @Value("${app.app-url}")
    private String appUrl;

    private final RestClient restClient = RestClient.create();

    public PixPaymentResult createPixPayment(Appointment appointment, Client client, Tenant tenant) {
        String token = resolveToken(tenant);
        if (token.isBlank()) {
            throw new AppException("Pagamento Pix não configurado neste estabelecimento", 400, "PIX_NOT_CONFIGURED");
        }

        String description = "Agendamento #" + appointment.getId().toString().substring(0, 8).toUpperCase();
        String expiresAt = ZonedDateTime.now(SAO_PAULO).plusMinutes(30)
                .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);

        Map<String, Object> body = Map.of(
                "transaction_amount", appointment.getPrice(),
                "description", description,
                "payment_method_id", "pix",
                "payer", Map.of("email", client.getEmail()),
                "notification_url", appUrl + "/api/webhooks/mercadopago",
                "external_reference", appointment.getId().toString(),
                "date_of_expiration", expiresAt
        );

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.post()
                    .uri(MP_BASE + "/v1/payments")
                    .header("Authorization", "Bearer " + token)
                    .header("X-Idempotency-Key", appointment.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (response == null) throw new AppException("Resposta inválida do Mercado Pago", 502);

            String paymentId = response.get("id").toString();

            @SuppressWarnings("unchecked")
            Map<String, Object> poi = (Map<String, Object>) response.get("point_of_interaction");
            @SuppressWarnings("unchecked")
            Map<String, Object> td = (Map<String, Object>) poi.get("transaction_data");

            String qrCode = (String) td.get("qr_code");
            String qrCodeBase64 = (String) td.get("qr_code_base64");

            log.info("[payment] Pix criado: payment_id={} appt={}", paymentId, appointment.getId());
            return new PixPaymentResult(paymentId, qrCode, qrCodeBase64, expiresAt);

        } catch (HttpClientErrorException ex) {
            log.error("[payment] Erro MP ao criar Pix: {} — {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new AppException("Erro ao criar pagamento Pix. Tente novamente.", 502, "MP_ERROR");
        }
    }

    public String getPaymentStatus(Tenant tenant, String paymentId) {
        String token = resolveToken(tenant);
        if (token.isBlank()) return null;

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.get()
                    .uri(MP_BASE + "/v1/payments/" + paymentId)
                    .header("Authorization", "Bearer " + token)
                    .retrieve()
                    .body(Map.class);

            return response != null ? (String) response.get("status") : null;
        } catch (Exception ex) {
            log.warn("[payment] Erro ao consultar status de pagamento {}: {}", paymentId, ex.getMessage());
            return null;
        }
    }

    private String resolveToken(Tenant tenant) {
        if (tenant.getMpAccessToken() != null && !tenant.getMpAccessToken().isBlank()) {
            return tenant.getMpAccessToken();
        }
        return defaultAccessToken != null ? defaultAccessToken : "";
    }

    public record PixPaymentResult(String paymentId, String qrCode, String qrCodeBase64, String expiresAt) {
    }
}
