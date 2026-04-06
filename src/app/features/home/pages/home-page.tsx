import {
  ArrowRight,
  FileText,
  GitCompareArrows,
  MessageSquareText,
  Sparkles,
  Upload,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import "../../../styles/home-page.css";

export function HomePage() {
  const { t } = useTranslation();

  const quickActions = [
    {
      to: "/documents",
      icon: Upload,
      title: t("home.actions.uploadTitle"),
      description: t("home.actions.uploadDescription"),
    },
    {
      to: "/compare",
      icon: GitCompareArrows,
      title: t("home.actions.compareTitle"),
      description: t("home.actions.compareDescription"),
    },
    {
      to: "/documents",
      icon: MessageSquareText,
      title: t("home.actions.chatTitle"),
      description: t("home.actions.chatDescription"),
    },
  ];

  const highlights = [
    {
      icon: FileText,
      title: t("home.highlights.libraryTitle"),
      description: t("home.highlights.libraryDescription"),
    },
    {
      icon: Sparkles,
      title: t("home.highlights.aiTitle"),
      description: t("home.highlights.aiDescription"),
    },
    {
      icon: GitCompareArrows,
      title: t("home.highlights.compareTitle"),
      description: t("home.highlights.compareDescription"),
    },
  ];

  return (
    <div className="home-page">
      <section className="home-hero surface-card">
        <div className="home-hero__content">
          <div className="home-hero__badge">
            <Sparkles size={16} />
            <span>{t("home.badge")}</span>
          </div>

          <h1>{t("home.title")}</h1>
          <p>{t("home.subtitle")}</p>

          <div className="home-hero__actions">
            <Link to="/documents" className="primary-button home-hero__primary">
              <Upload size={18} />
              <span>{t("home.primaryCta")}</span>
            </Link>

            <Link
              to="/compare"
              className="secondary-button home-hero__secondary"
            >
              <GitCompareArrows size={18} />
              <span>{t("home.secondaryCta")}</span>
            </Link>
          </div>
        </div>

        <div className="home-hero__visual">
          <div className="home-hero__orb home-hero__orb--one" />
          <div className="home-hero__orb home-hero__orb--two" />

          <div className="home-preview">
            <div className="home-preview__header">
              <span className="home-preview__dot" />
              <span className="home-preview__dot" />
              <span className="home-preview__dot" />
            </div>

            <div className="home-preview__body">
              <div className="home-preview__card">
                <p className="home-preview__label">
                  {t("home.preview.documents")}
                </p>
                <h3>-</h3>
              </div>

              <div className="home-preview__card">
                <p className="home-preview__label">{t("home.preview.ready")}</p>
                <h3>-</h3>
              </div>

              <div className="home-preview__card home-preview__card--wide">
                <p className="home-preview__label">{t("home.preview.flow")}</p>
                <div className="home-preview__chips">
                  <span>Summary</span>
                  <span>Extract</span>
                  <span>Chat</span>
                  <span>Compare</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-grid">
        <div className="home-section surface-card">
          <div className="section-heading">
            <div>
              <p className="section-heading__eyebrow">
                {t("home.quickActionsEyebrow")}
              </p>
              <h2>{t("home.quickActionsTitle")}</h2>
            </div>
          </div>

          <div className="home-actions">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.title}
                  to={action.to}
                  className="home-action-card"
                >
                  <div className="home-action-card__icon">
                    <Icon size={20} />
                  </div>

                  <div className="home-action-card__content">
                    <h3>{action.title}</h3>
                    <p>{action.description}</p>
                  </div>

                  <ArrowRight size={18} className="home-action-card__arrow" />
                </Link>
              );
            })}
          </div>
        </div>

        <div className="home-section surface-card">
          <div className="section-heading">
            <div>
              <p className="section-heading__eyebrow">
                {t("home.highlightsEyebrow")}
              </p>
              <h2>{t("home.highlightsTitle")}</h2>
            </div>
          </div>

          <div className="home-highlights">
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="home-highlight-card">
                  <div className="home-highlight-card__icon">
                    <Icon size={20} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
