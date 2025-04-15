import { Suspense } from 'react';
import { useTranslation } from '../hooks/useTranslation';

interface WithTranslationProps {
  children: React.ReactNode;
}

const LoadingFallback = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">{t('common.loading')}</p>
      </div>
    </div>
  );
};

export const withTranslation = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const WithTranslation: React.FC<P & WithTranslationProps> = (props) => {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <WrappedComponent {...props} />
      </Suspense>
    );
  };

  return WithTranslation;
}; 