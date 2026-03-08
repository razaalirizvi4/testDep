/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React from "react"
import { FaPizzaSlice, FaMotorcycle, FaMobileAlt } from "react-icons/fa"
import { useTranslations } from "next-intl"

export default function FeaturesSection() {
  const t = useTranslations("features");

  const features = [
    {
      icon: FaPizzaSlice,
      title: t("savorTheFinestFlavors"),
      description: t("exploreHandpicked"),
    },
    {
      icon: FaMotorcycle,
      title: t("lightningFastDelivery"),
      description: t("experienceQuickest"),
    },
    {
      icon: FaMobileAlt,
      title: t("seamlessTracking"),
      description: t("monitorYourOrder"),
    },
  ]

 function generateBlob(seed: number): string {
   const randomPoint = () => {
     const theta = seed * 2 * Math.PI
     const r = 0.5 + 0.3 * Math.sin(theta)
     return [50 + r * Math.cos(theta) * 50, 50 + r * Math.sin(theta) * 50]
   }
 
   const points = Array.from({ length: 8 }, (_, i) => randomPoint())
   return `M${points.map((p) => p.join(",")).join("L")}Z`
 }
 
 return (
    <section className="relative py-20 overflow-hidden bg-gradient-to-b from-orange-50 to-white container mx-auto px-10">
      {/* Background blobs */}
      <div className="absolute inset-0 z-0">
        <svg
          className="absolute top-0 left-0 w-96 h-96 text-orange-100 opacity-50 transform -translate-x-1/2 -translate-y-1/2"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path fill="currentColor" d={generateBlob(0.5)} />
        </svg>
        <svg
          className="absolute bottom-0 right-0 w-96 h-96 text-orange-100 opacity-50 transform translate-x-1/2 translate-y-1/2"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path fill="currentColor" d={generateBlob(0.7)} />
        </svg>
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <h2 className="text-5xl font-extrabold text-center mb-12 text-gray-800 leading-tight">
          {t('title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="relative bg-white p-8 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-100 rounded-bl-full z-0"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-primary rounded-2xl flex items-center justify-center mb-6 transform -rotate-6">
                  <feature.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

