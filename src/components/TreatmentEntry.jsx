import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  OutlinedInput,
  Chip,
  Card,
  CardContent,
  ListItemText,
  ListSubheader,
  Select,
  Checkbox,
  CircularProgress,
  Paper,
  Stack,
  useTheme,
  InputAdornment,
  useMediaQuery,
} from "@mui/material";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import SearchIcon from "@mui/icons-material/Search";
import { DataGrid } from "@mui/x-data-grid";
import api from "../utils/api";
import { useLang } from "../contexts/LangContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getTokenValue, registerUser } from "../services/user_service";
import { Refresh } from "@mui/icons-material";
import { tokens } from "../theme";
import { fetchPatientData, fetchOrder } from "../services/open_mrs_api_call";
import { normalizeText } from "../utils/normalizer";
import { renderETDateAtCell } from "./PatientSearch";

const tokenvalue = getTokenValue();

const treatmentCategories = ["Laboratory"];

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;

/*NO AUTO‑FOCUS  – we also disable the menu’s “auto‑focus first item”  */
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
  /* This stops MUI from focusing the first <MenuItem> automatically */
  MenuListProps: {
    autoFocusItem: false,
  },
};
const initialState = {
  cardNumber: "",
  category: "Laboratory",
  amount: [],
  reason: [],
};
const errorStates = {
  cardNumber: "",
  cardNumberSearch: "",
  fullNameSearch: "",
};

const getCategoryName = (name) => {
  try {
    if (name?.toLowerCase()?.includes("laboratory")) {
      return "Lab Order";
    } else if (name?.toLowerCase()?.includes("Laboratory")) {
      return "Radiology Order";
    }
  } catch (error) {
    console.error(error);
  }
};

const TreatmentEntryR = () => {
  const { language } = useLang();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Define checkbox color based on theme mode
  const checkboxColor =
    theme.palette.mode === "light"
      ? theme.palette.primary.main
      : theme.palette.secondary.main;

  const [treatmentList, setTreatmentList] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [fullReasons, setFullReasons] = useState([]);
  const [formData, setFormData] = useState(initialState);
  const [formDataError, setFormDataError] = useState(errorStates);
  const [searchText, setSearchText] = useState("");
  const [saveLoading, setSaveloading] = useState(false);
  const [loadingRowId, setLoadingRowId] = useState(null);

  const [refresh, setRefresh] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isFetching, setIsFetching] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [isGetLoading, setIsGetLoading] = useState(false);

  const isLargeScreen = useMediaQuery(theme.breakpoints.up("md"));

  //fetchData for the data grid
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await api.put("/Patient/get-patient-request", {
          loggedInUser: tokenvalue?.name,
        });
        const datas =
          response?.data?.length > 0
            ? response?.data.map((item, index) => ({ ...item, id: index + 1 }))
            : [];

        const ModData = datas
          ?.map(
            ({
              patientFirstName,
              patientMiddleName,
              patientLastName,
              ...rest
            }) => ({
              patientFName:
                patientFirstName +
                " " +
                patientMiddleName +
                " " +
                patientLastName,
              ...rest,
            })
          )
          ?.filter((item) =>
            item?.requestedReason?.toLowerCase()?.includes("laboratory")
          );
        setTreatmentList(ModData || []);
      } catch (error) {
        console.error("This is Fetch Table Data Error: ", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [refresh]);

  //List Searching Logic
  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
  };

  const handleCancel = () => {
    setFormData(initialState);
    setFormDataError(errorStates);
    setPatientName("");
  };

  const handleCheckboxChange = (event) => {
    try {
      const values = event.target.value;

      setFormData((prev) => {
        return {
          ...prev,
          reason: values,
          amount: values.map((item) => ({
            purpose: item,
            Amount: fullReasons
              .filter(
                (itm) => normalizeText(itm.purpose) === normalizeText(item)
              )
              .map((item) => item.amount)[0],
          })),
        };
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleSave = async () => {
    try {
      setSaveloading(true);
      if (formDataError.cardNumber.length > 0) {
        toast.error("Please fix the Card Number Error.");
        return;
      }

      const userData = await fetchPatientData(formData?.cardNumber);

      const msg = await registerUser(userData);

      if (msg?.toLowerCase().includes("internal server error.")) {
        toast.error("Someting is wrong. please try again!");
        return;
      }

      if (formData?.reason.length > 0) {
        const response = await api.post("/Patient/add-patient-request", {
          patientCardNumber: formData?.cardNumber,
          requestedServices: fullReasons
            .filter((item) => formData?.reason?.includes(item.purpose))
            .map((item) => item.id),
          purpose: formData?.category,
          createdBy: tokenvalue?.name,
        });
        if (Object.values(response?.data)?.some((item) => item?.length > 0)) {
          toast.success("Request Registered Successfully.");
          setRefresh((prev) => !prev);
          setFormData(initialState);
          setPatientName("");
        }
      }
    } catch (error) {
      console.error("This is Save Error: ", error);
      toast.error(error?.response?.data?.msg || "Internal Server Error.");
    } finally {
      setSaveloading(false);
    }
  };

  //fetch Reasons
  useEffect(() => {
    const fetchReasons = async () => {
      try {
        const response = await api.get("/Lookup/payment-purpose");
        if (response?.status === 200) {
          setReasons(response?.data?.map((item) => item.purpose));
          setFullReasons(response?.data);
        }
      } catch (error) {
        console.error(error.message);
      }
    };
    fetchReasons();
  }, []);

  const filteredReason = searchText.trim()
    ? reasons.filter((item) =>
        normalizeText(item)?.includes(normalizeText(searchText))
      )
    : reasons;

  const handleMarkDone = async (data) => {
    try {
      setLoadingRowId(data.id);

      const payload = {
        patientCardNumber: data?.patientCardNumber,
        groupID: data?.requestGroup,
        isComplete: true,
        loggedInUser: tokenvalue?.name,
      };
      const response = await api.put(
        "/Patient/complete-patient-request",
        payload
      );
      if (response.status === 200) {
        toast.success(response?.data?.msg);
        setRefresh((prev) => !prev);
      }
    } catch (error) {
      console.error("This IS mark as done Error: ", error);
      toast.error(error?.response?.data?.msg || "Internal Server Error.");
    } finally {
      setLoadingRowId(null);
    }
  };

  const columns = [
    { field: "patientCardNumber", headerName: "Card Number", flex: 1 },
    { field: "patientFName", headerName: "Patient Name", flex: 1 },
    {
      field: "requestedReason",
      headerName: "Category",
      flex: 1,
    },
    {
      field: "totalPrice",
      headerName: "Amount",
      flex: 1,
      renderCell: (params) => {
        try {
          return `ETB ${params?.row?.totalPrice}`;
        } catch (error) {
          console.error("Error Occured on rendering: ", error);
        }
      },
    },
    {
      field: "paid",
      headerName: "Status",
      flex: 1,
      renderCell: (params) => {
        try {
          const status = params?.row?.paid;
          const result = status ? "Paid" : "Pending";
          return result;
        } catch (error) {
          console.error("Error Occured on rendering: ", error);
        }
      },
    },
    {
      field: "createdOn",
      headerName: "Date",
      flex: 1,
      renderCell: (params) => {
        return renderETDateAtCell(params?.row?.createdOn);
      },
    },
    {
      field: "Action",
      headerName: "Action",
      flex: 1,
      renderCell: (params) => {
        try {
          return params?.row?.paid ? (
            <Button
              variant="outlined"
              color="success"
              startIcon={<TaskAltIcon />}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                fontWeight: 600,
                "&:hover": { transform: "scale(1.01)" },
              }}
              onClick={() => handleMarkDone(params.row)}
              disabled={loadingRowId === params.row.id}
            >
              {loadingRowId === params.row.id ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Mark as Completed"
              )}
            </Button>
          ) : null;
        } catch (error) {
          console.error("Error occurred on rendering: ", error);
          return null;
        }
      },
    },
  ];

  const handleChange = (e) => {
    if (e.target.name === "cardNumber") {
      setPatientName("");
      setFormData((prev) => ({
        ...prev,
        amount: [],
        reason: [],
      }));
      mrnCheck(e.target.name, e.target.value);
    } else if (e.target.name === "category") {
      setFormData((prev) => ({
        ...prev,
        amount: [],
        reason: [],
      }));
    }
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const mrnCheck = (name, value) => {
    const comp = /^[0-9]{5,}$/;
    if (!comp.test(value) && value.length > 0) {
      setFormDataError((prev) => ({
        ...prev,
        [name]: "Please Insert Valid MRN, more than 5 digit only.",
      }));
    } else {
      setFormDataError((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleBlur = async () => {
    try {
      setIsGetLoading(true);
      const fetched = await fetchOrder(
        formData?.cardNumber,
        getCategoryName(formData?.category)
      );
      if (fetched?.length > 0) {
        setFormData((prev) => {
          return {
            ...prev,
            reason: fetched?.map((item) => item?.display),
            amount: fetched
              ?.map((item) => item?.display)
              ?.map((item) => {
                return {
                  purpose: item,
                  Amount: fullReasons
                    .filter(
                      (itm) =>
                        normalizeText(itm.purpose) === normalizeText(item)
                    )
                    .map((item) => item.amount)[0],
                };
              }),
          };
        });
      } else {
        toast.info(`${formData?.category} Order not found!`);
      }
    } catch (error) {
      console.error("This is handle blur error: ", error);
    } finally {
      setIsGetLoading(false);
    }
  };

  const handleGetPatientName = async () => {
    try {
      setIsFetching(true);

      if (patientName?.length <= 0) {
        if (
          formDataError?.cardNumber?.length <= 0 &&
          formData?.cardNumber?.length > 0
        ) {
          const response = await fetchPatientData(formData?.cardNumber);

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
            if (
              formData?.cardNumber?.length > 0 &&
              formDataError?.cardNumber?.length <= 0 &&
              formData?.category?.length > 0 &&
              fullName?.length > 0
            ) {
              handleBlur();
            }
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
    <Box p={4}>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Patient Treatment Entry Laboratory
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Card Number"
              name="cardNumber"
              value={formData?.cardNumber}
              onChange={handleChange}
              placeholder="Enter card number"
              error={!!formDataError?.cardNumber}
              helperText={
                formDataError?.cardNumber?.length > 0
                  ? formDataError?.cardNumber
                  : patientName
              }
              onBlur={() => handleGetPatientName()}
              InputLabelProps={{
                sx: {
                  color: "primary.neutral",
                  "&.Mui-focused": {
                    color: "secondary.main",
                  },
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {(isFetching || isGetLoading) && (
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
              FormHelperTextProps={{
                style: {
                  color: !!formDataError?.cardNumber ? "red" : "green",
                  fontSize: "14px",
                },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              label="Treatment Category"
              name="category"
              value={formData?.category}
              onChange={handleChange}
              InputLabelProps={{
                sx: {
                  color: "primary.neutral",
                  "&.Mui-focused": {
                    color: "secondary.main",
                  },
                },
              }}
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
            >
              {treatmentCategories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl
              sx={{
                width: "100%",
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",

                  "&:hover fieldset": {
                    borderColor: "info.main",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "primary.main",
                    boxShadow: "0px 0px 8px rgba(0, 0, 255, 0.2)",
                  },
                },
              }}
            >
              <InputLabel
                id="demo-multiple-checkbox-label"
                sx={{
                  color: "primary.neutral",
                  "&.Mui-focused": {
                    color: "secondary.main",
                  },
                }}
              >
                {language === "AMH" ? "ምክንያት" : "Select Treatment"}
              </InputLabel>

              <Select
                labelId="demo-multiple-checkbox-label"
                id="demo-multiple-checkbox"
                multiple
                fullWidth
                value={formData.reason}
                onChange={handleCheckboxChange}
                input={
                  <OutlinedInput
                    label={language === "AMH" ? "ምክንያት" : "Select Reason*"}
                  />
                }
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value, index) => (
                      <Chip
                        key={index}
                        label={value}
                        onMouseDown={(e) => e.stopPropagation()} //Prevent Select toggle
                        onDelete={(e) => {
                          e.stopPropagation(); //Prevent Select toggle

                          setFormData((prev) => {
                            const current = prev.reason;
                            const updatedReason = current.filter(
                              (val) =>
                                !normalizeText(val).includes(
                                  normalizeText(value)
                                )
                            );
                            return {
                              ...prev,
                              reason: updatedReason,
                              amount: prev.amount.filter(
                                (item) =>
                                  normalizeText(item.purpose) !==
                                  normalizeText(value)
                              ),
                            };
                          });
                        }}
                      />
                    ))}
                  </Box>
                )}
                MenuProps={MenuProps}
              >
                {/* 🔍 Search bar inside the dropdown */}
                <ListSubheader>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search…"
                    value={searchText}
                    onChange={handleSearchChange}
                    /* Prevent *all* key events from bubbling up to <Select> */
                    inputProps={{
                      onKeyDown: (e) => e.stopPropagation(),
                      onKeyUp: (e) => e.stopPropagation(),
                      onKeyPress: (e) => e.stopPropagation(),
                    }}
                    InputLabelProps={{
                      sx: {
                        color: "primary.neutral",
                        "&.Mui-focused": {
                          color: "secondary.main",
                        },
                      },
                    }}
                  />
                </ListSubheader>

                {filteredReason.map((reason, index) => (
                  <MenuItem key={index} value={reason}>
                    <Checkbox
                      checked={formData?.reason?.includes(reason)}
                      sx={{
                        color: checkboxColor,
                        "&.Mui-checked": {
                          color: checkboxColor,
                        },
                      }}
                    />
                    <ListItemText primary={reason} />
                  </MenuItem>
                ))}

                {filteredReason.length === 0 && (
                  <MenuItem disabled>No results found</MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>

          <Grid container spacing={3} marginLeft={2} marginTop={1}>
            {formData?.amount?.map((treatment, index) => (
              <Grid item xs={6} sm={6} md={3} key={index}>
                <Card
                  key={index}
                  sx={{
                    backgroundColor:
                      theme.palette.mode === "light"
                        ? "#f5f5f5"
                        : colors.primary[400],
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      color={
                        theme.palette.mode === "light"
                          ? "primary"
                          : colors.grey[100]
                      }
                    >
                      {treatment.purpose}
                    </Typography>
                    <Typography
                      variant="body2"
                      color={
                        theme.palette.mode === "light"
                          ? "primary"
                          : colors.grey[100]
                      }
                      sx={{ mt: 1 }}
                    >
                      Amount: {treatment.Amount} Birr
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {formData?.reason?.length > 0 && (
            <Grid container justifyContent="center" marginTop={2}>
              <Grid item xs={12} sm={12} md={3}>
                <Card
                  sx={{
                    backgroundColor:
                      theme.palette.mode === "light"
                        ? "#CECECE"
                        : colors.primary[400],
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h5"
                      color="#3E7C28"
                      sx={{ mt: 1, fontWeight: "bold" }}
                    >
                      Total Amount
                    </Typography>
                    <Typography
                      variant="body2"
                      color={
                        theme.palette.mode === "light"
                          ? "primary"
                          : colors.grey[100]
                      }
                      sx={{ mt: 1, fontWeight: "bold" }}
                    >
                      {formData?.amount?.reduce(
                        (total, item) => total + parseFloat(item.Amount || 0),
                        0
                      )}{" "}
                      Birr
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          <Grid item xs={12}>
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#478594",
                color: "white", // Added text color for better visibility
                px: 4,
                py: 1.5,
                fontWeight: "bold",
                "&:hover": {
                  backgroundColor: "#1f5459",
                },
              }}
              onClick={handleSave}
              disabled={
                !formData?.cardNumber ||
                !formData?.category ||
                !formData?.reason?.length > 0 //||
                // Object.values(formDataError).some((item) => item.length > 0)
              }
            >
              {saveLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Save Treatment"
              )}
            </Button>
            <Button
              variant="outlined"
              color="error"
              sx={{ marginInline: "15px" }}
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Typography variant="h6" gutterBottom fontWeight="bold">
        Treatment List
      </Typography>

      <Box
        mb={3}
        p={2}
        component={Paper}
        elevation={3}
        borderRadius={2}
        overflow="auto"
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <Box
              sx={{
                height: "56px",
                border: `1px dashed ${colors.grey[100]}`,
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(0,0,0,0.6)",
                fontStyle: "italic",
                paddingBottom: "71px",
              }}
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <Box
              sx={{
                height: "56px",
                border: `1px dashed ${colors.grey[100]}`,
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(0,0,0,0.6)",
                fontStyle: "italic",
                paddingBottom: "71px",
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Stack
              direction={isLargeScreen ? "row" : "column"}
              spacing={1}
              alignItems="stretch"
            >
              <Button
                variant="contained"
                fullWidth
                color="primary"
                size={isLargeScreen ? "small" : "large"}
                disabled
                startIcon={<SearchIcon />}
                sx={{
                  height: "56px",
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: "bold",
                }}
              >
                Search
              </Button>

              <Button
                variant="outlined"
                fullWidth
                size={isLargeScreen ? "small" : "large"}
                sx={{
                  height: "56px",
                  color: colors.grey[100],
                  borderColor: colors.grey[100],
                  "&:hover": {
                    borderColor: colors.grey[300],
                    color: colors.grey[300],
                  },
                }}
                onClick={() => setRefresh((prev) => !prev)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  <Refresh
                    sx={{
                      transition: "transform 0.5s",
                      "&:hover": { transform: "rotate(90deg)" },
                    }}
                  />
                )}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      <Paper elevation={2} sx={{ height: 400 }}>
        <DataGrid
          rows={treatmentList}
          loading={isLoading}
          columns={columns}
          disableSelectionOnClick
        />
      </Paper>
      <ToastContainer />
    </Box>
  );
};

export default TreatmentEntryR;
