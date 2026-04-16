import { login, resendConfirmationEmail } from "@/app/api/auth.api";
import { AppLoader } from "@/app/components/feedback/app-loader";
import { LanguageSwitcher } from "@/app/components/layout/language-switcher";
import {
  buildEmailConfirmationUrl,
  getCurrentLanguage,
  isValidEmail,
  readApiErrorCode,
  translateAuthError,
} from "@/app/lib/auth-flow";
import { useAuthStore } from "@/app/store/auth.store";
import { LockKeyhole, Mail, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../../../styles/login-page.css";

const MIN_SUCCESS_LOADER_MS = 1000;

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

type BearState = "idle" | "email" | "password";

type LoginLocationState = {
  registeredEmail?: string;
  registrationSuccess?: boolean;
};

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);

  const locationState = (location.state ?? null) as LoginLocationState | null;

  const [email, setEmail] = useState(locationState?.registeredEmail ?? "");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessLoader, setShowSuccessLoader] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(
    locationState?.registrationSuccess
      ? t("auth.login.registrationSuccess")
      : "",
  );
  const [isResending, setIsResending] = useState(false);
  const [canResend, setCanResend] = useState(false);

  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const bearState = useMemo<BearState>(() => {
    if (isPasswordFocused) return "password";
    if (isEmailFocused || email.length > 0) return "email";
    return "idle";
  }, [isPasswordFocused, isEmailFocused, email.length]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (isSubmitting) return;

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError(t("auth.errors.emailRequired"));
      setInfo("");
      setCanResend(false);
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setError(t("auth.errors.emailInvalid"));
      setInfo("");
      setCanResend(false);
      return;
    }

    if (!password.trim()) {
      setError(t("auth.errors.passwordRequired"));
      setInfo("");
      setCanResend(false);
      return;
    }

    setError("");
    setInfo("");
    setCanResend(false);
    setIsSubmitting(true);

    try {
      const [result] = await Promise.all([
        login({ email: normalizedEmail, password }),
        wait(250),
      ]);

      setAuth(result);

      setShowSuccessLoader(true);
      await wait(MIN_SUCCESS_LOADER_MS);

      navigate("/documents");
    } catch (error) {
      const code = readApiErrorCode(error);
      const message = translateAuthError(t, code, t("auth.login.error"));

      setError(message);

      if (code === "AUTH_EMAIL_NOT_CONFIRMED") {
        setCanResend(true);
      }
    } finally {
      setShowSuccessLoader(false);
      setIsSubmitting(false);
    }
  }

  async function handleResendConfirmation() {
    const normalizedEmail = email.trim();

    if (!normalizedEmail || isResending) return;

    setError("");
    setInfo("");
    setIsResending(true);

    try {
      await resendConfirmationEmail({
        email: normalizedEmail,
        confirmationUrl: buildEmailConfirmationUrl(),
        language: getCurrentLanguage(),
      });

      setInfo(t("auth.login.resendSuccess"));
      setCanResend(false);
    } catch (error) {
      const code = readApiErrorCode(error);
      setError(translateAuthError(t, code, t("auth.login.resendError")));
    } finally {
      setIsResending(false);
    }
  }

  return (
    <>
      <AppLoader
        visible={showSuccessLoader}
        title={t("auth.loader.title")}
        subtitle={t("auth.loader.subtitle")}
      />

      <div className="login-page">
        <div className="login-page__glow login-page__glow--one" />
        <div className="login-page__glow login-page__glow--two" />
        <div className="login-page__noise" />

        <div className="login-page__topbar">
          <div className="login-page__badge">
            <Sparkles size={16} />
            <span>{t("auth.login.badge")}</span>
          </div>

          <LanguageSwitcher />
        </div>

        <div className="login-card">
          <section className="login-card__visual">
            <div className="bear-card">
              <div className={`bear bear--${bearState}`}>
                <div className="bear__shadow" />

                <div className="bear__ears">
                  <span className="bear__ear bear__ear--left" />
                  <span className="bear__ear bear__ear--right" />
                </div>

                <div className="bear__face">
                  <div className="bear__brows">
                    <span className="bear__brow bear__brow--left" />
                    <span className="bear__brow bear__brow--right" />
                  </div>

                  <div className="bear__eyes">
                    <span className="bear__eye bear__eye--left">
                      <span className="bear__eye-core" />
                      <span className="bear__eye-shine" />
                    </span>
                    <span className="bear__eye bear__eye--right">
                      <span className="bear__eye-core" />
                      <span className="bear__eye-shine" />
                    </span>
                  </div>

                  <div className="bear__snout">
                    <span className="bear__nose" />
                    <span className="bear__mouth" />
                  </div>

                  <div className="bear__blush bear__blush--left" />
                  <div className="bear__blush bear__blush--right" />
                </div>

                <div className="bear__paws">
                  <span className="bear__paw bear__paw--left">
                    <span className="bear__claw bear__claw--1" />
                    <span className="bear__claw bear__claw--2" />
                    <span className="bear__claw bear__claw--3" />
                  </span>

                  <span className="bear__paw bear__paw--right">
                    <span className="bear__claw bear__claw--1" />
                    <span className="bear__claw bear__claw--2" />
                    <span className="bear__claw bear__claw--3" />
                  </span>
                </div>
              </div>

              <div className="bear-card__orbit bear-card__orbit--one">📄</div>
              <div className="bear-card__orbit bear-card__orbit--two">✨</div>
              <div className="bear-card__orbit bear-card__orbit--three">🤖</div>
            </div>

            <div className="login-card__copy">
              <p className="login-card__eyebrow">{t("brand.workspace")}</p>
              <h1>{t("auth.login.title")}</h1>
              <p>{t("auth.login.subtitle")}</p>

              <div className="login-card__feature-list">
                <div className="login-card__feature">
                  <span>💬</span>
                  <p>{t("auth.login.featureChat")}</p>
                </div>

                <div className="login-card__feature">
                  <span>📑</span>
                  <p>{t("auth.login.featureCompare")}</p>
                </div>

                <div className="login-card__feature">
                  <span>⚡</span>
                  <p>{t("auth.login.featureExtract")}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="login-card__form-side">
            <div className="login-form__header">
              <p className="login-form__brand">{t("brand.name")}</p>
              <h2>{t("auth.login.formTitle")}</h2>
              <p>{t("auth.login.formSubtitle")}</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form" noValidate>
              <label className="login-field">
                <span className="login-field__label">
                  {t("auth.login.email")}
                </span>
                <div className="login-field__control">
                  <Mail size={18} />
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder={t("auth.login.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setIsEmailFocused(false)}
                  />
                </div>
              </label>

              <label className="login-field">
                <span className="login-field__label">
                  {t("auth.login.password")}
                </span>
                <div className="login-field__control">
                  <LockKeyhole size={18} />
                  <input
                    type="password"
                    autoComplete="current-password"
                    placeholder={t("auth.login.passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                  />
                </div>
              </label>

              {info ? <div className="login-form__info">{info}</div> : null}
              {error ? <div className="login-form__error">{error}</div> : null}

              {canResend ? (
                <button
                  type="button"
                  className="login-form__secondary"
                  disabled={isResending}
                  onClick={handleResendConfirmation}
                >
                  {isResending
                    ? t("auth.login.resending")
                    : t("auth.login.resendConfirmation")}
                </button>
              ) : null}

              <button
                type="submit"
                className="login-form__submit"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? t("auth.login.signingIn")
                  : t("auth.login.submit")}
              </button>

              <div className="login-form__footer">
                <span>{t("auth.login.noAccount")}</span>
                <Link to="/register">{t("auth.login.createAccount")}</Link>
              </div>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
