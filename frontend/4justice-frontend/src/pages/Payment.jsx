
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";


import { CustomerPageHeader } from "./CustomerCases";

const API_BASE_URL = "http://localhost:8081";

export default function Payment() {
    const navigate = useNavigate();
    const location = useLocation();

    const params = new URLSearchParams(location.search);
    const paypalOrderId = params.get("token");
    const paypalCancelled = params.get("paypal") === "cancel";

    const caseId =
        location.state?.caseId ||
        sessionStorage.getItem("currentCaseId");

    const customerEmail =
        location.state?.customerEmail ||
        sessionStorage.getItem("customerEmail") ||
        "";

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // Prevent duplicate capture calls during this component's lifetime.
    const captureStarted = useRef(false);

    function authHeaders() {
        const token =
            localStorage.getItem("customerToken") ||
            localStorage.getItem("token");

        return {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
    }


    // Capture when PayPal returns an order token.
    useEffect(() => {
        if (paypalCancelled) {
            setError("");
            setMessage(
                "Payment was cancelled. You can return to PayPal when you're ready."
            );
            return;
        }

        if (!paypalOrderId || captureStarted.current) {
            return;
        }

        captureStarted.current = true;

        async function capturePayment() {
            const paymentId =
                sessionStorage.getItem("paypalPaymentId");

            const savedCaseId =
                sessionStorage.getItem("currentCaseId");

            if (!paymentId || !savedCaseId) {
                setError(
                    "Payment details are missing. Please return to your case and start checkout again."
                );
                captureStarted.current = false;
                return;
            }

            setLoading(true);
            setError("");
            setMessage("Confirming your payment with PayPal...");

            try {
                const response = await fetch(
                    `${API_BASE_URL}/api/payments/capture`,
                    {
                        method: "POST",
                        headers: authHeaders(),
                        body: JSON.stringify({
                            paymentId,
                            paypalOrderId,
                        }),
                    }
                );

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        data.error ||
                        `Payment confirmation failed (HTTP ${response.status}).`
                    );
                }

                if (
                    !["SUCCESS", "COMPLETED"].includes(
                        String(data.status || "").toUpperCase()
                    )
                ) {
                    throw new Error(
                        "PayPal has not confirmed a completed payment."
                    );
                }

                sessionStorage.removeItem("paypalPaymentId");

                navigate(`/customer/my-cases/${savedCaseId}`, {
                    replace: true,
                    state: {
                        paymentVerified: true,
                        caseId: savedCaseId,
                        paymentId,
                        paypalOrderId,
                        paypalCaptureId: data.paypalCaptureId || null,
                    },
                });
            } catch (err) {
                setError(
                    err.message ||
                    "Payment could not be confirmed. Please try again."
                );
                setMessage("");
                captureStarted.current = false;
            } finally {
                setLoading(false);
            }
        }

        capturePayment();
    }, [paypalOrderId, paypalCancelled, navigate]);


    async function handlePayment() {
        if (!caseId) {
            setError("Case ID is missing. Please return to your case.");
            return;
        }

        // Don't create another order while handling a PayPal return.
        if (paypalOrderId && !paypalCancelled) {
            setError(
                "A PayPal order is already being processed. Please reload this page to retry confirmation."
            );
            return;
        }

        setLoading(true);
        setError("");
        setMessage("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/payments/create`,
                {
                    method: "POST",
                    headers: authHeaders(),
                    body: JSON.stringify({ caseId }),
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    data.error ||
                    `Could not create or resume PayPal checkout (HTTP ${response.status}).`
                );
            }

            if (
                !data.approvalUrl ||
                !data.paypalOrderId ||
                !data.paymentId
            ) {
                throw new Error(
                    "The server did not return the required PayPal order details."
                );
            }

            sessionStorage.setItem("currentCaseId", caseId);
            sessionStorage.setItem("paypalPaymentId", data.paymentId);

            if (customerEmail) {
                sessionStorage.setItem("customerEmail", customerEmail);
            }

            // Redirect to the approval URL returned by the backend.
            window.location.assign(data.approvalUrl);
        } catch (err) {
            setError(
                err.message ||
                "Something went wrong while starting payment."
            );
            setLoading(false);
        }
    }

    const isReturningFromPayPal = Boolean(paypalOrderId);

    return (
        <>
        <CustomerPageHeader title="Payment" activeTab="" />
        <main className="payment-page">
            <section className="payment-card">
                
                <p className="payment-eyebrow">
                    APPEEL SECURE CHECKOUT
                </p>

                <h1>
                    {loading && isReturningFromPayPal
                        ? "Confirming Your Payment"
                        : "Complete Your Payment"}
                </h1>

                <p className="payment-description">
                    Pay the service fee securely using PayPal to continue
                    with your legal case.
                </p>

                <div className="payment-amount">
                    <span>Case service fee</span>
                    <strong>SEK 99.00</strong>
                </div>

                {caseId ? (
                    <p className="payment-case-id">
                        Case ID: <strong>{caseId}</strong>
                    </p>
                ) : (
                    <p className="payment-error">
                        Case ID is missing. Return to your case and try again.
                    </p>
                )}

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

                {loading ? (
                    <p className="payment-note">
                        Please wait...
                    </p>
                ) : (
                    <button
                        type="button"
                        className="payment-button"
                        onClick={handlePayment}
                        disabled={!caseId || (isReturningFromPayPal && !paypalCancelled)}
                    >
                        {isReturningFromPayPal && !paypalCancelled
                            ? "Payment Confirmation in Progress"
                            : paypalCancelled || error
                                ? "Try Payment Again"
                                : "Pay SEK 99.00 with PayPal"}
                    </button>
                )}

                <p className="payment-note">
                    Payments are processed through PayPal Sandbox during testing.
                </p>
            </section>
        </main>
        </>
    );
}
