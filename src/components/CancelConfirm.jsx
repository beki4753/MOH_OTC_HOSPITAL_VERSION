import React, { useEffect, useState } from "react";
import {
  Modal,
  Box,
  Typography,
  Button,
  IconButton,
  Backdrop,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Divider,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InfoIcon from "@mui/icons-material/Info";

const CancelConfirm = ({ isOpen, onClose, onConfirm, userData, onloading }) => {
  const [selectedGroups, setSelectedGroups] = useState([]);

  const theme = useTheme();
  const checkboxColor =
    theme.palette.mode === "light"
      ? theme.palette.primary.main
      : theme.palette.secondary.main;

  useEffect(() => {
    if (isOpen) setSelectedGroups([]);
  }, [userData, isOpen]);

  const handleCheckboxChange = (group) => {
    try {
      setSelectedGroups((prev) =>
        prev.includes(group?.groupID)
          ? prev?.filter((id) => id !== group.groupID)
          : [...prev, group.groupID]
      );
    } catch (error) {
      console.error("This is handle CheckBox Error: ", error);
    }
  };

  const handleSubmit = () => {
    try {
      const selectedPayload = userData?.requestedCatagories
        ?.filter((group) => selectedGroups.includes(group.groupID))
        ?.map((group) => ({
          patientCardNumber: userData?.patientCardNumber,
          groupID: group.groupID,
          purpose: group.purpose || "N/A",
        }));

      if (selectedPayload.length > 0) {
        onConfirm({ selectedPayload: selectedPayload, message: "Yes Please!" });
      }
    } catch (error) {
      console.error("This is the handle Confimr Error: ", error);
    }
  };

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
        sx={{
          ...modalStyle,
          bgcolor:
            theme.palette.mode === "light"
              ? "background.paper"
              : "background.default",
        }}
      >
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography
            variant="h6"
            fontWeight="bold"
            color="primary"
            id="confirmation-modal-title"
          >
            <InfoIcon sx={{ fontSize: 30, verticalAlign: "middle", mr: 1 }} />
            Confirm Cancellation
          </Typography>
          <IconButton
            onClick={onClose}
            color="primary"
            aria-label="close modal"
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Typography variant="body1" mt={2} mb={1}>
          Cancel payment for <strong>{userData?.patientFName}</strong>?
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" fontWeight="medium" mb={1}>
          Select categories to cancel:
        </Typography>

        {userData?.requestedCatagories?.length > 0 ? (
          userData.requestedCatagories.map((group,index) => (
            <FormControlLabel
              key={index}
              control={
                <Checkbox
                  checked={selectedGroups.includes(group.groupID)}
                  onChange={() => handleCheckboxChange(group)}
                  sx={{
                    color: checkboxColor,
                    "&.Mui-checked": {
                      color: checkboxColor,
                    },
                  }}
                />
              }
              label={`${group.purpose} - ${group.amount} Birr`}
              sx={{ textAlign: "left" }}
            />
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            No categories found.
          </Typography>
        )}

        {/* Buttons */}
        <Box display="flex" justifyContent="flex-end" mt={3} gap={2}>
          <Button
            variant="outlined"
            color="error"
            onClick={onClose}
            disabled={onloading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color={theme.palette.mode === "light" ? "primary" : "secondary"}
            disabled={selectedGroups.length === 0 || onloading}
            onClick={handleSubmit}
          >
            {onloading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Confirm"
            )}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "90%",
  maxWidth: 500,
  boxShadow: 24,
  p: 3,
  borderRadius: 2,
};

export default CancelConfirm;
