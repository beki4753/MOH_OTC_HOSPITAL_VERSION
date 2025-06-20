import React, { useEffect, useState } from "react";
import "./UserManagment.css";
import { DataGrid } from "@mui/x-data-grid";
import { IconButton, Button, useTheme } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PasswordIcon from "@mui/icons-material/VpnKey";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AddRoleModal from "./AddRoleModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../utils/api";
const RoleManagment = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [dataToedit, setDataToedit] = useState(null);
  const [rows, setRows] = useState([]);

  const theme = useTheme();

  const handleEditUser = async (params) => {
    try {
      setDataToedit(params.row); // Set selected user data for editing
      setModalOpen(true); // Open the modal for editing
    } catch (error) {
      console.error(error.message);
    }
  };

  const resetDataToEdit = async () => {
    setDataToedit(null);
  };

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await api.get("/Admin/roles");

        const sortedRoles = response?.data?.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        const rolesWithOrder = sortedRoles.map((role, index) => ({
          ...role,
          orderNumber: index + 1,
        }));
        setRows(rolesWithOrder);
      } catch (error) {
        console.error("fetchrole>>", error.message);
        toast.error("Internal Server Error on Role Fetch;");
      }
    };

    fetchRoles();
  }, []);

  const columns = [
    { field: "orderNumber", headerName: "ID", flex: 1 },
    { field: "name", headerName: "Role", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      renderCell: (params) => (
        <>
          <IconButton
            // onClick={() => handleEditUser(params)}
            aria-label="edit"
            className="text-info"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            // onClick={() => handleOpenDeleteConfirm(params.row)}
            color="danger"
            aria-label="delete"
            className="text-danger"
          >
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  // Handle the form submission
  const handleAddRole = async (userData) => {
    // Send userData to your backend API or perform other actions
  };

  // Handle the form submission
  const handleEditRole = (userData) => {
    // Send userData to your backend API or perform other actions
  };

  return (
    <div className="user-management-container">
      <h1 className="hed">Role Management</h1>

      <Button
        variant="contained"
        color={theme.palette.mode === "light" ? "primary" : "success"}
        startIcon={<PersonAddIcon />}
        onClick={() => setModalOpen(true)}
      >
        Add Role
      </Button>

      <AddRoleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddRole}
        onEdit={handleEditRole}
        updateData={dataToedit}
        resetData={resetDataToEdit}
      />

      <div className="data-grid-container">
        <DataGrid
          rows={rows}
          columns={columns}
          autoHeight
          pageSizeOptions={[5, 10]}
        />
      </div>
      <ToastContainer />
    </div>
  );
};

export default RoleManagment;
