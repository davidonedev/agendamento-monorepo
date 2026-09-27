package com.agendepro.notification;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Porta de whatsapp.service.ts — integração com Evolution API. Se o tenant não tiver
 * WhatsApp configurado, a mensagem só é logada (paridade com o comportamento de
 * desenvolvimento do Node).
 */
@Slf4j
@Service
public class WhatsappService {

    public static final String DEFAULT_TEMPLATE = """
            Olá {{clientName}}! 👋

            Seu agendamento em *{{tenantName}}* foi registrado com sucesso!

            📅 *Data:* {{date}}
            🕐 *Horário:* {{time}}
            ✂️ *Profissional:* {{professional}}
            💈 *Serviços:* {{services}}
            💰 *Total:* {{total}}

            Para confirmar seu cadastro e ativar sua conta, acesse o link abaixo:
            {{verificationLink}}

            _Este link expira em 24 horas. Caso não tenha feito este agendamento, ignore esta mensagem._""";

    private static final Pattern PLACEHOLDER = Pattern.compile("\\{\\{(\\w+)\\}\\}");

    private final RestClient restClient = RestClient.create();

    /** "(11) 99999-9999" / "11999999999" / "5511999999999" → "5511999999999". */
    public String normalizePhone(String phone) {
        String digits = phone.replaceAll("\\D", "");
        if (digits.startsWith("55") && digits.length() >= 12) return digits;
        return "55" + digits;
    }

    public String interpolateTemplate(String template, Map<String, String> vars) {
        Matcher matcher = PLACEHOLDER.matcher(template);
        StringBuilder result = new StringBuilder();
        while (matcher.find()) {
            String value = vars.getOrDefault(matcher.group(1), matcher.group(0));
            matcher.appendReplacement(result, Matcher.quoteReplacement(value));
        }
        matcher.appendTail(result);
        return result.toString();
    }

    public record TenantWhatsappConfig(String apiUrl, String apiKey, String instance) {
        public boolean isConfigured() {
            return apiUrl != null && !apiUrl.isBlank()
                    && apiKey != null && !apiKey.isBlank()
                    && instance != null && !instance.isBlank();
        }
    }

    @Async
    public void sendMessage(TenantWhatsappConfig config, String to, String text) {
        if (config == null || !config.isConfigured()) {
            log.info("\n──────────────────────────────────────────────────────\n" +
                            "[WHATSAPP] Mensagem (sem API configurada)\n  Para: {}\n  Mensagem:\n{}\n" +
                            "──────────────────────────────────────────────────────",
                    to, text.lines().map(l -> "    " + l).reduce("", (a, b) -> a + "\n" + b));
            return;
        }

        String normalized = normalizePhone(to);
        String url = config.apiUrl().replaceAll("/$", "") + "/message/sendText/" + config.instance();

        try {
            restClient.post()
                    .uri(url)
                    .header("Content-Type", "application/json")
                    .header("apikey", config.apiKey())
                    .body(Map.of("number", normalized, "text", text))
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception ex) {
            log.error("[whatsapp] Falha ao enviar mensagem: {}", ex.getMessage());
        }
    }
}
