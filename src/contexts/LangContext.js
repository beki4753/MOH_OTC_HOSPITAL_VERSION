import React, { useState, useEffect, createContext, useContext } from "react";

const LangContext = createContext(undefined);

export const useLang = () => {
  const context = useContext(LangContext);
  if (!context) {
    throw new Error("useLang must be used within LangProvider");
  }
  return context;
};

export const LangProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const storedLang = localStorage.getItem("lang");
    return storedLang ? JSON.parse(storedLang) : "EN";
  });

  useEffect(() => {
    localStorage.setItem("lang", JSON.stringify(language));
  }, [language]);

  return (
    <LangContext.Provider value={{ language, setLanguage }}>
      {children}
    </LangContext.Provider>
  );
};
