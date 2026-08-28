export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateUsername(username: string): ValidationResult {
  if (!username || username.length === 0) {
    return { valid: false, error: "Username tidak boleh kosong." };
  }

  if (username.length < 3) {
    return { valid: false, error: "Username minimal 3 karakter." };
  }

  if (username.length > 30) {
    return { valid: false, error: "Username maksimal 30 karakter." };
  }

  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    return {
      valid: false,
      error: "Username hanya boleh huruf, angka, dan underscore.",
    };
  }

  return { valid: true };
}

export function validateName(name: string): ValidationResult {
  if (!name || name.length === 0) {
    return { valid: false, error: "Nama tidak boleh kosong." };
  }

  if (name.length < 2) {
    return { valid: false, error: "Nama minimal 2 karakter." };
  }

  if (name.length > 100) {
    return { valid: false, error: "Nama maksimal 100 karakter." };
  }

  const nameRegex = /^[a-zA-Z\s]+$/;
  if (!nameRegex.test(name)) {
    return {
      valid: false,
      error: "Nama hanya boleh huruf dan spasi.",
    };
  }

  return { valid: true };
}

export function validatePassword(password: string): ValidationResult {
  if (!password || password.length === 0) {
    return { valid: false, error: "Password tidak boleh kosong." };
  }

  if (password.length < 6) {
    return { valid: false, error: "Password minimal 6 karakter." };
  }

  if (password.length > 100) {
    return { valid: false, error: "Password maksimal 100 karakter." };
  }

  return { valid: true };
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim();
}
