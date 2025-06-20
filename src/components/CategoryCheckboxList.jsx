import React from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Divider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
} from "@mui/material";

const CategoryCheckboxList = ({ selectedRow, setSelectedRow, theme }) => {
  if (!selectedRow) return null;

  const checkboxColor =
    theme.palette.mode === "light"
      ? theme.palette.primary.main
      : theme.palette.secondary.main;

  const handleCheckboxChange = (index, isChecked) => {
    const updatedCategories = selectedRow.requestedCatagories.map((cat, i) =>
      i === index ? { ...cat, isPaid: isChecked } : cat
    );

    setSelectedRow((prev) => ({
      ...prev,
      requestedCatagories: updatedCategories,
    }));
  };

  return (
    <Card
      sx={{
        mb: 2,
        p: 2,
        backgroundColor:
          theme.palette.mode === "light"
            ? "background.paper"
            : "background.default",
      }}
    >
      <CardHeader
        title="Requested Categories"
        sx={{
          backgroundColor:
            theme.palette.mode === "light"
              ? "#f5f5f5"
              : theme.palette.grey[700],
          textAlign: "center",
        }}
      />
      <Divider />
      <CardContent>
        {selectedRow.requestedCatagories?.length === 0 ? (
          <Typography color="text.secondary" align="center">
            No categories found.
          </Typography>
        ) : (
          <Box
            sx={{
              maxHeight: 300,
              overflowY: "auto",
              pr: 1,
            }}
          >
            <FormGroup>
              {selectedRow.requestedCatagories.map((item, index) => (
                <FormControlLabel
                  key={item.groupID}
                  control={
                    <Checkbox
                      checked={!!item.isPaid}
                      onChange={(e) =>
                        handleCheckboxChange(index, e.target.checked)
                      }
                      sx={{
                        color: checkboxColor,
                        "&.Mui-checked": {
                          color: checkboxColor,
                        },
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ fontWeight: 500 }}>
                      {item.purpose}
                    </Typography>
                  }
                />
              ))}
            </FormGroup>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryCheckboxList;
