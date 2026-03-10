"use client";

import { useEffect } from "react";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  useEffect(() => {
    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src =
        "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      document.body.appendChild(script);

      (window as any).googleTranslateElementInit = () => {
        new (window as any).google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,hi,pa",
            autoDisplay: false,
          },
          "google_translate_element"
        );
      };
    }
  }, []);

  function changeLang(lang: string) {
    const select = document.querySelector(".goog-te-combo") as HTMLSelectElement;
    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event("change"));
    }
  }

  return (
    <div className="flex items-center gap-2 text-white">
      <Globe size={18} className="text-teal-300" />

      <button onClick={() => changeLang("en")} className="lang-btn">ENG</button>
      <button onClick={() => changeLang("hi")} className="lang-btn">हिंदी</button>
      <button onClick={() => changeLang("pa")} className="lang-btn">ਪੰਜਾਬੀ</button>

      {/* Hidden translate element */}
      <div id="google_translate_element" className="hidden"></div>
    </div>
  );
}
