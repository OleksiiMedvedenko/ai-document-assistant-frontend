import { useTranslation } from "react-i18next";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
      {["en", "pl", "ua"].map((lang) => (
        <button
          key={lang}
          onClick={() => i18n.changeLanguage(lang)}
          className={`rounded-xl px-3 py-1.5 text-sm transition ${
            i18n.language === lang
              ? "bg-white text-zinc-950"
              : "text-zinc-300 hover:bg-white/10"
          }`}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
