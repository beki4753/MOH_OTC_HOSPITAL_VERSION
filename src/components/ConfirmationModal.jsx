import React from "react";
import {
  Modal,
  Box,
  Typography,
  Button,
  IconButton,
  Backdrop,
  CircularProgress,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InfoIcon from "@mui/icons-material/Info";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  userData,
  userRole,
  loading,
  showUser = true,
}) => {
  const theme = useTheme();
  return (
    <Modal
      open={isOpen}
      onClose={(event, reason) => {
        if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
          onClose();
        }
      }}
      disableEscapeKeyDown
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{ timeout: 500 }}
      aria-labelledby="confirmation-modal-title"
      aria-describedby="confirmation-modal-description"
    >
      <Box
        sx={modalStyle}
        bgcolor={
          theme.palette.mode === "light"
            ? theme.palette.background.paper
            : theme.palette.background.default
        }
      >
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography
            variant="h6"
            fontWeight="bold"
            id="confirmation-modal-title"
            sx={{
              color: (theme) =>
                theme.palette.mode === "light"
                  ? theme.palette.primary.main
                  : theme.palette.info.light,
              display: "flex",
              alignItems: "center",
            }}
          >
            <InfoIcon sx={{ fontSize: 28, mr: 1 }} />
            Please Confirm
          </Typography>

          <IconButton onClick={onClose} color="error" aria-label="close modal">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Warning Message */}
        <Typography
          variant="body1"
          textAlign="center"
          mt={2}
          id="confirmation-modal-description"
        >
          Are you sure you want to delete the{" "}
          {showUser && (userRole ? `role "${userRole}"` : "user ")}
          <strong>{userData}</strong>?
        </Typography>

        {/* Buttons */}
        <Box display="flex" justifyContent="center" mt={3}>
          <Button
            variant="contained"
            color={theme.palette.mode === "light" ? "primary" : "secondary"}
            onClick={() => {
              onConfirm({ userData: userData, message: "Delete" });
            }}
            sx={{ mx: 1 }}
            aria-label="confirm deletion"
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Confirm"
            )}
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={onClose}
            sx={{ mx: 1 }}
            aria-label="cancel deletion"
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

// Modal Styles
const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  boxShadow: 24,
  p: 3,
  borderRadius: 2,
  textAlign: "center",
};

export default ConfirmationModal;
