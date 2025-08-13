// supabase/functions/invoice-notify/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  try {
    console.log("Webhook received at:", new Date().toISOString());
    
    // Skip auth check for database triggers
    // In production, you might want to add a secret token check
    
    // Parse the payload
    const payload = await req.json();
    console.log("Invoice webhook payload:", JSON.stringify(payload, null, 2));
    
    // Extract invoice details
    const { id, invoice_number, amount, client, supplier, created_at } = payload;
    console.log(`Processing invoice ${invoice_number} for amount ${amount}`);
    
    // TODO: Add logic to look up approvers and send emails
    // For now, just log that we would send emails
    console.log(`Would send notification emails for invoice ${invoice_number}`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Webhook processed successfully",
      invoice_id: id
    }), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});