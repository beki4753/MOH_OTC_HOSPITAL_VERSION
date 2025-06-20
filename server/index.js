const express = require("express");
const cors = require("cors");
const ordersRouter = require("./orders");
const api = require("./api.js");

const app = express();

// middle ware
app.use(
  cors({
    methods: ["POST", "GET"],
    origin: "*",
  })
);
app.use(express.json());

const handlePatientRequest = async (req, res) => {
  try {
    const { cardNumber } = req.body;
    const response = await api.get("/patient/", {
      params: {
        identifier: cardNumber,
        searchType: "card",
        v: "full",
      },
    });
    
    res.status(200).json(response.data);
  } catch (error) {
    console.error("API Error:", error.message);
    res.status(500).json({
      error: "Proxy request failed",
      details: error.message,
    });
  }
};

app.post("/change", handlePatientRequest);

app.use("/r", ordersRouter);

app.listen(5000, () => {
  console.log("Proxy server running on http://localhost:5000");
});
