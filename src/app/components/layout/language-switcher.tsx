import { useTranslation } from "react-i18next";

const languages = [
  { code: "en", label: "EN" },
  { code: "pl", label: "PL" },
  { code: "ua", label: "UA" },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="glass inline-flex rounded-2xl p-1 soft-shadow">
      {languages.map((language) => {
        const active = i18n.language === language.code;

        return (
          <button
            key={language.code}
            type="button"
            onClick={() => void i18n.changeLanguage(language.code)}
            className={[
              "rounded-xl px-3 py-2 text-xs font-semibold tracking-wide transition",
              active
                ? "bg-white text-zinc-950"
                : "text-zinc-300 hover:bg-white/10 hover:text-white",
            ].join(" ")}
          >
            {language.label}
          </button>
        );
      })}
    </div>
  );
}
