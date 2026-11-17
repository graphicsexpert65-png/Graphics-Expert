import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Check, Zap, Sparkles } from 'lucide-react';

export const PricingView: React.FC = () => {
  const { addToast } = useApp();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleSimulateSubscription = (planName: string) => {
    addToast('Simulated Plan Activated', `You are now simulating the ${planName} membership.`, 'success');
  };

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Essential access for occasional designers and small projects.',
      features: [
        'Unlimited access to all 8 client-side tools',
        'Standard image resizing & compression',
        'Free template downloads selection',
        'Basic personal license usage',
        'Community customer support',
      ],
      buttonText: 'Current Plan',
      isCurrent: true,
      popular: false,
    },
    {
      name: 'Pro',
      price: billingCycle === 'monthly' ? '$9.99' : '$7.99',
      period: 'per month',
      description: 'For active freelance designers, agencies & social media managers.',
      features: [
        'Unlimited access to all free & pro design tools',
        '15 Premium template downloads per month',
        'Commercial use license on all assets',
        'Full layered PSD, AI & Canva source access',
        'Priority email & WhatsApp design support',
      ],
      buttonText: 'Try Pro (Simulated)',
      isCurrent: false,
      popular: true,
    },
    {
      name: 'Business',
      price: billingCycle === 'monthly' ? '$19.99' : '$15.99',
      period: 'per month',
      description: 'For corporate teams, marketing agencies, and franchise chains.',
      features: [
        'Everything in Pro plan',
        '50 Premium template downloads per month',
        'Extended Commercial License included',
        'Multi-seat team sharing (up to 5 users)',
        'Custom template sizing upon request',
        'Dedicated account manager',
      ],
      buttonText: 'Try Business (Simulated)',
      isCurrent: false,
      popular: false,
    },
  ];

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
          Transparent Memberships
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
          Flexible Plans for Creators & Businesses
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
          Start for free with in-browser tools, or unlock commercial template libraries with monthly downloads.
        </p>

        {/* Demo Disclaimer */}
        <div className="inline-block p-2 bg-amber-50 border border-amber-200 text-amber-900 text-[11px] rounded-lg">
          <strong>Prototype Mode:</strong> Subscription payments are simulated. No recurring billing is active.
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all ${
              plan.popular
                ? 'bg-[#0F172A] text-white shadow-xl ring-2 ring-blue-600 relative'
                : 'bg-white text-slate-900 border border-slate-200 shadow-sm'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                Most Popular
              </div>
            )}

            <div>
              <div className="flex justify-between items-baseline mb-4">
                <h3 className="text-lg font-bold font-display">{plan.name}</h3>
              </div>

              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-extrabold font-mono tracking-tight">{plan.price}</span>
                <span className={`text-xs ${plan.popular ? 'text-slate-400' : 'text-slate-500'}`}>
                  /{plan.period}
                </span>
              </div>

              <p className={`text-xs mb-6 ${plan.popular ? 'text-slate-300' : 'text-slate-500'}`}>
                {plan.description}
              </p>

              <div className="space-y-3 pt-4 border-t border-slate-200/20 text-xs">
                {plan.features.map((feat) => (
                  <div key={feat} className="flex items-start gap-2.5">
                    <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.popular ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    <span className={plan.popular ? 'text-slate-200' : 'text-slate-700'}>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8">
              <button
                onClick={() => handleSimulateSubscription(plan.name)}
                className={`w-full py-3 px-4 rounded-xl text-xs font-semibold transition-colors ${
                  plan.popular
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
