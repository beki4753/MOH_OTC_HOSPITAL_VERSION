import React, { useState, useMemo } from "react";
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Stack,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

// Sample data
const rows = [
  { id: 1, name: "John", age: 25 },
  { id: 2, name: "Alice", age: 30 },
  { id: 3, name: "Bob", age: 20 },
  { id: 4, name: "Eve", age: 35 },
];

// Columns
const columns = [
  { field: "id", headerName: "ID", width: 70 },
  { field: "name", headerName: "Name", width: 150 },
  { field: "age", headerName: "Age", width: 100 },
];

// Filter options
const filterOptions = [
  { label: "Equal to", value: "=" },
  { label: "Greater than", value: ">" },
  { label: "Less than", value: "<" },
  { label: "Greater or equal", value: ">=" },
  { label: "Less or equal", value: "<=" },
  { label: "Not equal", value: "!=" },
  { label: "Between", value: "between" },
];

export default function FriendlyAgeFilterDataGrid() {
  const [operator, setOperator] = useState("=");
  const [filterAge, setFilterAge] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");

  const filteredRows = useMemo(() => {
    const parsedAge = parseInt(filterAge);
    const min = parseInt(minAge);
    const max = parseInt(maxAge);

    if (operator === "between") {
      if (isNaN(min) || isNaN(max)) return rows;
      return rows.filter((row) => row.age >= min && row.age <= max);
    }

    if (isNaN(parsedAge)) return rows;

    return rows.filter((row) => {
      switch (operator) {
        case ">":
          return row.age > parsedAge;
        case "<":
          return row.age < parsedAge;
        case "=":
          return row.age === parsedAge;
        case ">=":
          return row.age >= parsedAge;
        case "<=":
          return row.age <= parsedAge;
        case "!=":
          return row.age !== parsedAge;
        default:
          return true;
      }
    });
  }, [operator, filterAge, minAge, maxAge]);

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2} alignItems="center" mb={2}>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Filter Type</InputLabel>
            <Select
              value={operator}
              label="Filter Type"
              onChange={(e) => setOperator(e.target.value)}
            >
              {filterOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {operator === "between" ? (
          <>
            <Grid item xs={6} sm={4}>
              <TextField
                label="Min Age"
                type="number"
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField
                label="Max Age"
                type="number"
                value={maxAge}
                onChange={(e) => setMaxAge(e.target.value)}
                fullWidth
              />
            </Grid>
          </>
        ) : (
          <Grid item xs={12} sm={4}>
            <TextField
              type="number"
              label="Age"
              value={filterAge}
              onChange={(e) => setFilterAge(e.target.value)}
              fullWidth
            />
          </Grid>
        )}
      </Grid>

      <DataGrid
        rows={filteredRows}
        columns={columns}
        autoHeight
        pageSize={5}
        rowsPerPageOptions={[5]}
      />
    </Box>
  );
}
