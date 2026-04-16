import type { SupportedLanguage } from "@/app/api/auth.api";
import i18n from "@/i18n";
import type { TFunction } from "i18next";

export function getCurrentLanguage(): SupportedLanguage {
  const language = i18n.language?.toLowerCase();

  if (language === "pl" || language === "ua" || language === "en") {
    return language;
  }

  return "en";
}

export function buildEmailConfirmationUrl(): string {
  return `${window.location.origin}/confirm-email`;
}

export function readApiErrorCode(error: unknown): string | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object" &&
    (error as { response?: unknown }).response !== null
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            code?: unknown;
            Code?: unknown;
            message?: unknown;
            Message?: unknown;
          };
        };
      }
    ).response;

    const data = response?.data;

    if (typeof data?.code === "string" && data.code.trim()) {
      return data.code;
    }

    if (typeof data?.Code === "string" && data.Code.trim()) {
      return data.Code;
    }

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }

    if (typeof data?.Message === "string" && data.Message.trim()) {
      return data.Message;
    }
  }

  return null;
}

export function readApiErrorMessage(error: unknown, fallback: string): string {
  const code = readApiErrorCode(error);

  if (code) {
    return code;
  }

  return fallback;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function translateAuthError(
  t: TFunction,
  code: string | null,
  fallback: string,
): string {
  switch (code) {
    case "AUTH_EMAIL_REQUIRED":
      return t("auth.errors.emailRequired");
    case "AUTH_EMAIL_INVALID":
      return t("auth.errors.emailInvalid");
    case "AUTH_PASSWORD_REQUIRED":
      return t("auth.errors.passwordRequired");
    case "AUTH_PASSWORD_TOO_SHORT":
      return t("auth.errors.passwordTooShort");
    case "AUTH_EMAIL_ALREADY_EXISTS":
      return t("auth.errors.emailAlreadyExists");
    case "AUTH_INVALID_CREDENTIALS":
      return t("auth.errors.invalidCredentials");
    case "AUTH_EMAIL_NOT_CONFIRMED":
      return t("auth.errors.emailNotConfirmed");
    case "AUTH_ACCOUNT_INACTIVE":
      return t("auth.errors.accountInactive");
    case "AUTH_CONFIRMATION_INVALID_OR_EXPIRED":
      return t("auth.errors.confirmationInvalidOrExpired");
    case "AUTH_CONFIRMATION_RESEND_COOLDOWN":
      return t("auth.errors.confirmationResendCooldown");
    case "AUTH_CONFIRMATION_EMAIL_DELIVERY_FAILED":
      return t("auth.errors.confirmationDeliveryFailed");
    case "AUTH_EMAIL_ALREADY_CONFIRMED":
      return t("auth.errors.emailAlreadyConfirmed");
    case "AUTH_CONFIRMATION_URL_REQUIRED":
    case "AUTH_CONFIRMATION_URL_INVALID":
    case "AUTH_CONFIRMATION_URL_HOST_NOT_ALLOWED":
      return t("auth.errors.confirmationUrlInvalid");
    case "AUTH_INVALID_REFRESH_TOKEN":
      return t("auth.errors.invalidSession");
    case "AUTH_NOT_AUTHENTICATED":
      return t("auth.errors.notAuthenticated");
    default:
      return fallback;
  }
}
