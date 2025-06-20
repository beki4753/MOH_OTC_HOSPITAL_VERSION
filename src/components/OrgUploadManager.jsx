import React, { useEffect, useState } from "react";
import {
  Container,
  Paper,
  Typography,
  Button,
  IconButton,
  TextField,
  MenuItem,
  CircularProgress,
  Grid,
  useTheme,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { DataGrid } from "@mui/x-data-grid";
import * as XLSX from "xlsx";
import { CancelPresentationTwoTone } from "@mui/icons-material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import api from "../utils/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getTokenValue } from "../services/user_service";
import EditCreditUsers from "./EditCreditUsers";
import ConfirmationModal from "./ConfirmationModal";

const tokenvalue = getTokenValue();

const OrgUploadManager = () => {
  const [fileData, setFileData] = useState([]);
  const [SearchData, setSearchData] = useState([]);
  const [data, setData] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [editLoading, setEditloading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [searching, SetSearching] = useState(false);
  const [isConfOpen, setIsConfOpen] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const option = ["New", "Extend"];
  const [formData, setFormData] = useState({ organization: "", option: "" });
  const [org, setOrg] = useState([]);
  const [searchKey, setSearchKey] = useState("");

  const theme = useTheme();

  const handleFileUpload = (event) => {
    try {
      setFileLoading(true);
      setSearchData([]);
      setSearchKey("");
      if (!formData.organization) {
        toast.error("Please First Select Organization.");
        event.target.value = null;
        return;
      } else if (!formData.option) {
        toast.error("Please First Select Option.");
        event.target.value = null;
        return;
      }
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json(sheet);
        const withIds = parsedData.map((prev, index) => ({
          ...prev,
          id: index + 1,
          workPlace: formData?.organization,
          option: formData?.option,
        }));

        setFileData(withIds);
        event.target.value = null;
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error(error);
    } finally {
      setFileLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      SetSearching(true);
      if (!searchKey) {
        toast.error("Please insert something to search field");

        return;
      }

      const response = await api.get(`/Organiztion/get-workers/${searchKey}`);
      if (response?.data?.length === 0) {
        toast.info(`Employee ID : ${searchKey} not Found.`);
      }
      setSearchData(response?.data);
    } catch (error) {
      console.error(error);
      toast.error("Unable to search.");
    } finally {
      SetSearching(false);
    }
  };

  const handleUploadToDatabase = async () => {
    try {
      setLoading(true);
      const response = await api.post("/Organiztion/add-workers", {
        employeeID: fileData.map((Item) => Item?.employeeID),
        employeeName: fileData.map((Item) => Item?.employeeName),
        employeePhone: fileData.map((Item) => Item?.employeePhone),
        employeeEmail: fileData.map((Item) => Item?.employeeEmail),
        isExtend: formData?.option === "Extend" ? true : false,
        workplace: formData?.organization,
        uploadedBy: tokenvalue?.name,
      });
      toast.success("Upload Successful.");
      setRefresh((prev) => !prev);
      setFileData([]);
      setFormData({ organization: "", option: "" });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchEmp = async () => {
      try {
        const response = await api.get(`/Organiztion/get-workers`);
        setData(response?.data <= 0 ? new Array() : response?.data);
      } catch (error) {
        console.error(error);
        toast.error(error?.response?.data || "Failde To Load list.");
      }
    };

    fetchEmp();
  }, [refresh]);

  const handleDeleteAll = () => {
    setFileData([]);
    setFormData({ organization: "", option: "" });
    setSearchData([]);
    setSearchKey("");
  };

  const handleEdit = async (params) => {
    try {
      if (params.message === "Edit") {
        if (fileData.length > 0) {
          const updated = fileData?.map((item) =>
            item.id === params?.editedData?.id
              ? { ...item, ...params?.editedData }
              : item
          );
          setFileData(updated);
        }

        setEditloading(true);
      } else {
        setEditing(true);
        setEditData(params?.row);
      }
    } catch (error) {
      console.error("This is handle Edit Error: ", error);
    } finally {
      setEditloading(false);
    }
  };

  const handlConfirm = async (params) => {
    try {
      if (params.message === "Delete") {
        if (fileData.length > 0) {
          setFileData((prev) =>
            prev.filter((item) => item.employeeID !== params?.userData)
          );
        }

        setDeleteLoading(true);
        setIsConfOpen(false);
        setDeleteId(null);
      } else {
        setIsConfOpen(true);
        setDeleteId(params?.row?.employeeID);
      }
    } catch (error) {
      console.error("This is handle confirm Error: ", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    { field: "employeeID", headerName: "Employee ID", flex: 1 },
    { field: "employeeName", headerName: "Employee Name", flex: 1 },
    { field: "employeePhone", headerName: "Phone", flex: 1 },
    { field: "employeeEmail", headerName: "Email", flex: 1 },
    { field: "workPlace", headerName: "Organization", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      width: 130,
      renderCell: (params) => (
        <>
          <IconButton
            onClick={() => handleEdit(params)}
            color="info"
            aria-label="edit"
            className="text-info"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => handlConfirm(params)}
            aria-label="delete"
            className="text-danger"
          >
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  const CustomErrorOverlay = () => {
    toast.error("Id Missing");
    return (
      <div style={{ padding: "20px", color: "red" }}>
        An error occurred: Id Missing
      </div>
    );
  };

  //Fetch Organization with agreement
  useEffect(() => {
    const fetchORG = async () => {
      try {
        const response = await api.get(`/Organiztion/Organization`);
        if (response?.status === 200 || response?.status === 201) {
          setOrg(response?.data?.map((item) => item.organization));
        }
      } catch (error) {
        console.error(error.message);
      }
    };
    fetchORG();
  }, []);

  const handleChange = (e) => {
    setSearchData([]);
    setSearchKey("");
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Container>
      <Typography variant="h5" gutterBottom>
        Credit Users
      </Typography>
      <Paper sx={{ padding: 2, marginBottom: 2 }}>
        <Grid>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField
                select
                fullWidth
                label="Organization"
                variant="filled"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                margin="normal"
                required
                InputLabelProps={{
                  sx: {
                    color: "primary.neutral",
                    "&.Mui-focused": {
                      color: "secondary.main",
                    },
                  },
                }}
              >
                {org.map((item, index) => (
                  <MenuItem key={index} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={3}>
              <TextField
                select
                fullWidth
                label="Option"
                name="option"
                variant="filled"
                value={formData.option}
                onChange={handleChange}
                margin="normal"
                required
                InputLabelProps={{
                  sx: {
                    color: "primary.neutral",
                    "&.Mui-focused": {
                      color: "secondary.main",
                    },
                  },
                }}
              >
                {option.map((item, index) => (
                  <MenuItem key={index} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid
              item
              xs={5}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <input
                accept=".xlsx, .xls"
                type="file"
                onChange={(e) => {
                  handleFileUpload(e);
                }}
                style={{ display: "none" }}
                id="upload-excel"
              />
              <label htmlFor="upload-excel">
                <Button
                  variant="contained"
                  color={
                    theme.palette.mode === "light" ? "primary" : "secondary"
                  }
                  component="span"
                  startIcon={<CloudUploadIcon />}
                >
                  {fileLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Upload Excel"
                  )}
                </Button>
              </label>
              <IconButton
                onClick={handleDeleteAll}
                color="error"
                sx={{ marginLeft: 2 }}
              >
                <CancelPresentationTwoTone />
              </IconButton>
              <Button
                variant="contained"
                color={theme.palette.mode === "light" ? "primary" : "secondary"}
                onClick={handleUploadToDatabase}
                sx={{ marginLeft: 2 }}
                disabled={fileData.length === 0}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Upload to Database"
                )}
              </Button>
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ marginTop: "10px" }}>
            <Grid item xs={11}>
              <TextField
                fullWidth
                type="text"
                label="Search By Employee ID"
                value={searchKey}
                onChange={(e) => {
                  setSearchData([]);
                  setSearchKey(e.target.value);
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
            <Grid
              item
              xs={1}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Button
                variant="contained"
                color={theme.palette.mode === "light" ? "primary" : "secondary"}
                onClick={() => handleSearch()}
              >
                {searching ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Search"
                )}
              </Button>
            </Grid>
          </Grid>

          <Typography variant="h6" sx={{ m: "15px 0 5px 20px" }}>
            {SearchData.length > 0
              ? "Viewing Search Result"
              : fileData.length > 0
              ? "Viewing from File"
              : "Viewing Registered"}
          </Typography>
        </Grid>
      </Paper>
      <Paper sx={{ height: 400 }}>
        <DataGrid
          rows={
            SearchData.length > 0
              ? SearchData
              : fileData.length <= 0
              ? data
              : fileData
          }
          columns={columns}
          // getRowId={(row) => row.id}
          // error={error}
          components={{
            ErrorOverlay: CustomErrorOverlay,
          }}
        />
      </Paper>
      <EditCreditUsers
        open={editing}
        onClose={() => {
          setEditing(false);
          setEditData(null);
          setEditloading(false);
        }}
        creditUserData={editData}
        onSave={handleEdit}
        isloading={editLoading}
      />
      <ConfirmationModal
        isOpen={isConfOpen}
        onClose={() => {
          setIsConfOpen(false);
          setDeleteId(null);
          setDeleteLoading(false);
        }}
        onConfirm={handlConfirm}
        userData={deleteId}
        loading={deleteLoading}
      />
      <ToastContainer />
    </Container>
  );
};

export default OrgUploadManager;
