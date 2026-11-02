
import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  ShieldCheck,
  BadgeCheck,
} from "lucide-react";

import heroImage2 from "../../assets/hero2.png";
import heroImage3 from "../../assets/hero22.jpg";

function HomeHero() {
  const heroImages = [heroImage2, heroImage3];
  const [currentHero, setCurrentHero] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHero((previous) => (previous + 1) % heroImages.length);
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="home-hero-section">
      {/* Background image slider */}
      {heroImages.map((image, index) => (
        <div
          key={image}
          className={`home-hero-background ${
            currentHero === index ? "active" : ""
          }`}
          style={{ backgroundImage: `url("${image}")` }}
        />
      ))}

      {/* Navy overlay */}
      <div className="home-hero-overlay" />

      {/* Hero content */}
      <div className="home-hero-container">
        <div className="home-hero-content">
          <h1>
            Justice shouldn’t cost a fortune.
            <br />
            <span>Start from 99 SEK.</span>
          </h1>

          <p className="home-hero-description">
            Understand your options and take your next step with
            straightforward pricing and a simpler way to get legal support.
          </p>

          <div className="home-hero-trust" aria-label="Service benefits">
            <div className="home-hero-trust-item">
              <CheckCircle2 aria-hidden="true" />
              <span>Transparent pricing</span>
            </div>

            <div className="home-hero-trust-item">
              <BadgeCheck aria-hidden="true" />
              <span>No hidden fees</span>
            </div>

            <div className="home-hero-trust-item">
              <ShieldCheck aria-hidden="true" />
              <span>Secure case handling</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeHero;
