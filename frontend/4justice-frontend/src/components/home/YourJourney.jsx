
import React, { useState, useEffect } from "react";

const journeySteps = [
  {
    id: 1,
    label: "Upload Documents",
    desc: "Submit your contracts, evidence, and relevant documents.",
    icon: "↑",
  },
  {
    id: 2,
    label: "Pay 99 SEK",
    desc: "Pay the one-time initial review fee to begin your case.",
    icon: "€",
  },
  {
    id: 3,
    label: "Case Started",
    desc: "Receive a case reference to track your legal matter.",
    icon: "✓",
  },
  {
    id: 4,
    label: "Case Review",
    desc: "Your information is reviewed to understand your matter.",
    icon: "⌕",
  },
  {
    id: 5,
    label: "Fixed-Price Offer",
    desc: "Review the scope and price for additional legal support.",
    icon: "◇",
  },
  {
    id: 6,
    label: "Your Approval",
    desc: "Choose whether to proceed with the proposed next steps.",
    icon: "→",
  },
  {
    id: 7,
    label: "Document Preparation",
    desc: "Receive support preparing relevant legal documents.",
    icon: "▤",
  },
];

function getVisibleCards() {
  if (typeof window === "undefined") return 4;

  if (window.innerWidth <= 640) return 1;
  if (window.innerWidth <= 1024) return 2;

  return 4;
}

function YourJourney() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [visibleCards, setVisibleCards] = useState(getVisibleCards);

  useEffect(() => {
    const handleResize = () => {
      setVisibleCards(getVisibleCards());
      setCurrentSlide(0);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const maxSlide = Math.max(
    0,
    journeySteps.length - visibleCards
  );

  const goToSlide = (index) => {
    setCurrentSlide(Math.max(0, Math.min(index, maxSlide)));
  };

  return (
  <section id="journey" className="home-journey-section scandi-section">
      <div className="home-section-container">

        {/* Section heading */}
        <div className="section-heading text-center">
          <h2>Your Journey with APPEEL</h2>

          <p>
            Seven simple steps. Clear pricing. Legal support at every stage.
          </p>
        </div>

        {/* Carousel */}
        <div className="journey-carousel">

          <button
            type="button"
            className="journey-carousel-btn"
            onClick={() => goToSlide(currentSlide - 1)}
            disabled={currentSlide === 0}
            aria-label="Previous steps"
          >
            &#8592;
          </button>

          <div className="journey-carousel-viewport">
            <div
              className="journey-carousel-track"
              style={{
                "--visible-cards": visibleCards,
                "--current-slide": currentSlide,
              }}
            >
              {journeySteps.map((step) => (
                <article
                  className="journey-step-card"
                  key={step.id}
                >
                  <div className="journey-card-top">
                    <span className="journey-card-number">
                      STEP {String(step.id).padStart(2, "0")}
                    </span>

                    <span
                      className="journey-card-icon"
                      aria-hidden="true"
                    >
                      {step.icon}
                    </span>
                  </div>

                  <div className="journey-card-body">
                    <h3>{step.label}</h3>
                    <p>{step.desc}</p>
                  </div>

                  <div className="journey-card-footer">
                    <span>APPEEL PROCESS</span>

                    <span
                      className="journey-card-arrow"
                      aria-hidden="true"
                    >
                      &#8599;
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="journey-carousel-btn"
            onClick={() => goToSlide(currentSlide + 1)}
            disabled={currentSlide >= maxSlide}
            aria-label="Next steps"
          >
            &#8594;
          </button>
        </div>

        {/* Pagination */}
        <div className="journey-carousel-pagination">
          <span>
            Showing {currentSlide + 1}–
            {Math.min(
              currentSlide + visibleCards,
              journeySteps.length
            )}{" "}
            of {journeySteps.length} steps
          </span>

          <div className="journey-carousel-dots">
            {Array.from(
              { length: maxSlide + 1 },
              (_, index) => (
                <button
                  type="button"
                  key={index}
                  className={`journey-carousel-dot ${
                    currentSlide === index ? "active" : ""
                  }`}
                  onClick={() => goToSlide(index)}
                  aria-label={`Show steps starting at ${index + 1}`}
                  aria-current={
                    currentSlide === index ? "step" : undefined
                  }
                />
              )
            )}
          </div>
        </div>

      </div>
    </section>
  );
}

export default YourJourney;
