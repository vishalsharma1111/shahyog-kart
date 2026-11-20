import React, { useState } from 'react';
import {
  Heart,
  ShieldCheck,
  Users,
  Target,
  Award,
  Sparkles,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Send,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Globe,
  Share2,
  Building,
  Truck,
  Layers,
  HelpCircle
} from 'lucide-react';
import api from '../api/axiosInstance';
import ImpactCounter from '../components/common/ImpactCounter';

const AboutContact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [openFaq, setOpenFaq] = useState(0);

  const pillars = [
    {
      role: 'Customers & Donors',
      icon: Users,
      desc: 'Conscious citizens who purchase artisanal goods and donate surplus essentials, knowing every transaction fuels ground-level social impact.'
    },
    {
      role: 'Artisans & Sellers',
      icon: Layers,
      desc: 'Indigenous weavers, clay potters, organic beekeepers, and women self-help cooperatives receiving fair, unmediated compensation.'
    },
    {
      role: 'Verified NGOs',
      icon: Building,
      desc: 'Audited charitable foundations that publish verified supply needs and distribute relief directly to underprivileged beneficiaries.'
    },
    {
      role: 'Logistics Fleets',
      icon: Truck,
      desc: 'Dedicated delivery couriers ensuring transparent doorstep pickups and cryptographic 6-digit OTP handovers at NGO gates.'
    }
  ];

  const faqs = [
    {
      q: 'How does Shahyog Kart channel e-commerce sales to social causes?',
      a: 'Every artisan product on Shahyog Kart has a transparent social donation percentage (5% to 20%) set in its listing. When you complete checkout, that portion is automatically directed into our audited escrow fund and distributed directly to the corresponding verified NGO cause.'
    },
    {
      q: 'How does the Doorstep Physical Item Donation work?',
      a: 'You submit details of items you wish to donate (Books, Clothes, Shoes, Food, Stationery, Toys, Blankets, Household Essentials). Our intelligent weighted algorithm matches your donation to verified NGOs based on category, proximity, quantity, and urgency. Once the NGO accepts, our courier partner collects the items right from your doorstep.'
    },
    {
      q: 'What are Shahyog Reward Coins and how do I redeem them?',
      a: 'Whenever an NGO verifies received items using our secure 6-digit handover OTP, Shahyog Coins are credited to your account (e.g. 20 Books = 200 Coins). 1 Coin = ₹1. You can redeem up to 50% of your cart value using your coins at shopping checkout!'
    },
    {
      q: 'Are monetary donations eligible for 80G tax exemptions in India?',
      a: 'Yes! All partner NGOs listed on Shahyog Kart hold valid Section 80G and 12A registrations. You receive an instant digital receipt with NGO registration details for tax filing.'
    },
    {
      q: 'How are NGOs, Sellers, and Couriers verified?',
      a: 'All partner accounts require manual Super Admin verification. Our team audits government trust deeds, 80G certificates, driving licenses, and artisan cooperatives before any partner features are unlocked.'
    }
  ];

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name || !formData.email || !formData.message) {
      setErrorMsg('Name, email, and message are required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/contact', formData);
      if (res.data.success) {
        setSubmitted(true);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-20 py-8">
      {/* 1. Header / Hero */}
      <section className="max-w-4xl mx-auto px-4 text-center space-y-4">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-orange-600 bg-brand-orange-50 px-3.5 py-1.5 rounded-full border border-brand-orange-200 inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          About Shahyog Kart
        </span>
        <h1 className="text-4xl sm:text-6xl font-black text-gray-950 tracking-tight leading-tight">
          Empowering Indian Artisans, <br />
          Sustaining Grassroots Causes.
        </h1>
        <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
          Shahyog Kart unites conscious e-commerce, free doorstep item donations, and verified NGO relief into one circular, self-sustaining socio-economic ecosystem.
        </p>
      </section>

      {/* 2. Mission & Vision */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          <div className="bg-gradient-to-br from-brand-green-950 to-brand-green-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-brand-orange-400">
                <Target className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Our Mission</h2>
              <p className="text-gray-300 text-sm leading-relaxed">
                To eradicate friction in Indian social philanthropy and fair trade by transforming every commercial transaction into an automated vehicle for grassroots child education, nutrition relief, and rural livelihood dignity.
              </p>
            </div>
            <div className="pt-6 border-t border-white/10 text-xs text-gray-400 font-medium">
              Zero middlemen exploitation • Transparent audited escrow
            </div>
          </div>

          <div className="bg-gradient-to-br from-brand-orange-500 to-amber-600 text-white rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                <Award className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Our Vision</h2>
              <p className="text-orange-100 text-sm leading-relaxed">
                A nation where no usable book, blanket, or garment ends up in a landfill while an underprivileged child or family shivers; and where traditional Indian artisans thrive through respectful, nationwide commerce.
              </p>
            </div>
            <div className="pt-6 border-t border-white/10 text-xs text-orange-200 font-medium">
              Circular economy • Verified proof of impact
            </div>
          </div>
        </div>
      </section>

      {/* 3. Social Impact Counter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ImpactCounter />
      </section>

      {/* 4. Multi-Stakeholder Ecosystem Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-gray-50/80 py-16 rounded-3xl border border-gray-200/60">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-green-800">
            Four Stakeholder Pillars
          </span>
          <h2 className="text-3xl font-black text-gray-950 mt-1">
            How the Ecosystem Works Harmoniously
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
                <div className="w-10 h-10 rounded-xl bg-brand-green-50 text-brand-green-900 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-gray-900 text-base mb-2">{pillar.role}</h4>
                <p className="text-xs text-gray-600 leading-relaxed">{pillar.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Contact Form & Support Details */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Contact Details & Info */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-brand-orange-600">
                Get in Touch
              </span>
              <h2 className="text-3xl font-black text-gray-950 mt-1">
                We'd Love to Hear From You
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                Have questions regarding order status, NGO partnership verification, corporate CSR alliances, or bulk donation drives? Our team responds within 12 business hours.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Email Inquiries</h4>
                  <p className="text-xs text-gray-600 mt-0.5">support@shahyogkart.com</p>
                  <p className="text-[10px] text-gray-400">ngo-relations@shahyogkart.com</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Helpline & WhatsApp</h4>
                  <p className="text-xs text-gray-600 mt-0.5">+91 (011) 4567-8900</p>
                  <p className="text-[10px] text-gray-400">Mon - Sat: 9:00 AM to 7:00 PM IST</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Central Hub</h4>
                  <p className="text-xs text-gray-600 mt-0.5">Shahyog Innovation Center, Sector 62, Noida, Uttar Pradesh 201309</p>
                </div>
              </div>
            </div>

            {/* Social Media Links */}
            <div>
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Connect with Us</h4>
              <div className="flex items-center gap-2">
                {[
                  { name: 'Twitter / X', url: 'https://twitter.com' },
                  { name: 'LinkedIn', url: 'https://linkedin.com' },
                  { name: 'Instagram', url: 'https://instagram.com' },
                  { name: 'YouTube', url: 'https://youtube.com' }
                ].map((s) => (
                  <a
                    key={s.name}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-brand-green-900 hover:text-white transition text-xs font-bold text-gray-700 shadow-2xs"
                  >
                    {s.name}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Live Contact Form */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-10 rounded-3xl border border-gray-100 shadow-xl">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-gray-900">Message Received!</h3>
                <p className="text-xs text-gray-600 max-w-sm mx-auto">
                  Thank you, <strong>{formData.name}</strong>. Your inquiry has been dispatched to our support administration team.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
                  }}
                  className="px-5 py-2.5 rounded-xl bg-brand-green-900 text-white text-xs font-bold"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <h3 className="text-lg font-black text-gray-900 mb-2">Send us a Message</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Ananya Sen"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-green-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-green-900 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 9876543210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-green-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Inquiry Topic</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-green-900 outline-none"
                    >
                      <option value="General Inquiry">General Question</option>
                      <option value="NGO Partnership">NGO Onboarding & Verification</option>
                      <option value="Artisan Onboarding">Artisan Collective Onboarding</option>
                      <option value="Corporate CSR">Corporate CSR Partnership</option>
                      <option value="Order & Delivery Support">Order & Delivery Assistance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Your Message *</label>
                  <textarea
                    rows="4"
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe how we can support you..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-green-900 outline-none"
                  ></textarea>
                </div>

                {errorMsg && (
                  <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-brand-green-900 hover:bg-brand-green-950 text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      Send Message to Shahyog Team <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 6. Frequently Asked Questions (Accordion) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-green-800 flex items-center justify-center gap-1.5">
            <HelpCircle className="w-4 h-4" />
            Clarity & Transparency
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-950">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-xs transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-gray-900 hover:text-brand-green-900"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-brand-orange-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-gray-600 leading-relaxed border-t border-gray-50 bg-gray-50/40">
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

export default AboutContact;
