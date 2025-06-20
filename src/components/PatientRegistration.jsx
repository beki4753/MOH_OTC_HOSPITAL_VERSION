import React, { useEffect, useReducer, useRef, useState } from "react";
import {
  Grid,
  TextField,
  MenuItem,
  Button,
  Box,
  Typography,
  Stack,
  Stepper,
  StepLabel,
  Step,
  Divider,
  CircularProgress,
  useTheme,
} from "@mui/material";
import EtDatePicker from "mui-ethiopian-datepicker";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../utils/api";
import { getTokenValue } from "../services/user_service";

const tokenvalue = getTokenValue();

const steps = ["Basic Info", "Addres Info"];
const genders = ["Male", "Female"];
const Religions = [
  "UNKNOWN",
  "CHRISTIAN",
  "MUSLIM",
  "ORTHODOX",
  "PROTESTANT",
  "CATHOLIC",
  "OTHER",
  "NONE",
];

const Departments = [
  "OutPatient Clinic",
  "Family Planning Clinic",
  "Antenatal Care Clinic",
  "HIV/AIDS Clinic",
  "Tuberculosis Clinic",
  "Pediatrics Clinic",
  "Pharmacy",
  "Laboratory",
  "Postpartum Visit",
];

const Providers = [
  "OPDCLINIC",
  "ARTCLINIC",
  "VCTCLINIC",
  "LABORATORY",
  "OPDCLINIC2",
  "OPDCLINIC6",
  "OPDCLINICDENTAL",
  "PEDIATRICSWARD",
  "MEDICALA",
  "ANCCLINIC",
  "LABORDELIVERYWARD",
  "PEDIATRICSCLINIC",
  "OPDCLINICGETU",
  "MCHCLINICOPD",
  "MERRA-LAB",
  "MERRATEST1",
];

const MultipleB = ["UNKNOWN", "NO", "TWINS", "TRIPLETS OR MORE"];
const HighestE = [
  "NO EDUCATION",
  "PRIMARY",
  "SECONDARY",
  "TERTIARY",
  "NONE",
  "GRADE 1",
  "GRADE 2",
  "GRADE 3",
  "GRADE 4",
  "GRADE 5",
  "GRADE 6",
  "GRADE 7",
  "GRADE 8",
  "GRADE 9",
  "GRADE 10",
  "GRADE 11",
  "GRADE 12",
  "COLLEGE/UNIVERSITY",
];
const occupationList = [
  "Farmer",
  "Teacher",
  "Health Worker",
  "Nurse",
  "Doctor",
  "Midwife",
  "Engineer",
  "Civil Servant",
  "Police Officer",
  "Soldier",
  "Merchant",
  "Driver",
  "Construction Worker",
  "Daily Laborer",
  "Housemaid",
  "Student",
  "Unemployed",
  "Self-employed",
  "Tailor",
  "Weaver",
  "Potter",
  "Carpenter",
  "Electrician",
  "Mechanic",
  "Blacksmith",
  "Butcher",
  "Barber",
  "Hairdresser",
  "Taxi Driver",
  "Bus Conductor",
  "Security Guard",
  "Religious Leader",
  "Traditional Healer",
  "Agricultural Extension Worker",
  "NGO Worker",
  "Banker",
  "Accountant",
  "Shopkeeper",
  "Trader",
  "Hotel Worker",
  "Tour Guide",
  "Fisherman",
  "Livestock Keeper",
  "Miner",
  "Artist",
  "Musician",
  "Actor/Actress",
  "Craft Worker",
  "Mobile Technician",
  "IT Technician",
  "Software Developer",
  "Journalist",
  "Lawyer",
  "Judge",
  "Pharmacist",
  "Veterinarian",
  "Cleaner",
  "Retired",
];

const Marital = ["None", "Single", "Married", "Divorced", "Widowed"];
const ethiopianRegions = [
  "Addis Ababa",
  "Afar",
  "Amhara",
  "Benishangul-Gumuz",
  "Central Ethiopia",
  "Dire Dawa",
  "Gambela",
  "Harari",
  "Oromia",
  "Sidama",
  "South Ethiopia",
  "South West Ethiopia Peoples",
  "Somali",
  "Tigray",
];

const initialState = {
  fname: "",
  dob: "",
  edu: "",
  fatname: "",
  pbirth: "",
  occ: "",
  gfname: "",
  mbirth: "",
  mstatus: "",
  maname: "",
  religion: "",
  sname: "",
  sfname: "",
  gender: "",
  providers: "",
  vdate: "",
  dep: "",
  mrn: "",
  region: "",
  nregion: "",
  woreda: "",
  nworeda: "",
  kebele: "",
  nkebele: "",
  hn: "",
  nhn: "",
  addD: "",
  naddD: "",
  phone: "",
  nphone: "",
  mobile: "",
  nmobile: "",
  isUpdate: false,
};

const controller = (state, action) => {
  try {
    if (action.name === "reset") {
      return initialState;
    } else if (action.name === "bulk") {
      return { ...state, ...action.values }; // merge all keys
    } else {
      return { ...state, [action.name]: action.values };
    }
  } catch (error) {
    console.error("Error on State update : ", error);
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

function PatientRegistration() {
  const [formData, setFormData] = useReducer(controller, initialState);
  const [formDataError, setFormDataError] = useReducer(
    controllerError,
    initialState
  );
  const [activeStep, setActiveStep] = useState(0);
  const [checkLoading, setCheckLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const lastCardNumberRef = useRef("");

  const theme = useTheme();

  const handleCancel = () => {
    setFormData({ name: "reset" });
    setFormDataError({ name: "Reset" });
    setActiveStep(0);
  };

  const handleChangeTime = (fieldName, selectedDate) => {
    try {
      const jsDate =
        selectedDate instanceof Date ? selectedDate : new Date(selectedDate);

      if (isNaN(jsDate.getTime())) {
        console.error(
          "Invalid date provided to handleChangeTime:",
          selectedDate
        );
        toast.error("Invalid date selected.");
        return;
      }

      // Adjust for local timezone
      const tzOffsetMinutes = jsDate.getTimezoneOffset();
      const offsetSign = tzOffsetMinutes <= 0 ? "+" : "-";
      const offsetHours = String(
        Math.floor(Math.abs(tzOffsetMinutes) / 60)
      ).padStart(2, "0");
      const offsetMinutes = String(Math.abs(tzOffsetMinutes) % 60).padStart(
        2,
        "0"
      );

      const localTime = new Date(jsDate.getTime() - tzOffsetMinutes * 60000);
      const formattedDate = localTime
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
      const finalDateTime = `${formattedDate} ${offsetSign}${offsetHours}:${offsetMinutes}`;

      setFormData({ name: fieldName, values: finalDateTime });
      setFormDataError({ name: fieldName, values: "" });
    } catch (error) {
      console.error("Date Picker Change Error:", error);
      toast.error("Unable to select the date properly.");
    }
  };

  const handleChange = (e) => {
    if (
      e.target.name === "fname" ||
      e.target.name === "fatname" ||
      e.target.name === "gfname" ||
      e.target.name === "maname" ||
      e.target.name === "sname" ||
      e.target.name === "sfname"
    ) {
      validateName(e.target.name, e.target.value);
    } else if (e.target.name === "pbirth") {
      onlyLetterCheck(e.target.name, e.target.value);
    } else if (
      e.target.name === "woreda" ||
      e.target.name === "nworeda" ||
      e.target.name === "kebele" ||
      e.target.name === "nkebele" ||
      e.target.name === "addD" ||
      e.target.name === "naddD" ||
      e.target.name === "hn" ||
      e.target.name === "nhn"
    ) {
      letterNumberCheck(e.target.name, e.target.value);
    } else if (e.target.name === "mrn") {
      lastCardNumberRef.current = "";

      mrnCheck(e.target.name, e.target.value);
      if (formData?.isUpdate) {
        toast.info(
          "You changed the MRN so now you are recording a new data, not updating the existing one."
        );
        setFormData({ name: "isUpdate", values: false });
      }
    } else if (e.target.name === "phone" || e.target.name === "nphone") {
      phoneCheck(e.target.name, e.target.value);
    } else if (e.target.name === "mobile" || e.target.name === "nmobile") {
      validatePhoneNumber(e.target.name, e.target.value);
    } else {
      emptyCheck(e.target.name, e.target.value);
    }

    setFormData({ name: e.target.name, values: e.target.value });

    //setFormDataError({ name: e.target.name, values: '' });
  };

  const emptyCheck = (name, value) => {
    if (value?.length <= 0) {
      setFormDataError({ name: name, values: "Please fill this field first." });
    } else {
      setFormDataError({ name: name, values: "" });
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

  const phoneCheck = (name, value) => {
    const check = /^(?:\(?\d{2,4}\)?[\s-]?)?\d{5,8}$/;
    if (!check.test(value) && value.length > 0) {
      setFormDataError({
        name: name,
        values:
          "Insert like (011) 2345678 , 011-2345678 , 2345678 , 0123 45678",
      });
    } else {
      setFormDataError({
        name: name,
        values: "",
      });
    }
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

  const onlyLetterCheck = (name, value) => {
    const comp = /^[a-zA-Z\u1200-\u137F\s]+$/;
    if (!comp.test(value) && value.length > 0) {
      setFormDataError({
        name: name,
        values: "Please Insert Only Letters.",
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

  const handleNext = async () => {
    try {
      const step1Fields = [
        "fname",
        "fatname",
        "gender",
        "providers",
        "dep",
        "mrn",
        "dob",
      ];
      const step2Fields = [
        "region",
        "nregion",
        "woreda",
        "nworeda",
        "kebele",
        "nkebele",
      ];

      const requiredMessage = "Please fill the required fields first.";
      const errorFixMessage = "Please fix the errors.";

      const isEmpty = (field) =>
        !formData?.[field] || formData[field].length === 0;

      const hasStep1Empty = step1Fields.some(isEmpty);
      const hasStep2Empty = step2Fields.some(isEmpty);

      const hasFieldErrors = Object.values(formDataError).some(Boolean);

      if (activeStep < steps.length - 1) {
        if (hasStep1Empty) {
          step1Fields.map((item) => {
            if (formData[item].length <= 0) {
              setFormDataError({
                name: item,
                values: "Please fill this field first.",
              });
            }
          });
          toast.error(requiredMessage);
          return;
        }
        if (hasFieldErrors) {
          toast.error(errorFixMessage);
          return;
        }
        setActiveStep((prev) => prev + 1);
      } else {
        if (hasStep1Empty || hasStep2Empty) {
          step2Fields.map((item) => {
            if (formData[item].length <= 0) {
              setFormDataError({ name: item, values: requiredMessage });
            }
          });
          toast.error(requiredMessage);
          return;
        }
        if (Object.values(formDataError).some((err) => err.length > 0)) {
          toast.error(errorFixMessage);
          return;
        }
        setLoading(true);

        const payload = {
          patientCardNumber: formData?.mrn,
          patientFirstName: formData?.fname,
          patientMiddleName: formData?.fatname,
          patientLastName: formData?.gfname,
          patientMotherName: formData?.maname,
          patientDOB: formData?.dob?.replace(" +03:00", ""),
          patientGender: formData?.gender,
          patientReligion: formData?.religion,
          patientPlaceofbirth: formData?.pbirth,
          multiplebirth: formData?.mbirth,
          appointment: formData?.providers,
          patientPhoneNumber: formData?.mobile,
          iscreadituser: 0,
          iscbhiuser: 0,
          patientOccupation: formData?.occ,
          department: formData?.dep,
          patientEducationlevel: formData?.edu,
          patientMaritalstatus: formData?.mstatus,
          patientSpouseFirstName: formData?.sname,
          patientSpouselastName: formData?.sfname,
          patientRegisteredBy: tokenvalue?.name, //token name
          patientVisitingDate:
            formData?.vdate?.length > 0
              ? formData?.vdate?.replace(" +03:00", "")
              : new Date(),
          patientRegion: formData?.region,
          patientWoreda: formData?.woreda,
          patientKebele: formData?.kebele,
          patientHouseNo: formData?.hn,
          patientAddressDetail: formData?.addD,
          patientPhone: formData?.phone,
          patientKinRegion: formData?.nregion,
          patientKinWoreda: formData?.nworeda,
          patientKinKebele: formData?.nkebele,
          patientKinHouseNo: formData?.nhn,
          patientKinAddressDetail: formData?.naddD,
          patientKinPhone: formData?.nphone,
          patientKinMobile: formData?.nmobile,
          patientChangedBy: tokenvalue?.name,
        };
        let response;
        if (!formData?.isUpdate) {
          response = await api.post("/Patient/add-patient-info", payload);
        } else {
          response = await api.put("/Patient/update-patient-info", payload);
        }
        if (Object.values(response?.data)?.some((item) => item?.length > 0)) {
          setFormData({ name: "reset" });
          setFormDataError({ name: "Reset" });
          setActiveStep(0);
          toast.success("Patient Information Recorded Successfully.");
          setLoading(false);
        }
      }
    } catch (error) {
      console.error("Error Happened on Next Step and Submit handler:", error);
      toast.error(error?.response?.data?.msg || "Internal Server Error.");
      setLoading(false);
    }
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleCheck = async () => {
    try {
      setCheckLoading(true);
      if (formDataError?.mrn?.length > 0 || formData?.mrn?.length <= 0) {
        toast.error("Please Insert Valid MRN first.");
        return;
      }

      if (
        formData?.mrn?.length > 0 &&
        formData?.mrn === lastCardNumberRef?.current
      ) {
        return;
      } else {
        lastCardNumberRef.current = formData?.mrn;
      }

      const response = await api.put("/Patient/get-one-patient-info", {
        patientCardNumber: formData?.mrn,
      });
      if (response?.data?.length <= 0) {
        toast.info("MRN Not Found!");
        return;
      } else {
        if (Object.values(response?.data)?.some((item) => item?.length > 0)) {
          const item = response?.data;

          const renamedData = {
            mrn: item.patientCardNumber,
            fname: item.patientFirstName,
            fatname: item.patientMiddleName,
            gfname: item.patientLastName,
            maname: item.patientMotherName,
            dob: item.patientDOB,
            gender: item.patientGender,
            religion: item.patientReligion,
            pbirth: item.patientPlaceofbirth,
            mbirth: item.multiplebirth,
            providers: item.appointment,
            hn: item.patientHouseNo,
            nhn: item.patientKinHouseNo,
            mobile: item.patientPhoneNumber,
            occ: item.patientOccupation,
            dep: item.department,
            edu: item.patientEducationlevel,
            mstatus: item.patientMaritalstatus,
            sname: item.patientSpouseFirstName,
            sfname: item.patientSpouselastName,
            vdate: item.patientVisitingDate,
            region: item.patientRegion,
            woreda: item.patientWoreda,
            kebele: item.patientKebele,
            addD: item.patientAddressDetail,
            phone: item.patientPhone,
            nregion: item.patientKinRegion,
            nworeda: item.patientKinWoreda,
            nkebele: item.patientKinKebele,
            naddD: item.patientKinAddressDetail,
            nphone: item.patientKinPhone,
            nmobile: item.patientKinMobile,
            isUpdate: true,
          };
          setFormData({
            name: "bulk",
            values: renamedData,
          });
          toast.success("Patient record found for this card number.");
        } else {
          toast.info("Patient record not found for this card number.");
        }
      }
    } catch (error) {
      console.error("This Is CHeck Error: ", error);
      toast.error(error?.response?.data?.msg || "Internal Server Error.");
    } finally {
      setCheckLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <>
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <TextField
                label="MRN"
                name="mrn"
                type="text"
                value={formData?.mrn}
                onChange={handleChange}
                onBlurCapture={() => handleCheck()}
                error={!!formDataError?.mrn}
                helperText={formDataError?.mrn}
                required
                InputProps={{
                  min: 0, // Prevents negative values
                  step: "any", // Allows decimal values
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
              {checkLoading && (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  sx={{ marginLeft: "15px" }}
                >
                  <CircularProgress size={24} color="inherit" />
                </Box>
              )}
            </Grid>

            <hr style={{ margin: "20px" }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="First Name *"
                  type="text"
                  name="fname"
                  value={formData?.fname}
                  onChange={handleChange}
                  error={!!formDataError?.fname}
                  helperText={formDataError?.fname}
                  fullWidth
                  required
                  InputProps={{
                    min: 0, // Prevents negative values
                    step: "any", // Allows decimal values
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
                <EtDatePicker
                  key={formData.dob || "dob-empty"}
                  label="Date of Birth *"
                  name="dob"
                  value={
                    !!formData?.dob && !["", null].includes(formData.dob)
                      ? new Date(formData.dob.replace(" +03:00", ""))
                      : null
                  }
                  onChange={(e) => {
                    handleChangeTime("dob", e);
                  }}
                  error={!!formDataError?.dob}
                  helperText={formDataError?.dob}
                  sx={{ width: "100%" }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  value={formData.edu}
                  name="edu"
                  onChange={handleChange}
                  label="Highest Education Level Attained"
                  fullWidth
                  InputProps={{
                    min: 0, // Prevents negative values
                    step: "any", // Allows decimal values
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
                >
                  {HighestE.map((he) => (
                    <MenuItem key={he} value={he}>
                      {he}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Father's Name *"
                  type="text"
                  name="fatname"
                  value={formData?.fatname}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={!!formDataError?.fatname}
                  helperText={formDataError?.fatname}
                  InputProps={{
                    min: 0, // Prevents negative values
                    step: "any", // Allows decimal values
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
                  label="Place of Birth"
                  type="text"
                  value={formData?.pbirth}
                  name="pbirth"
                  onChange={handleChange}
                  error={!!formDataError?.pbirth}
                  helperText={formDataError?.pbirth}
                  fullWidth
                  InputProps={{
                    min: 0, // Prevents negative values
                    step: "any", // Allows decimal values
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
                  select
                  label="Occupation"
                  value={formData.occ}
                  name="occ"
                  onChange={handleChange}
                  fullWidth
                  InputProps={{
                    min: 0, // Prevents negative values
                    step: "any", // Allows decimal values
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
                >
                  {occupationList.map((ol) => (
                    <MenuItem key={ol} value={ol}>
                      {ol}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  type="text"
                  label="Grandfather's Name"
                  value={formData?.gfname}
                  name="gfname"
                  onChange={handleChange}
                  error={!!formDataError?.gfname}
                  helperText={formDataError?.gfname}
                  fullWidth
                  InputProps={{
                    min: 0, // Prevents negative values
                    step: "any", // Allows decimal values
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
                  select
                  value={formData.mbirth}
                  label="Multiple Birth"
                  name="mbirth"
                  onChange={handleChange}
                  fullWidth
                  InputProps={{
                    min: 0, // Prevents negative values
                    step: "any", // Allows decimal values
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
                >
                  {MultipleB.map((mb) => (
                    <MenuItem key={mb} value={mb}>
                      {mb}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  value={formData.mstatus}
                  fullWidth
                  label="Marital Status"
                  name="mstatus"
                  onChange={handleChange}
                  InputProps={{
                    min: 0, // Prevents negative values
                    step: "any", // Allows decimal values
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
                >
                  {Marital.map((ms) => (
                    <MenuItem key={ms} value={ms}>
                      {ms}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  type="text"
                  label="Mother's First Name"
                  value={formData?.maname}
                  fullWidth
                  name="maname"
                  onChange={handleChange}
                  error={!!formDataError?.maname}
                  helperText={formDataError?.maname}
                  InputProps={{
                    min: 0, // Prevents negative values
                    step: "any", // Allows decimal values
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
                  select
                  value={formData.religion}
                  name="religion"
                  onChange={handleChange}
                  label="Religion"
                  fullWidth
                  InputProps={{
                    min: 0, // Prevents negative values
                    step: "any", // Allows decimal values
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
                >
                  {Religions.map((r) => (
                    <MenuItem key={r} value={r}>
                      {r}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  type="text"
                  label="Spouse's First Name"
                  value={formData?.sname}
                  name="sname"
                  fullWidth
                  onChange={handleChange}
                  error={!!formDataError?.sname}
                  helperText={formDataError?.sname}
                  InputProps={{
                    min: 0, // Prevents negative values
                    step: "any", // Allows decimal values
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
                  select
                  label="Gender *"
                  value={formData.gender}
                  name="gender"
                  onChange={handleChange}
                  fullWidth
                  required
                  error={!!formDataError?.gender}
                  helperText={formDataError?.gender}
                  InputProps={{
                    min: 0, // Prevents negative values
                    step: "any", // Allows decimal values
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
                >
                  {genders.map((g) => (
                    <MenuItem key={g} value={g}>
                      {g}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Grid container direction="column" spacing={1}>
                  <Grid item>
                    <Typography variant="subtitle1" fontWeight="bold">
                      *Appointment / Assignment
                    </Typography>
                  </Grid>
                  <Grid item>
                    <TextField
                      select
                      value={formData.providers}
                      name="providers"
                      label="Providers *"
                      onChange={handleChange}
                      fullWidth
                      required
                      error={!!formDataError?.providers}
                      helperText={formDataError?.providers}
                      InputProps={{
                        min: 0, // Prevents negative values
                        step: "any", // Allows decimal values
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
                    >
                      {Providers.map((p) => (
                        <MenuItem key={p} value={p}>
                          {p}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  type="text"
                  label="Spouse's Father's Name"
                  value={formData?.sfname}
                  name="sfname"
                  fullWidth
                  onChange={handleChange}
                  error={!!formDataError?.sfname}
                  helperText={formDataError?.sfname}
                  InputProps={{
                    min: 0, // Prevents negative values
                    step: "any", // Allows decimal values
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
                <EtDatePicker
                  key={formData?.vdate || "vdate-empty"}
                  label="Visit Date"
                  name="vdate"
                  value={formData?.vdate ? new Date(formData?.vdate) : ""}
                  onChange={(e) => handleChangeTime("vdate", e)}
                  sx={{ width: "100%" }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  label="Departments"
                  value={formData.dep}
                  name="dep"
                  fullWidth
                  required
                  error={!!formDataError?.dep}
                  helperText={formDataError?.dep}
                  onChange={handleChange}
                  InputProps={{
                    min: 0, // Prevents negative values
                    step: "any", // Allows decimal values
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
                >
                  {Departments.map((d) => (
                    <MenuItem key={d} value={d}>
                      {d}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </>
        );
      case 1:
        return (
          <>
            <Stack
              direction="row"
              spacing={2}
              divider={<Divider orientation="vertical" flexItem />}
            >
              {/* Left Section */}
              <Box flex={1}>
                <Typography gutterBottom variant="subtitle1" fontWeight="bold">
                  Patient Current Address
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      select
                      value={formData.region}
                      name="region"
                      onChange={handleChange}
                      label="Region"
                      fullWidth
                      required
                      error={!!formDataError?.region}
                      helperText={formDataError?.region}
                      InputProps={{
                        min: 0, // Prevents negative values
                        step: "any", // Allows decimal values
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
                    >
                      {ethiopianRegions.map((r) => (
                        <MenuItem key={r} value={r}>
                          {r}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Woreda/Subcity"
                      value={formData?.woreda}
                      name="woreda"
                      onChange={handleChange}
                      fullWidth
                      error={!!formDataError?.woreda}
                      helperText={formDataError?.woreda}
                      required
                      InputProps={{
                        min: 0, // Prevents negative values
                        step: "any", // Allows decimal values
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
                    <TextField
                      label="Kebele"
                      value={formData?.kebele}
                      name="kebele"
                      onChange={handleChange}
                      fullWidth
                      error={!!formDataError?.kebele}
                      helperText={formDataError?.kebele}
                      required
                      InputProps={{
                        min: 0, // Prevents negative values
                        step: "any", // Allows decimal values
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
                    <TextField
                      label="House #/Peasant Association#"
                      value={formData.hn}
                      name="hn"
                      onChange={handleChange}
                      error={!!formDataError?.hn}
                      helperText={formDataError?.hn}
                      fullWidth
                      InputProps={{
                        min: 0, // Prevents negative values
                        step: "any", // Allows decimal values
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
                    <TextField
                      label="Address Details"
                      multiline
                      value={formData?.addD}
                      name="addD"
                      onChange={handleChange}
                      rows={4}
                      fullWidth
                      error={!!formDataError?.addD}
                      helperText={formDataError?.addD}
                      InputProps={{
                        min: 0, // Prevents negative values
                        step: "any", // Allows decimal values
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
                    <TextField
                      label="Phone"
                      value={formData?.phone}
                      name="phone"
                      onChange={handleChange}
                      fullWidth
                      error={!!formDataError?.phone}
                      helperText={formDataError?.phone}
                      InputProps={{
                        min: 0, // Prevents negative values
                        step: "any", // Allows decimal values
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
                    <TextField
                      label="Mobile Phone"
                      value={formData?.mobile}
                      name="mobile"
                      onChange={handleChange}
                      fullWidth
                      error={!!formDataError?.mobile}
                      helperText={formDataError?.mobile}
                      InputProps={{
                        min: 0, // Prevents negative values
                        step: "any", // Allows decimal values
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
              <Box flex={1}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Next of Kin
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      select
                      value={formData.nregion}
                      name="nregion"
                      onChange={handleChange}
                      label="Region"
                      fullWidth
                      required
                      error={!!formDataError?.nregion}
                      helperText={formDataError?.nregion}
                      InputProps={{
                        min: 0, // Prevents negative values
                        step: "any", // Allows decimal values
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
                    >
                      {ethiopianRegions.map((r) => (
                        <MenuItem key={r} value={r}>
                          {r}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Woreda/Subcity"
                      value={formData?.nworeda}
                      name="nworeda"
                      onChange={handleChange}
                      fullWidth
                      error={!!formDataError?.nworeda}
                      helperText={formDataError?.nworeda}
                      required
                      InputProps={{
                        min: 0, // Prevents negative values
                        step: "any", // Allows decimal values
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
                    <TextField
                      label="Kebele"
                      value={formData?.nkebele}
                      name="nkebele"
                      onChange={handleChange}
                      fullWidth
                      required
                      error={!!formDataError?.nkebele}
                      helperText={formDataError?.nkebele}
                      InputProps={{
                        min: 0, // Prevents negative values
                        step: "any", // Allows decimal values
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
                    <TextField
                      label="House #/Peasant Association#"
                      value={formData?.nhn}
                      name="nhn"
                      onChange={handleChange}
                      fullWidth
                      error={!!formDataError?.nhn}
                      helperText={formDataError?.nhn}
                      InputProps={{
                        min: 0, // Prevents negative values
                        step: "any", // Allows decimal values
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
                    <TextField
                      label="Address Details"
                      value={formData?.naddD}
                      name="naddD"
                      onChange={handleChange}
                      multiline
                      rows={4}
                      fullWidth
                      error={!!formDataError?.naddD}
                      helperText={formDataError?.naddD}
                      InputProps={{
                        min: 0, // Prevents negative values
                        step: "any", // Allows decimal values
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
                    <TextField
                      label="Phone"
                      value={formData.nphone}
                      name="nphone"
                      onChange={handleChange}
                      fullWidth
                      error={!!formDataError?.nphone}
                      helperText={formDataError?.nphone}
                      InputProps={{
                        min: 0, // Prevents negative values
                        step: "any", // Allows decimal values
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
                    <TextField
                      label="Mobile Phone"
                      value={formData?.nmobile}
                      name="nmobile"
                      onChange={handleChange}
                      fullWidth
                      error={!!formDataError?.nmobile}
                      helperText={formDataError?.nmobile}
                      InputProps={{
                        min: 0, // Prevents negative values
                        step: "any", // Allows decimal values
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
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div>
        <Box
          sx={{
            mx: "auto",
            p: 3,
            marginInline: "15px",
            border: "1px solid #ccc",
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Patient Registration Form
          </Typography>
          <Stepper
            activeStep={activeStep}
            alternativeLabel
            sx={{
              padding: 2,
              "& .MuiStepLabel-label": {
                color: "text.primary",
                fontWeight: "bold",
                fontSize: "1rem",
              },
              "& .MuiStepIcon-root.Mui-active": {
                color:
                  theme.palette.mode === "light"
                    ? theme.palette.primary.main
                    : theme.palette.secondary.main, 
              },
              "& .MuiStepIcon-root.Mui-completed": {
                color: theme.palette.success.main, 
              },
              "& .MuiStepIcon-root": {
                fontSize: 28,
              },
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box mt={3}>{renderStepContent(activeStep)}</Box>
          {/* Buttons */}
          <Box
            sx={{
              mt: 3,
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
            }}
          >
            <Button
              variant="contained"
              disabled={activeStep === 0}
              color={theme.palette.mode === "light" ? "primary" : "secondary"}
              onClick={handleBack}
            >
              Back
            </Button>
            <Button
              variant="contained"
              color={theme.palette.mode === "light" ? "primary" : "secondary"}
              disabled={loading}
              onClick={handleNext}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : activeStep === steps.length - 1 && !formData?.isUpdate ? (
                "Submit"
              ) : activeStep === steps.length - 1 && formData?.isUpdate ? (
                "Update"
              ) : (
                "Next"
              )}
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleCancel()}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </div>
      <ToastContainer />
    </>
  );
}
export default PatientRegistration;
