
import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Check,
  ShieldCheck,
  MessageCircle,
  FileCheck2,
} from "lucide-react";

function AboutSection() {
  return (
    <section id="about" className="home-about">
      <div className="home-about-container">

        {/* LEFT VISUAL PANEL */}
        <div className="home-about-visual">
          <div className="about-visual-top">
            <span className="about-visual-label">
              LEGAL SUPPORT, MADE SIMPLER
            </span>
            <span className="about-visual-line" />
          </div>

          <div className="about-visual-main">
            <span className="about-visual-number">01</span>

            <h3>
              Your situation.
              <br />
              Your options.
              <br />
              <span>Your next step.</span>
            </h3>

            <p>
              Clear information and practical guidance
              to help you move forward with confidence.
            </p>
          </div>

          <div className="about-visual-bottom">
            <div className="about-visual-icon">
              <ShieldCheck size={22} />
            </div>
            <div>
              <strong>Clarity comes first.</strong>
              <span>Know where you stand before you decide.</span>
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="home-about-content">

          <span className="section-eyebrow">
            ABOUT APPEEL
          </span>

          <h2>
            Legal support should feel
            <span> within reach.</span>
          </h2>

          <p className="home-about-intro">
            Legal issues can feel complicated. Getting clear
            information about your options shouldn't.
          </p>

          <p className="home-about-description">
            APPEEL helps make legal processes easier to understand
            through straightforward communication, transparent
            pricing and practical next steps. So you can make
            informed decisions without unnecessary confusion.
          </p>

          <div className="home-about-benefits">

            <div className="home-about-benefit">
              <div className="about-benefit-icon">
                <Check size={18} />
              </div>
              <div>
                <strong>Know your options</strong>
                <span>
                  Understand the possible next steps for your situation.
                </span>
              </div>
            </div>

            <div className="home-about-benefit">
              <div className="about-benefit-icon">
                <FileCheck2 size={18} />
              </div>
              <div>
                <strong>Understand the process</strong>
                <span>
                  Get clearer information about what to expect.
                </span>
              </div>
            </div>

            <div className="home-about-benefit">
              <div className="about-benefit-icon">
                <MessageCircle size={18} />
              </div>
              <div>
                <strong>Take your next step</strong>
                <span>
                  Move forward with practical information and support.
                </span>
              </div>
            </div>

          </div>

          <Link to="/contact" className="home-about-button">
            Let's talk
            <ArrowUpRight size={19} />
          </Link>

        </div>
      </div>
    </section>
  );
}

export default AboutSection;
