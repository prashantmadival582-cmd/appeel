
package com.example._justice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateOrderResponse {

    // Internal payment record ID
    private String paymentId;

    // PayPal order ID
    private String paypalOrderId;

    // URL where the customer approves the payment
    private String approvalUrl;

    // Payment amount, e.g. 99.00
    private String amount;

    // Payment currency, e.g. SEK
    private String currency;
}
