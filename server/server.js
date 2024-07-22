const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const CONSUMER_KEY = process.env.CONSUMER_KEY;
const CONSUMER_SECRET = process.env.CONSUMER_SECRET;
const SHORTCODE = process.env.SHORTCODE;
const PASSKEY = process.env.PASSKEY;

const getAccessToken = async () => {
  try {
    const url =
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString(
      "base64"
    );
    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
    return response.data.access_token;
  } catch (error) {
    console.error("Error getting access token:", error);
    throw error;
  }
};

app.get("/access-token", async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    res.json({ access_token: accessToken });
  } catch (error) {
    res.status(500).json({ error: "Failed to get access token" });
  }
});

app.post("/initiate-payment", async (req, res) => {
  try {
    const { phoneNumber, amount } = req.body;
    const accessToken = await getAccessToken();

    const url =
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
    const date = new Date();
    const timestamp =
      date.getFullYear() +
      ("0" + (date.getMonth() + 1)).slice(-2) +
      ("0" + date.getDate()).slice(-2) +
      ("0" + date.getHours()).slice(-2) +
      ("0" + date.getMinutes()).slice(-2) +
      ("0" + date.getSeconds()).slice(-2);
    const password = Buffer.from(SHORTCODE + PASSKEY + timestamp).toString(
      "base64"
    );

    const data = {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: SHORTCODE,
      PhoneNumber: phoneNumber,
      CallBackURL: "https://your-callback-url.com/callback",
      AccountReference: "CompanyXLTD",
      TransactionDesc: "Payment of X",
    };

    const response = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error initiating payment:", error);
    res.status(500).json({ error: "Failed to initiate payment" });
  }
});

app.post("/check-payment-status", async (req, res) => {
  try {
    const { CheckoutRequestID } = req.body;
    const accessToken = await getAccessToken();

    const url = "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query";
    const date = new Date();
    const timestamp =
      date.getFullYear() +
      ("0" + (date.getMonth() + 1)).slice(-2) +
      ("0" + date.getDate()).slice(-2) +
      ("0" + date.getHours()).slice(-2) +
      ("0" + date.getMinutes()).slice(-2) +
      ("0" + date.getSeconds()).slice(-2);
    const password = Buffer.from(SHORTCODE + PASSKEY + timestamp).toString(
      "base64"
    );

    const data = {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID,
    };

    const response = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error checking payment status:", error);
    res.status(500).json({ error: "Failed to check payment status" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
