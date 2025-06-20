import React, { useEffect, useReducer, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../utils/api";
import { EthDateTime } from "ethiopian-calendar-date-converter";

const initialState = {
  mrn: "",
  fname: "",
  fatname: "",
  gfatname: "",
  mobile: "",
};

export const renderETDateAtCell = (data) => {
  try {
    const rawDate = data;
    if (!rawDate) return "";

    const parsedDate = new Date(rawDate);

    const correctedDate = new Date(parsedDate.getTime() + 3 * 60 * 60 * 1000);

    const etDate = EthDateTime.fromEuropeanDate(correctedDate);

    return `${etDate.year}-${String(etDate.month).padStart(2, "0")}-${String(
      etDate.date
    ).padStart(2, "0")}`;
  } catch (err) {
    console.error("Date conversion error:", err);
    return "";
  }
};

const controller = (state, action) => {
  try {
    if (action.name === "Reset") {
      return initialState;
    } else {
      return { ...state, [action.name]: action.values };
    }
  } catch (error) {
    console.error("State Update Error: ", error);
  }
};

const controllerError = (state, action) => {
  try {
    if (action.name === "Reset") {
      return initialState;
    } else {
      return { ...state, [action.name]: action.values };
    }
  } catch (error) {
    console.error("State Update Error: ", error);
  }
};

const dataModFunc = async (data) => {
  try {
    const dataMod =
      data.length > 0
        ? data.map(
            (
              {
                rowID,
                patientFirstName,
                patientMiddleName,
                patientLastName,
                patientSpouseFirstName,
                patientSpouselastName,
                ...rest
              },
              index
            ) => ({
              id: index + 1,
              patientFName:
                patientFirstName +
                " " +
                patientMiddleName +
                " " +
                patientLastName,
              patientSpouseName:
                patientSpouseFirstName + " " + patientSpouselastName,
              ...rest,
            })
          )
        : [];

    return dataMod;
  } catch (error) {
    console.error("This is the Data Modification Error: ", error);
    return [];
  }
};

const PatientSearch = () => {
  const theme = useTheme();
  const [formData, setFormData] = useReducer(controller, initialState);
  const [formDataError, setFormDataError] = useReducer(
    controllerError,
    initialState
  );
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [searchData, setSearchData] = useState([]);
  const [totalP, setTotalP] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  //fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.put("/Patient/get-patient-info", {
          currentTime: new Date(),
        });
        if (response?.status === 200) {
          const dataMod = await dataModFunc(response?.data?.data);
          setRows(dataMod);
          setTotalP(response?.data?.totalPatient || 0);
        }
      } catch (error) {
        console.error("This is Fetch Data Error: ", error);
      }
    };
    fetchData();
  }, []);

  //Searching Check Task
  useEffect(() => {
    setIsSearching(checkSeacrh());
  }, [formData]);

  const conditionalObje = async (gfatname, fatname, fname, mobile, mrn) => {
    try {
      const result = { currentTime: new Date() };
      if (!!gfatname) result.patientLastName = gfatname;
      if (!!fatname) result.patientMiddleName = fatname;
      if (!!fname) result.patientFirstName = fname;
      if (!!mobile) result.patientPhone = mobile;
      if (!!mrn) result.patientCardNumber = mrn;
      return result;
    } catch (error) {
      console.error("This is the Conditional Rendering Error: ", error);
      return {};
    }
  };

  const columns = [
    { field: "patientCardNumber", headerName: "Patient MRN", flex: 1 },
    { field: "patientFName", headerName: "Patient Name", flex: 1 },
    { field: "patientMotherName", headerName: "Mother Name", flex: 1 },
    {
      field: "patientGender",
      headerName: "Gender",
      flex: 1,
      maxWidth: "10px",
    },
    {
      field: "patientDOB",
      headerName: "Date of Birth",
      flex: 1,
      renderCell: (params) => {
        return renderETDateAtCell(params?.row?.patientDOB);
      },
    },
    { field: "patientPhoneNumber", headerName: "Mobile", flex: 1 },
    { field: "appointment", headerName: "Provider", flex: 1 },
    { field: "department", headerName: "Department", flex: 1 },
    { field: "patientSpouseName", headerName: "Spouse Name", flex: 1 },
    {
      field: "patientVisitingDate",
      headerName: "Visiting Date",
      flex: 1,
      renderCell: (params) => {
        return renderETDateAtCell(params?.row?.patientVisitingDate);
      },
    },
  ];

  const handleChange = (e) => {
    try {
      if (
        e.target.name === "fname" ||
        e.target.name === "fatname" ||
        e.target.name === "gfatname"
      ) {
        validateName(e.target.name, e.target.value);
      } else if (e.target.name === "mrn") {
        mrnCheck(e.target.name, e.target.value);
      } else {
        validatePhoneNumber(e.target.name, e.target.value);
      }
      setFormData({ name: e.target.name, values: e.target.value });
    } catch (error) {
      console.error("The Handle Chnage Error: ", error);
      toast.error("Some thing went wrong.");
    }
  };

  const mrnCheck = (name, value) => {
    const valid = /^[0-9]{5,}$/.test(value);
    setFormDataError({
      name,
      values: valid ? "" : "Please enter valid MRN (5+ digits).",
    });
  };

  const handleCancel = () => {
    setFormData({ name: "Reset" });
    setFormDataError({ name: "Reset" });
  };

  const checkSeacrh = () => {
    if (
      formData.fname.length > 0 ||
      formData.fatname.length > 0 ||
      formData.gfatname.length > 0 ||
      formData?.mrn.length > 0 ||
      formData?.mobile.length > 0
    ) {
      return true;
    } else {
      setSearchData([]);
      return false;
    }
  };

  const handleSeacrh = async () => {
    try {
      setLoading(true);
      if (
        formData.fname.length <= 0 &&
        formData.fatname.length <= 0 &&
        formData.gfatname.length <= 0 &&
        formData?.mrn.length <= 0 &&
        formData?.mobile.length <= 0
      ) {
        toast.info("Please fill at least one of field to search.");
        return;
      } else if (Object.values(formDataError).some((em) => em.length > 0)) {
        toast.info("Please fix the errors first.");
        return;
      }
      const payload = await conditionalObje(
        formData.gfatname,
        formData.fatname,
        formData.fname,
        formData.mobile,
        formData?.mrn
      );

      const response = await api.put("/Patient/get-patient-info", payload);
      if (response?.status === 200) {
        const modDat = await dataModFunc(response?.data?.data);
        if (modDat.length > 0) {
          setSearchData(modDat);
        } else {
          toast.info("Data not found!");
          setSearchData([]);
        }
      }
    } catch (error) {
      console.error("The Searching Error: ", error);
      toast.error(error?.response?.data?.message || "Internal server error.");
    } finally {
      setLoading(false);
    }
  };

  const validateName = (name, value) => {
    const usernameRegex = /^[a-zA-Z\u1200-\u137F]{3,}$/;
    if (!usernameRegex.test(value) && value.length > 0) {
      setFormDataError({
        name: name,
        values:
          "Name must be only letters, at least 3 characters long, and contain no spaces.",
      });
    } else {
      setFormDataError({
        name: name,
        values: "",
      });
    }
    return;
  };

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

  return (
    <div>
      <Box
        sx={{
          mx: "auto",
          p: { xs: 2, sm: 3 },
          mt: 4,
          borderRadius: 2,
          //backgroundColor: "#f9f9f9",
          boxShadow: 3,
          marginInline: "15px",
        }}
      >
        <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              borderBottom: `2px solid ${theme.palette.primary.main}`,
              display: "inline-block",
              fontWeight: 600,
            }}
          >
            Patient Search
          </Typography>

          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="MRN"
                value={formData?.mrn}
                name="mrn"
                onChange={handleChange}
                error={!!formDataError?.mrn}
                helperText={formDataError?.mrn}
                fullWidth
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
                      color: theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="First Name"
                value={formData?.fname}
                name="fname"
                onChange={handleChange}
                error={!!formDataError?.fname}
                helperText={formDataError?.fname}
                fullWidth
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
                      color: theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Father Name"
                value={formData?.fatname}
                name="fatname"
                onChange={handleChange}
                error={!!formDataError?.fatname}
                helperText={formDataError?.fatname}
                fullWidth
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
                      color: theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Grand Father Name"
                value={formData?.gfatname}
                name="gfatname"
                onChange={handleChange}
                error={!!formDataError?.gfatname}
                helperText={formDataError?.gfatname}
                fullWidth
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
                      color: theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Mobile"
                value={formData?.mobile}
                name="mobile"
                onChange={handleChange}
                error={!!formDataError?.mobile}
                helperText={formDataError?.mobile}
                fullWidth
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
                      color: theme.palette.mode === "dark" ? "#fff" : "#000",
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Button
                variant="contained"
                color={theme.palette.mode === "light" ? "primary" : "secondary"}
                fullWidth
                onClick={handleSeacrh}
                sx={{ height: "100%" }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Search"
                )}
              </Button>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Button
                variant="outlined"
                color="error"
                onClick={handleCancel}
                fullWidth
                sx={{ height: "100%" }}
              >
                Cancel
              </Button>
            </Grid>
          </Grid>

          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={6}>
              <Typography
                variant="subtitle1"
                sx={{ mb: 1, fontWeight: 500, color: "text.secondary" }}
              >
                Patients Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <Typography
                variant="subtitle1"
                sx={{
                  mb: 1,
                  fontWeight: 500,
                  color: "text.secondary",
                  justifySelf: "end",
                }}
              >
                Total Patient is &nbsp; <strong>{totalP}</strong>
              </Typography>
            </Grid>
          </Grid>

          <Box sx={{ height: 300, width: "100%" }}>
            <DataGrid
              rows={isSearching ? searchData : rows}
              columns={columns}
              pageSize={5}
              loading={loading}
              rowsPerPageOptions={[5]}
              disableSelectionOnClick
            />
          </Box>
        </Paper>
      </Box>
      <ToastContainer />
    </div>
  );
};

export default PatientSearch;
