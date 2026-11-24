
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

const API_BASE_URL = "http://localhost:8081";

export default function ExternalInvoicePayment() {
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const paypalOrderId = params.get("token");
  const paypalCancelled = params.get("paypal") === "cancel";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const captureStarted = useRef(false);

  useEffect(() => {
    if (paypalCancelled) {
      setMessage("Your payment was cancelled. You can return to the invoice email and try again.");
      return;
    }

    if (!paypalOrderId || captureStarted.current) {
      return;
    }

    captureStarted.current = true;

    async function capturePayment() {
      setLoading(true);
      setError("");
      setMessage("Verifying your PayPal payment. Please wait...");

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/external-invoices/capture`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              paypalOrderId,
            }),
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message ||
            data.error ||
            `Payment verification failed (${response.status}).`
          );
        }

        if (String(data.status || "").toUpperCase() !== "SUCCESS") {
          throw new Error("PayPal has not confirmed this payment yet.");
        }

        setMessage(
          "Payment successful! Your external invoice has been paid. APPEEL has received your payment confirmation."
        );
      } catch (err) {
        setError(
          err.message ||
          "We could not verify your payment. Please contact APPEEL Support."
        );
        setMessage("");
        captureStarted.current = false;
      } finally {
        setLoading(false);
      }
    }

    capturePayment();
  }, [paypalOrderId, paypalCancelled]);

  return (
    <main className="payment-page">
      <section className="payment-card">
        <p className="payment-eyebrow">APPEEL EXTERNAL INVOICE</p>

        <h1>
          {loading
            ? "Confirming Your Payment"
            : paypalCancelled
              ? "Payment Cancelled"
              : paypalOrderId
                ? error
                  ? "Payment Verification"
                  : "Payment Status"
                : "External Invoice Payment"}
        </h1>

        <p className="payment-description">
          Thank you for choosing APPEEL. This page confirms payments made
          against your external invoice through PayPal.
        </p>

        {message && (
          <p className="payment-note" role="status">
            {message}
          </p>
        )}

        {error && (
          <p className="payment-error" role="alert">
            {error}
          </p>
        )}

        {loading && (
          <p className="payment-note">
            Please do not close this page while we verify your payment.
          </p>
        )}

        {!paypalOrderId && !paypalCancelled && (
          <p className="payment-error">
            No PayPal order was found. Please open the payment link from
            your APPEEL invoice email.
          </p>
        )}

        {error && (
          <p className="payment-note">
            If you have already completed payment, please contact APPEEL
            Support with your invoice email.
          </p>
        )}

        <p className="payment-note">
          Secure payment verification powered by PayPal.
        </p>
      </section>
    </main>
  );
}
