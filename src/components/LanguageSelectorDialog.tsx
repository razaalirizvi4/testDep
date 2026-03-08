'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { type Locale } from '@/i18n/config';
import { languagesData } from '@/i18n/languages';
import { XMarkIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { useTransition } from 'react';

export default function LanguageSelectorDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();

  const currentLanguage = languagesData.find((lang) => lang.locale === locale);

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === locale) return;

    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
      setIsOpen(false);
    });
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        disabled={isPending}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black hover:bg-gray-800 transition-all text-sm font-medium text-white shadow-lg active:scale-95"
        aria-label="Select language and country"
      >
        <GlobeAltIcon className="w-4 h-4 text-white" />
        <span className="text-white">{currentLanguage?.name}</span>
      </button>

      {/* Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-black">Select Language & Country</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Choose your preferred language and region</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {languagesData.map((language) => (
                <div key={language.locale}>
                  <h3
                    className={`text-lg font-semibold mb-3 ${locale === language.locale
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-900 dark:text-white'
                      }`}
                  >
                    {language.nativeName}
                    {locale === language.locale && (
                      <span className="text-sm ml-2 inline-block bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                        Current
                      </span>
                    )}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {language.countries.map((country) => (
                      <button
                        key={country.code}
                        onClick={() => handleLocaleChange(language.locale)}
                        disabled={isPending || locale === language.locale}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${locale === language.locale
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          } ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span className="text-2xl">{country.flag}</span>
                        <div className="text-left">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {country.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {country.code}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
