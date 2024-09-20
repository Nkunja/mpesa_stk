/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; 

function App() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getAccessToken();
  }, []);

  const getAccessToken = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await axios.get(`${API_BASE_URL}/access-token`);
      setAccessToken(response.data.access_token);
      console.log(accessToken);
    } catch (error) {
      console.error("Error getting access token:", error);
      setError("Failed to get access token. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const parsePhoneNumber = (input: any) => {
    // Remove any non-digit characters
    const digits = input.replace(/\D/g, '');
    
    if (digits.length === 9 && digits.startsWith('7')) {
      return `254${digits}`;
    } else if (digits.length === 10 && digits.startsWith('07')) {
      return `254${digits.slice(1)}`;
    } else if (digits.length === 12 && digits.startsWith('254')) {
      return digits;
    } else {
      throw new Error("Invalid phone number format");
    }
  };

  const handlePhoneNumberChange = (e: any) => {
    setPhoneNumber(e.target.value);
  };

  const initiatePayment = async () => {
    if (!phoneNumber || !amount) {
      setError("Please enter both phone number and amount.");
      return;
    }

    try {
      const parsedPhoneNumber = parsePhoneNumber(phoneNumber);
      setIsLoading(true);
      setError("");
      setPaymentStatus("Initiating payment...");

      const response = await axios.post(`${API_BASE_URL}/initiate-payment`, {
        phoneNumber: parsedPhoneNumber,
        amount: parseInt(amount),
      });
      setPaymentStatus("Payment initiated. Waiting for confirmation...");
      // Add a delay before checking the status
      setTimeout(
        () => checkPaymentStatus(response.data.CheckoutRequestID),
        10000
      );
    } catch (error: any) {
      console.error("Error initiating payment:", error);
      setError(error.message === "Invalid phone number format" 
        ? "Invalid phone number format. Please use 0712345678, or 254712345678." 
        : "Payment initiation failed. Please try again.");
      setPaymentStatus("");
    } finally {
      setIsLoading(false);
    }
  };

  const checkPaymentStatus = async (CheckoutRequestID: string, retries = 3) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await axios.post(
        `${API_BASE_URL}/check-payment-status`,
        {
          CheckoutRequestID,
        }
      );
      if (response.data.ResultCode === "0") {
        setPaymentStatus("Payment successful");
      } else if (response.data.ResultCode === "None" && retries > 0) {
        // If status is not yet available, retry after a delay
        setPaymentStatus("Payment processing. Checking status again...");
        setTimeout(
          () => checkPaymentStatus(CheckoutRequestID, retries - 1),
          5000
        );
      } else {
        setPaymentStatus(`Payment failed: ${response.data.ResultDesc}`);
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
      if (retries > 0) {
        // If there's an error, retry after a delay
        setPaymentStatus("Error checking status. Retrying...");
        setTimeout(
          () => checkPaymentStatus(CheckoutRequestID, retries - 1),
          5000
        );
      } else {
        setError(
          "Failed to check payment status. Please check your M-Pesa app or SMS for confirmation."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-semibold text-center mb-6">
              M-Pesa Payment
            </h1>
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <div className="relative">
                  <input
                    id="phoneNumber"
                    type="text"
                    className="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:border-rose-600"
                    placeholder="Phone Number"
                    value={phoneNumber}
                    onChange={handlePhoneNumberChange}
                  />
                  <label
                    htmlFor="phoneNumber"
                    className="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-2 transition-all peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
                  >
                    Phone Number 
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="amount"
                    type="number"
                    className="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:border-rose-600"
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <label
                    htmlFor="amount"
                    className="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-2 transition-all peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
                  >
                    Amount (KES)
                  </label>
                </div>
                <div className="relative">
                  <button
                    onClick={initiatePayment}
                    disabled={isLoading}
                    className="bg-blue-500 text-white rounded-md px-4 py-2 w-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Processing..." : "Pay with M-Pesa"}
                  </button>
                </div>
              </div>
            </div>
            {error && <p className="mt-2 text-red-600">{error}</p>}
            {paymentStatus && (
              <p className="mt-2 text-blue-600">{paymentStatus}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;