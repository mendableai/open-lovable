'use client';

import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function SubscriptionPlans() {
  const [loading, setLoading] = useState(false);

  const plans = [
    { name: "Pro", price: "$10/mo", features: ["100 messages/day", "Advanced AI model"] },
    { name: "Pro+", price: "$25/mo", features: ["Unlimited messages", "All AI models"] },
  ];

  const handleSubscribe = async (plan: string, provider: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, provider }),
      });

      const { paymentUrl } = await response.json();
      window.location.href = paymentUrl;
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center space-x-4 p-8">
      {plans.map((plan) => (
        <div key={plan.name} className="border rounded-lg p-6 w-64 text-center">
          <h2 className="text-2xl font-bold">{plan.name}</h2>
          <p className="text-4xl font-bold my-4">{plan.price}</p>
          <ul className="space-y-2">
            {plan.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col space-y-2">
            <Button onClick={() => handleSubscribe(plan.name, "paystack")} disabled={loading}>
              {loading ? "Processing..." : "Subscribe with Paystack"}
            </Button>
            <Button onClick={() => handleSubscribe(plan.name, "flutterwave")} disabled={loading}>
              {loading ? "Processing..." : "Subscribe with Flutterwave"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
