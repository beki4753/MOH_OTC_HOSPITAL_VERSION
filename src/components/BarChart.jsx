import React, { useEffect, useState } from "react";
import { useTheme } from "@mui/material";
import { ResponsiveBar } from "@nivo/bar";
import { tokens } from "../theme";
import api from "../utils/api";
import { getTokenValue } from "../services/user_service";

const tokenvalue = getTokenValue();
const BarChart = ({ isDashboard = false }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 7);
  const [result, setResult] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.put("/Payment/Get-all-Payment", {
          startDate: startDate,
          endDate: today,
          user: tokenvalue?.name,
        });
      
        const summary = response?.data
          ? response?.data?.reduce((acc, payment) => {
              const { paymentType, paymentAmount } = payment;
              // const dateKey = new Date(createdOn).toISOString().split('T')[0];
              if (!acc[paymentType]) {
                acc[paymentType] = 0;
              }
              acc[paymentType] += parseFloat(paymentAmount);
              return acc;
            }, {})
          : [];
      

        const mapped =  Object.entries(summary).map(([key, value]) => ({
          method: key,
          amount: value,
        }));
        mapped.sort((a, b) => b.y - a.y);

        setResult(mapped);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchData();
  }, []);

  // If data hasn't loaded yet

  return (
    <ResponsiveBar
      data={result} // <-- Use the result directly
      indexBy="method" // <-- Use the x as category
      keys={["amount"]} // <-- y is the value we're plotting
      margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
      padding={0.3}
      theme={{
        axis: {
          domain: {
            line: {
              stroke: colors.grey[100],
            },
          },
          legend: {
            text: {
              fill: colors.grey[100],
            },
          },
          ticks: {
            line: {
              stroke: colors.grey[100],
              strokeWidth: 1,
            },
            text: {
              fill: colors.grey[100],
            },
          },
        },
        legends: {
          text: {
            fill: colors.grey[100],
          },
        },
      }}
      // colors={{ scheme: "nivo" }}
      colors={colors.greenAccent[500]}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: isDashboard ? undefined : "Payment Type",
        legendPosition: "middle",
        legendOffset: 32,
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: isDashboard ? undefined : "Amount",
        legendPosition: "middle",
        legendOffset: -40,
      }}
      legends={[
        {
          dataFrom: "keys",
          anchor: "bottom-right",
          direction: "column",
          justify: false,
          translateX: 120,
          translateY: 0,
          itemsSpacing: 2,
          itemWidth: 100,
          itemHeight: 20,
          itemDirection: "left-to-right",
          itemOpacity: 0.85,
          symbolSize: 20,
          effects: [
            {
              on: "hover",
              style: {
                itemOpacity: 1,
              },
            },
          ],
        },
      ]}
      role="application"
      barAriaLabel={function (e) {
        return e.id + ": " + e.formattedValue + " in category: " + e.indexValue;
      }}
    />
  );
};

export default BarChart;