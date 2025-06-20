import React from "react";
import { useNavigate } from "react-router-dom";

const NotFoundPage = () => {
  const navigate = useNavigate();

  const goHome = () => {
    navigate("/");
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>404</h1>
      <p style={styles.subtitle}>Page Not Found</p>
      <p style={styles.description}>
        Oops! The page you are looking for doesn't exist or has been moved.
      </p>
      <button style={styles.button} onClick={goHome}>
        Go Back Home
      </button>
    </div>
  );
};

const styles = {
  container: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    textAlign: "center",
    backgroundColor: "#f8f9fa",
    color: "#343a40",
    fontFamily: "Arial, sans-serif",
  },
  title: {
    fontSize: "6rem",
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: "2rem",
    marginBottom: "1rem",
  },
  description: {
    fontSize: "1.2rem",
    marginBottom: "2rem",
  },
  button: {
    padding: "10px 20px",
    fontSize: "1rem",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default NotFoundPage;
