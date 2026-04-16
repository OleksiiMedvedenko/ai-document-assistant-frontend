import { confirmEmail, resendConfirmationEmail } from "@/app/api/auth.api";
import {
  buildEmailConfirmationUrl,
  getCurrentLanguage,
  readApiErrorCode,
  translateAuthError,
} from "@/app/lib/auth-flow";
import { CheckCircle2, Loader2, MailWarning, RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import "../../../styles/confirm-email-page.css";

type Status = "loading" | "success" | "error";
type FeedbackTone = "info" | "error" | "success";

export function ConfirmEmailPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const email = useMemo(
    () => searchParams.get("email")?.trim() ?? "",
    [searchParams],
  );
  const token = useMemo(
    () => searchParams.get("token")?.trim() ?? "",
    [searchParams],
  );

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [actionFeedback, setActionFeedback] = useState("");
  const [actionFeedbackTone, setActionFeedbackTone] =
    useState<FeedbackTone>("info");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!email || !token) {
        if (!cancelled) {
          setStatus("error");
          setMessage(t("auth.confirm.invalidLink"));
        }
        return;
      }

      try {
        await confirmEmail({ email, token });

        if (!cancelled) {
          setStatus("success");
          setMessage(t("auth.confirm.successMessage"));
        }
      } catch (error) {
        if (!cancelled) {
          const code = readApiErrorCode(error);
          setStatus("error");
          setMessage(
            translateAuthError(t, code, t("auth.confirm.errorMessage")),
          );
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [email, token, t]);

  async function handleResend() {
    if (!email || isResending) {
      return;
    }

    setActionFeedback("");
    setIsResending(true);

    try {
      await resendConfirmationEmail({
        email,
        confirmationUrl: buildEmailConfirmationUrl(),
        language: getCurrentLanguage(),
      });

      setActionFeedback(t("auth.confirm.resendSuccess"));
      setActionFeedbackTone("success");
    } catch (error) {
      const code = readApiErrorCode(error);
      setActionFeedback(
        translateAuthError(t, code, t("auth.confirm.resendError")),
      );
      setActionFeedbackTone("error");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="confirm-email-page">
      <div className="confirm-email-card">
        <div
          className={`confirm-email-card__icon confirm-email-card__icon--${status}`}
        >
          {status === "loading" ? (
            <Loader2 size={28} className="confirm-email-card__spinner" />
          ) : status === "success" ? (
            <CheckCircle2 size={28} />
          ) : (
            <MailWarning size={28} />
          )}
        </div>

        <p className="confirm-email-card__kicker">{t("auth.confirm.kicker")}</p>

        <h1 className="confirm-email-card__title">
          {status === "loading"
            ? t("auth.confirm.loadingTitle")
            : status === "success"
              ? t("auth.confirm.successTitle")
              : t("auth.confirm.errorTitle")}
        </h1>

        <p className="confirm-email-card__message">{message}</p>

        {email ? (
          <p className="confirm-email-card__email">
            <strong>{t("auth.confirm.emailLabel")}:</strong> {email}
          </p>
        ) : null}

        <div className="confirm-email-card__actions">
          {status === "success" ? (
            <Link className="confirm-email-card__primary" to="/login">
              {t("auth.confirm.goToLogin")}
            </Link>
          ) : null}

          {status === "error" && email ? (
            <button
              className="confirm-email-card__secondary"
              type="button"
              onClick={handleResend}
              disabled={isResending}
            >
              <RefreshCcw size={16} />
              {isResending
                ? t("auth.confirm.resending")
                : t("auth.confirm.resendButton")}
            </button>
          ) : null}
        </div>

        {actionFeedback ? (
          <div
            className={`confirm-email-card__feedback confirm-email-card__feedback--${actionFeedbackTone}`}
          >
            {actionFeedback}
          </div>
        ) : null}
      </div>
    </div>
  );
}
