import React from 'react';
import { Heart, ShieldCheck, Users, Target, Award, Sparkles, CheckCircle2 } from 'lucide-react';
import ImpactCounter from '../components/common/ImpactCounter';

const About = () => {
  const pillars = [
    {
      role: 'Customers & Donors',
      desc: 'Conscious shoppers who choose mindful lifestyle products knowing that a portion of their spend directly funds societal good.'
    },
    {
      role: 'Artisans & Sellers',
      desc: 'Rural self-help groups, indigenous weavers, and cottage producers receiving fair compensation without intermediary exploitation.'
    },
    {
      role: 'Verified NGOs',
      desc: 'Vetted grassroots organizations focused on hunger eradication, education, women empowerment, and tree plantation.'
    },
    {
      role: 'Delivery Partners',
      desc: 'Responsible logistics personnel ensuring packages reach doorsteps safely while sustaining fair livelihood standards.'
    }
  ];

  return (
    <div className="space-y-16 py-10">
      {/* Header */}
      <section className="max-w-4xl mx-auto px-4 text-center space-y-4">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-orange-600 bg-brand-orange-50 px-3.5 py-1.5 rounded-full border border-brand-orange-200">
          Our Purpose & Story
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-gray-950 tracking-tight">
          Empowering Indian Artisans, <br />
          Sustaining Grassroots Causes.
        </h1>
        <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
          Shahyog Kart was born from a simple realization: e-commerce generates trillions in volume, yet rural creators remain undercompensated, and verified charitable institutions struggle for reliable funding. We combined them into one unified, self-sustaining circular economy.
        </p>
      </section>

      {/* Values Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-brand-green-100 text-brand-green-900 flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">100% Verified NGOs</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Every NGO on Shahyog Kart is manually audited for legal FCRA / 80G / 12A documentation, operational history, and financial transparency before approval.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-brand-orange-100 text-brand-orange-600 flex items-center justify-center mb-6">
              <Heart className="w-6 h-6 fill-brand-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Automated Social Impact</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Up to 20% of every checkout is ring-fenced for philanthropic causes. Customers track exactly how much impact their cart generates in real time.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Fair Trade & Dignity</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              We cut predatory middlemen, returning maximum value to master weavers, organic beekeepers, terracotta potters, and bamboo craftsmen.
            </p>
          </div>
        </div>
      </section>

      {/* Impact Counter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ImpactCounter />
      </section>

      {/* The 4 Stakeholder Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-brand-gray-100 py-14 rounded-3xl">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-950">
            Our Multi-Stakeholder Ecosystem
          </h2>
          <p className="text-gray-600 text-sm mt-2">
            A cohesive alliance where every member grows with accountability.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-brand-green-900 text-white font-bold flex items-center justify-center text-xs mb-4">
                0{idx + 1}
              </div>
              <h4 className="font-bold text-gray-900 text-base mb-2">{pillar.role}</h4>
              <p className="text-xs text-gray-600 leading-relaxed">{pillar.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default About;
