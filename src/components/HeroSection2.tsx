"use client";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import { useTranslations } from "next-intl";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import Header from "./layout/Header";

// import LocationSearch from "./LocationSearch";
import { useRouter } from "@/i18n/navigation";

export default function HeroSection2() {
  const router = useRouter();
  const t = useTranslations("hero");

  const slides = [
    {
      image:
        "https://images.unsplash.com/photo-1675257163553-7b47b4680636?q=80&w=1626&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      title: t("slides.juicyBurgers"),
      subtitle: t("slides.deliveredToDoorstep"),
    },
    {
      image:
        "https://images.unsplash.com/photo-1590947132387-155cc02f3212?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      title: t("slides.hotFreshPizza"),
      subtitle: t("slides.readyIn30Minutes"),
    },
    {
      image:
        "https://images.unsplash.com/photo-1611143669185-af224c5e3252?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      title: t("slides.deliciousSushi"),
      subtitle: t("slides.experienceAuthenticFlavors"),
    },
  ];
  return (
    <div className="relative h-svh">
      <div className="">
        <Header />
      </div>

      <Swiper
        spaceBetween={30}
        centeredSlides={true}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
        }}
        navigation={true}
        modules={[Autoplay, Pagination, Navigation]}
        className="w-full h-full"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index}>
            <div className="relative w-full h-full">
              <Image
                src={slide.image || "/placeholder.svg"}
                alt={slide.title}
                layout="fill"
                objectFit="cover"
                priority={index === 0}
              />

              <div className="absolute inset-0 bg-black bg-opacity-50" />

              <div className="container mx-auto space-y-8 absolute top-1/3 left-1/2 -translate-x-1/2 text-center text-white">
                <h1 className="text-5xl md:text-6xl xl:text-7xl font-semibold leading-tight text-white">
                  {t('title')} <span className="bg-gradient-to-r from-[#f97316] to-[#dc2626] bg-clip-text text-transparent">{t('subRest')}</span> {t('subAfter')}
                </h1>
                <p className="text-xl lg:text-2xl font-medium text-white">
                  {t('subtitle')}
                </p>
                <div className=" items-start justify-start left-8 transform  text-white z-10  ">

                  <h2 className="text-4xl md:text-5xl lg:text-4xl italic mb-2 md:mb-4 shadow-text">
                    {slide.title}
                  </h2>
                  <button
                    onClick={() => router.push("/restaurants")}
                    className="bg-primary py-2 px-4 font-medium rounded-full hover:bg-primary-600"
                  >
                    {t('cta')}
                  </button>
                </div>

                {/* <LocationSearch /> */}
              </div>

            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>

  );
}
