import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { CustomerPageHeader } from "./CustomerCases";

// const API_BASE_URL = "http://localhost:8081";
import API_BASE_URL from "../api/api";

export default function Payment() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

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
            setMessage(t("payment.messages.cancelled"));
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
                setError(t("payment.errors.missingPaymentDetails"));
                captureStarted.current = false;
                return;
            }

            setLoading(true);
            setError("");
            setMessage(t("payment.messages.confirming"));

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
                        t("payment.errors.confirmationFailed", {
                            status: response.status,
                        })
                    );
                }

                if (
                    !["SUCCESS", "COMPLETED"].includes(
                        String(data.status || "").toUpperCase()
                    )
                ) {
                    throw new Error(
                        t("payment.errors.notCompleted")
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
                    t("payment.errors.confirmationUnavailable")
                );
                setMessage("");
                captureStarted.current = false;
            } finally {
                setLoading(false);
            }
        }

        capturePayment();
    }, [paypalOrderId, paypalCancelled, navigate, t]);

    async function handlePayment() {
        if (!caseId) {
            setError(t("payment.errors.missingCaseId"));
            return;
        }

        // Don't create another order while handling a PayPal return.
        if (paypalOrderId && !paypalCancelled) {
            setError(t("payment.errors.orderProcessing"));
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
                    t("payment.errors.checkoutFailed", {
                        status: response.status,
                    })
                );
            }

            if (
                !data.approvalUrl ||
                !data.paypalOrderId ||
                !data.paymentId
            ) {
                throw new Error(
                    t("payment.errors.missingOrderDetails")
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
                t("payment.errors.startFailed")
            );
            setLoading(false);
        }
    }

    const isReturningFromPayPal = Boolean(paypalOrderId);

    return (
        <>
            <CustomerPageHeader
                title={t("payment.title")}
                activeTab=""
            />

            <main className="payment-page">
                <section className="payment-card">

                    <p className="payment-eyebrow">
                        {t("payment.eyebrow")}
                    </p>

                    <h1>
                        {loading && isReturningFromPayPal
                            ? t("payment.confirmingTitle")
                            : t("payment.completeTitle")}
                    </h1>

                    <p className="payment-description">
                        {t("payment.description")}
                    </p>

                    <div className="payment-amount">
                        <span>{t("payment.serviceFee")}</span>
                        <strong>SEK 99.00</strong>
                    </div>

                    {caseId ? (
                        <p className="payment-case-id">
                            {t("payment.caseId")}: <strong>{caseId}</strong>
                        </p>
                    ) : (
                        <p className="payment-error">
                            {t("payment.errors.missingCaseIdDescription")}
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
                            {t("payment.pleaseWait")}
                        </p>
                    ) : (
                        <button
                            type="button"
                            className="payment-button"
                            onClick={handlePayment}
                            disabled={
                                !caseId ||
                                (isReturningFromPayPal && !paypalCancelled)
                            }
                        >
                            {isReturningFromPayPal && !paypalCancelled
                                ? t("payment.confirmationInProgress")
                                : paypalCancelled || error
                                    ? t("payment.tryAgain")
                                    : t("payment.payButton")}
                        </button>
                    )}

                    <p className="payment-note">
                        {t("payment.sandboxNote")}
                    </p>
                </section>
            </main>
        </>
    );
}