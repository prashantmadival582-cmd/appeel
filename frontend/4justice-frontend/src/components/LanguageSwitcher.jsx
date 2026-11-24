
import { useTranslation } from "react-i18next";

import enFlag from "../assets/language-switcher-english.png";
import svFlag from "../assets/language-switcher-sweeden.png";

function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const currentLanguage = (
    i18n.resolvedLanguage || i18n.language || "en"
  ).startsWith("sv")
    ? "sv"
    : "en";

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
    localStorage.setItem("appeelLanguage", language);
  };

  return (
    <div className="language-switcher dashboard-language-switcher">
      <button
        type="button"
        className={currentLanguage === "en" ? "active" : ""}
        onClick={() => changeLanguage("en")}
        aria-pressed={currentLanguage === "en"}
        aria-label="English"
        title="English"
      >
        <img src={enFlag} alt="English" className="lang-flag-img" />
      </button>

      <span>|</span>

      <button
        type="button"
        className={currentLanguage === "sv" ? "active" : ""}
        onClick={() => changeLanguage("sv")}
        aria-pressed={currentLanguage === "sv"}
        aria-label="Svenska"
        title="Svenska"
      >
        <img src={svFlag} alt="Svenska" className="lang-flag-img" />
      </button>
    </div>
  );
}

export default LanguageSwitcher;
