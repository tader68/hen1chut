import { webhookHandler } from "../_shared/payments.ts";
import { serverClient } from "../_shared/runtime.ts";
Deno.serve(req => webhookHandler(req,{
  secret:Deno.env.get("SEPAY_WEBHOOK_SECRET"),
  settle:async payment => {
    const {data,error} = await serverClient().rpc("settle_checkout_payment",{p_transaction_id:payment.transactionId,p_payment_code:payment.code,p_amount_vnd:payment.amount,p_bank_paid_at:payment.paidAt,p_body_hash:payment.bodyHash,p_bank_gateway:payment.bankGateway,p_account_number:payment.accountNumber});
    if (error) throw error;
    return data;
  },
}));
