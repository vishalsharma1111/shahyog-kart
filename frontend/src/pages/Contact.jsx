import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, ChevronDown } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'customer',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const faqs = [
    {
      q: 'How does Shahyog Kart fund NGOs automatically?',
      a: 'Every artisan product on Shahyog Kart has an explicit donation percentage (5% to 20%) set in its listing. When a customer completes checkout, that portion is automatically directed into our audited escrow fund and distributed directly to the corresponding cause or NGO.'
    },
    {
      q: 'Are donations eligible for tax exemptions in India?',
      a: 'Yes! All partner NGOs listed on Shahyog Kart possess valid Section 80G and 12A registrations. You receive an instant digital receipt with registration details for tax filing.'
    },
    {
      q: 'How do Sellers and NGOs get verified?',
      a: 'After registering, seller and NGO accounts are reviewed by Shahyog Kart administrators who verify registration certificates, artisan background, and bank credentials. This ensures zero exploitation and maintains platform integrity.'
    },
    {
      q: 'What is the return or refund policy for ethical products?',
      a: 'We offer a 7-day hassle-free replacement or refund window if items arrive damaged or defective, while protecting the artisan’s fair wages.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-orange-600 bg-brand-orange-50 px-3.5 py-1.5 rounded-full border border-brand-orange-200">
          Get in Touch
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-gray-950 tracking-tight">
          We’d Love to Hear From You
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Have questions about an order, NGO verification, artisan onboarding, or corporate CSR partnerships? Reach out below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Contact Form */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-10 rounded-3xl border border-gray-100 shadow-xl">
          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Message Received!</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Thank you, <strong>{formData.name}</strong>. Our support team will get back to you at{' '}
                <strong>{formData.email}</strong> within 12 business hours.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', email: '', role: 'customer', subject: '', message: '' });
                }}
                className="px-5 py-2.5 rounded-xl bg-brand-green-900 text-white text-xs font-bold"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Send us a Message</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
                    placeholder="Full name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
                    placeholder="name@domain.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">I am a...</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none bg-white"
                >
                  <option value="customer">Shopper / Individual Donor</option>
                  <option value="seller">Artisan Collective / Seller Partner</option>
                  <option value="ngo">Registered NGO Representative</option>
                  <option value="delivery">Logistics / Delivery Partner</option>
                  <option value="csr">Corporate CSR Partner</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
                  placeholder="Inquiry regarding..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Your Message</label>
                <textarea
                  rows="4"
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-green-900 outline-none"
                  placeholder="How can we assist you today?"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-2xl font-bold bg-brand-green-900 hover:bg-brand-green-950 text-white shadow-lg transition flex items-center justify-center gap-2 text-sm"
              >
                <Send className="w-4 h-4" /> Dispatch Inquiry
              </button>
            </form>
          )}
        </div>

        {/* Office Details & Helpline */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-brand-gray-100 p-6 sm:p-8 rounded-3xl border border-gray-200/80 space-y-6">
            <h3 className="font-bold text-gray-900 text-lg">Platform Support Desks</h3>

            <div className="space-y-4 text-xs text-gray-600">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-brand-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-900 text-sm">Corporate Headquarters</p>
                  <p>Plot 18, Innovation Hub, Sector 62, Noida, NCR Delhi - 201309</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-brand-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-900 text-sm">Direct Support Inquiries</p>
                  <p>care@shahyogkart.org</p>
                  <p>verification@shahyogkart.org (For NGO & Seller Docs)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-brand-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-900 text-sm">Toll-Free Helpline</p>
                  <p>+91 1800-SHAHYOG (9:00 AM - 7:00 PM IST, Mon-Sat)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <section className="max-w-4xl mx-auto space-y-6 pt-6">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-950">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-gray-500 mt-1">Everything you need to know about our social platform</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-4 sm:p-5 text-left font-bold text-sm text-gray-900 flex items-center justify-between gap-4"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Contact;
