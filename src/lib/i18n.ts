"use client";

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import common_en from '@/locales/en/common.json';
import common_hi from '@/locales/hi/common.json';
import common_mr from '@/locales/mr/common.json';
import common_bn from '@/locales/bn/common.json';
import common_ta from '@/locales/ta/common.json';


i18n
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    resources: {
      en: { common: common_en },
      hi: { common: common_hi },
      mr: { common: common_mr },
      bn: { common: common_bn },
      ta: { common: common_ta },
    },
    ns: ['common'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  });

export default i18n;
