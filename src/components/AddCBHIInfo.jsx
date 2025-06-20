import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Backdrop,
  Grid,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AddCBHIInfo = ({
  isOpen,
  onClose,
  onSubmit,
  userData,
  resetUserData,
  adding,
}) => {
  const [formData, setFormData] = useState({
    kebele: "",
    idNumber: "",
    referalNum: "",
    letterNum: "",
    examination: "",
    goth: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  useEffect(() => {
    if (userData !== undefined) {
      setFormData({
        kebele: userData?.kebele || "",
        idNumber: userData?.idNo || "",
        referalNum: userData?.referalNo || "",
        letterNum: userData?.letterNo || "",
        examination: userData?.examination || "",
        goth: userData?.goth || "",
      });
    }
  }, [userData]);

  const handleClose = () => {
    setFormData({
      kebele: "",
      idNumber: "",
      referalNum: "",
      letterNum: "",
      examination: "",
      goth: "",
    });
    onClose();
    resetUserData();
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (!isOpen) {
      handleClose();
    }
  }, [isOpen]);

  return (
    <Modal
      open={isOpen}
      onClose={(event, reason) => {
        if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
          handleClose(); // Reset and close the modal
        }
      }}
      disableEscapeKeyDown
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{ timeout: 500 }}
    >
      <Box sx={modalStyle}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Add CBHI Information</Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Grid>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Kebele"
                  name="kebele"
                  type="text"
                  value={formData.kebele}
                  onChange={handleChange}
                  margin="normal"
                  disabled={!!userData}
                  //   error={!!fnameError}
                  //   helperText={fnameError}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Goth"
                  name="goth"
                  type="text"
                  value={formData.goth}
                  onChange={handleChange}
                  margin="normal"
                  disabled={!!userData}
                  //   error={!!fnameError}
                  //   helperText={fnameError}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="ID Number"
                  name="idNumber"
                  type="text"
                  value={formData.idNumber}
                  onChange={handleChange}
                  margin="normal"
                  disabled={!!userData}
                  required
                  //   error={!!emailError}
                  //   helperText={emailError}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Referal Number"
              name="referalNum"
              type="text"
              value={formData.referalNum}
              onChange={handleChange}
              margin="normal"
              disabled={!!userData}
              //   error={!!phoneError}
              //   helperText={phoneError}
            />
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Letter Number"
                  name="letterNum"
                  type="text"
                  value={formData.letterNum}
                  onChange={handleChange}
                  margin="normal"
                  disabled={!!userData}
                  //   error={!!addrError}
                  //   helperText={addrError}
                />
              </Grid>

              <Grid item xs={8}>
                <TextField
                  fullWidth
                  label="Examination"
                  name="examination"
                  type="test"
                  value={formData.examination}
                  onChange={handleChange}
                  margin="normal"
                  disabled={!!userData}
                />
              </Grid>
            </Grid>
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Button onClick={handleClose} color="secondary" sx={{ mr: 2 }}>
                Close
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={!!userData}
              >
                {adding ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Add CBHI Info"
                )}
                
              </Button>
            </Box>
          </form>
        </Grid>
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
  width: 600,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 3,
  borderRadius: 2,
};

export default AddCBHIInfo;
