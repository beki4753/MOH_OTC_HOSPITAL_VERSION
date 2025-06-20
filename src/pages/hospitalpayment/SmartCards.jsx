import React from "react";
import { Card, CardContent, Typography, Grid } from "@mui/material";

// Sample data (can be fetched dynamically)
{/*const data = [
  { title: "Revenue", amount: 1250000 },
  { title: "Expenses", amount: -450000 },
  { title: "Profit", amount: 800000 },
  { title: "Loss", amount: -150000 },
];
*/}
const formatter = new Intl.NumberFormat('en-us',{
  style: 'currency',
  currency:'ETB',
  minimumFractionDigits:2,
})

const formatAccounting = (num)=>{
  const formatted = formatter.format(Math.abs(num));
  return num <0 ? `(${formatted})`: formatted;
}

const SmartCards = ({data}) => {
  return (
    <Grid container spacing={2} justifyContent="center">
      {data&& data.map((item, index) => (
        <Grid item key={index}>
          <Card
            sx={{
              minWidth: 180,
              maxWidth: "100%",
              textAlign: "center",
              background: item.amount < 0 ? "#ffebee" : "#e8f5e9", // Light Red for negative, Light Green for positive
              borderLeft: `5px solid ${item.amount < 0 ? "#d32f2f" : "#2e7d32"}`, // Strong Red/Green Border
              boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
              transition: "transform 0.2s",
              "&:hover": { transform: "scale(1.05)" },
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                {item.method}
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: "bold",
                  color: item.amount < 0 ? "#d32f2f" : "#2e7d32",
                }}
              >
                {formatAccounting(item.amount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default SmartCards;
