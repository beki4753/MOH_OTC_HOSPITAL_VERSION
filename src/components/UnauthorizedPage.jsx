// src/components/UnauthorizedPage.jsx
import React from "react";
import {
  Box,
  Button,
  Container,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import SentimentVeryDissatisfiedIcon from "@mui/icons-material/SentimentVeryDissatisfied";
import { useNavigate } from "react-router-dom";

export default function UnauthorizedPage() {
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  return (
    <Container
      maxWidth="md"
      sx={{
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        px: 2,
      }}
    >
      <SentimentVeryDissatisfiedIcon
        sx={{
          fontSize: isSm ? 80 : 120,
          color: theme.palette.error.main,
          mb: 2,
        }}
      />
      <Typography variant={isSm ? "h4" : "h2"} gutterBottom>
        403 — Forbidden
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 4, maxWidth: 600 }}
      >
        You don’t have permission to access this page. If you think this is a
        mistake, please contact your administrator.
      </Typography>
      <Box>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => navigate("/")}
        >
          Go to Home
        </Button>
      </Box>
    </Container>
  );
}
