import React, { useEffect, useState } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ApartmentIcon from "@mui/icons-material/Apartment";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { StatBox } from "../../components";
import { GeographyChart } from "../../components";

import api from "../../utils/api";

import { useRef } from "react";


const AdminDashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const dashboardRef = useRef(null);

  const [userAdded, setUserAdded] = useState(0);
  const [organizationcount, setOrganizationcount] = useState(0);
  const [countBanker, setCountBanker] = useState(0);
  const [orgList, setOrgList] = useState([]);
  const [userType, setUserType] = useState([]);
  const [cbhiProvider, setCbhiProvider] = useState(0);

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 7);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const collectionnStartDate = new Date(today);
  collectionnStartDate.setDate(today.getDate() - 30);
  // Fetch uncollected data
  useEffect(() => {
    const fetchUserList = async () => {
      const response = await api.get("/Admin/users");

      const data = response?.data;

      const summary = data.reduce((acc, user) => {
        const { userType } = user;
        acc[userType] = (acc[userType] || 0) + 1;
        return acc;
      }, {});

      const totalUser = Object.values(summary).reduce(
        (acc, total) => acc + total,
        0
      );

      const barData = Object.entries(summary).map(([key, value]) => ({
        type: key,
        No_of_User: value,
      }));

      setUserAdded(totalUser);

      setUserType(barData);
    };

    fetchUserList();
  }, []);

  useEffect(() => {
    const fetchOrganization = async () => {
      const response = await api.get("/Organiztion/Organization");

      const data = response?.data;

      const totalOrganization = data.length;

      setOrganizationcount(totalOrganization);
      setOrgList(data);
    };

    fetchOrganization();
  }, []);

  useEffect(() => {
    const fetchBanker = async () => {
      const response = await api.get("/Organiztion/get-workers");

      const data = response?.data;

      const countBanker = data?.length;

      setCountBanker(countBanker);
    };

    fetchBanker();
  }, []);



  useEffect(() => {
    const fetchCBHI = async () => {
      const response = await api.get("/Providers/list-providers");

      const data = response?.data;

      const totalProvider = new Set(data.map((item) => item.provider)).size;

      setCbhiProvider(totalProvider);
    };

    fetchCBHI();
  }, []);

  return (
    <>
      <div ref={dashboardRef} style={{ padding: "20px" }}>
        <h1>Welcome to Admin Dashboard</h1>

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={4}
        ></Box>
        <Box
          display="grid"
          gridTemplateColumns="repeat(12, 1fr)"
          gridAutoRows="140px"
          gap="20px"
        >
          {/* ROW 1 - STAT CARDS */}
          {[
            {
              title: userAdded || 0,
              subtitle: "No of User Added",
              icon: (
                <PersonAddIcon
                  sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
                />
              ),
            },
            {
              title: organizationcount,
              subtitle: "Total Organization Count",
              icon: (
                <ApartmentIcon
                  sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
                />
              ),
            },
            {
              title: countBanker,
              subtitle: "Total Banker ",
              icon: (
                <AccountBalanceIcon
                  sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
                />
              ),
            },
            {
              title: cbhiProvider,
              subtitle: "Number of Provider",
              icon: (
                <ApartmentIcon
                  sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
                />
              ),
            },
          ].map((stat, index) => (
            <Box
              key={index}
              gridColumn="span 3"
              backgroundColor={colors.primary[400]}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <StatBox
                title={stat.title}
                subtitle={stat.subtitle}
                progress={stat.progress}
                increase={stat.increase}
                icon={stat.icon}
              />
            </Box>
          ))}
          <Box
            gridColumn="span 4"
            gridRow="span 2"
            backgroundColor={colors.primary[400]}
            overflow="auto"
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              p="15px"
            >
              <Typography
                color={colors.grey[100]}
                variant="h5"
                fontWeight="600"
              >
                Organization list with Proper Location
              </Typography>
            </Box>

            <Box
              display="flex"
              justifyContent="space-between"
              p="10px 15px"
              borderBottom={`2px solid ${colors.primary[500]}`}
            >
              <Typography
                color={colors.greenAccent[500]}
                fontWeight="600"
                width="50%"
              >
                Organization
              </Typography>
              <Typography
                color={colors.greenAccent[500]}
                fontWeight="600"
                width="50%"
              >
                Location
              </Typography>
            </Box>

            {orgList.map((org, i) => (
              <Box
                key={`${org.organization}-${i}`}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                p="10px 15px"
                sx={{
                  "&:hover": {
                    backgroundColor: colors.greenAccent[900],
                  },
                }}
              >
                <Typography color={colors.greenAccent[500]} width="50%">
                  {org.organization}
                </Typography>

                <Typography
                  color={colors.greenAccent[500]}
                  fontWeight="600"
                  width="50%"
                >
                  {org.location}
                </Typography>
              </Box>
            ))}
          </Box>
          <Box
            gridColumn="span 4"
            gridRow="span 2"
            backgroundColor={colors.primary[400]}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              p="15px"
            >
              <Typography
                color={colors.grey[100]}
                variant="h5"
                fontWeight="600"
              >
                UserType by No User
              </Typography>
            </Box>

            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={userType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={"type"} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="type" fill="#8884d8" />
                <Bar dataKey="No_of_User" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Box>

          <Box
            gridColumn="span 4"
            gridRow="span 2"
            backgroundColor={colors.primary[400]}
            padding="30px"
          >
            <Typography variant="h5" fontWeight="600" color={colors.grey[100]}>
              Geography Based Traffic
            </Typography>
            <Box height="200px" mt="10px">
              <GeographyChart isDashboard={true} />
            </Box>
          </Box>
        </Box>
      </div>
    </>
  );
};

export default AdminDashboard;
