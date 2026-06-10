import { promises as dns } from 'node:dns'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'tempmail.com', 'temp-mail.org', '10minutemail.com',
  'guerrillamail.com', 'yopmail.com', 'throwaway.email', 'trashmail.com',
  'fakeinbox.com', 'getnada.com', 'maildrop.cc', 'sharklasers.com',
  'mailnesia.com', 'inboxbear.com', 'dispostable.com',
])

export type EmailValidationResult =
  | { ok: true }
  | { ok: false; reason: 'format' | 'disposable' | 'mx' }

export function isEmailFormatValid(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 254
}

/**
 * Verifica se o domínio do e-mail tem registros MX válidos.
 * Não garante que a caixa exista — apenas que o domínio aceita e-mails.
 * A confirmação real vem do clique no link enviado.
 */
export async function checkEmailDomain(email: string): Promise<EmailValidationResult> {
  if (!isEmailFormatValid(email)) return { ok: false, reason: 'format' }

  const domain = email.split('@')[1].toLowerCase()
  if (DISPOSABLE_DOMAINS.has(domain)) return { ok: false, reason: 'disposable' }

  try {
    const records = await dns.resolveMx(domain)
    if (!records || records.length === 0) return { ok: false, reason: 'mx' }
    return { ok: true }
  } catch {
    return { ok: false, reason: 'mx' }
  }
}

export function emailErrorMessage(reason: 'format' | 'disposable' | 'mx', locale: 'pt' | 'en' | 'es' = 'pt'): string {
  const msgs = {
    pt: {
      format: 'E-mail inválido.',
      disposable: 'E-mails descartáveis não são permitidos.',
      mx: 'Este domínio de e-mail não existe ou não aceita mensagens.',
    },
    en: {
      format: 'Invalid email.',
      disposable: 'Disposable emails are not allowed.',
      mx: 'This email domain does not exist or does not accept messages.',
    },
    es: {
      format: 'Correo inválido.',
      disposable: 'No se permiten correos desechables.',
      mx: 'Este dominio de correo no existe o no acepta mensajes.',
    },
  }
  return msgs[locale][reason]
}
