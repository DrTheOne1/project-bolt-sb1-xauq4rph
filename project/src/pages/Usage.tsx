import { useQuery } from '@tanstack/react-query';
import { BarChart2, MessageSquare, Users, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Usage() {
  const { data: usageStats } = useQuery({
    queryKey: ['usage-stats'],
    queryFn: async () => {
      // Implement actual usage stats fetching
      return {
        messagesThisMonth: 1234,
        totalCredits: 5000,
        usedCredits: 1234,
        activeContacts: 567,
      };
    },
  });

  const stats = [
    {
      name: 'Messages This Month',
      value: usageStats?.messagesThisMonth.toLocaleString() || '0',
      icon: MessageSquare,
    },
    {
      name: 'Total Credits',
      value: usageStats?.totalCredits.toLocaleString() || '0',
      icon: BarChart2,
    },
    {
      name: 'Used Credits',
      value: usageStats?.usedCredits.toLocaleString() || '0',
      icon: Clock,
    },
    {
      name: 'Active Contacts',
      value: usageStats?.activeContacts.toLocaleString() || '0',
      icon: Users,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Usage Statistics</h1>

      <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-12 shadow sm:px-6 sm:pt-6"
          >
            <dt>
              <div className="absolute rounded-md bg-indigo-500 p-3">
                <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{stat.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">
            Credit Usage History
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Track your credit usage over time.</p>
          </div>
          <div className="mt-5">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Date
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Messages Sent
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Credits Used
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {/* Add usage history rows here */}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}