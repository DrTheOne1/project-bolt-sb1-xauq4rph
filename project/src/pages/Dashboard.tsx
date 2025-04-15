import { useQuery } from '@tanstack/react-query';
import { 
  MessageSquare, 
  Users, 
  Clock, 
  CheckCircle, 
  Globe, 
  TrendingUp, 
  AlertTriangle,
  BarChart2,
  Phone,
  DollarSign
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // TODO: Implement actual stats fetching
      return {
        totalMessages: 1234,
        deliveryRate: 98.5,
        activeContacts: 567,
        scheduledMessages: 12,
        internationalReach: 45,
        failureRate: 1.5,
        averageDeliveryTime: '2.3s',
        monthlyGrowth: 15.8
      };
    }
  });

  const { data: countryStats } = useQuery({
    queryKey: ['country-stats'],
    queryFn: async () => {
      // TODO: Implement actual country stats fetching
      return [
        { country: 'United States', messages: 450, success: 98 },
        { country: 'United Kingdom', messages: 320, success: 97 },
        { country: 'Germany', messages: 280, success: 99 },
        { country: 'France', messages: 250, success: 98 },
        { country: 'Japan', messages: 220, success: 99 }
      ];
    }
  });

  const cards = [
    { name: 'Total Messages', value: stats?.totalMessages.toLocaleString() ?? 0, icon: MessageSquare, trend: '+12.5%' },
    { name: 'Delivery Rate', value: `${stats?.deliveryRate ?? 0}%`, icon: CheckCircle, trend: '+0.8%' },
    { name: 'Active Contacts', value: stats?.activeContacts.toLocaleString() ?? 0, icon: Users, trend: '+5.2%' },
    { name: 'Scheduled Messages', value: stats?.scheduledMessages ?? 0, icon: Clock, trend: '-2.1%' },
    { name: 'International Reach', value: `${stats?.internationalReach ?? 0} countries`, icon: Globe, trend: '+3.4%' },
    { name: 'Monthly Growth', value: `${stats?.monthlyGrowth ?? 0}%`, icon: TrendingUp, trend: '+2.3%' },
    { name: 'Failure Rate', value: `${stats?.failureRate ?? 0}%`, icon: AlertTriangle, trend: '-0.3%' },
    { name: 'Avg. Delivery Time', value: stats?.averageDeliveryTime ?? '0s', icon: Clock, trend: '-0.1s' }
  ];

  const deliveryData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Message Volume',
        data: [65, 59, 80, 81, 56, 55],
        fill: true,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderColor: 'rgb(99, 102, 241)',
        tension: 0.4
      }
    ]
  };

  const countryData = {
    labels: countryStats?.map(stat => stat.country) ?? [],
    datasets: [
      {
        label: 'Messages Sent',
        data: countryStats?.map(stat => stat.messages) ?? [],
        backgroundColor: 'rgba(99, 102, 241, 0.8)'
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <select className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 3 months</option>
            <option>Last year</option>
          </select>
          <button className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
            Download Report
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow transition-all hover:shadow-lg sm:p-6"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <card.icon className="h-8 w-8 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">{card.name}</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{card.value}</div>
                    <div className={`ml-2 text-sm font-medium ${
                      card.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {card.trend}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Message Volume Trend</h2>
          <div className="h-80">
            <Line
              data={deliveryData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Top Countries</h2>
          <div className="h-80">
            <Bar
              data={countryData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          <div className="mt-4">
            <div className="flow-root">
              <ul role="list" className="-mb-8">
                {[
                  {
                    content: 'Bulk message campaign completed',
                    target: '5000 recipients',
                    icon: MessageSquare,
                    iconBackground: 'bg-indigo-500',
                    time: '3 mins ago'
                  },
                  {
                    content: 'New gateway added',
                    target: 'AWS SNS Integration',
                    icon: Phone,
                    iconBackground: 'bg-green-500',
                    time: '1 hour ago'
                  },
                  {
                    content: 'Credits purchased',
                    target: '10,000 credits',
                    icon: DollarSign,
                    iconBackground: 'bg-blue-500',
                    time: '2 hours ago'
                  }
                ].map((item, itemIdx) => (
                  <li key={itemIdx}>
                    <div className="relative pb-8">
                      {itemIdx !== 2 ? (
                        <span
                          className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span
                            className={`${
                              item.iconBackground
                            } h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white`}
                          >
                            <item.icon className="h-5 w-5 text-white" aria-hidden="true" />
                          </span>
                        </div>
                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                          <div>
                            <p className="text-sm text-gray-500">
                              {item.content}{' '}
                              <span className="font-medium text-gray-900">{item.target}</span>
                            </p>
                          </div>
                          <div className="whitespace-nowrap text-right text-sm text-gray-500">
                            {item.time}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6">
              <button className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                View all activity
                <span aria-hidden="true"> &rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}