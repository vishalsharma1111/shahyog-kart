import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Mail, Phone, MapPin, ShieldCheck, ArrowRight } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-brand-green-950 text-gray-300 pt-16 pb-12 border-t border-brand-green-900 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-green-800 to-brand-green-600 flex items-center justify-center text-white shadow-md">
                <Heart className="w-5 h-5 fill-brand-orange-500 text-brand-orange-500" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                Shahyog<span className="text-brand-orange-500">Kart</span>
              </span>
            </Link>

            <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
              India's first unified e-commerce & social donation ecosystem. We connect conscious consumers, rural micro-producers, grassroots NGOs, and responsible delivery partners to make every transaction purposeful.
            </p>

            <div className="flex items-center gap-2 text-xs font-semibold text-brand-orange-400 bg-brand-orange-500/10 px-3 py-1.5 rounded-lg border border-brand-orange-500/20 max-w-max">
              <ShieldCheck className="w-4 h-4 text-brand-orange-400" />
              <span>100% Verified NGOs & Ethically Sourced Goods</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/shop" className="hover:text-white transition">Shop Catalog</Link>
              </li>
              <li>
                <Link to="/donate" className="hover:text-white transition">Direct Donations</Link>
              </li>
              <li>
                <Link to="/ngos" className="hover:text-white transition">Verified NGOs</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition">Our Social Model</Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-white transition">Track Your Order</Link>
              </li>
            </ul>
          </div>

          {/* Partner with us */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">
              Partner With Us
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/register?role=seller" className="hover:text-white transition">Sell on Shahyog Kart</Link>
              </li>
              <li>
                <Link to="/register?role=ngo" className="hover:text-white transition">Onboard as an NGO</Link>
              </li>
              <li>
                <Link to="/register?role=delivery" className="hover:text-white transition">Delivery Partner Program</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition">CSR Corporate Match</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition">Support & Grievances</Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">
              Contact & HQ
            </h4>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand-orange-400 flex-shrink-0 mt-1" />
                <span>Sector 62, Innovation Plaza, Noida / New Delhi, India</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-brand-orange-400 flex-shrink-0" />
                <span>support@shahyogkart.org</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-brand-orange-400 flex-shrink-0" />
                <span>+91 1800-SHAHYOG (Toll Free)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-4">
          <p>© {new Date().getFullYear()} Shahyog Kart Foundation. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Shop with Purpose, Donate with Love <Heart className="w-3.5 h-3.5 text-brand-orange-500 fill-brand-orange-500" /> Made for India.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
