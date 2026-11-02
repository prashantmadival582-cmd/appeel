
import React from "react";
import {
  BadgeCheck,
  Clock3,
  Scale,
  ClipboardCheck,
} from "lucide-react";

const benefits = [
  {
    icon: BadgeCheck,
    title: "Know the Cost Upfront",
    description:
      "See the price and agreed scope before you decide to proceed.",
  },
  {
    icon: Clock3,
    title: "A Clear Response Timeline",
    description:
      "We aim to provide an initial response within 24 hours.",
  },
  {
    icon: Scale,
    title: "Guidance for Your Situation",
    description:
      "Understand your options and get help preparing relevant documents.",
  },
  {
    icon: ClipboardCheck,
    title: "Stay Informed",
    description:
      "Follow your case progress and understand the next steps along the way.",
  },
];

function BenefitsSection() {
  return (
    <section id="trust" className="benefits-section">
      <div className="home-section-container">
        <header className="benefits-heading">
          <span className="section-eyebrow">THE APPEEL APPROACH</span>

         <h2>Legal support made simple</h2>

          <p>
            <b>Simple information, clear pricing, and easy next steps</b>
          </p>
        </header>

        <div className="home-benefits-grid">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <article className="home-benefit-card" key={benefit.title}>
                <div className="home-benefit-icon" aria-hidden="true">
                  <Icon size={23} strokeWidth={1.8} />
                </div>

                <h3>{benefit.title}</h3>

                <p>{benefit.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default BenefitsSection;
