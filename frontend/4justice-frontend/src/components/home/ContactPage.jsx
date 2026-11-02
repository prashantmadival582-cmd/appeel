import Navbar from "../Navbar";
import Footer from "../Footer";
import ContactSection from "./ContactSection";

function ContactPage() {
  return (
    <>
      <Navbar />

      <main className="contact-page">
        <ContactSection />
      </main>

      <Footer />
    </>
  );
}

export default ContactPage;