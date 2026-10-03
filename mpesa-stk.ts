// Deploy: supabase functions deploy mpesa-stk --no-verify-jwt
// Secrets: MPESA_KEY MPESA_SECRET MPESA_SHORTCODE MPESA_PASSKEY MPESA_ENV(live|sandbox)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const sb=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"};
const base=Deno.env.get("MPESA_ENV")==="live"?"https://api.safaricom.co.ke":"https://sandbox.safaricom.co.ke";
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 const b=await req.json();
 if(b.Body?.stkCallback){const c=b.Body.stkCallback;
  await sb.from("payments").update({status:c.ResultCode===0?"paid":"failed",result:c.ResultDesc}).eq("checkout_id",c.CheckoutRequestID);
  return new Response("ok");}
 let phone=String(b.phone).replace(/\D/g,"");phone=phone.startsWith("0")?"254"+phone.slice(1):phone;
 const amount=Math.max(1,Math.round(b.amount)),short=Deno.env.get("MPESA_SHORTCODE")!;
 const tok=(await (await fetch(base+"/oauth/v1/generate?grant_type=client_credentials",{headers:{Authorization:"Basic "+btoa(Deno.env.get("MPESA_KEY")+":"+Deno.env.get("MPESA_SECRET"))}})).json()).access_token;
 const ts=new Date().toISOString().replace(/\D/g,"").slice(0,14);
 const r=await (await fetch(base+"/mpesa/stkpush/v1/processrequest",{method:"POST",headers:{Authorization:"Bearer "+tok,"Content-Type":"application/json"},
  body:JSON.stringify({BusinessShortCode:short,Password:btoa(short+Deno.env.get("MPESA_PASSKEY")+ts),Timestamp:ts,TransactionType:"CustomerPayBillOnline",Amount:amount,PartyA:phone,PartyB:short,PhoneNumber:phone,
  CallBackURL:Deno.env.get("SUPABASE_URL")+"/functions/v1/mpesa-stk",AccountReference:"SunriseFarm",TransactionDesc:String(b.ref||"Deposit")})})).json();
 if(r.CheckoutRequestID)await sb.from("payments").insert({checkout_id:r.CheckoutRequestID,phone,amount,animal_name:b.ref,status:"pending"});
 return new Response(JSON.stringify(r),{headers:{...cors,"Content-Type":"application/json"}});
});
