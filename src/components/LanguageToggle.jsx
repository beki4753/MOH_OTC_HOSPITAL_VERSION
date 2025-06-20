import React, { useState} from "react";
import { Button, Box } from "@mui/material";
import { useLang } from "../contexts/LangContext";



const LanguageToggle = () => {
  const {language,setLanguage} = useLang()
 


  return (
    <Box
      sx={{
        display: "flex",
        borderRadius: "12px",
        overflow: "hidden",
        width: "100px",
        height: "28px",
        border: "1px solid #1976d2",
      }}
    >
      <Button
        onClick={() => setLanguage("EN")}
        sx={{
          flex: 1,
          fontSize: "12px",
          fontWeight: "bold",
          textTransform: "uppercase",
          padding: "2px 6px",
          minWidth: "auto",
          backgroundColor: language === "EN" ? "#1976d2" : "white",
          color: language === "EN" ? "white" : "#1976d2",
          "&:hover": {
            backgroundColor: language === "EN" ? "#1565c0" : "#e3f2fd",
          },
        }}
      >
        EN
      </Button>
      <Button
        onClick={() => setLanguage("AMH")}
        sx={{
          flex: 1,
          fontSize: "12px",
          fontWeight: "bold",
          textTransform: "uppercase",
          padding: "2px 6px",
          minWidth: "auto",
          backgroundColor: language === "AMH" ? "#1976d2" : "white",
          color: language === "AMH" ? "white" : "#1976d2",
          "&:hover": {
            backgroundColor: language === "AMH" ? "#1565c0" : "#e3f2fd",
          },
        }}
      >
        AMH
      </Button>
    </Box>
  );
};

export default LanguageToggle;
