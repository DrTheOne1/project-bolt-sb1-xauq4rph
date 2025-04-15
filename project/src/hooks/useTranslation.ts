import { useTranslation as useI18nTranslation } from 'react-i18next';
import { TranslationKey } from '../i18n/types';

export const useTranslation = () => {
  const { t, i18n, ...rest } = useI18nTranslation();

  const typedT = (key: TranslationKey, options?: Record<string, any>) => {
    return t(key, options) as string;
  };

  return {
    t: typedT,
    i18n,
    ...rest
  };
}; 