import {
  ArrowRight,
  BadgeCheck,
  FileText,
  GitCompareArrows,
  MessageSquareText,
  Sparkles,
  Upload,
  WandSparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import "../../../styles/home-page.css";

function HomeInsightCard({
  icon,
  label,
  value,
  hint,
  tone = "gold",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  tone?: "gold" | "purple" | "green";
}) {
  return (
    <div className={`home-insight-card home-insight-card--${tone}`}>
      <div className="home-insight-card__icon">{icon}</div>
      <div className="home-insight-card__content">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{hint}</small>
      </div>
    </div>
  );
}

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
            <Sparkles size={14} />
            <span>{t("home.badge")}</span>
          </div>

          <h1>{t("home.title")}</h1>
          <p>{t("home.subtitle")}</p>

          <div className="home-hero__chips">
            <div className="home-hero-chip">
              <Upload size={14} />
              <span>{t("home.actions.uploadTitle")}</span>
            </div>

            <div className="home-hero-chip">
              <WandSparkles size={14} />
              <span>{t("home.highlights.aiTitle")}</span>
            </div>

            <div className="home-hero-chip">
              <GitCompareArrows size={14} />
              <span>{t("home.actions.compareTitle")}</span>
            </div>
          </div>

          <div className="home-hero__actions">
            <Link to="/documents" className="home-primary-button">
              <Upload size={18} />
              <span>{t("home.primaryCta")}</span>
            </Link>

            <Link to="/compare" className="home-secondary-button">
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
                <h3>AI Docs</h3>
              </div>

              <div className="home-preview__card">
                <p className="home-preview__label">{t("home.preview.ready")}</p>
                <h3>24/7</h3>
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

      <section className="home-insights">
        <HomeInsightCard
          icon={<FileText size={16} />}
          label={t("home.quickActionsTitle")}
          value={t("home.actions.uploadTitle")}
          hint={t("home.actions.uploadDescription")}
          tone="gold"
        />
        <HomeInsightCard
          icon={<BadgeCheck size={16} />}
          label={t("home.highlightsTitle")}
          value={t("home.highlights.libraryTitle")}
          hint={t("home.highlights.libraryDescription")}
          tone="green"
        />
        <HomeInsightCard
          icon={<GitCompareArrows size={16} />}
          label={t("home.secondaryCta")}
          value={t("home.actions.compareTitle")}
          hint={t("home.actions.compareDescription")}
          tone="purple"
        />
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
                    <Icon size={19} />
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
                    <Icon size={19} />
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
