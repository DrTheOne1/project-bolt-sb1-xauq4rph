import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
      <div className="mx-auto max-w-max">
        <main className="sm:flex">
          <p className="text-4xl font-bold tracking-tight text-blue-600 sm:text-5xl">404</p>
          <div className="sm:mr-6">
            <div className="sm:border-r sm:border-gray-200 sm:pr-6">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                {t('errors.pageNotFound')}
              </h1>
              <p className="mt-1 text-base text-gray-500">
                {t('errors.pageNotFoundDescription')}
              </p>
            </div>
            <div className="mt-10 flex space-x-3 sm:border-r sm:border-gray-200 sm:pr-6">
              <Link
                to="/"
                className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {t('common.goHome')}
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 