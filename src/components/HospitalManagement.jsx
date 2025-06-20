import React, {  useState } from "react";
import {
  Container,
  Paper,
  Typography,
  IconButton,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { toast,ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EditIcon from "@mui/icons-material/Edit";
import EditHospitalMgmt from "./EditHospitalMgmt";

const HospitalManagement = () => {
  const [data, setData] = useState([]);
  const [selected,setSelected] = useState(null)
  const [openDialog,setOpenDialog] = useState(false)
  const [editing,setIsEditing] = useState(false)



  const handleEditUser = async (params) => {
    try {
       setSelected(params.row)
       setOpenDialog(true)
    } catch (error) {
      console.error(error.message);
    }
  };

  const columns = [
    { field: "id", headerName: "ID", flex: 1 },
    { field: "hospital", headerName: "Hospital Name", flex: 1 },
    { field: "director", headerName: "Director", flex: 1 },
    { field: "directorEmail", headerName: "Director Email", flex: 1 },
    { field: "directorPhone", headerName: "Director Mobile", flex: 1 },
    { field: "district", headerName: "District", flex: 1 },
    { field: "districtEmail", headerName: "District Email", flex: 1 },
    { field: "districtPhone", headerName: "District Mobile", flex: 1 },
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
          </>
        ),
      },
  ];

  const mocData = [
    {
      id: "1",
      hospital: "DB TENA TABIYA",
      director: "Teshale Magna",
      directorEmail: "teshe@gmail.com",
      directorPhone: "+251953",
      district: "Shimels",
      districtEmail: "shimels@gmail.com",
      districtPhone: "+2510710",
      contactMethode:"SMS",
    },
    {
        id: "2",
        hospital: "DB Referal Hospital",
        director: "Kbrom Teshome",
        directorEmail: "kbrom@gmail.com",
        directorPhone: "+251953",
        district: "Shimels",
        districtEmail: "shimels@gmail.com",
        districtPhone: "+2510710",
        contactMethode:"EMAIL",
      },
  ];

  const handleEditSubmit = async(data)=>{
    try{
        setIsEditing(true)
        await new Promise(resolve => setTimeout(resolve, 3000))

        setOpenDialog(false)
    }catch(error)
    {
        console.error(error)
    }finally{
        setIsEditing(false)
    }

  }
const handleReset =()=>{
    setSelected(null)
}
  return (
    <Container>
      <Typography variant="h5" gutterBottom>
        District - Director - Hospital Mapping
      </Typography>
      <Paper sx={{ height: 400 }}>
        <DataGrid rows={mocData} columns={columns} />
      </Paper>
      <EditHospitalMgmt
        isOpen={openDialog}
        onClose = {()=>setOpenDialog(false)}
        onSubmit ={handleEditSubmit}
        userData={selected}
        resetUserData ={handleReset}
        adding = {editing}
      />
      <ToastContainer/>
    </Container>
  );
};

export default HospitalManagement;
