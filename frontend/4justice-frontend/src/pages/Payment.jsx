
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { CustomerPageHeader } from "./CustomerCases";
import {
    customerRequest,
    isCustomerAuthError,
} from "../api/customerApi";

const PENDING_PAYMENT_KEY = "appeelPendingPayment";
const PENDING_SUBMISSION_KEY = "appeelPendingSubmission";

function readPendingPayment() {
    try {
        const saved = sessionStorage.getItem(PENDING_PAYMENT_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
}

export default function Payment() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    const params = new URLSearchParams(location.search);
    const paypalOrderId = params.get("token");
    const paypalCancelled = params.get("paypal") === "cancel";

    const [paymentDetails, setPaymentDetails] = useState(
        () => location.state || readPendingPayment()
    );

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // Prevent duplicate capture requests during this component's lifetime.
    const captureStarted = useRef(false);

    // Save payment details when arriving from StartCase.
    useEffect(() => {
        if (location.state?.paymentId) {
            setPaymentDetails(location.state);

            sessionStorage.setItem(
                PENDING_PAYMENT_KEY,
                JSON.stringify(location.state)
            );
        }
    }, [location.state]);

    // Verify the PayPal payment and create the case only after backend verification.
    async function confirmPayment() {
        if (captureStarted.current) {
            return;
        }

        if (!paymentDetails?.paymentId || !paypalOrderId) {
            setError(t("payment.errors.missingPaymentDetails"));
            return;
        }

        captureStarted.current = true;
        setLoading(true);
        setError("");
        setMessage(t("payment.messages.confirming"));

        try {
            const response = await customerRequest(
                "/api/payments/capture",
                {
                    method: "POST",
                    body: JSON.stringify({
                        paymentId: paymentDetails.paymentId,
                        paypalOrderId,
                    }),
                }
            );

            const data = await response.json();

            if (
                !["SUCCESS", "COMPLETED"].includes(
                    String(data.status || "").toUpperCase()
                )
            ) {
                throw new Error(
                    t("payment.errors.notCompleted")
                );
            }

            // The backend returns caseId only after verified payment.
            if (!data.caseId) {
                throw new Error(
                    t("payment.errors.missingPaymentDetails")
                );
            }

            // Clear temporary submission details after successful verification.
            sessionStorage.removeItem(PENDING_PAYMENT_KEY);
            sessionStorage.removeItem(PENDING_SUBMISSION_KEY);

            navigate(`/customer/my-cases/${data.caseId}`, {
                replace: true,
                state: {
                    paymentVerified: true,
                    caseId: data.caseId,
                    paymentId: paymentDetails.paymentId,
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

            if (isCustomerAuthError(err)) {
                navigate("/customer/login", {
                    replace: true,
                });
            }

            // Allow the customer to retry verification.
            captureStarted.current = false;
        } finally {
            setLoading(false);
        }
    }

    // Automatically verify when PayPal redirects back with its order token.
    useEffect(() => {
        if (paypalCancelled || !paypalOrderId) {
            return;
        }

        confirmPayment();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        paypalOrderId,
        paypalCancelled,
        paymentDetails?.paymentId,
    ]);

    // Retry or retrieve the pending PayPal order using the same submission key.
    async function retryPayment() {
        if (
            !paymentDetails?.caseType ||
            !paymentDetails?.description ||
            !paymentDetails?.submissionKey
        ) {
            setError(
                t("payment.errors.missingPaymentDetails")
            );
            return;
        }

        setLoading(true);
        setError("");
        setMessage("");

        try {
            const response = await customerRequest(
                "/api/payments/create",
                {
                    method: "POST",
                    body: JSON.stringify({
                        caseType: paymentDetails.caseType,
                        description: paymentDetails.description,
                        submissionKey: paymentDetails.submissionKey,
                    }),
                }
            );

            const data = await response.json();

            if (
                !data.paymentId ||
                !data.paypalOrderId ||
                !data.approvalUrl
            ) {
                throw new Error(
                    t("payment.errors.missingOrderDetails")
                );
            }

            const updatedDetails = {
                ...paymentDetails,
                paymentId: data.paymentId,
                paypalOrderId: data.paypalOrderId,
                approvalUrl: data.approvalUrl,
            };

            setPaymentDetails(updatedDetails);

            sessionStorage.setItem(
                PENDING_PAYMENT_KEY,
                JSON.stringify(updatedDetails)
            );

            // Continue to the PayPal approval page.
            window.location.assign(data.approvalUrl);
        } catch (err) {
            setError(
                err.message ||
                    t("payment.errors.startFailed")
            );

            if (isCustomerAuthError(err)) {
                navigate("/customer/login", {
                    replace: true,
                });
            }

            setLoading(false);
        }
    }

    function continueToPayPal() {
        if (paypalCancelled) {
            retryPayment();
            return;
        }

        if (paymentDetails?.approvalUrl) {
            window.location.assign(paymentDetails.approvalUrl);
            return;
        }

        setError(
            t("payment.errors.missingOrderDetails")
        );
    }

    const isReturningFromPayPal =
        Boolean(paypalOrderId) && !paypalCancelled;

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

                    {paypalCancelled && (
                        <p className="payment-note" role="status">
                            {t("payment.messages.cancelled")}
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
                    ) : isReturningFromPayPal ? (
                        error ? (
                            <button
                                type="button"
                                className="payment-button"
                                onClick={confirmPayment}
                            >
                                {t("payment.tryAgain")}
                            </button>
                        ) : (
                            <p className="payment-note">
                                {t("payment.confirmationInProgress")}
                            </p>
                        )
                    ) : (
                        <button
                            type="button"
                            className="payment-button"
                            onClick={continueToPayPal}
                            disabled={!paymentDetails?.paymentId}
                        >
                            {paypalCancelled || error
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
