import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Divider,
  TextField,
  InputAdornment,
  IconButton,
  useTheme,
} from "@mui/material";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import PersonIcon from "@mui/icons-material/Person";
import VerifiedIcon from "@mui/icons-material/Verified";
import { toast } from "react-toastify";
import api from "../utils/api";
import { getTokenValue } from "../services/user_service";
import { convertToEthDateWithTime } from "../pages/reports/CollectedReport";
const tokenvalue = getTokenValue();

const formatter2 = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: true,
});

const formatAccounting2 = (num) => {
  const formatted = formatter2.format(Math.abs(num));
  return num < 0 ? `(${formatted})` : formatted;
};

const AgreementDialog = ({
  open,
  onClose,
  selectedTransaction,
  onSubmit,
  BackdropProps,
}) => {
  const [agreed, setAgreed] = useState(false);
  const [verifyEmp, setVerifyEmp] = useState(undefined);
  const [empVerified, setEmpVerified] = useState("no");
  const [signature, setSignature] = useState("");
  const [empIdError, setEmpIdError] = useState("");
  const [empNameError, setEmpNameError] = useState("");
  const [formData, setFormData] = useState({
    empId: "",
    empName: "",
    signature: "",
    cashier: "",
  });

  const theme = useTheme();

  const checkboxColor =
    theme.palette.mode === "light"
      ? theme.palette.primary.main
      : theme.palette.secondary.main;

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      signature: signature,
    }));
  }, [signature]);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === "empId") {
      empIdValidation(value);
    }
    if (name === "empName") {
      empNameValidation(value);
    }
    setVerifyEmp(undefined);
    setEmpVerified("no");
  };

  const handleVerify = async () => {
    try {
      const response = await api.put("/Collection/collector-check", {
        employeeID: formData?.empId.toLocaleLowerCase(),
        employeeName: formData?.empName,
        user: tokenvalue?.name,
      });
      if (response.status === 200) {
        toast.success("Verified.");
        setEmpVerified("yes");
        setVerifyEmp(true);
      } else {
        setVerifyEmp(undefined);
        setVerifyEmp(false);
      }
    } catch (error) {
      console.error(error);
      setVerifyEmp(false);
      setEmpVerified("no");
      toast.info(error?.response?.data?.msg || "Internal Server Error!");
    }
  };

  const empIdValidation = (value) => {
    if (!/^TS[0-9]{1,}$/.test(value) || value.lengh < 4) {
      setEmpIdError("Please provide valid Employee Id");
    } else {
      setEmpIdError("");
    }
  };

  const nameRegx = /^[A-Za-z]+(?:\s[A-Za-z]+)?$/;

  const empNameValidation = (value) => {
    if (!nameRegx.test(value) || value.length < 4) {
      setEmpNameError("Please provide a valid Name");
    } else {
      setEmpNameError("");
    }
  };

  const handleSubmit = (e) => {
    // Handle agreement submission
    e.preventDefault();
    if (empVerified === "no" || empVerified.length <= 0) {
      toast.info("Please first verify the employee !!");
      return;
    }
    onSubmit(formData);
  };

  const handleClose = () => {
    setAgreed(false);
    setSignature("");
    setEmpIdError("");
    setEmpNameError("");
    setFormData({
      empId: "",
      empName: "",
      signature: "",
      cashier: "",
    });
    setVerifyEmp(undefined);
    setEmpVerified("no");

    onClose();
  };

  useEffect(() => {
    if (!open) {
      handleClose();
    }
  }, [open]);

  return (
    <>
      <Dialog
        open={open}
        onClose={(event, reason) => {
          if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
            handleClose(); // Reset and close the modal
          }
        }}
        disableEnforceFocus // to remove focus warning
        maxWidth="sm"
        fullWidth
        BackdropProps={{ "aria-hidden": false }}
      >
        <DialogTitle>Payment Confirmation & Agreement</DialogTitle>
        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <DialogContent>
            <Typography variant="h6" gutterBottom>
              Amount to Collect: ETB &nbsp;
              {formatAccounting2(selectedTransaction?.collectedAmount)}
            </Typography>
            <Divider sx={{ my: 2 }} />
            {/* 
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
              }
              label="I confirm this agreement paper and agree to the terms of service"
            /> */}
            <TextField
              fullWidth
              label="Employee ID"
              name="empId"
              type="text"
              value={formData.empId.toUpperCase()}
              onChange={handleChange}
              margin="normal"
              variant="outlined"
              required
              error={!!empIdError}
              helperText={empIdError}
              InputProps={{
                startAdornment: <CreditCardIcon sx={{ mr: 1 }} />,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton edge="end">
                      <VerifiedIcon
                        color={
                          verifyEmp !== undefined
                            ? verifyEmp
                              ? "success"
                              : "error"
                            : ""
                        }
                      />
                    </IconButton>
                  </InputAdornment>
                ),
                sx: {
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                  color: theme.palette.mode === "dark" ? "#fff" : "#000",
                },
              }}
              // disabled

              InputLabelProps={{
                sx: {
                  color: theme.palette.mode === "dark" ? "#ccc" : "#555",
                  "&.Mui-focused": {
                    color: theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                },
              }}
            />
            <TextField
              fullWidth
              label="Employee Name"
              name="empName"
              value={formData.empName}
              onChange={handleChange}
              margin="normal"
              variant="outlined"
              required
              error={!!empNameError}
              helperText={empNameError}
              InputProps={{
                startAdornment: <PersonIcon sx={{ mr: 1 }} />,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton edge="end">
                      <VerifiedIcon
                        color={
                          verifyEmp !== undefined
                            ? verifyEmp
                              ? "success"
                              : "error"
                            : ""
                        }
                      />
                    </IconButton>
                  </InputAdornment>
                ),
                sx: {
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                  color: theme.palette.mode === "dark" ? "#fff" : "#000",
                },
              }}
              // disabled
              InputLabelProps={{
                sx: {
                  color: theme.palette.mode === "dark" ? "#ccc" : "#555",
                  "&.Mui-focused": {
                    color: theme.palette.mode === "dark" ? "#fff" : "#000",
                  },
                },
              }}
            />
            <Button
              variant="contained"
              color={theme.palette.mode === "light" ? "primary" : "secondary"}
              onClick={handleVerify}
              disabled={
                !formData.empId ||
                !formData.empName ||
                empIdError.length > 0 ||
                empNameError.length > 0
              }
            >
              Verify Employee
            </Button>
            <Box mt={2}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Time Signature:
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                color={"inherit"}
                disabled={
                  !verifyEmp ||
                  !formData.empId ||
                  !formData.empName ||
                  empIdError.length > 0 ||
                  empNameError.length > 0
                }
                onClick={() => {
                  const date = new Date();

                  date.setHours(date.getHours() + 3); // Add 3 hours to UTC time
                  setSignature(date.toISOString());
                }}
              >
                {convertToEthDateWithTime(signature) || "Click to Sign"}
              </Button>
            </Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  sx={{
                    color: checkboxColor,
                    "&.Mui-checked": {
                      color: checkboxColor,
                    },
                  }}
                />
              }
              label="I confirm this agreement paper and agree to the terms of service"
              sx={{ marginTop: "15px" }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} variant="outlined" color="error">
              Cancel
            </Button>
            <Button
              type="submit"
              color={theme.palette.mode === "dark" ? "secondary" : "primary"}
              variant="contained"
              disabled={
                !agreed ||
                !signature ||
                !formData.empId ||
                !formData.empName ||
                empIdError.length > 0 ||
                empNameError.length > 0
              }
            >
              Confirm Agreement
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default AgreementDialog;
