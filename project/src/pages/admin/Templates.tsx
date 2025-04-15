import { useTranslation } from 'react-i18next';

const AdminTemplates: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        {t('navigation.templates')}
      </h1>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <p className="text-gray-600 dark:text-gray-300">
          {t('admin.templates.comingSoon')}
        </p>
      </div>
    </div>
  );
};

export default AdminTemplates; 