import * as React from "react";
import {
  Box,
  Chip,
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  ListSubheader,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
} from "@mui/material";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;

/* ⛔  NO AUTO‑FOCUS  – we also disable the menu’s “auto‑focus first item”  */
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
  /* This stops MUI from focusing the first <MenuItem> automatically */
  MenuListProps: {
    autoFocusItem: false,
  },
};

const names = [
  "Oliver Hansen",
  "Van Henry",
  "April Tucker",
  "Ralph Hubbard",
  "Omar Alexander",
  "Carlos Abbott",
  "Miriam Wagner",
  "Bradley Wilkerson",
  "Virginia Andrews",
  "Kelly Snyder",
];

function SearchableList() {
  const [personName, setPersonName] = React.useState([]);
  const [searchText, setSearchText] = React.useState("");

  /* Handle chips / selection */
  const handleChange = (event) => {
    const {
      target: { value },
    } = event;
    setPersonName(typeof value === "string" ? value.split(",") : value);
  };

  /* Update search filter text */
  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
  };

  /* Simple client‑side filter */
  const filteredNames = names.filter((n) =>
    n.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <FormControl sx={{ m: 1, width: 300 }}>
      <InputLabel id="demo-multiple-checkbox-label">Tag</InputLabel>

      <Select
        labelId="demo-multiple-checkbox-label"
        id="demo-multiple-checkbox"
        multiple
        value={personName}
        onChange={handleChange}
        input={<OutlinedInput label="Tag" />}
        renderValue={(selected) => (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {selected.map((value) => (
              <Chip
                key={value}
                label={value}
                onMouseDown={(e) => e.stopPropagation()} // 🛑 Prevent Select toggle
                onDelete={(e) => {
                  e.stopPropagation(); // 🛑 Prevent Select toggle
                  setPersonName((prev) =>
                    prev.filter((item) => item !== value)
                  );
                }}
              />
            ))}
          </Box>
        )}
        MenuProps={MenuProps}
      >
        {/* 🔍 Search bar inside the dropdown */}
        <ListSubheader>
          <TextField
            fullWidth
            size="small"
            placeholder="Search…"
            value={searchText}
            onChange={handleSearchChange}
            /* Prevent *all* key events from bubbling up to <Select> */
            inputProps={{
              onKeyDown: (e) => e.stopPropagation(),
              onKeyUp: (e) => e.stopPropagation(),
              onKeyPress: (e) => e.stopPropagation(),
            }}
          />
        </ListSubheader>

        {filteredNames.map((name) => (
          <MenuItem key={name} value={name}>
            <Checkbox checked={personName.includes(name)} />
            <ListItemText primary={name} />
          </MenuItem>
        ))}

        {filteredNames.length === 0 && (
          <MenuItem disabled>No results found</MenuItem>
        )}
      </Select>
    </FormControl>
  );
}

export default SearchableList;
