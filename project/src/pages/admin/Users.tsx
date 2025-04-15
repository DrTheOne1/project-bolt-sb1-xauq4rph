import { useTranslation } from 'react-i18next';

export default function Users() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('admin.users.title')}</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-600 dark:text-gray-400">
          {t('admin.users.comingSoon')}
        </p>
      </div>
    </div>
  );
} 