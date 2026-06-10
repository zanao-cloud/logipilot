export type PasswordCheck = {
  minLength: boolean
  hasUppercase: boolean
  hasLowercase: boolean
  hasNumber: boolean
  hasSpecial: boolean
}

export const MIN_PASSWORD_LENGTH = 8

export function checkPassword(pwd: string): PasswordCheck {
  return {
    minLength: pwd.length >= MIN_PASSWORD_LENGTH,
    hasUppercase: /[A-Z]/.test(pwd),
    hasLowercase: /[a-z]/.test(pwd),
    hasNumber: /\d/.test(pwd),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>_\-+=/\\[\];'`~]/.test(pwd),
  }
}

export function isPasswordStrong(pwd: string): boolean {
  const c = checkPassword(pwd)
  return c.minLength && c.hasUppercase && c.hasLowercase && c.hasNumber && c.hasSpecial
}

export function passwordErrorMessage(pwd: string, locale: 'pt' | 'en' | 'es' = 'pt'): string | null {
  const c = checkPassword(pwd)
  if (c.minLength && c.hasUppercase && c.hasLowercase && c.hasNumber && c.hasSpecial) return null
  const msgs = {
    pt: 'A senha precisa ter no mínimo 8 caracteres, com letra maiúscula, minúscula, número e caractere especial.',
    en: 'Password must be at least 8 characters with uppercase, lowercase, number and special character.',
    es: 'La contraseña debe tener al menos 8 caracteres, con mayúscula, minúscula, número y carácter especial.',
  }
  return msgs[locale]
}
