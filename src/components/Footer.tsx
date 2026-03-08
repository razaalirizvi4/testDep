// import React from 'react'
// function Footer() {
//   return (
//     <div>
//            <footer className="bg-gray-900 text-white py-20">
//         <div className="container mx-auto px-4">
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
//             <div>
//               <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
//                 Fiesta
//               </h3>
//               <p className="text-gray-400">
//                 Your favorite food delivery service.
//               </p>
//             </div>
//             <div>
//               <h4 className="text-lg font-semibold mb-4">Company</h4>
//               <ul className="space-y-2 text-gray-400">
//                 <li>About Us</li>
//                 <li>Careers</li>
//                 <li>Partner With Us</li>
//                 <li>Blog</li>
//               </ul>
//             </div>
//             <div>
//               <h4 className="text-lg font-semibold mb-4">Support</h4>
//               <ul className="space-y-2 text-gray-400">
//                 <li>Help Center</li>
//                 <li>Safety</li>
//                 <li>Terms of Service</li>
//                 <li>Privacy Policy</li>
//               </ul>
//             </div>
//             <div>
//               <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
//               <ul className="space-y-2 text-gray-400">
//                 <li>Facebook</li>
//                 <li>Twitter</li>
//                 <li>Instagram</li>
//                 <li>LinkedIn</li>
//               </ul>
//             </div>
//           </div>
//           <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
//             <p> 2024 Fiesta. All rights reserved.</p>
//           </div>
//         </div>
//       </footer>
//     </div>
//   )
// }

// export default Footer

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BiMailSend, BiMapPin, BiPhone } from "react-icons/bi";
import LanguageSelectorDialog from "./LanguageSelectorDialog";
import { useTranslations, useFormatter } from "next-intl";
import {
  FaFacebookF,
  FaInstagram,
  FaGooglePlay,
  FaApple,
} from "react-icons/fa";

export default function Footer() {
  const pathname = usePathname();
  const t = useTranslations("footer");
  const format = useFormatter();

  // Hide footer on auth pages
  const isAuthPage = pathname.includes("/auth/login") || pathname.includes("/auth/signup") || pathname.includes("/auth/forgot-password") || pathname.includes("/auth/reset-password") || pathname.includes("/auth/verify-email");
  if (isAuthPage) {
    return null;
  }

  // Formatting helpers
  const getDayName = (day: 'monday' | 'thursday' | 'friday' | 'saturday' | 'sunday') => {
    const dates = {
      monday: new Date(2024, 0, 1),
      thursday: new Date(2024, 0, 4),
      friday: new Date(2024, 0, 5),
      saturday: new Date(2024, 0, 6),
      sunday: new Date(2024, 0, 7)
    };
    return format.dateTime(dates[day], { weekday: 'long' });
  };

  const formatTime = (hour: number, minute: number) => {
    const date = new Date(2024, 0, 1, hour, minute);
    return format.dateTime(date, { hour: 'numeric', minute: '2-digit' });
  };

  const renderTimeRange = (startH: number, startM: number, endH: number, endM: number) => {
    return t("timeRange", {
      start: formatTime(startH, startM),
      end: formatTime(endH, endM)
    });
  };

  return (
    <footer className="  pt-12 pb-8 bg-black text-white relative overflow-hidden">
      <div className="container mx-auto px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo Section */}
          <div className="flex flex-col gap-8">
            <div className="mb-4 flex ">
              <Image
                src="/images/fiestaa-logo.png"
                alt="Fiestaa Logo"
                width={90}
                height={30}
                className="object-contain"
              />
            </div>

          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4 text-white">
              {t("contact")}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center  cursor-pointer  space-x-3 group">
                <BiPhone className="w-5 h-5 z-50 group-hover:text-primary-600  transition-colors" />
                <Link
                  href="tel:05111728687"
                  className="hover:text-primary-600 z-50 transition-colors"
                >
                  05111728687
                </Link>
              </div>
              <div className="flex items-center space-x-3 group">
                <BiMailSend className="w-5 h-5  group-hover:text-primary-600 transition-colors" />
                <Link
                  href="mailto:delivery@foodapp.com"
                  className="hover:text-primary-600 transition-colors"
                >
                  delivery@foodapp.com
                </Link>
              </div>
              <div className="flex items-start space-x-3 cursor-pointer group">
                <BiMapPin className="w-5 h-5  group-hover:text-primary-600 transition-colors flex-shrink-0" />
                <p className="hover:text-primary-600 transition-colors">
                  Food Apps - Heathrow Road, Airport Branch, Terminal 3,
                  Hounslow, London
                </p>
              </div>
            </div>
          </div>

          {/* Timings */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4  text-white">
              {t("ourTimings")}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                {/* <Clock className="w-5 h-5 text-purple-300" /> */}
                <div>
                  <p className="font-medium">
                    {t("dayRange", { start: getDayName("monday"), end: getDayName("thursday") })}
                  </p>
                  <p className="">{renderTimeRange(11, 0, 0, 30)}</p>
                </div>
              </div>
              <div>
                <p className="font-medium">{getDayName("friday")}</p>
                <p className="">{renderTimeRange(11, 0, 12, 45)}</p>
                <p className="">{renderTimeRange(13, 30, 0, 30)}</p>
              </div>
              <div>
                <p className="font-medium">
                  {t("dayRange", { start: getDayName("saturday"), end: getDayName("sunday") })}
                </p>
                <p className="">{renderTimeRange(11, 0, 0, 30)}</p>
              </div>
            </div>
          </div>

          {/* Download & Social */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4  ">{t("downloadApp")}</h3>
              <div className="flex space-x-4 ">
                <Link
                  href="#"
                  className="p-2 text-center bg-white rounded-full   cursor-pointer shadow-sm border border-gray-200 text-black  hover:bg-black hover:text-white transition-colors"
                >
                  <FaApple className="w-5 h-5 " />
                </Link>
                <Link
                  href="#"
                  className=" p-2 text-black  bg-white   cursor-pointer  shadow-sm border border-gray-200 rounded-full hover:bg-black hover:text-white transition-colors"
                >
                  <FaGooglePlay className="w-5 h-5" />
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2   text-white">
                {t("followUs")}
              </h3>
              <div className="flex space-x-4">
                <Link
                  href="#"
                  className="p-2 bg-white rounded-full   cursor-pointer shadow-sm border border-gray-200 text-blue-600  hover:bg-black hover:text-white transition-colors"
                >
                  <FaFacebookF className="w-5 h-5" />
                </Link>
                <Link
                  href="#"
                  className=" text-[#E1306C] p-2 bg-white   cursor-pointer  shadow-sm border border-gray-200 rounded-full hover:bg-black hover:text-white transition-colors"
                >
                  <FaInstagram className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-4 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm">
              {t("copyright", {
                year: new Date().getFullYear(),
                allRightsReserved: t("allRightsReserved")
              })}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">{t("language")}:</span>
              <LanguageSelectorDialog />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
