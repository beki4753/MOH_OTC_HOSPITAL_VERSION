import React, { useState, useReducer, useEffect } from "react";
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Paper,
  IconButton,
  CircularProgress,
  Stack,
  Divider,
  InputAdornment,
  useTheme,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Edit } from "@mui/icons-material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EtDatePicker from "mui-ethiopian-datepicker";
import { renderETDateAtCell } from "./PatientSearch";
import api from "../utils/api";
import { fetchPatientData } from "../services/open_mrs_api_call";
import { registerUser } from "../services/user_service";

const initialForm = {
  patientCardNumber: "",
  patientAge: "",
  accedentDate: "",
  acceedentAddress: "",
  carCertificate: "",
  plateNumber: "",
  policeName: "",
  policePhone: "",
};

const controllerError = (state, action) => {
  try {
    if (action.name === "Reset") {
      return initialForm;
    } else {
      return { ...state, [action.name]: action.values };
    }
  } catch (error) {
    console.error("State Update Error: ", error);
  }
};

function TrafficAccidentCrud() {
  const [formData, setFormData] = useState(initialForm);
  const [formDataError, setFormDataError] = useReducer(
    controllerError,
    initialForm
  );

  const [records, setRecords] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [patientName, setPatientName] = useState("");

  const theme = useTheme()

  //Fetch DataGrid data
  useEffect(() => {
    const fetchTableData = async () => {
      try {
        const response = await api.put("/Patient/get-patient-accedent", {});
        const modData = response?.data?.data?.map(
          ({
            accedentRecId,
            patientMiddleName,
            patientLastName,
            patientFirstName,
            ...rest
          }) => ({
            id: accedentRecId,
            patientName:
              patientFirstName +
              " " +
              patientMiddleName +
              " " +
              patientLastName,
            ...rest,
          })
        );

        if (response?.status === 200) {
          setRecords(modData.sort((a, b) => b.id - a.id));
        }
      } catch (error) {
        console.error("This is fetch table data error: ", error);
        toast.error(error?.response?.data?.msg || "Unable to Fetch Data");
      }
    };

    fetchTableData();
  }, [refresh]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "patientCardNumber") {
      setPatientName("");
      mrnCheck(name, value);
    } else if (name === "accedentDate" || name === "plateNumber") {
      letterNumberCheck(name, value);
    } else if (name === "policeName") {
      validateName(name, value);
    } else if (name === "policePhone") {
      validatePhoneNumber(name, value);
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    try {
      setLoading(true);
      e.preventDefault();

      if (Object.values(formDataError).some((em) => em.length > 0)) {
        toast.error("Please fix the erros first.");
        return;
      }
      const payload = {
        id: editIndex !== null ? formData?.id : 0,
        patientCardNumber: formData?.patientCardNumber,
        accAddress: formData?.acceedentAddress,
        accDate: formData?.accedentDate,
        policeName: formData?.policeName,
        policePhone: formData?.policePhone,
        plateNumber: formData?.plateNumber,
        certificate: formData?.carCertificate,
      };

      if (editIndex !== null) {
        const response = await api.put(
          "/Patient/change-patient-accedent",
          payload
        );
        if (response?.status === 200) {
          toast.success(response?.data?.msg || "Updated Successfully.");
          setRefresh((prev) => !prev);
          setEditIndex(null);
          setFormData(initialForm);
        }
      } else {
        const userData = await fetchPatientData(formData?.patientCardNumber);

        const msg = await registerUser(userData);

        if (msg?.toLowerCase().includes("internal server error.")) {
          toast.error("Someting is wrong. please try again!");
          return;
        }

        const response = await api.post(
          "/Patient/add-patient-accedent",
          payload
        );
        if (response?.status === 200) {
          setRefresh((prev) => !prev);
          toast.success("Recorded Successfully.");
          setFormData(initialForm);
          setPatientName("");
        }
      }
    } catch (error) {
      console.error("This is Submit Error: ", error);
      toast.error(error?.response?.data?.msg || "Internal Server Error.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (index) => {
    setFormData(records[index]);
    setEditIndex(index);
  };

  const handleCancelEdit = () => {
    setFormData(initialForm);
    setFormDataError({ name: "Reset" });
    setEditIndex(null);
  };

  const handleChangeTime = (fieldName, selectedDate) => {
    let jsDate;
    if (selectedDate instanceof Date) {
      jsDate = selectedDate;
    } else {
      jsDate = new Date(selectedDate);
    }

    if (isNaN(jsDate.getTime())) {
      console.error("Invalid date provided to handleChangeTime:", selectedDate);
      return;
    }

    const tzOffsetMinutes = jsDate.getTimezoneOffset();
    const absOffset = Math.abs(tzOffsetMinutes);
    const offsetHours = String(Math.floor(absOffset / 60)).padStart(2, "0");
    const offsetMinutes = String(absOffset % 60).padStart(2, "0");
    const sign = tzOffsetMinutes <= 0 ? "+" : "-";

    const localDate = new Date(jsDate.getTime() - tzOffsetMinutes * 60000);
    const dateStr = localDate.toISOString().slice(0, 19).replace("T", " ");

    const sqlDateOffset = `${dateStr} ${sign}${offsetHours}:${offsetMinutes}`;

    setFormData((prev) => ({
      ...prev,
      [fieldName]: sqlDateOffset,
    }));
  };

  const columns = [
    { field: "patientCardNumber", headerName: "MRN", flex: 1 },
    { field: "patientName", headerName: "Name", flex: 1 },
    { field: "patientAge", headerName: "Age", flex: 1 },

    {
      field: "accedentDate",
      headerName: "Date",
      flex: 1,
      renderCell: (params) => {
        return renderETDateAtCell(params?.row?.accedentDate);
      },
    },
    { field: "plateNumber", headerName: "Plate Number", flex: 1 },
    {
      field: "carCertificate",
      headerName: "Car Certificate",
      flex: 1,
      renderCell: (params) => {
        return params?.row?.carCertificate?.length <= 0
          ? "Unspecified"
          : params?.row?.carCertificate;
      },
    },
    { field: "acceedentAddress", headerName: "Address", flex: 2 },
    { field: "policeName", headerName: "Police Name", flex: 1 },
    { field: "policePhone", headerName: "Police Phone", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <>
          <IconButton
            onClick={() => {
              handleEdit(records.findIndex((r) => r.id === params.row.id));
            }}
          >
            <Edit />
          </IconButton>
        </>
      ),
    },
  ];

  const validatePhoneNumber = (name, phone) => {
    const phoneRegex = /^(?:\+251|09|07)\d+$/;
    if (!phoneRegex.test(phone) && phone.length > 0) {
      setFormDataError({
        name: name,
        values:
          "Phone number must start with +251, 09, or 07 and contain only numbers.",
      });
    } else {
      if (phone.startsWith("+251") && phone.length !== 13) {
        setFormDataError({
          name: name,
          values: "Phone number starting with +251 must have 13 digits.",
        });
      } else if (
        (phone.startsWith("09") || phone.startsWith("07")) &&
        phone.length !== 10
      ) {
        setFormDataError({
          name: name,
          values: "Phone number starting with 09 or 07 must have 10 digits.",
        });
      } else {
        setFormDataError({
          name: name,
          values: "",
        });
      }
      return;
    }
  };

  const validateName = (name, value) => {
    const comp = /^[a-zA-Z\u1200-\u137F\s]{3,}$/;
    if (!comp.test(value) && value.length > 0) {
      setFormDataError({
        name: name,
        values: "Full Name must be only letters, at least 3 characters long.",
      });
    } else {
      setFormDataError({
        name: name,
        values: "",
      });
    }
    return;
  };

  const mrnCheck = (name, value) => {
    const comp = /^[0-9]{5,}$/;
    if (!comp.test(value) && value.length > 0) {
      setFormDataError({
        name: name,
        values: "Please Insert Valid MRN, more than 5 digit only.",
      });
    } else {
      setFormDataError({
        name: name,
        values: "",
      });
    }
  };

  const letterNumberCheck = (name, value) => {
    const comp = /^[a-zA-Z0-9\u1200-\u137F\s]+$/;
    if (!comp.test(value) && value.length > 0) {
      setFormDataError({
        name: name,
        values: "Letters Number and space Only.",
      });
    } else {
      setFormDataError({
        name: name,
        values: "",
      });
    }
  };

  const handleGetPatientName = async () => {
    try {
      setIsFetching(true);

      if (patientName?.length <= 0) {
        if (
          formDataError?.patientCardNumber?.length <= 0 &&
          formData?.patientCardNumber?.length > 0
        ) {
          const response = await fetchPatientData(formData?.patientCardNumber);

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
            toast.error("Card Number Not Registered.");
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
    <Box
      p={3}
      component={Paper}
      sx={{ marginInline: "15px" }}
      elevation={4}
      borderRadius={3}
    >
      <Typography variant="h5" gutterBottom fontWeight="bold">
        🚨 Traffic Accident Registration
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2} mt={1}>
          <Grid item xs={12}>
            <Stack
              direction="row"
              spacing={2}
              divider={<Divider orientation="vertical" flexItem />}
              sx={{ width: "100%" }}
            >
              {/* Left Section */}
              <Box sx={{ flex: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Patient Information
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="MRN"
                      name="patientCardNumber"
                      value={formData?.patientCardNumber}
                      onChange={handleChange}
                      disabled={editIndex !== null}
                      fullWidth
                      required
                      error={!!formDataError?.patientCardNumber}
                      helperText={
                        formDataError?.patientCardNumber?.length > 0
                          ? formDataError?.patientCardNumber
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
                          color:
                            theme.palette.mode === "dark" ? "#fff" : "#000",
                        },
                      }}
                      InputLabelProps={{
                        sx: {
                          color:
                            theme.palette.mode === "dark" ? "#ccc" : "#555",
                          "&.Mui-focused": {
                            color:
                              theme.palette.mode === "dark" ? "#fff" : "#000",
                          },
                        },
                      }}
                      FormHelperTextProps={{
                        style: {
                          color: !!formDataError?.patientCardNumber
                            ? "red"
                            : "green",
                          fontSize: "14px",
                        },
                      }}
                      onBlurCapture={() => handleGetPatientName()}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box
                      sx={{
                        height: "56px",
                        border: `1px dashed ${
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.23)"
                            : "rgba(0,0,0,0.23)"
                        }`,
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "rgba(0,0,0,0.6)",
                        fontStyle: "italic",
                        paddingBottom: "71px",
                      }}
                    >
                      {/* Placeholder */}
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Car Information (if Known)
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Car Plate Number"
                      name="plateNumber"
                      value={formData?.plateNumber}
                      onChange={handleChange}
                      fullWidth
                      error={!!formDataError?.plateNumber}
                      helperText={formDataError?.plateNumber}
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
                          color:
                            theme.palette.mode === "dark" ? "#fff" : "#000",
                        },
                      }}
                      InputLabelProps={{
                        sx: {
                          color:
                            theme.palette.mode === "dark" ? "#ccc" : "#555",
                          "&.Mui-focused": {
                            color:
                              theme.palette.mode === "dark" ? "#fff" : "#000",
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Certificate"
                      name="carCertificate"
                      value={formData?.carCertificate}
                      onChange={handleChange}
                      fullWidth
                      error={!!formDataError?.carCertificate}
                      helperText={formDataError?.carCertificate}
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
                          color:
                            theme.palette.mode === "dark" ? "#fff" : "#000",
                        },
                      }}
                      InputLabelProps={{
                        sx: {
                          color:
                            theme.palette.mode === "dark" ? "#ccc" : "#555",
                          "&.Mui-focused": {
                            color:
                              theme.palette.mode === "dark" ? "#fff" : "#000",
                          },
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Right Section */}
              <Box sx={{ flex: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Accident Information
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <EtDatePicker
                      key={formData?.accedentDate || "accidentDate-date"}
                      label="Accident Date"
                      name="accedentDate"
                      value={
                        formData?.accedentDate
                          ? new Date(formData?.accedentDate)
                          : null
                      }
                      onChange={(e) => handleChangeTime("accedentDate", e)}
                      sx={{ width: "100%" }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Accident Address"
                      name="acceedentAddress"
                      value={formData?.acceedentAddress}
                      onChange={handleChange}
                      fullWidth
                      multiline
                      rows={2}
                      required
                      error={!!formDataError?.acceedentAddress}
                      helperText={formDataError?.acceedentAddress}
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
                          color:
                            theme.palette.mode === "dark" ? "#fff" : "#000",
                        },
                      }}
                      InputLabelProps={{
                        sx: {
                          color:
                            theme.palette.mode === "dark" ? "#ccc" : "#555",
                          "&.Mui-focused": {
                            color:
                              theme.palette.mode === "dark" ? "#fff" : "#000",
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      From the form filled out by the police
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Police Name"
                      name="policeName"
                      value={formData?.policeName}
                      onChange={handleChange}
                      fullWidth
                      required
                      error={!!formDataError?.policeName}
                      helperText={formDataError?.policeName}
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
                          color:
                            theme.palette.mode === "dark" ? "#fff" : "#000",
                        },
                      }}
                      InputLabelProps={{
                        sx: {
                          color:
                            theme.palette.mode === "dark" ? "#ccc" : "#555",
                          "&.Mui-focused": {
                            color:
                              theme.palette.mode === "dark" ? "#fff" : "#000",
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Police Phone"
                      name="policePhone"
                      value={formData?.policePhone}
                      onChange={handleChange}
                      fullWidth
                      type="tel"
                      error={!!formDataError?.policePhone}
                      helperText={formDataError?.policePhone}
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
                          color:
                            theme.palette.mode === "dark" ? "#fff" : "#000",
                        },
                      }}
                      InputLabelProps={{
                        sx: {
                          color:
                            theme.palette.mode === "dark" ? "#ccc" : "#555",
                          "&.Mui-focused": {
                            color:
                              theme.palette.mode === "dark" ? "#fff" : "#000",
                          },
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Stack>
          </Grid>
        </Grid>

        {/* Buttons */}
        <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
          <Button variant="outlined" color="error" onClick={handleCancelEdit}>
            Cancel
          </Button>
          <Button
            type="submit"
            color={theme.palette.mode === "dark" ? "secondary" : "primary"}
            disabled={loading}
            variant="contained"
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : editIndex !== null ? (
              "Update"
            ) : (
              "Register"
            )}
          </Button>
        </Box>
      </form>

      <Box mt={5}>
        <Typography variant="h6" gutterBottom>
          Registered Records
        </Typography>
        <Box style={{ height: 400, width: "100%" }}>
          <DataGrid
            rows={records}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5]}
            disableRowSelectionOnClick
            getRowId={(row) => row.id}
            localeText={{
              noRowsLabel: "No traffic accident records to display",
            }}
          />
        </Box>
      </Box>
      <ToastContainer />
    </Box>
  );
}

export default TrafficAccidentCrud;
