import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  useTheme,
  Box,
  CircularProgress,
} from "@mui/material";
import AddHospitalServices from "./AddHospitalServices";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { DataGrid, GridToolbarContainer } from "@mui/x-data-grid";
import { Add, Edit, Delete, ReplayOutlined } from "@mui/icons-material";
import api from "../utils/api";
import { getTokenValue } from "../services/user_service";
import { formatAccounting2 } from "../pages/hospitalpayment/HospitalPayment";
import api2 from "../utils/api2";

const tokenvalue = getTokenValue();
const categories = [
  "Digital Payment Channels",
  "CBHI Providers",
  "Organizations with Agreements",
  "Hospital Services",
  "Payment Methods",
];

const PaymentManagementLists = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState({});
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    name: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const theme = useTheme();

  function CustomToolbar({ rows, columns, category }) {
    const exportToExcel = async () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Payment Data");

      // Define headers
      worksheet.columns = columns
        .filter((col) => col.field !== "actions") // Skip actions column
        .map((col) => ({
          header: col.headerName || col.field,
          key: col.field,
          width: 25,
        }));

      // Add rows
      rows.forEach((row) => {
        const rowData = {};
        worksheet.columns.forEach((col) => {
          rowData[col.key] = row[col.key];
        });
        worksheet.addRow(rowData);
      });

      // Style headers
      worksheet.getRow(1).font = { bold: true };

      // Generate and trigger download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `${category}_data_.xlsx`);
    };

    return (
      <GridToolbarContainer>
        <Button
          variant="outlined"
          color={theme.palette.mode === "dark" ? "secondary" : "primary"}
          onClick={() => exportToExcel()}
        >
          Export to Excel
        </Button>
      </GridToolbarContainer>
    );
  }

  // Generalized fetch function
  const fetchData = async (endpoint, key, mapFunction) => {
    try {
      const response = await api.get(endpoint);
      if (response?.status === 200 || response?.status === 201) {
        const obj = response?.data?.map(({ createdBy, ...rest }) => ({
          createdby: createdBy,
          ...rest,
        }));
        const result = {
          [key]: obj,
        };

        setData((prevData) => ({ ...prevData, ...result }));
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  // Fetch Payment Methods
  useEffect(() => {
    fetchData("/Lookup/payment-type", "Payment Methods", (item) => item.type);
  }, [refresh]);

  // Fetch Digital Channels
  useEffect(() => {
    fetchData(
      "/Lookup/payment-channel",
      "Digital Payment Channels",
      (item) => item.channel
    );
  }, [refresh]);

  // Fetch Paymet purpose
  useEffect(() => {
    fetchData(
      "/Lookup/payment-purpose",
      "Hospital Services",
      (item) => item.purpose
    );
  }, [refresh]);

  // Fetch CBHI Provider
  useEffect(() => {
    fetchData(
      `/Providers/list-providers`,
      "CBHI Providers",
      (item) => item.provider
    );
  }, [refresh]);

  // Fetch Organization with Agreement
  useEffect(() => {
    fetchData(
      `/Organiztion/Organization`,
      "Organizations with Agreements",
      (item) => item.organization
    );
  }, [refresh]);

  const handleOpen = (category, item = "", id = null) => {
    setFormData({ category, name: item });
    setEditId(id);
    setOpen(true);
  };

  const handleOpen2 = (category, item = "", loc = "", id = null) => {
    setFormData({ category, name: item, address: loc });
    setEditId(id);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditId(null);
    setFormData({ category: "", name: "", address: "" });
  };

  const getRowsAndColumns = (category) => {
    const baseData = data[category] || [];

    const rows = baseData.map((item) => ({
      id: item.id,
      name:
        category === "Digital Payment Channels"
          ? item.channel
          : category === "Payment Methods"
          ? item.type
          : category === "Hospital Services"
          ? item.purpose
          : category === "CBHI Providers"
          ? item.provider
          : item.organization,
      createdBy: item.createdby,
      location:
        category === "Organizations with Agreements" ? item.location : "",
      amount:
        category === "Hospital Services" ? formatAccounting2(item.amount) : 0,
      shortCodes: item.shortCodes,
      group: item.group,
      subgroup: item.subgroup,
    }));

    let columns = [];

    if (category === "Hospital Services") {
      columns = [
        { field: "name", headerName: "Name", flex: 1.1 },
        { field: "shortCodes", headerName: "ShortCode", flex: 1 },
        { field: "group", headerName: "Group", flex: 1 },
        { field: "subgroup", headerName: "SubGroup", flex: 1 },
        { field: "amount", headerName: "Amount", flex: 0.5 },
      ];
    } else if (category === "Organizations with Agreements") {
      columns = [
        { field: "name", headerName: "Name", flex: 1 },
        { field: "location", headerName: "Address", flex: 1 },
      ];
    } else {
      columns = [{ field: "name", headerName: "Name", flex: 1 }];
    }

    columns.push({
      field: "actions",
      headerName: "Actions",
      flex: 0.5,
      renderCell: (params) =>
        params?.row?.createdBy?.toUpperCase() !== "SYS" && (
          <>
            <IconButton
              onClick={() => {
                if (category === "Organizations with Agreements") {
                  handleOpen2(
                    category,
                    params.row.name,
                    params.row.location,
                    params.row.id
                  );
                } else if (category === "Hospital Services") {
                  handleOpen2(
                    category,
                    params.row.name,
                    params.row.location,
                    params.row.id
                  );
                } else {
                  handleOpen(category, params.row.name, params.row.id);
                }
              }}
            >
              <Edit />
            </IconButton>
            <IconButton
              onClick={() => handleDelete(category, params.row.id)}
              color="error"
            >
              <Delete />
            </IconButton>
          </>
        ),
    });

    return { rows, columns };
  };

  const handleUpdateList = async () => {
    try {
      setIsUpdating(true);
      const response = await api2.get("/k/sync-concepts/");
      if (response?.status === 200) {
        toast.success(response?.data?.message || "Updated Successfully.");
        setRefresh((prev) => !prev);
      }
    } catch (error) {
      console.error("This is handleUpdateList Error: ", error);
      toast.error(error?.response?.data?.error || "Internal server Error.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChange = (e) => {
    if (e.target.name === "address") {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    } else {
      setFormData({ ...formData, name: e.target.value });
    }
  };

  const handleSubmit = async (params) => {
    try {
      const { category, name, address } = formData;
      if (!name.trim()) return;
      const apiEndpoints = {
        "Digital Payment Channels": "/Lookup/payment-channel",
        "Payment Methods": "/Lookup/payment-type",
        "Hospital Services": "/Lookup/payment-purpose",
        "CBHI Providers": "/Providers/add-provider",
        "Organizations with Agreements": "/Organiztion/Organization",
      };

      const apiEndpointsEdit = {
        "Digital Payment Channels": "/Lookup/payment-channel",
        "Payment Methods": "/Lookup/payment-type",
        "Hospital Services": "/Lookup/payment-purpose",
        "CBHI Providers": "/Providers/update-provider",
        "Organizations with Agreements": "/Organiztion/Organization",
      };

      const requestBody = {
        "Digital Payment Channels": {
          channel: name,
          createdBy: tokenvalue.name,
        },
        "Payment Methods": { type: name, createdBy: tokenvalue.name },
        "Hospital Services": params,
        "CBHI Providers": {
          provider: name,
          service: "CBHI",
          createdBy: tokenvalue.name,
        },
        "Organizations with Agreements": {
          organization: name,
          address: address,
          createdBy: tokenvalue.name,
        },
      };

      const requestBodyEdit = {
        "Digital Payment Channels": {
          id: Number(editId),
          channel: name,
          updatedBy: tokenvalue.name,
          updatedOn: new Date().toISOString(),
        },
        "Payment Methods": {
          id: Number(editId),
          type: name,
          updatedBy: tokenvalue.name,
          updatedOn: new Date().toISOString(),
        },
        "Hospital Services": {
          id: Number(editId),
          purpose: name,
          updatedBy: tokenvalue.name,
          updatedOn: new Date().toISOString(),
        },
        "CBHI Providers": {
          id: Number(editId),
          provider: name,
          service: "CBHI",
          updatedBy: tokenvalue.name,
          updatedOn: new Date().toISOString(),
        },

        "Organizations with Agreements": {
          id: Number(editId),
          organization: name,
          address: address,
          updatedBy: tokenvalue.name,
          updatedOn: new Date().toISOString(),
        },
      };

      if (editId !== null && apiEndpointsEdit[category]) {
        try {
          await api.put(apiEndpointsEdit[category], requestBodyEdit[category]);

          toast.success(`${category} updated successfully!`);
          setRefresh((prev) => !prev);
          handleClose();
        } catch (error) {
          console.error("Update error:", error);
          toast.error(error?.response?.data || "Error updating data!");
        }
      }

      if (apiEndpoints[category] && editId === null) {
        try {
          setLoading(true);

          const response = await api.post(
            apiEndpoints[category],
            requestBody[category],
            {
              headers: { "Content-Type": "application/json" },
            }
          );
          if (response.status === 201 || response.status === 200) {
            toast.success(`${category} added successfully!`);
            setRefresh((prev) => !prev);
            setIsOpen(false);
            handleClose();
            return;
          }
        } catch (error) {
          console.error("Upload error:", error);
          toast.error("Error Uploading data!");
        } finally {
          setLoading(false);
        }
      }

      // handleClose();
    } catch (error) {
      console.error("Error:", error);
      toast.error(error?.response?.data || "Internal Server Error!");
    }
  };

  const handleDelete = async (category, id) => {
    try {
      const apiEndpoints = {
        "Digital Payment Channels": "/Lookup/payment-channel",
        "Hospital Services": "/Lookup/payment-purpose",
        "Payment Methods": "/Lookup/payment-type",
        "CBHI Providers": "/Providers/delete-provider",
        "Organizations with Agreements": "/Organiztion/Organization",
      };

      if (apiEndpoints[category]) {
        const response = await api.delete(apiEndpoints[category], {
          headers: { "Content-Type": "application/json" },
          data: { id: id, deletedBy: tokenvalue.name },
        });

        if (response.status === 200) {
          toast.success(`${category} deleted successfully!`);
          setRefresh((prev) => !prev);
        }
      } else {
        console.warn(`No API endpoint found for category: ${category}`);
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete item. Please try again.");
    }
  };

  const handleSomething = (categoryA) => {
    setFormData({ category: categoryA, name: categoryA, address: "" });
    setEditId(null);
    setIsOpen(true);
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Payment Management
      </Typography>
      {categories.map((category) => (
        <div key={category} style={{ marginBottom: "20px" }}>
          <Typography variant="h6" gutterBottom>
            {category}
          </Typography>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1} // margin bottom
          >
            <Button
              variant="contained"
              color={theme.palette.mode === "light" ? "primary" : "secondary"}
              startIcon={<Add />}
              onClick={() => {
                category === "Organizations with Agreements"
                  ? handleOpen2(category)
                  : category === "Hospital Services"
                  ? handleSomething(category)
                  : handleOpen(category);
              }}
            >
              Add {category}
            </Button>

            {category === "Hospital Services" && (
              <Button
                variant="outlined"
                color={theme.palette.mode === "light" ? "primary" : "secondary"}
                startIcon={<ReplayOutlined />}
                onClick={() => handleUpdateList()}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Update List"
                )}
              </Button>
            )}
          </Box>

          {(() => {
            const { rows, columns } = getRowsAndColumns(category);
            return (
              <DataGrid
                rows={rows}
                columns={columns}
                autoHeight
                slots={{
                  toolbar: () => (
                    <CustomToolbar
                      rows={rows}
                      columns={columns}
                      category={category}
                    />
                  ),
                }}
              />
            );
          })()}
        </div>
      ))}

      <Dialog
        open={open}
        onClose={(event, reason) => {
          if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
            handleClose(); // Reset and close the modal
          }
        }}
        disableEnforceFocus
      >
        <DialogTitle>
          {editId !== null ? "Edit" : "Add"} {formData.category}
        </DialogTitle>
        <DialogContent
          style={{
            display: "flex",
            msFlexDirection: "column",
            height:
              formData?.category === "Organizations with Agreements"
                ? "150px"
                : "100px",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <TextField
            fullWidth
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            autoFocus
            InputProps={{
              sx: {
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: theme.palette.mode === "dark" ? "#fff" : "#000",
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
          {formData?.category === "Organizations with Agreements" && (
            <TextField
              fullWidth
              label="Address"
              name="address"
              value={formData?.address || ""}
              onChange={handleChange}
              autoFocus
              sx={{ marginTop: "10px" }}
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
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="error">
            Cancel
          </Button>
          <Button
            variant="contained"
            color={theme.palette.mode === "light" ? "primary" : "success"}
            onClick={handleSubmit}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <AddHospitalServices
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        loading={loading}
        setLoading={setLoading}
        onSubmit={handleSubmit}
      />
      <ToastContainer />
    </Container>
  );
};

export default PaymentManagementLists;
