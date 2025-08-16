import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const secretHash = process.env.FLUTTERWAVE_SECRET_HASH!;
  const signature = request.headers.get("verif-hash");

  if (signature !== secretHash) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = await request.json();

  if (event.event === "charge.completed" && event.data.status === "successful") {
    const { email } = event.data.customer;
    const { plan } = event.data.meta;
    const { id: providerSubscriptionId } = event.data;

    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: user, error } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { error: subscriptionError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: user.id,
        plan,
        status: "active",
        provider: "flutterwave",
        provider_subscription_id: providerSubscriptionId,
        start_date: new Date(),
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      });

    if (subscriptionError) {
      return NextResponse.json({ error: subscriptionError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
