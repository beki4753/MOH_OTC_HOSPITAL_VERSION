import React, { useState, useReducer, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Grid,
  FormHelperText,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  useTheme,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Add } from "@mui/icons-material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EtDatePicker from "mui-ethiopian-datepicker";
import { EthDateTime } from "ethiopian-calendar-date-converter";

// Replace with your actual token getter and API helper
import api from "../utils/api";
import { registerUser } from "../services/user_service";
import { fetchPatientData } from "../services/open_mrs_api_call";
import { renderETDateAtCell } from "./PatientSearch";

const initialFormState = {
  mrn: "",
  id: "",
  goth: "",
  kebele: "",
  expDate: "",
  referralNumber: "",
  letterNumber: "",
  examination: "",
};

const controllerError = (state, action) => {
  if (action.name === "Reset") return initialFormState;
  return { ...state, [action.name]: action.values };
};

const requiredFields = {
  mrn: "MRN",
  id: "ID",
  kebele: "Woreda/Kebele",
  expDate: "Expiration Date",
};

function CBHIUsersManager() {
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [formDataError, setFormDataError] = useReducer(
    controllerError,
    initialFormState
  );
  const [loading, setLoading] = useState(false);
  const [woredas, setWoredas] = useState([]);
  const [refresh, setReferesh] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [patientName, setPatientName] = useState("");

  const theme = useTheme();

  //Fetch Providers
  useEffect(() => {
    const fetchWoredas = async () => {
      try {
        const response = await api.get(`/Providers/list-providers`);
        if (response.status === 200) {
          setWoredas(response?.data?.map((item) => item.provider));
        }
      } catch (error) {
        console.error("Fetch woredas error:", error);
      }
    };
    fetchWoredas();
  }, []);

  //Get data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.post(`/Patient/get-patient-cbhi`);

        if (response.status === 200) {
          const dataMod =
            Array.isArray(response?.data?.data?.value) &&
            response.data.data.value.length > 0
              ? response.data.data.value
                  .map(
                    (
                      {
                        patientFirstName = "",
                        patientMiddleName = "",
                        patientLastName = "",
                        rowID,
                        ...rest
                      },
                      index
                    ) => ({
                      ...rest,
                      patientFName:
                        `${patientFirstName} ${patientMiddleName} ${patientLastName}`.trim(),
                      id: index + 1,
                    })
                  )
                  .sort((a, b) => b.id - a.id)
              : [];
          setUsers(dataMod);
        }
      } catch (error) {
        console.error("Fetch woredas error:", error);
      }
    };

    fetchData();
  }, [refresh]);

  const handleOpen = (data = null) => {
    if (data !== null) {
      const updateData = {
        mrn: data?.mrn,
        id: data?.idNo,
        goth: data?.goth,
        kebele: data?.provider,
        expDate: data?.expDate,
        referralNumber: data?.referalNo,
        letterNumber: data?.letterNo,
        examination: data?.examination,
      };
      setFormData(updateData);
    } else {
      setFormData(initialFormState);
    }
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
    setFormData(initialFormState);
    setFormDataError({ name: "Reset" });
    setPatientName("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "mrn") {
      setPatientName("");
      mrnCheck(name, value);
    } else letterNumberCheck(name, value);

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const missingFields = Object.keys(requiredFields).filter(
        (key) => !formData[key]
      );

      if (missingFields?.length > 0) {
        const fieldNames = missingFields
          .map((key) => requiredFields[key])
          .join(", ");

        missingFields?.map((item) => {
          setFormDataError({
            name: item,
            values: "Please fill this field",
          });
        });

        toast.error(
          `Please fill in the following required fields: ${fieldNames}`
        );
        return;
      }

      if (Object.values(formDataError).some((err) => err.length > 0)) {
        toast.error("Please fix the errors.");
        return;
      }

      const payload = {
        provider: formData?.kebele,
        service: "CBHI",
        kebele: formData?.kebele,
        goth: formData?.goth,
        idNo: formData?.id,
        referalNo: formData?.referralNumber,
        letterNo: formData?.letterNumber,
        examination: formData?.examination,
        expDate: formData?.expDate,
        cardNumber: `${Number(formData?.mrn)}`,
      };

      const userData = await fetchPatientData(Number(formData?.mrn));
      let msg;
      if (Object.values(userData || {})?.some((item) => item?.length > 0)) {
        msg = await registerUser(userData);
      } else {
        toast.error("Patient Is Not Registered.");
        return;
      }

      if (msg?.toLowerCase().includes("internal server error.")) {
        toast.error("Someting is wrong. please try again!");
        return;
      }

      const response = await api.post("/Patient/add-patient-cbhi", payload);
      if (response?.status === 201) {
        toast.success(
          response?.data?.msg || "CBHI User Regustered Success Fully."
        );
        setReferesh((prev) => !prev);
        setPatientName("");
        handleClose();
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save user.");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { field: "patientCardNumber", headerName: "MRN", flex: 1 },
    { field: "patientFName", headerName: "Patient Name", flex: 1 },
    { field: "idNo", headerName: "ID", flex: 1 },
    { field: "woreda", headerName: "Woreda/Kebele", flex: 1 },
    { field: "goth", headerName: "Goth", flex: 1 },
    { field: "referalNo", headerName: "Referral No.", flex: 1 },
    { field: "letterNo", headerName: "Letter No.", flex: 1 },
    { field: "examination", headerName: "Examination", flex: 1 },
    {
      field: "expDate",
      headerName: "Expired Date",
      flex: 1,
      renderCell: (params) => {
        return renderETDateAtCell(params?.row?.expDate);
      },
    },
  ];

  const mrnCheck = (name, value) => {
    const valid = /^[0-9]{5,}$/.test(value);
    setFormDataError({
      name,
      values: valid ? "" : "Please enter valid MRN (5+ digits).",
    });
  };

  const letterNumberCheck = (name, value) => {
    const valid = /^[a-zA-Z0-9\u1200-\u137F\s/\\]+$/.test(value);
    setFormDataError({
      name,
      values: valid ? "" : "Letters and numbers and \\ / only.",
    });
  };

  const handleChangeTime = (fieldName, selectedDate) => {
    const jsDate = new Date(selectedDate);
    if (isNaN(jsDate.getTime())) return;
    const tzOffset = jsDate.getTimezoneOffset();
    const offsetStr = `${tzOffset <= 0 ? "+" : "-"}${String(
      Math.abs(tzOffset / 60)
    ).padStart(2, "0")}:${String(Math.abs(tzOffset % 60)).padStart(2, "0")}`;
    const localDate = new Date(jsDate.getTime() - tzOffset * 60000);
    const dateStr = localDate.toISOString().slice(0, 19).replace("T", " ");
    const sqlDateOffset = `${dateStr} ${offsetStr}`;
    setFormData((prev) => ({ ...prev, [fieldName]: sqlDateOffset }));
    setFormDataError({ name: fieldName, values: "" });
  };

  const handleGetPatientName = async () => {
    try {
      setIsFetching(true);

      if (patientName?.length <= 0) {
        if (formDataError?.mrn?.length <= 0 && formData?.mrn?.length > 0) {
          const response = await fetchPatientData(Number(formData?.mrn));

          if (
            response?.patientFirstName ||
            response?.patientMiddleName ||
            response?.patientLastName
          ) {
            const fullName =
              response?.patientFirstName +
              " " +
              response?.patientMiddleName +
              " " +
              response?.patientLastName;
            setPatientName(fullName);
          } else {
            toast.error(
              response?.response?.data?.details || "Card Number Not Registered."
            );
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <Box p={4}>
      <ToastContainer />
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h5" fontWeight="bold">
          CBHI Users Management
        </Typography>
        <Button
          variant="contained"
          color={theme.palette.mode === "light" ? "info" : "success"}
          startIcon={<Add />}
          onClick={() => handleOpen()}
        >
          Add CBHI User
        </Button>
      </Box>

      <DataGrid
        autoHeight
        rows={users}
        columns={columns}
        pageSize={5}
        rowsPerPageOptions={[5]}
        sx={{ boxShadow: 3, borderRadius: 2 }}
      />

      <Dialog
        open={openDialog}
        onClose={(event, reason) => {
          if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
            handleClose(); // Reset and close the modal
          }
        }}
        fullWidth
        maxWidth="md"
        disableEnforceFocus // to remove focus warning
      >
        <DialogTitle>Add CBHI User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={1}>
            {[
              { label: "MRN", name: "mrn" },
              { label: "ID", name: "id" },
              { label: "Woreda/Kebele", name: "kebele" },
              { label: "Goth", name: "goth" },
              { label: "Expired Date", name: "expDate" },
              { label: "Referral Number", name: "referralNumber" },
              { label: "Letter Number", name: "letterNumber" },
              { label: "Examination", name: "examination" },
            ].map(({ label, name }) => (
              <Grid item xs={12} sm={6} key={name}>
                {name === "expDate" ? (
                  <EtDatePicker
                    label={label}
                    name={name}
                    required
                    error={!!formDataError[name]}
                    helperText={formDataError[name]}
                    value={formData[name] ? new Date(formData[name]) : null}
                    onChange={(e) => handleChangeTime(name, e)}
                    sx={{ width: "100%" }}
                    InputProps={{
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
                    InputLabelProps={{
                      sx: {
                        color: theme.palette.mode === "dark" ? "#ccc" : "#555",
                        "&.Mui-focused": {
                          color:
                            theme.palette.mode === "dark" ? "#fff" : "#000",
                        },
                      },
                    }}
                  />
                ) : name === "kebele" ? (
                  <FormControl
                    required
                    fullWidth
                    error={!!formDataError[name]}
                    sx={{
                      "& .MuiInputLabel-root": {
                        color: theme.palette.mode === "dark" ? "#ccc" : "#555",
                        "&.Mui-focused": {
                          color:
                            theme.palette.mode === "dark" ? "#fff" : "#000",
                        },
                      },
                      "& .MuiOutlinedInput-root": {
                        color: theme.palette.mode === "dark" ? "#fff" : "#000",
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
                      },
                    }}
                  >
                    <InputLabel>{label}</InputLabel>
                    <Select
                      name={name}
                      value={formData[name]}
                      onChange={handleChange}
                      label={label}
                    >
                      {woredas.map((w) => (
                        <MenuItem key={w} value={w}>
                          {w}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>{formDataError[name]}</FormHelperText>
                  </FormControl>
                ) : name === "mrn" ? (
                  <TextField
                    fullWidth
                    label={label}
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    required={["mrn", "id", "kebele"].includes(name)}
                    error={!!formDataError[name]}
                    helperText={
                      formDataError[name]?.length > 0
                        ? formDataError[name]
                        : patientName
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          {isFetching && (
                            <CircularProgress size={24} color="inherit" />
                          )}
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
                    InputLabelProps={{
                      sx: {
                        color: theme.palette.mode === "dark" ? "#ccc" : "#555",
                        "&.Mui-focused": {
                          color:
                            theme.palette.mode === "dark" ? "#fff" : "#000",
                        },
                      },
                    }}
                    FormHelperTextProps={{
                      style: {
                        color: !!formDataError?.mrn ? "red" : "green",
                        fontSize: "14px",
                      },
                    }}
                    onBlurCapture={() => handleGetPatientName()}
                  />
                ) : (
                  <TextField
                    fullWidth
                    label={label}
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    multiline={name === "examination"}
                    rows={name === "examination" ? 4 : 1}
                    required={["mrn", "id", "kebele"].includes(name)}
                    error={!!formDataError[name]}
                    helperText={formDataError[name]}
                    InputProps={{
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
                    InputLabelProps={{
                      sx: {
                        color: theme.palette.mode === "dark" ? "#ccc" : "#555",
                        "&.Mui-focused": {
                          color:
                            theme.palette.mode === "dark" ? "#fff" : "#000",
                        },
                      },
                    }}
                  />
                )}
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="outlined" color="error">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            color={theme.palette.mode === "dark" ? "secondary" : "primary"}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CBHIUsersManager;
