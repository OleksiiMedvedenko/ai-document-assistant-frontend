import {
  getAdminUsers,
  removeAdminUserLimits,
  updateAdminUserActiveStatus,
  updateAdminUserLimits,
  updateAdminUserRole,
  type AdminUserItem,
} from "@/app/api/admin-users.api";
import { ConfirmModal } from "@/app/components/feedback/confirm-modal";
import { useAuthStore } from "@/app/store/auth.store";
import {
  Activity,
  BarChart3,
  Check,
  ChevronsUpDown,
  Crown,
  Infinity as InfinityIcon,
  Loader2,
  RefreshCcw,
  RotateCcw,
  Search,
  Settings2,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import "../../../styles/admin-users-page.css";

type LimitsFormState = {
  monthlyChatMessageLimit: string;
  monthlyDocumentUploadLimit: string;
  monthlySummarizationLimit: string;
  monthlyExtractionLimit: string;
  monthlyComparisonLimit: string;
  hasUnlimitedAiUsage: boolean;
  reason: string;
};

type RolePickerUserId = string | null;
type FilterTab = "all" | "admins" | "active" | "unlimited";

type UsageCardProps = {
  title: string;
  used: number;
  limit: number;
  remaining: number | null;
  unlimited: boolean;
  icon?: React.ReactNode;
};

type MetricKey =
  | "chatMessages"
  | "documentUploads"
  | "summarizations"
  | "extractions"
  | "comparisons";

type MetricDefinition = {
  key: MetricKey;
  labelKey: string;
};

const metricDefinitions: MetricDefinition[] = [
  { key: "chatMessages", labelKey: "usage.chatMessages" },
  { key: "documentUploads", labelKey: "usage.documentUploads" },
  { key: "summarizations", labelKey: "usage.summarizations" },
  { key: "extractions", labelKey: "usage.extractions" },
  { key: "comparisons", labelKey: "usage.comparisons" },
];

function toFormState(user: AdminUserItem): LimitsFormState {
  return {
    monthlyChatMessageLimit: String(user.monthlyChatMessageLimit ?? ""),
    monthlyDocumentUploadLimit: String(user.monthlyDocumentUploadLimit ?? ""),
    monthlySummarizationLimit: String(user.monthlySummarizationLimit ?? ""),
    monthlyExtractionLimit: String(user.monthlyExtractionLimit ?? ""),
    monthlyComparisonLimit: String(user.monthlyComparisonLimit ?? ""),
    hasUnlimitedAiUsage: user.hasUnlimitedAiUsage,
    reason: user.overrideReason ?? "",
  };
}

function parseNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function getInitials(user: AdminUserItem) {
  const base = (user.displayName || user.email || "?").trim();
  const parts = base.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }

  return base.slice(0, 2).toUpperCase();
}

function getMetricLimit(user: AdminUserItem, key: MetricKey) {
  switch (key) {
    case "chatMessages":
      return user.monthlyChatMessageLimit;
    case "documentUploads":
      return user.monthlyDocumentUploadLimit;
    case "summarizations":
      return user.monthlySummarizationLimit;
    case "extractions":
      return user.monthlyExtractionLimit;
    case "comparisons":
      return user.monthlyComparisonLimit;
    default:
      return 0;
  }
}

function getMetricUsed(user: AdminUserItem, key: MetricKey) {
  switch (key) {
    case "chatMessages":
      return user.usage.chatMessages.used;
    case "documentUploads":
      return user.usage.documentUploads.used;
    case "summarizations":
      return user.usage.summarizations.used;
    case "extractions":
      return user.usage.extractions.used;
    case "comparisons":
      return user.usage.comparisons.used;
    default:
      return 0;
  }
}

function getMetricRemaining(user: AdminUserItem, key: MetricKey) {
  switch (key) {
    case "chatMessages":
      return user.usage.chatMessages.remaining;
    case "documentUploads":
      return user.usage.documentUploads.remaining;
    case "summarizations":
      return user.usage.summarizations.remaining;
    case "extractions":
      return user.usage.extractions.remaining;
    case "comparisons":
      return user.usage.comparisons.remaining;
    default:
      return 0;
  }
}

function getUsagePercent(used: number, limit: number, unlimited: boolean) {
  if (unlimited) return 100;
  if (!limit || limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

function getAggregateUsage(user: AdminUserItem) {
  if (user.hasUnlimitedAiUsage) {
    return {
      totalPercent: 100,
      totalUsed:
        user.usage.chatMessages.used +
        user.usage.documentUploads.used +
        user.usage.summarizations.used +
        user.usage.extractions.used +
        user.usage.comparisons.used,
      totalLimit: null as number | null,
    };
  }

  const totalUsed =
    user.usage.chatMessages.used +
    user.usage.documentUploads.used +
    user.usage.summarizations.used +
    user.usage.extractions.used +
    user.usage.comparisons.used;

  const totalLimit =
    (user.monthlyChatMessageLimit || 0) +
    (user.monthlyDocumentUploadLimit || 0) +
    (user.monthlySummarizationLimit || 0) +
    (user.monthlyExtractionLimit || 0) +
    (user.monthlyComparisonLimit || 0);

  const totalPercent =
    totalLimit > 0
      ? Math.min(100, Math.round((totalUsed / totalLimit) * 100))
      : 0;

  return { totalPercent, totalUsed, totalLimit };
}

function getHealthTone(percent: number, unlimited: boolean) {
  if (unlimited) return "premium";
  if (percent >= 90) return "danger";
  if (percent >= 65) return "warning";
  return "good";
}

function UsageMetricCard({
  title,
  used,
  limit,
  remaining,
  unlimited,
  icon,
}: UsageCardProps) {
  const { t } = useTranslation();
  const percent = getUsagePercent(used, limit, unlimited);
  const tone = getHealthTone(percent, unlimited);

  return (
    <div className={`admin-usage-card admin-usage-card--${tone}`}>
      <div className="admin-usage-card__top">
        <div className="admin-usage-card__title-wrap">
          <div className="admin-usage-card__icon">{icon}</div>
          <h4>{title}</h4>
        </div>

        <span
          className={`admin-usage-card__badge ${
            unlimited ? "admin-usage-card__badge--unlimited" : ""
          }`}
        >
          {unlimited ? t("common.unlimited") : `${used}/${limit}`}
        </span>
      </div>

      <div className="admin-usage-card__progress">
        <div style={{ width: `${percent}%` }} />
      </div>

      <div className="admin-usage-card__stats">
        <div>
          <span>{t("common.used")}</span>
          <strong>{used}</strong>
        </div>
        <div>
          <span>{t("common.limit")}</span>
          <strong>{unlimited ? "∞" : limit}</strong>
        </div>
        <div>
          <span>{t("common.remaining")}</span>
          <strong>{unlimited ? "∞" : (remaining ?? 0)}</strong>
        </div>
      </div>
    </div>
  );
}

function InsightStat({
  icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "purple" | "green" | "gold";
}) {
  return (
    <div className={`admin-insight-card admin-insight-card--${tone}`}>
      <div className="admin-insight-card__icon">{icon}</div>
      <div className="admin-insight-card__content">
        <span>{label}</span>
        <strong>{value}</strong>
        {hint ? <small>{hint}</small> : null}
      </div>
    </div>
  );
}

export function AdminUsersPage() {
  const { t } = useTranslation();
  const currentUser = useAuthStore((state) => state.user);
  const refreshCurrentUser = useAuthStore((state) => state.refreshCurrentUser);

  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [form, setForm] = useState<LimitsFormState | null>(null);

  const [detailsUser, setDetailsUser] = useState<AdminUserItem | null>(null);
  const [rolePickerOpenFor, setRolePickerOpenFor] =
    useState<RolePickerUserId>(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("active");

  const [resetConfirmUser, setResetConfirmUser] =
    useState<AdminUserItem | null>(null);

  async function loadUsers() {
    setLoading(true);

    try {
      const data = await getAdminUsers();
      setUsers(data);

      if (detailsUser) {
        const refreshedDetails =
          data.find((x) => x.id === detailsUser.id) ?? null;
        setDetailsUser(refreshedDetails);
      }

      if (selectedUser) {
        const refreshedSelected =
          data.find((x) => x.id === selectedUser.id) ?? null;
        if (refreshedSelected) {
          setSelectedUser(refreshedSelected);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function refreshIfCurrentUser(userId: string) {
    if (currentUser?.id === userId) {
      await refreshCurrentUser();
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target?.closest(".admin-role-picker")) {
        setRolePickerOpenFor(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setRolePickerOpenFor(null);
        setSelectedUser(null);
        setForm(null);
        setDetailsUser(null);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const admins = users.filter((x) => x.role === "Admin").length;
    const unlimited = users.filter((x) => x.hasUnlimitedAiUsage).length;
    const active = users.filter((x) => x.isActive).length;
    const overrides = users.filter((x) => x.hasActiveOverride).length;

    const chatUsed = users.reduce(
      (sum, x) => sum + x.usage.chatMessages.used,
      0,
    );
    const docsUsed = users.reduce(
      (sum, x) => sum + x.usage.documentUploads.used,
      0,
    );
    const summariesUsed = users.reduce(
      (sum, x) => sum + x.usage.summarizations.used,
      0,
    );
    const extractionsUsed = users.reduce(
      (sum, x) => sum + x.usage.extractions.used,
      0,
    );
    const comparisonsUsed = users.reduce(
      (sum, x) => sum + x.usage.comparisons.used,
      0,
    );

    return {
      totalUsers,
      admins,
      unlimited,
      active,
      overrides,
      chatUsed,
      docsUsed,
      summariesUsed,
      extractionsUsed,
      comparisonsUsed,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    let result = users;

    if (activeFilter === "admins") {
      result = result.filter((user) => user.role === "Admin");
    } else if (activeFilter === "active") {
      result = result.filter((user) => user.isActive);
    } else if (activeFilter === "unlimited") {
      result = result.filter((user) => user.hasUnlimitedAiUsage);
    }

    if (!normalized) return result;

    return result.filter((user) => {
      const haystack = [
        user.displayName ?? "",
        user.email,
        user.role,
        user.authProvider,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [users, search, activeFilter]);

  const topUsers = useMemo(() => {
    return [...filteredUsers]
      .sort(
        (a, b) =>
          getAggregateUsage(b).totalPercent - getAggregateUsage(a).totalPercent,
      )
      .slice(0, 5);
  }, [filteredUsers]);

  async function handleRoleChange(userId: string, role: "Admin" | "User") {
    setSavingUserId(userId);

    try {
      await updateAdminUserRole(userId, { role });
      setRolePickerOpenFor(null);
      await Promise.all([loadUsers(), refreshIfCurrentUser(userId)]);
    } finally {
      setSavingUserId(null);
    }
  }

  async function handleStatusChange(userId: string, isActive: boolean) {
    setSavingUserId(userId);

    try {
      await updateAdminUserActiveStatus(userId, { isActive });
      await Promise.all([loadUsers(), refreshIfCurrentUser(userId)]);
    } finally {
      setSavingUserId(null);
    }
  }

  async function handleSaveLimits() {
    if (!selectedUser || !form) return;

    setSavingUserId(selectedUser.id);

    try {
      await updateAdminUserLimits(selectedUser.id, {
        monthlyChatMessageLimit: parseNumber(form.monthlyChatMessageLimit),
        monthlyDocumentUploadLimit: parseNumber(
          form.monthlyDocumentUploadLimit,
        ),
        monthlySummarizationLimit: parseNumber(form.monthlySummarizationLimit),
        monthlyExtractionLimit: parseNumber(form.monthlyExtractionLimit),
        monthlyComparisonLimit: parseNumber(form.monthlyComparisonLimit),
        hasUnlimitedAiUsage: form.hasUnlimitedAiUsage,
        reason: form.reason || null,
      });

      const affectedUserId = selectedUser.id;
      setSelectedUser(null);
      setForm(null);

      await Promise.all([loadUsers(), refreshIfCurrentUser(affectedUserId)]);
    } finally {
      setSavingUserId(null);
    }
  }

  async function handleResetToDefault(userId: string) {
    setSavingUserId(userId);

    try {
      await removeAdminUserLimits(userId);
      setResetConfirmUser(null);
      await Promise.all([loadUsers(), refreshIfCurrentUser(userId)]);
    } finally {
      setSavingUserId(null);
    }
  }

  return (
    <div className="admin-users-page">
      <section className="admin-users-hero surface-card">
        <div className="admin-users-hero__content">
          <div className="admin-users-hero__badge">
            <Sparkles size={14} />
            <span>{t("adminUsers.badge")}</span>
          </div>

          <h1>{t("adminUsers.title")}</h1>
          <p>{t("adminUsers.subtitle")}</p>
        </div>

        <div className="admin-users-hero__actions">
          <button
            type="button"
            className="admin-hero-button"
            onClick={() => void loadUsers()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 size={16} className="spin" />
            ) : (
              <RefreshCcw size={16} />
            )}
            <span>{t("common.refresh")}</span>
          </button>
        </div>
      </section>

      <section className="admin-users-insights">
        <InsightStat
          icon={<Users size={16} />}
          label={t("adminUsers.totalUsers")}
          value={stats.totalUsers}
          hint={t("adminUsers.insightUsersHint")}
          tone="purple"
        />
        <InsightStat
          icon={<ShieldCheck size={16} />}
          label={t("adminUsers.admins")}
          value={stats.admins}
          hint={t("adminUsers.insightAdminsHint")}
          tone="gold"
        />
        <InsightStat
          icon={<Zap size={16} />}
          label={t("adminUsers.overrides")}
          value={stats.overrides}
          hint={t("adminUsers.insightOverridesHint")}
          tone="green"
        />
        <InsightStat
          icon={<TrendingUp size={16} />}
          label={t("adminUsers.monthlyActivity")}
          value={
            stats.chatUsed +
            stats.docsUsed +
            stats.summariesUsed +
            stats.extractionsUsed +
            stats.comparisonsUsed
          }
          hint={t("adminUsers.insightActivityHint")}
        />
      </section>

      <section className="admin-users-layout">
        <div className="admin-users-main">
          <section className="admin-users-panel surface-card">
            <div className="admin-users-panel__top">
              <div>
                <p className="section-kicker">
                  {t("adminUsers.userManagementKicker")}
                </p>
                <h2>{t("adminUsers.userManagementTitle")}</h2>
              </div>

              <div className="admin-users-toolbar">
                <div className="admin-users-filters">
                  <button
                    type="button"
                    className={`admin-filter-chip ${activeFilter === "all" ? "is-active" : ""}`}
                    onClick={() => setActiveFilter("all")}
                  >
                    {t("adminUsers.filterAll")}
                  </button>
                  <button
                    type="button"
                    className={`admin-filter-chip ${activeFilter === "admins" ? "is-active" : ""}`}
                    onClick={() => setActiveFilter("admins")}
                  >
                    {t("adminUsers.filterAdmins")}
                  </button>
                  <button
                    type="button"
                    className={`admin-filter-chip ${activeFilter === "active" ? "is-active" : ""}`}
                    onClick={() => setActiveFilter("active")}
                  >
                    {t("adminUsers.filterActive")}
                  </button>
                  <button
                    type="button"
                    className={`admin-filter-chip ${activeFilter === "unlimited" ? "is-active" : ""}`}
                    onClick={() => setActiveFilter("unlimited")}
                  >
                    {t("adminUsers.filterUnlimited")}
                  </button>
                </div>

                <div className="admin-users-search">
                  <Search size={16} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("adminUsers.searchPlaceholder")}
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="admin-users-empty">
                <Loader2 size={18} className="spin" />
                <span>{t("common.loading")}</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="admin-users-empty">
                <Users size={18} />
                <span>{t("adminUsers.noUsersFound")}</span>
              </div>
            ) : (
              <div className="admin-users-compact-grid">
                {filteredUsers.map((user) => {
                  const isSaving = savingUserId === user.id;
                  const aggregate = getAggregateUsage(user);
                  const tone = getHealthTone(
                    aggregate.totalPercent,
                    user.hasUnlimitedAiUsage,
                  );

                  return (
                    <article
                      key={user.id}
                      className={`admin-user-row admin-user-row--${tone}`}
                      onClick={() => setDetailsUser(user)}
                    >
                      <div className="admin-user-row__main">
                        <div className="admin-user-row__avatar">
                          {getInitials(user)}
                        </div>

                        <div className="admin-user-row__identity">
                          <div className="admin-user-row__title">
                            <h3>{user.displayName || user.email}</h3>

                            {user.role === "Admin" ? (
                              <span className="admin-mini-badge admin-mini-badge--admin">
                                <Crown size={11} />
                                {t("roles.admin")}
                              </span>
                            ) : (
                              <span className="admin-mini-badge admin-mini-badge--user">
                                <UserRound size={11} />
                                {t("roles.user")}
                              </span>
                            )}

                            {user.hasUnlimitedAiUsage ? (
                              <span className="admin-mini-badge admin-mini-badge--premium">
                                <InfinityIcon size={11} />
                                {t("adminUsers.unlimited")}
                              </span>
                            ) : null}

                            {user.hasActiveOverride ? (
                              <span className="admin-mini-badge">
                                {t("adminUsers.overrideActive")}
                              </span>
                            ) : null}
                          </div>

                          <p>{user.email}</p>
                        </div>
                      </div>

                      <div className="admin-user-row__right">
                        <div className="admin-user-row__meta">
                          <div className="admin-user-row__meta-item">
                            <span>{t("adminUsers.provider")}</span>
                            <strong>{user.authProvider}</strong>
                          </div>

                          <div
                            className="admin-user-row__meta-item"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span>{t("adminUsers.status")}</span>
                            <button
                              className={`admin-pill ${user.isActive ? "is-active" : "is-inactive"}`}
                              disabled={isSaving}
                              onClick={() =>
                                void handleStatusChange(user.id, !user.isActive)
                              }
                            >
                              {user.isActive
                                ? t("adminUsers.active")
                                : t("adminUsers.inactive")}
                            </button>
                          </div>

                          <div className="admin-user-row__meta-item">
                            <span>{t("adminUsers.totalConsumption")}</span>
                            <strong>
                              {user.hasUnlimitedAiUsage
                                ? t("common.unlimited")
                                : `${aggregate.totalPercent}%`}
                            </strong>
                          </div>
                        </div>

                        <div
                          className="admin-user-row__progress"
                          aria-hidden="true"
                        >
                          <div
                            style={{ width: `${aggregate.totalPercent}%` }}
                          />
                        </div>

                        <div
                          className="admin-user-row__actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="admin-role-picker">
                            <button
                              type="button"
                              className="admin-role-picker__trigger admin-role-picker__trigger--compact"
                              disabled={isSaving}
                              onClick={() =>
                                setRolePickerOpenFor((current) =>
                                  current === user.id ? null : user.id,
                                )
                              }
                            >
                              <div className="admin-role-picker__trigger-content">
                                <Shield size={14} />
                                <span>
                                  {user.role === "Admin"
                                    ? t("roles.admin")
                                    : t("roles.user")}
                                </span>
                              </div>
                              <ChevronsUpDown size={14} />
                            </button>

                            {rolePickerOpenFor === user.id ? (
                              <div className="admin-role-picker__dropdown">
                                {(["User", "Admin"] as const).map((role) => {
                                  const active = user.role === role;

                                  return (
                                    <button
                                      key={role}
                                      type="button"
                                      className={`admin-role-picker__option ${
                                        active
                                          ? "admin-role-picker__option--active"
                                          : ""
                                      }`}
                                      onClick={() =>
                                        void handleRoleChange(user.id, role)
                                      }
                                    >
                                      <div className="admin-role-picker__option-main">
                                        <Shield size={14} />
                                        <span>
                                          {role === "Admin"
                                            ? t("roles.admin")
                                            : t("roles.user")}
                                        </span>
                                      </div>
                                      {active ? <Check size={14} /> : null}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>

                          <button
                            type="button"
                            className="admin-icon-button"
                            title={t("adminUsers.editLimits")}
                            onClick={() => {
                              setSelectedUser(user);
                              setForm(toFormState(user));
                            }}
                          >
                            <Settings2 size={15} />
                          </button>

                          <button
                            type="button"
                            className="admin-icon-button admin-icon-button--accent"
                            title={t("adminUsers.resetToDefault")}
                            disabled={isSaving}
                            onClick={() => setResetConfirmUser(user)}
                          >
                            {isSaving ? (
                              <Loader2 size={15} className="spin" />
                            ) : (
                              <RotateCcw size={15} />
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="admin-users-sidebar">
          <section className="admin-sidebar-card surface-card">
            <div className="admin-sidebar-card__header">
              <div>
                <p className="section-kicker">
                  {t("adminUsers.topUsageKicker")}
                </p>
                <h3>{t("adminUsers.topUsageTitle")}</h3>
              </div>
              <BarChart3 size={18} />
            </div>

            <div className="admin-top-list">
              {topUsers.length === 0 ? (
                <div className="admin-users-empty admin-users-empty--small">
                  <span>{t("adminUsers.noUsersFound")}</span>
                </div>
              ) : (
                topUsers.map((user, index) => {
                  const aggregate = getAggregateUsage(user);

                  return (
                    <button
                      key={user.id}
                      type="button"
                      className="admin-top-user"
                      onClick={() => setDetailsUser(user)}
                    >
                      <div className="admin-top-user__left">
                        <div className="admin-top-user__rank">#{index + 1}</div>
                        <div className="admin-top-user__avatar">
                          {getInitials(user)}
                        </div>
                        <div className="admin-top-user__content">
                          <strong>{user.displayName || user.email}</strong>
                          <span>{user.email}</span>
                        </div>
                      </div>

                      <div className="admin-top-user__right">
                        <strong>
                          {user.hasUnlimitedAiUsage
                            ? t("common.unlimited")
                            : `${aggregate.totalPercent}%`}
                        </strong>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          <section className="admin-sidebar-card surface-card">
            <div className="admin-sidebar-card__header">
              <div>
                <p className="section-kicker">
                  {t("adminUsers.activityBreakdownKicker")}
                </p>
                <h3>{t("adminUsers.activityBreakdownTitle")}</h3>
              </div>
              <TrendingUp size={18} />
            </div>

            <div className="admin-breakdown">
              <div className="admin-breakdown__row">
                <span>{t("usage.chatMessages")}</span>
                <strong>{stats.chatUsed}</strong>
              </div>
              <div className="admin-breakdown__row">
                <span>{t("usage.documentUploads")}</span>
                <strong>{stats.docsUsed}</strong>
              </div>
              <div className="admin-breakdown__row">
                <span>{t("usage.summarizations")}</span>
                <strong>{stats.summariesUsed}</strong>
              </div>
              <div className="admin-breakdown__row">
                <span>{t("usage.extractions")}</span>
                <strong>{stats.extractionsUsed}</strong>
              </div>
              <div className="admin-breakdown__row">
                <span>{t("usage.comparisons")}</span>
                <strong>{stats.comparisonsUsed}</strong>
              </div>
            </div>
          </section>
        </aside>
      </section>

      {detailsUser ? (
        <div
          className="admin-modal-backdrop"
          onClick={() => setDetailsUser(null)}
        >
          <div
            className="admin-user-details admin-user-details--wide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-user-details__top">
              <div>
                <div className="admin-users-hero__badge">
                  <BarChart3 size={14} />
                  <span>{t("adminUsers.detailsBadge")}</span>
                </div>
                <h2>{detailsUser.displayName || detailsUser.email}</h2>
                <p>{detailsUser.email}</p>
              </div>

              <button
                type="button"
                className="admin-user-details__close"
                onClick={() => setDetailsUser(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-user-details__meta">
              <div>
                <span>{t("adminUsers.role")}</span>
                <strong>
                  {detailsUser.role === "Admin"
                    ? t("roles.admin")
                    : t("roles.user")}
                </strong>
              </div>
              <div>
                <span>{t("adminUsers.provider")}</span>
                <strong>{detailsUser.authProvider}</strong>
              </div>
              <div>
                <span>{t("adminUsers.status")}</span>
                <strong>
                  {detailsUser.isActive
                    ? t("adminUsers.active")
                    : t("adminUsers.inactive")}
                </strong>
              </div>
              <div>
                <span>{t("adminUsers.unlimitedAccess")}</span>
                <strong>
                  {detailsUser.hasUnlimitedAiUsage
                    ? t("common.yes")
                    : t("common.no")}
                </strong>
              </div>
            </div>

            {detailsUser.hasActiveOverride ? (
              <div className="admin-user-details__override">
                <Settings2 size={16} />
                <div>
                  <strong>{t("adminUsers.overrideActive")}</strong>
                  <span>
                    {detailsUser.overrideReason || t("adminUsers.noReason")}
                  </span>
                </div>
              </div>
            ) : null}

            <div className="admin-user-details__charts">
              {metricDefinitions.map((metric) => (
                <UsageMetricCard
                  key={metric.key}
                  title={t(metric.labelKey)}
                  used={getMetricUsed(detailsUser, metric.key)}
                  limit={getMetricLimit(detailsUser, metric.key)}
                  remaining={getMetricRemaining(detailsUser, metric.key)}
                  unlimited={detailsUser.hasUnlimitedAiUsage}
                  icon={
                    metric.key === "chatMessages" ? (
                      <Activity size={15} />
                    ) : metric.key === "documentUploads" ? (
                      <Users size={15} />
                    ) : metric.key === "summarizations" ? (
                      <Sparkles size={15} />
                    ) : metric.key === "extractions" ? (
                      <SlidersHorizontal size={15} />
                    ) : (
                      <BarChart3 size={15} />
                    )
                  }
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {selectedUser && form ? (
        <div
          className="admin-modal-backdrop"
          onClick={() => {
            setSelectedUser(null);
            setForm(null);
          }}
        >
          <div
            className="admin-modal admin-modal--wide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__header">
              <div>
                <p className="section-kicker">
                  {t("adminUsers.editingKicker")}
                </p>
                <h2>{t("adminUsers.editLimitsTitle")}</h2>
                <p>{selectedUser.email}</p>
              </div>

              <button
                type="button"
                className="admin-user-details__close"
                onClick={() => {
                  setSelectedUser(null);
                  setForm(null);
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal__grid">
              <label className="admin-modal__field">
                <span>{t("adminUsers.chatLimit")}</span>
                <input
                  value={form.monthlyChatMessageLimit}
                  onChange={(e) =>
                    setForm((prev) =>
                      prev
                        ? { ...prev, monthlyChatMessageLimit: e.target.value }
                        : prev,
                    )
                  }
                />
              </label>

              <label className="admin-modal__field">
                <span>{t("adminUsers.uploadLimit")}</span>
                <input
                  value={form.monthlyDocumentUploadLimit}
                  onChange={(e) =>
                    setForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            monthlyDocumentUploadLimit: e.target.value,
                          }
                        : prev,
                    )
                  }
                />
              </label>

              <label className="admin-modal__field">
                <span>{t("adminUsers.summaryLimit")}</span>
                <input
                  value={form.monthlySummarizationLimit}
                  onChange={(e) =>
                    setForm((prev) =>
                      prev
                        ? { ...prev, monthlySummarizationLimit: e.target.value }
                        : prev,
                    )
                  }
                />
              </label>

              <label className="admin-modal__field">
                <span>{t("adminUsers.extractLimit")}</span>
                <input
                  value={form.monthlyExtractionLimit}
                  onChange={(e) =>
                    setForm((prev) =>
                      prev
                        ? { ...prev, monthlyExtractionLimit: e.target.value }
                        : prev,
                    )
                  }
                />
              </label>

              <label className="admin-modal__field">
                <span>{t("adminUsers.compareLimit")}</span>
                <input
                  value={form.monthlyComparisonLimit}
                  onChange={(e) =>
                    setForm((prev) =>
                      prev
                        ? { ...prev, monthlyComparisonLimit: e.target.value }
                        : prev,
                    )
                  }
                />
              </label>

              <label className="admin-modal__field admin-modal__field--checkbox admin-toggle-card">
                <div className="admin-toggle-card__content">
                  <div className="admin-toggle-card__left">
                    <div className="admin-toggle-card__icon">
                      <InfinityIcon size={16} />
                    </div>
                    <div>
                      <strong>{t("adminUsers.unlimitedAccess")}</strong>
                      <small>{t("adminUsers.unlimitedAccessHint")}</small>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`admin-switch ${form.hasUnlimitedAiUsage ? "is-on" : ""}`}
                    onClick={() =>
                      setForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              hasUnlimitedAiUsage: !prev.hasUnlimitedAiUsage,
                            }
                          : prev,
                      )
                    }
                  >
                    <span />
                  </button>
                </div>
              </label>

              <label className="admin-modal__field admin-modal__field--full">
                <span>{t("adminUsers.reason")}</span>
                <textarea
                  value={form.reason}
                  rows={4}
                  placeholder={t("adminUsers.reasonPlaceholder")}
                  onChange={(e) =>
                    setForm((prev) =>
                      prev ? { ...prev, reason: e.target.value } : prev,
                    )
                  }
                />
              </label>
            </div>

            <div className="admin-modal__actions">
              <button
                className="admin-button admin-button--ghost"
                onClick={() => {
                  setSelectedUser(null);
                  setForm(null);
                }}
              >
                {t("common.cancel")}
              </button>

              <button
                className="admin-button admin-button--accent"
                onClick={() => void handleSaveLimits()}
              >
                {t("common.save")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <ConfirmModal
        open={!!resetConfirmUser}
        title={t("adminUsers.resetConfirmTitle")}
        description={
          resetConfirmUser
            ? t("adminUsers.resetConfirmDescription", {
                email: resetConfirmUser.email,
              })
            : ""
        }
        confirmLabel={t("adminUsers.resetToDefault")}
        cancelLabel={t("common.cancel")}
        busy={savingUserId === resetConfirmUser?.id}
        tone="warning"
        onCancel={() => {
          if (savingUserId) return;
          setResetConfirmUser(null);
        }}
        onConfirm={() => {
          if (!resetConfirmUser) return;
          void handleResetToDefault(resetConfirmUser.id);
        }}
      />
    </div>
  );
}
