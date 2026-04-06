import { register } from "@/app/api/auth.api";
import { AppLoader } from "@/app/components/feedback/app-loader";
import { LanguageSwitcher } from "@/app/components/layout/language-switcher";
import { LockKeyhole, Mail, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import "../../../styles/register-page.css";

const MIN_SUCCESS_LOADER_MS = 1000;

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

type BearState = "idle" | "email" | "password";

export function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showSuccessLoader, setShowSuccessLoader] = useState(false);
  const [error, setError] = useState("");

  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const bearState = useMemo<BearState>(() => {
    if (isPasswordFocused) return "password";
    if (isEmailFocused || email.length > 0) return "email";
    return "idle";
  }, [isPasswordFocused, isEmailFocused, email.length]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await Promise.all([register({ email, password }), wait(250)]);
      setShowSuccessLoader(true);
      await wait(MIN_SUCCESS_LOADER_MS);
      navigate("/login");
    } catch {
      setError(t("auth.register.error"));
    } finally {
      setShowSuccessLoader(false);
      setLoading(false);
    }
  }

  return (
    <>
      <AppLoader
        visible={showSuccessLoader}
        title={t("auth.register.loaderTitle")}
        subtitle={t("auth.register.loaderSubtitle")}
      />

      <div className="register-page">
        <div className="register-page__glow register-page__glow--one" />
        <div className="register-page__glow register-page__glow--two" />
        <div className="register-page__noise" />

        <div className="register-page__topbar">
          <div className="register-page__badge">
            <Sparkles size={16} />
            <span>{t("auth.register.badge")}</span>
          </div>

          <LanguageSwitcher />
        </div>

        <div className="register-card">
          <section className="register-card__visual">
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
              <div className="bear-card__orbit bear-card__orbit--three">🚀</div>
            </div>

            <div className="register-card__copy">
              <p className="register-card__eyebrow">{t("brand.workspace")}</p>
              <h1>{t("auth.register.title")}</h1>
              <p>{t("auth.register.subtitle")}</p>

              <div className="register-card__feature-list">
                <div className="register-card__feature">
                  <span>🧠</span>
                  <p>{t("auth.register.featureWorkspace")}</p>
                </div>

                <div className="register-card__feature">
                  <span>📂</span>
                  <p>{t("auth.register.featureFiles")}</p>
                </div>

                <div className="register-card__feature">
                  <span>⚡</span>
                  <p>{t("auth.register.featureFlow")}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="register-card__form-side">
            <div className="register-form__header">
              <p className="register-form__brand">{t("brand.name")}</p>
              <h2>{t("auth.register.formTitle")}</h2>
              <p>{t("auth.register.formSubtitle")}</p>
            </div>

            <form onSubmit={handleSubmit} className="register-form" noValidate>
              <label className="register-field">
                <span className="register-field__label">
                  {t("auth.register.email")}
                </span>
                <div className="register-field__control">
                  <Mail size={18} />
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder={t("auth.register.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setIsEmailFocused(false)}
                  />
                </div>
              </label>

              <label className="register-field">
                <span className="register-field__label">
                  {t("auth.register.password")}
                </span>
                <div className="register-field__control">
                  <LockKeyhole size={18} />
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder={t("auth.register.passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                  />
                </div>
              </label>

              {error ? (
                <div className="register-form__error">{error}</div>
              ) : null}

              <button
                disabled={loading}
                type="submit"
                className="register-form__submit"
              >
                {loading
                  ? t("auth.register.creating")
                  : t("auth.register.submit")}
              </button>
            </form>

            <div className="register-form__footer">
              <span>{t("auth.register.haveAccount")}</span>
              <Link to="/login">{t("auth.register.signIn")}</Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
