import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import paystack from "paystack";
import Flutterwave from "flutterwave-node-v3";

const paystackClient = paystack(process.env.PAYSTACK_SECRET_KEY!);
const flutterwaveClient = new Flutterwave(process.env.FLUTTERWAVE_PUBLIC_KEY!, process.env.FLUTTERWAVE_SECRET_KEY!);

const plans = {
  "Pro": 1000, // in kobo for Paystack, assuming NGN for Flutterwave
  "Pro+": 2500, // in kobo for Paystack, assuming NGN for Flutterwave
};

export async function POST(request: Request) {
  const { plan, provider } = await request.json();
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  if (!plan || !provider) {
    return NextResponse.json({ error: "Missing plan or provider" }, { status: 400 });
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const price = plans[plan as keyof typeof plans];
  if (!price) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  if (provider === "paystack") {
    const response = await paystackClient.transaction.initialize({
      amount: price,
      email: user.email!,
      metadata: {
        userId: user.id,
        plan,
      },
    });

    return NextResponse.json({ paymentUrl: response.data.authorization_url });
  } else if (provider === "flutterwave") {
    try {
      const response = await flutterwaveClient.Payment.getLink({
        tx_ref: `tx-${Date.now()}`,
        amount: price / 100, // Flutterwave expects amount in major currency unit
        currency: "NGN",
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-status`,
        customer: {
          email: user.email!,
          name: user.email!,
        },
        customizations: {
          title: "Sokarr.ai Subscription",
          description: `Payment for ${plan} plan`,
        },
        meta: {
          userId: user.id,
          plan,
        }
      });
      return NextResponse.json({ paymentUrl: response.data.link });
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: "Failed to create Flutterwave payment link" }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }
}
