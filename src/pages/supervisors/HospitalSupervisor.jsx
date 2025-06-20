import React, { useState, useEffect } from "react";
import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

const HospitalSupervisor = () => {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [cbhiPayments, setCbhiPayments] = useState([]);
  const [creditPayments, setCreditPayments] = useState([]);

  useEffect(() => {
    const approvals = JSON.parse(localStorage.getItem("cashPayments")) || [];
    const cbhi = JSON.parse(localStorage.getItem("hospitalPayments")) || [];
    const credit = JSON.parse(localStorage.getItem("hospitalPayments")) || [];
    setPendingApprovals(approvals);
    setCbhiPayments(cbhi);
    setCreditPayments(credit);
  }, []);

  const handleApprove = (id) => {
    const updatedApprovals = pendingApprovals.filter((item) => item.id !== id);
    setPendingApprovals(updatedApprovals);
    localStorage.setItem("pendingApprovals", JSON.stringify(updatedApprovals));
  };

  const handleClearCbhi = (woreda) => {
    const updatedCbhi = cbhiPayments.filter((item) => item.woreda !== woreda);
    setCbhiPayments(updatedCbhi);
    localStorage.setItem("cbhiPayments", JSON.stringify(updatedCbhi));
  };

  const handleClearCredit = (organization) => {
    const updatedCredit = creditPayments.filter((item) => item.organization !== organization);
    setCreditPayments(updatedCredit);
    localStorage.setItem("creditPayments", JSON.stringify(updatedCredit));
  };

  const handleClearAllCbhi = () => {
    setCbhiPayments([]);
    localStorage.setItem("cbhiPayments", JSON.stringify([]));
  };

  const handleClearAllCredit = () => {
    setCreditPayments([]);
    localStorage.setItem("creditPayments", JSON.stringify([]));
  };

  const columns = [
    { field: "id", headerName: "ID", width: 90 },
    { field: "casher", headerName: "Casher", width: 150 },
    { field: "amount", headerName: "Amount", width: 150 },
    { field: "method", headerName: "Method", width: 150 },
    {
      field: "actions",
      headerName: "Actions",
      width: 200,
      renderCell: (params) => (
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleApprove(params.row.id)}
        >
          Approve
        </Button>
      ),
    },
  ];

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Hospital Supervisor Dashboard
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6">Pending Approvals</Typography>
          <DataGrid rows={pendingApprovals} columns={columns} autoHeight pageSize={5} />
        </CardContent>
      </Card>

      <Box mt={3}>
        <Card>
          <CardContent>
            <Typography variant="h6">CBHI Payments</Typography>
            <Button variant="contained" color="secondary" onClick={handleClearAllCbhi}>
              Clear All CBHI
            </Button>
            <DataGrid
              rows={cbhiPayments}
              columns={[{ field: "woreda", headerName: "Woreda", width: 200 }]}
              autoHeight
              pageSize={5}
            />
          </CardContent>
        </Card>
      </Box>

      <Box mt={3}>
        <Card>
          <CardContent>
            <Typography variant="h6">Credit Payments</Typography>
            <Button variant="contained" color="secondary" onClick={handleClearAllCredit}>
              Clear All Credit
            </Button>
            <DataGrid
              rows={creditPayments}
              columns={[{ field: "organization", headerName: "Organization", width: 200 }]}
              autoHeight
              pageSize={5}
            />
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default HospitalSupervisor;
