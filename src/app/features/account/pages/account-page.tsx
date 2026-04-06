import { useAuthStore } from "@/app/store/auth.store";
import {
  Activity,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  Crown,
  Infinity as InfinityIcon,
  Loader2,
  Mail,
  Orbit,
  Shield,
  Sparkles,
  UserRound,
  Waypoints,
} from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "../../../styles/account-page.css";

function getUsagePercent(used: number, limit: number, unlimited: boolean) {
  const safeLimit =
    !limit || limit <= 0 || limit === Number.MAX_SAFE_INTEGER ? 0 : limit;

  if (unlimited || safeLimit <= 0) return 100;

  return Math.min(100, Math.round((used / safeLimit) * 100));
}

function getUsageTone(percent: number, unlimited: boolean) {
  if (unlimited) return "premium";
  if (percent >= 90) return "danger";
  if (percent >= 65) return "warning";
  return "good";
}

function UsageCard({
  title,
  used,
  limit,
  remaining,
  unlimited,
  icon,
}: {
  title: string;
  used: number;
  limit: number;
  remaining: number;
  unlimited: boolean;
  icon: React.ReactNode;
}) {
  const { t } = useTranslation();
  const safeLimit =
    !limit || limit <= 0 || limit === Number.MAX_SAFE_INTEGER ? 0 : limit;
  const percent = getUsagePercent(used, limit, unlimited);
  const tone = getUsageTone(percent, unlimited);

  return (
    <article className={`account-usage-card account-usage-card--${tone}`}>
      <div className="account-usage-card__top">
        <div className="account-usage-card__title-wrap">
          <div className="account-usage-card__icon">{icon}</div>
          <h3>{title}</h3>
        </div>

        <span
          className={`account-usage-badge ${
            unlimited ? "account-usage-badge--unlimited" : ""
          }`}
        >
          {unlimited ? t("common.unlimited") : `${used}/${safeLimit}`}
        </span>
      </div>

      <div className="account-usage-progress">
        <div
          className="account-usage-progress__bar"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="account-usage-stats">
        <div>
          <span>{t("common.used")}</span>
          <strong>{used}</strong>
        </div>
        <div>
          <span>{t("common.limit")}</span>
          <strong>{unlimited ? "∞" : safeLimit}</strong>
        </div>
        <div>
          <span>{t("common.remaining")}</span>
          <strong>{unlimited ? "∞" : remaining}</strong>
        </div>
      </div>
    </article>
  );
}

function InfoTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="account-info-tile">
      <div className="account-info-tile__label">
        {icon ? <span className="account-info-tile__icon">{icon}</span> : null}
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
    </div>
  );
}

function HighlightCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="account-highlight">
      <div className="account-highlight__icon">{icon}</div>
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
    </div>
  );
}

export function AccountPage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const refreshCurrentUser = useAuthStore((state) => state.refreshCurrentUser);

  useEffect(() => {
    void refreshCurrentUser();
  }, [refreshCurrentUser]);

  if (!user) {
    return (
      <div className="account-page">
        <div className="account-loading surface-card">
          <Loader2 size={18} className="account-spin" />
          <span>{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  const unlimited = user.usage.hasUnlimitedAiUsage;

  const totalUsed =
    user.usage.chatMessages.used +
    user.usage.documentUploads.used +
    user.usage.summarizations.used +
    user.usage.extractions.used +
    user.usage.comparisons.used;

  const totalLimit = unlimited
    ? null
    : user.usage.chatMessages.limit +
      user.usage.documentUploads.limit +
      user.usage.summarizations.limit +
      user.usage.extractions.limit +
      user.usage.comparisons.limit;

  const totalPercent =
    unlimited || !totalLimit || totalLimit <= 0
      ? 100
      : Math.min(100, Math.round((totalUsed / totalLimit) * 100));

  return (
    <div className="account-page">
      <section className="account-hero surface-card">
        <div className="account-hero__content">
          <div className="account-hero__badge">
            <Sparkles size={14} />
            <span>{t("account.badge")}</span>
          </div>

          <h1>{t("account.title")}</h1>
          <p>{t("account.subtitle")}</p>

          <div className="account-hero__chips">
            <div className="account-hero-chip">
              <UserRound size={14} />
              <span>{user.displayName || user.email}</span>
            </div>

            <div className="account-hero-chip">
              <Shield size={14} />
              <span>
                {user.isActive ? t("account.active") : t("account.inactive")}
              </span>
            </div>

            <div className="account-hero-chip">
              <InfinityIcon size={14} />
              <span>
                {unlimited ? t("common.unlimited") : `${totalPercent}%`}
              </span>
            </div>
          </div>
        </div>

        <div className="account-hero__visual">
          <div className="account-orb account-orb--one" />
          <div className="account-orb account-orb--two" />

          <div className="account-summary-card">
            <div className="account-summary-card__row">
              <UserRound size={17} />
              <span>{t("account.role")}</span>
              <strong>
                {user.role === "Admin" ? t("roles.admin") : t("roles.user")}
              </strong>
            </div>

            <div className="account-summary-card__row">
              <Shield size={17} />
              <span>{t("account.status")}</span>
              <strong>
                {user.isActive ? t("account.active") : t("account.inactive")}
              </strong>
            </div>

            <div className="account-summary-card__row">
              <Sparkles size={17} />
              <span>{t("account.unlimited")}</span>
              <strong>{unlimited ? t("common.yes") : t("common.no")}</strong>
            </div>

            <div className="account-summary-card__row">
              <BarChart3 size={17} />
              <span>{t("account.totalUsage")}</span>
              <strong>
                {unlimited
                  ? t("common.unlimited")
                  : `${totalUsed}/${totalLimit ?? 0}`}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className="account-insights">
        <div className="account-insight-card account-insight-card--gold">
          <div className="account-insight-card__icon">
            <BarChart3 size={16} />
          </div>
          <div>
            <span>{t("account.totalUsage")}</span>
            <strong>{unlimited ? t("common.unlimited") : totalUsed}</strong>
            <small>{t("account.usageSubtitle")}</small>
          </div>
        </div>

        <div className="account-insight-card account-insight-card--purple">
          <div className="account-insight-card__icon">
            <BadgeCheck size={16} />
          </div>
          <div>
            <span>{t("account.role")}</span>
            <strong>
              {user.role === "Admin" ? t("roles.admin") : t("roles.user")}
            </strong>
            <small>{t("account.profileSubtitle")}</small>
          </div>
        </div>

        <div className="account-insight-card account-insight-card--green">
          <div className="account-insight-card__icon">
            <Activity size={16} />
          </div>
          <div>
            <span>{t("account.status")}</span>
            <strong>
              {user.isActive ? t("account.active") : t("account.inactive")}
            </strong>
            <small>{t("account.securityDescription")}</small>
          </div>
        </div>
      </section>

      <section className="account-grid">
        <div className="account-profile surface-card">
          <div className="account-section-header">
            <div>
              <p className="section-kicker">{t("account.profileKicker")}</p>
              <h2>{t("account.profileTitle")}</h2>
              <p>{t("account.profileSubtitle")}</p>
            </div>
          </div>

          <div className="account-profile__top">
            <div className="account-profile__avatar">
              <span>
                {(user.displayName || user.email || "?")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            </div>

            <div className="account-profile__identity">
              <div className="account-profile__identity-row">
                <h3>{user.displayName || user.email}</h3>

                {user.role === "Admin" ? (
                  <span className="account-mini-badge account-mini-badge--admin">
                    <Crown size={11} />
                    {t("roles.admin")}
                  </span>
                ) : (
                  <span className="account-mini-badge account-mini-badge--user">
                    <UserRound size={11} />
                    {t("roles.user")}
                  </span>
                )}

                {user.isActive ? (
                  <span className="account-mini-badge">
                    <CheckCircle2 size={11} />
                    {t("account.active")}
                  </span>
                ) : null}

                {unlimited ? (
                  <span className="account-mini-badge account-mini-badge--premium">
                    <InfinityIcon size={11} />
                    {t("common.unlimited")}
                  </span>
                ) : null}
              </div>

              <p>{user.email}</p>
            </div>
          </div>

          <div className="account-profile__grid">
            <InfoTile
              label={t("account.email")}
              value={user.email}
              icon={<Mail size={13} />}
            />
            <InfoTile
              label={t("account.displayName")}
              value={user.displayName || "-"}
              icon={<UserRound size={13} />}
            />
            <InfoTile
              label={t("account.role")}
              value={user.role === "Admin" ? t("roles.admin") : t("roles.user")}
              icon={<BadgeCheck size={13} />}
            />
            <InfoTile
              label={t("account.provider")}
              value={user.authProvider}
              icon={<Orbit size={13} />}
            />
            <InfoTile
              label={t("account.status")}
              value={
                user.isActive ? t("account.active") : t("account.inactive")
              }
              icon={<Shield size={13} />}
            />
            <InfoTile
              label={t("account.unlimited")}
              value={unlimited ? t("common.yes") : t("common.no")}
              icon={<InfinityIcon size={13} />}
            />
          </div>
        </div>

        <div className="account-side surface-card">
          <div className="account-section-header">
            <div>
              <p className="section-kicker">{t("account.accessKicker")}</p>
              <h2>{t("account.accessTitle")}</h2>
            </div>
          </div>

          <div className="account-highlights">
            <HighlightCard
              icon={<Shield size={17} />}
              title={t("account.security")}
              description={t("account.securityDescription")}
            />

            <HighlightCard
              icon={<Sparkles size={17} />}
              title={t("account.usageAccess")}
              description={t("account.usageAccessDescription")}
            />

            <HighlightCard
              icon={<Waypoints size={17} />}
              title={t("account.monthlyTracking")}
              description={t("account.monthlyTrackingDescription")}
            />
          </div>
        </div>
      </section>

      <section className="account-usage surface-card">
        <div className="account-section-header">
          <div>
            <p className="section-kicker">{t("account.usageKicker")}</p>
            <h2>{t("account.usageTitle")}</h2>
            <p>{t("account.usageSubtitle")}</p>
          </div>
        </div>

        <div className="account-usage__grid">
          <UsageCard
            title={t("usage.chatMessages")}
            used={user.usage.chatMessages.used}
            limit={user.usage.chatMessages.limit}
            remaining={user.usage.chatMessages.remaining}
            unlimited={unlimited}
            icon={<Activity size={15} />}
          />
          <UsageCard
            title={t("usage.documentUploads")}
            used={user.usage.documentUploads.used}
            limit={user.usage.documentUploads.limit}
            remaining={user.usage.documentUploads.remaining}
            unlimited={unlimited}
            icon={<UserRound size={15} />}
          />
          <UsageCard
            title={t("usage.summarizations")}
            used={user.usage.summarizations.used}
            limit={user.usage.summarizations.limit}
            remaining={user.usage.summarizations.remaining}
            unlimited={unlimited}
            icon={<Sparkles size={15} />}
          />
          <UsageCard
            title={t("usage.extractions")}
            used={user.usage.extractions.used}
            limit={user.usage.extractions.limit}
            remaining={user.usage.extractions.remaining}
            unlimited={unlimited}
            icon={<Waypoints size={15} />}
          />
          <UsageCard
            title={t("usage.comparisons")}
            used={user.usage.comparisons.used}
            limit={user.usage.comparisons.limit}
            remaining={user.usage.comparisons.remaining}
            unlimited={unlimited}
            icon={<BarChart3 size={15} />}
          />
        </div>
      </section>
    </div>
  );
}
