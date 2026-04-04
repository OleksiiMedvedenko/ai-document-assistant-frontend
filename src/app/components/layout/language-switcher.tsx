import { useTranslation } from "react-i18next";

const languages = [
  { code: "en", label: "EN" },
  { code: "pl", label: "PL" },
  { code: "ua", label: "UA" },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="inline-flex rounded-2xl surface-soft p-1">
      {languages.map((language) => {
        const active = i18n.resolvedLanguage === language.code;

        return (
          <button
            key={language.code}
            type="button"
            onClick={() => void i18n.changeLanguage(language.code)}
            className={[
              "rounded-xl px-3 py-2 text-xs font-semibold tracking-wide transition",
              active
                ? "primary-button"
                : "text-soft hover:bg-[var(--panel-strong)]",
            ].join(" ")}
          >
            {language.label}
          </button>
        );
      })}
    </div>
  );
}
