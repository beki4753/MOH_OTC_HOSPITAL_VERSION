// orders.js
const express = require("express");
const api = require("./api");
const axios = require("axios");

const router = express.Router();

const normalizeText = (input, options = {}) => {
  const { removePunctuation = false, keepSpaces = true } = options;

  return (
    input
      // Normalize to NFC Unicode form
      .normalize("NFC")

      // Convert to lowercase
      .toLowerCase()

      // Remove diacritics (accents)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")

      // Remove punctuation if specified
      .replace(removePunctuation ? /[^\w\s]|_/g : "", "")

      // Replace multiple spaces with single space
      .replace(/\s+/g, keepSpaces ? " " : "")

      // Trim whitespace
      .trim()
  );
};

router.post("/orders", async (req, res) => {
  const { cardNumber, orderType } = req.body;

  if (!cardNumber || !orderType) {
    return res
      .status(400)
      .json({ error: "cardNumber and orderType are required" });
  }

  try {
    // Step 1: Get patient by card number
    const patientRes = await api.get("/patient", {
      params: {
        identifier: cardNumber,
        searchType: "card",
        v: "full",
      },
    });

    const patient = patientRes.data.results[0];
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const patientUuid = patient.uuid;

    // Step 2: Get order types list
    const orderTypeRes = await api.get("/ordertype");

    const matchedOrderType = orderTypeRes.data.results.filter(
      (type) => normalizeText(type.display) === normalizeText(orderType)
    );

    if (!matchedOrderType) {
      return res.status(404).json({ error: "Order type not found" });
    }

    // Step 3: Get orders for patient filtered by orderType
    const ordersRes = await api.get(`/order`, {
      params: {
        patientUuid: patientUuid,
        orderTypeUuid: matchedOrderType[0].uuid,
        v: "full",
      },
    });
    console.log({ orders: ordersRes.data.results });
    res.json({ orders: ordersRes.data.results });
  } catch (error) {
    console.error("Orders API Error:", error.message);
    res
      .status(500)
      .json({ error: "Failed to fetch orders", details: error.message });
  }
});

const getOrder = async () => {
  try {
    const orderTypeRes = await api.get("/ordertype");
    console.log("orderTypeRes: ", orderTypeRes?.data);
  } catch (error) {
    console.error(error);
  }
};

const getReq = async () => {
  try {
    const response = await axios.put(
      "http://10.113.14.75:1010/api/Patient/get-nurse-request-cashier",
      {
        headers: {
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoidGVzdDEiLCJqdGkiOiIyMDkxZDExZi1lNGU2LTRiODUtOGUxZC1mYTAxZTE3NmUwYTUiLCJVc2VyVHlwZSI6IkNhc2hpZXIiLCJEZXBhcnRlbWVudCI6Ikhvc3BpdGFsIiwiSG9zcGl0YWwiOiJEQiBSZWZlcnJhbCBIb3NwaXRhbCIsInVzZXJJZCI6ImEzNzE5NjZhLTdiNzYtNDk4ZC05Y2Q1LThkYWMxY2NmMTNjYSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IlVzZXIiLCJleHAiOjE3NTAzOTg4NjAsImlzcyI6IkZyZWVUcmFpbmVkIn0.VONjtSMHOKr2ZqrZEtyF7-evI0lomjsJxZcZLw0sDwE`,
        },
      }
    );

    console.log("This is response: ", response?.data);
  } catch (error) {
    console.log(error);
  }
};
// getReq();
//getOrder()

module.exports = router;
