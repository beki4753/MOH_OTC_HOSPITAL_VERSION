import React, { useEffect, useState } from "react";
import "./UserManagment.css";
import { DataGrid } from "@mui/x-data-grid";
import { IconButton, Button, useTheme } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PasswordIcon from "@mui/icons-material/VpnKey";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AddUserModal from "./AddUserModal";
import ConfirmationModal from "./ConfirmationModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../utils/api";
import SmartModal from "./SmartModal";

const UserManagment = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [openResetModal, setOpenResetModal] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // New state for selected user
  const [rows, setRows] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [role, setRoles] = useState([]);
  const [selectedDelete, setSelectedDelete] = useState("");
  const [selectedDeleteUser, setSelectedDeleteUser] = useState("");
  const [username, setUserName] = useState("");

  const theme = useTheme();

  const handlConfirm = async (params) => {
    setConfirmModalOpen(true);
    setSelectedDeleteUser(params.row.username);
    setSelectedDelete(params.row.id);
  };

  // Function to run on confirmation
  const handleDeleteConfirmation = async () => {
    try {
      const response = await api.delete(`/Admin/users/${selectedDelete}`);
      if (response.status === 200) {
        toast.success(response.data.message);
        setRefresh((prev) => !prev);
        setConfirmModalOpen(false);
      }
    } catch (error) {
      console.error(error.message);
      toast.error(error?.response?.data?.message);
    } finally {
      setSelectedDelete("");
      setSelectedDeleteUser("");
    }
  };

  const handleEditUser = async (params) => {
    try {
      setSelectedUser(params.row); // Set selected user data for editing
      setModalOpen(true); // Open the modal for editing
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleResetPassword = async (params) => {
    try {
      setUserName(params.row.username);
      setOpenResetModal(true);
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleResetSubmit = async (username, password, confirmPassword) => {
    try {
      const response = await api.post("/Admin/reset-password", {
        username: username,
        newPassword: password,
      });
      toast.success(response?.data?.message);
      handleCleare();
    } catch (error) {
      console.error(error.message);
      toast.error(error?.response?.data?.message || "Internal Server Error");
    } finally {
      setOpenResetModal(false);
    }
  };

  const handleReset = async () => {
    setSelectedUser(null);
  };

  const handleCleare = async () => {
    setUserName("");
  };

  const columns = [
    { field: "orderNumber", headerName: "ID", flex: 1 },
    { field: "username", headerName: "UserName", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    { field: "phoneNumber", headerName: "PhoneNumber", flex: 1 },
    { field: "roles", headerName: "Role", flex: 1 },
    { field: "departement", headerName: "Department", flex: 1 },
    { field: "userType", headerName: "User Type", flex: 1 },
    { field: "hospital", headerName: "Hospital Name", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      renderCell: (params) => (
        <>
          <IconButton
            onClick={() => handleEditUser(params)}
            aria-label="edit"
            className="text-info"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="danger"
            onClick={() => handlConfirm(params)}
            aria-label="delete"
            className="text-danger"
          >
            <DeleteIcon />
          </IconButton>
          <IconButton
            color="warning"
            onClick={() => handleResetPassword(params)}
            aria-label="reset password"
            className="text-warnning"
          >
            <PasswordIcon />
          </IconButton>
        </>
      ),
    },
  ];

  useEffect(() => {
    const fetchUserList = async () => {
      try {
        const response = await api.get("/Admin/users");

        const sortedUsers = response?.data?.sort((a, b) =>
          a.username.localeCompare(b.username)
        );
        const usersWithOrder = sortedUsers.map((user, index) => ({
          ...user,
          orderNumber: index + 1,
        }));
        setRows(usersWithOrder);
      } catch (error) {
        console.error(error.message);
      }
    };
    fetchUserList();
  }, [refresh]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await api.get("/Admin/roles");
        setRoles(response?.data?.map((item) => item.name));
      } catch (error) {
        console.error("fetchrole>>", error.message);
        toast.error(
          error?.response?.data?.message ||
            "Internal Server Error on Role Fetch;"
        );
      }
    };

    fetchRoles();
  }, []);

  const handleAddUser = async (userData) => {
    try {
      const response = await api.post("/Admin/users", {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        phoneNumber: userData.phone,
        userType: userData.usertype,
        departement: userData.department,
        hospital: userData.hospital,
      });
      if (response?.status === 200) {
        toast.success(response?.data?.message);
        setRefresh((prev) => !prev);
        handleReset();
        setModalOpen(false);
      }
    } catch (error) {
      console.error(error);
      if (Array.isArray(error?.response?.data)) {
        error?.response?.data?.map((item) => toast.error(item.description));
      } else {
        toast.error(error?.response?.data?.message || "Internal Server Error.");
      }
    }
  };

  const handleEditSubmit = async (editedUserData) => {
    try {
      const response = await api.post("/Admin/change-user-role", {
        userName: editedUserData.username,
        newRole: editedUserData.role,
      });
      if (response?.status === 200) {
        toast.success("Role Changed Success Fully!!");
        setRefresh((prev) => !prev);
        handleReset();
      }
    } catch (error) {
      console.error(error.message);
      toast.error("Internal Server Error.");
    } finally {
      setModalOpen(false);
    }
  };

  return (
    <div className="user-management-container">
      <h1 className="hed">User Management</h1>

      <Button
        variant="contained"
        color={theme.palette.mode === "light" ? "primary" : "secondary"}
        startIcon={<PersonAddIcon />}
        onClick={() => setModalOpen(true)}
      >
        Add User
      </Button>

      <AddUserModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddUser}
        onEdit={handleEditSubmit}
        userData={selectedUser}
        resetUserData={handleReset}
        role={role}
      />
      <ConfirmationModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        userData={selectedDeleteUser}
        onConfirm={() => handleDeleteConfirmation()}
      />
      <SmartModal
        open={openResetModal}
        onClose={() => setOpenResetModal(false)}
        username={username}
        onSubmit={handleResetSubmit}
        clearUserData={handleCleare}
      />
      <div className="data-grid-container">
        <DataGrid rows={rows} columns={columns} autoHeight />
      </div>
      <ToastContainer />
    </div>
  );
};

export default UserManagment;
