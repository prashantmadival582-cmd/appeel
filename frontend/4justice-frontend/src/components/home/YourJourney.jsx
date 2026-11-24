
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const journeySteps = [
  { id: 1, key: "upload", icon: "\u2191" },
  { id: 2, key: "payment", icon: "\u20ac" },
  { id: 3, key: "started", icon: "\u2713" },
  { id: 4, key: "review", icon: "\u2315" },
  { id: 5, key: "offer", icon: "\u25c7" },
  { id: 6, key: "approval", icon: "\u2192" },
  { id: 7, key: "preparation", icon: "\u25a4" },
];

function getLayout() {
  if (typeof window === "undefined") {
    return { visible: 4, gap: 22 };
  }

  if (window.innerWidth <= 640) {
    return { visible: 1, gap: 16 };
  }

  if (window.innerWidth <= 1024) {
    return { visible: 2, gap: 22 };
  }

  return { visible: 4, gap: 22 };
}

function YourJourney() {
  const { t } = useTranslation();

  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const offsetRef = useRef(0);
  const currentIndexRef = useRef(0);
  const isPausedRef = useRef(false);

  const [visibleCards, setVisibleCards] = useState(getLayout().visible);
  const [gap, setGap] = useState(getLayout().gap);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);

  const cardWidth =
    viewportWidth > 0
      ? (viewportWidth - gap * (visibleCards - 1)) / visibleCards
      : 0;

  const cardStep = cardWidth + gap;
  const groupWidth = cardStep * journeySteps.length;

  const maxSlide = Math.max(
    0,
    journeySteps.length - visibleCards
  );

  // Measure carousel layout.
  useEffect(() => {
    const measureLayout = () => {
      const layout = getLayout();

      setVisibleCards(layout.visible);
      setGap(layout.gap);

      if (viewportRef.current) {
        setViewportWidth(viewportRef.current.clientWidth);
      }

      offsetRef.current = 0;
      currentIndexRef.current = 0;
      setCurrentSlide(0);
    };

    measureLayout();

    window.addEventListener("resize", measureLayout);

    return () => {
      window.removeEventListener("resize", measureLayout);
    };
  }, []);

  // Automatically move cards from right to left.
  // Pause movement while hovering over the carousel.
  useEffect(() => {
    if (!cardWidth || !groupWidth || !trackRef.current) {
      return;
    }

    let animationFrame;
    let previousTime = 0;

    const speed = 30; // Pixels per second

    const animate = (time) => {
      if (!previousTime) {
        previousTime = time;
      }

      const elapsed = Math.min(time - previousTime, 50);
      previousTime = time;

      // Stop movement while hovered.
      if (!isPausedRef.current) {
        offsetRef.current += (speed * elapsed) / 1000;
      }

      // Seamless reset after the first group.
      if (offsetRef.current >= groupWidth) {
        offsetRef.current -= groupWidth;
      }

      if (trackRef.current) {
        trackRef.current.style.transform =
          `translate3d(${-offsetRef.current}px, 0, 0)`;
      }

      const nextIndex = Math.min(
        Math.floor(offsetRef.current / cardStep),
        maxSlide
      );

      if (nextIndex !== currentIndexRef.current) {
        currentIndexRef.current = nextIndex;
        setCurrentSlide(nextIndex);
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [cardWidth, cardStep, groupWidth, maxSlide]);

  // Navigate to a specific slide.
  const goToSlide = (index) => {
    const safeIndex = Math.max(0, Math.min(index, maxSlide));

    offsetRef.current = safeIndex * cardStep;
    currentIndexRef.current = safeIndex;
    setCurrentSlide(safeIndex);

    if (trackRef.current) {
      trackRef.current.style.transform =
        `translate3d(${-offsetRef.current}px, 0, 0)`;
    }
  };

  // Render journey cards.
  const renderSteps = (duplicate = false) =>
    journeySteps.map((step) => (
      <article
        className="journey-step-card"
        key={`${duplicate ? "duplicate-" : ""}${step.id}`}
        style={{
          width: cardWidth ? `${cardWidth}px` : undefined,
          flexBasis: cardWidth ? `${cardWidth}px` : undefined,
        }}
      >
        <div className="journey-card-top">
          <span className="journey-card-number">
            {t("journey.step")}{" "}
            {String(step.id).padStart(2, "0")}
          </span>

          <span className="journey-card-icon" aria-hidden="true">
            {step.icon}
          </span>
        </div>

        <div className="journey-card-body">
          <h3>{t(`journey.steps.${step.key}.label`)}</h3>
          <p>{t(`journey.steps.${step.key}.description`)}</p>
        </div>

        <div className="journey-card-footer">
          <span>{t("journey.process")}</span>

          <span className="journey-card-arrow" aria-hidden="true">
            &#8599;
          </span>
        </div>
      </article>
    ));

  return (
    <section
      id="journey"
      className="home-journey-section scandi-section"
    >
      <div className="home-section-container">

        <div className="section-heading text-center">
          <h2>{t("journey.heading")}</h2>
          <p>{t("journey.subtitle")}</p>
        </div>

        <div
          className="journey-carousel"
          onMouseEnter={() => {
            isPausedRef.current = true;
          }}
          onMouseLeave={() => {
            isPausedRef.current = false;
          }}
        >
          <button
            type="button"
            className="journey-carousel-btn"
            onClick={() => goToSlide(currentSlide - 1)}
            disabled={currentSlide === 0}
            aria-label="Previous steps"
          >
            &#8592;
          </button>

          <div
            className="journey-carousel-viewport"
            ref={viewportRef}
          >
            <div
              className="journey-carousel-track"
              ref={trackRef}
            >
              <div className="journey-marquee-group">
                {renderSteps()}
              </div>

              <div
                className="journey-marquee-group"
                aria-hidden="true"
              >
                {renderSteps(true)}
              </div>
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

        <div className="journey-carousel-pagination">
          <span>
            Showing {currentSlide + 1}–
            {Math.min(
              currentSlide + visibleCards,
              journeySteps.length
            )}
            {" "}of {journeySteps.length} steps
          </span>

          <div className="journey-carousel-dots">
            {Array.from({ length: maxSlide + 1 }, (_, index) => (
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
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

export default YourJourney;
