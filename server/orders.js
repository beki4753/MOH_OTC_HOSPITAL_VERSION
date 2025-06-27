// routes/orders.js
const express = require("express");
const api = require("./api");
const db = require("./db");
const router = express.Router();

const normalizeText = (input = "", options = {}) => {
  const { removePunctuation = false, keepSpaces = true } = options;
  return input
    .normalize("NFC")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(removePunctuation ? /[^\w\s]|_/g : "", "")
    .replace(/\s+/g, keepSpaces ? " " : "")
    .trim();
};

router.post("/orders", async (req, res) => {
  try {
    const { cardNumber, orderType } = req.body;
    if (!cardNumber || !orderType) {
      return res
        .status(400)
        .json({ error: "cardNumber and orderType are required" });
    }

    // 1. Find patient by card number
    const patientRes = await api.get("/patient", {
      params: {
        identifier: cardNumber,
        searchType: "card",
        v: "full",
      },
    });
    const patient = patientRes.data.results[0];
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    const patientUuid = patient.uuid;

    // 2. Find order type UUID
    const orderTypeRes = await api.get("/ordertype");
    const matchedOrderType = orderTypeRes.data.results.find(
      (type) => normalizeText(type.display) === normalizeText(orderType)
    );
    if (!matchedOrderType)
      return res.status(404).json({ error: "Order type not found" });

    // 3. Fetch orders for that patient
    const ordersRes = await api.get(`/order`, {
      params: {
        patientUuid,
        orderTypeUuid: matchedOrderType.uuid,
        v: "full",
      },
    });

    const orders = ordersRes.data.results;
    await db.poolConnect;

    // 4. Enrich each order with price info
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const conceptUuid = order?.concept?.uuid;

        const request = db.pool.request();
        request.input("uuid", db.sql.VarChar, conceptUuid);
        const result = await request.execute(`SP_FETCHBYUUID`);

        const totalPrice = result.recordset[0]?.Amount || 0;

        return {
          ...order,
          price: totalPrice,
        };
      })
    );

    if (enrichedOrders?.length) {
      const maxDate = enrichedOrders.reduce((max, order) => {
        const orderDate = new Date(order.dateActivated);
        return orderDate > max ? orderDate : max;
      }, new Date(0));

      const latestOrders = enrichedOrders.filter(
        (order) => new Date(order.dateActivated).getTime() === maxDate.getTime()
      );

      res.json({ orders: latestOrders });
    } else {
      res.json({ orders: [] });
    }
  } catch (error) {
    console.error("Orders API Error:", error.message);
    res.status(500).json({
      error: "Failed to fetch or enrich orders",
      details: error.message,
    });
  }
});

module.exports = router;
