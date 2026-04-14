/**
 * WhatsApp messaging service — Evolution API format.
 *
 * Compatible with:
 *  - Evolution API (open-source, self-hostable)
 *  - Any API that accepts:
 *      POST {apiUrl}/message/sendText/{instance}
 *      Headers: { apikey: key }
 *      Body:    { number: "5511999999999", text: "..." }
 *
 * If the tenant hasn't configured WhatsApp, the message is printed to
 * stdout so the developer can click the link during local development.
 */

export const DEFAULT_WHATSAPP_TEMPLATE = `Olá {{clientName}}! 👋

Seu agendamento em *{{tenantName}}* foi registrado com sucesso!

📅 *Data:* {{date}}
🕐 *Horário:* {{time}}
✂️ *Profissional:* {{professional}}
💈 *Serviços:* {{services}}
💰 *Total:* {{total}}

Para confirmar seu cadastro e ativar sua conta, acesse o link abaixo:
{{verificationLink}}

_Este link expira em 24 horas. Caso não tenha feito este agendamento, ignore esta mensagem._`;

// ─── Normalização de telefone ─────────────────────────────────────────────────

/**
 * Normaliza para o formato internacional sem '+':
 * "(11) 99999-9999" → "5511999999999"
 * "11999999999"     → "5511999999999"
 * "5511999999999"   → "5511999999999"
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  // Adiciona DDI Brasil se não tiver
  return '55' + digits;
}

// ─── Interpolação de template ─────────────────────────────────────────────────

export function interpolateTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

// ─── Envio via Evolution API ──────────────────────────────────────────────────

interface SendWhatsappParams {
  apiUrl:      string;
  apiKey:      string;
  instance:    string;
  to:          string;   // número normalizado (ex: 5511999999999)
  text:        string;
}

async function sendViaEvolutionApi(params: SendWhatsappParams): Promise<void> {
  const url = `${params.apiUrl.replace(/\/$/, '')}/message/sendText/${params.instance}`;

  const res = await fetch(url, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey':       params.apiKey,
    },
    body: JSON.stringify({ number: params.to, text: params.text }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`WhatsApp API error ${res.status}: ${body}`);
  }
}

// ─── Ponto de entrada principal ───────────────────────────────────────────────

interface TenantWhatsappConfig {
  whatsappApiUrl?:   string | null;
  whatsappApiKey?:   string | null;
  whatsappInstance?: string | null;
}

export async function sendWhatsappMessage(
  tenantConfig: TenantWhatsappConfig,
  to: string,
  text: string,
): Promise<void> {
  const { whatsappApiUrl, whatsappApiKey, whatsappInstance } = tenantConfig;

  if (!whatsappApiUrl || !whatsappApiKey || !whatsappInstance) {
    // Sem configuração → loga no console (desenvolvimento)
    console.log('\n──────────────────────────────────────────────────────');
    console.log('[WHATSAPP] Mensagem (sem API configurada)');
    console.log(`  Para: ${to}`);
    console.log('  Mensagem:');
    text.split('\n').forEach(line => console.log(`    ${line}`));
    console.log('──────────────────────────────────────────────────────\n');
    return;
  }

  await sendViaEvolutionApi({
    apiUrl:   whatsappApiUrl,
    apiKey:   whatsappApiKey,
    instance: whatsappInstance,
    to:       normalizePhone(to),
    text,
  });
}
