import { checkoutHandler, merchantFromEnv } from "../_shared/payments.ts";
import { serverClient } from "../_shared/runtime.ts";
Deno.serve(req => {
  const admin = serverClient();
  return checkoutHandler(req,{
    allowedOrigins:["https://tader68.github.io","http://127.0.0.1:4173","http://127.0.0.1:5173",...((Deno.env.get("CHECKOUT_EXTRA_ORIGINS") || "").split(",").filter(Boolean))],
    enabled:Deno.env.get("CHECKOUT_ENABLED") === "true",
    merchant:merchantFromEnv(key=>Deno.env.get(key)),
    verifyUser:async token => {
      const {data,error} = await admin.auth.getUser(token);
      return error ? null : data.user?.id || null;
    },
    createOrder:async (userId,sku,merchant) => {
      const {data,error} = await admin.rpc("create_checkout_order",{p_user_id:userId,p_sku:sku,p_bank_code:merchant.bankCode,p_bank_gateway:merchant.bankGateway,p_account_number:merchant.accountNumber,p_account_name:merchant.accountName,p_support_email:merchant.supportEmail});
      if (error) throw error;
      return data;
    },
    latestOrder:async (userId,sku) => {
      const {data,error} = await admin.from("commerce_orders").select("*").eq("user_id",userId).eq("sku",sku).order("created_at",{ascending:false}).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
});
