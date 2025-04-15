import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { SEO } from '../components/SEO';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { withTranslation } from '../components/withTranslation';

type MessageStatus = 'success' | 'failed' | 'pending' | 'delivered';

interface Message {
  id: string;
  recipient: string;
  content: string;
  status: MessageStatus;
  created_at: string;
}

const Messages = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: messages, isLoading, error } = useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Message[];
    }
  });

  const filteredMessages = messages?.filter(
    (message) =>
      message.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div>{t('common.loading')}</div>;
  if (error) return <div>{t('common.error')}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <SEO 
        title={t('messages.title')}
        description={t('messages.description')}
        keywords={['messages', 'SMS', 'communication']}
        type="website"
      />
      
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t('messages.title')}</h1>
          <p className="mt-2 text-gray-600">{t('messages.description')}</p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="mb-6 flex justify-between items-center">
              <input
                type="text"
                placeholder={t('messages.search')}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="ml-4">
                <LanguageSwitcher />
              </div>
            </div>

            {filteredMessages?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">{t('common.noResults')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('messages.recipient')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('messages.content')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('messages.status')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('messages.date')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMessages?.map((message) => (
                      <tr key={message.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {message.recipient}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {message.content}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              message.status === 'success'
                                ? 'bg-green-100 text-green-800'
                                : message.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : message.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {t(`messages.statusTypes.${message.status}`)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(message.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default withTranslation(Messages); 