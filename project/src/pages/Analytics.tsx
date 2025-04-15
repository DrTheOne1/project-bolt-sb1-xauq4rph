import { useQuery } from '@tanstack/react-query';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { format, subDays } from 'date-fns';
import { 
  MessageSquare, 
  Globe, 
  TrendingUp, 
  AlertTriangle,
  Download,
  Filter
} from 'lucide-react';
import { supabase } from '../lib/supabase';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Analytics() {
  const { data: messageStats } = useQuery({
    queryKey: ['message-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('status, sent_at')
        .order('sent_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    return format(subDays(new Date(), i), 'MMM dd');
  }).reverse();

  const deliveryTrendData = {
    labels: last7Days,
    datasets: [
      {
        label: 'Messages Sent',
        data: [65, 59, 80, 81, 56, 55, 70],
        fill: true,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderColor: 'rgb(99, 102, 241)',
        tension: 0.4
      },
      {
        label: 'Delivery Rate',
        data: [98, 96, 95, 97, 98, 99, 97],
        fill: false,
        borderColor: 'rgb(34, 197, 94)',
        tension: 0.4
      }
    ]
  };

  const countryData = {
    labels: ['USA', 'UK', 'Germany', 'France', 'Japan'],
    datasets: [
      {
        data: [30, 20, 15, 12, 10],
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(168, 85, 247, 0.8)'
        ]
      }
    ]
  };

  const statusData = {
    labels: ['Delivered', 'Failed', 'Pending'],
    datasets: [
      {
        data: [85, 5, 10],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(234, 179, 8, 0.8)'
        ]
      }
    ]
  };

  const stats = [
    { name: 'Total Messages', value: '12,345', change: '+12.5%', changeType: 'increase' },
    { name: 'Delivery Rate', value: '98.5%', change: '+0.8%', changeType: 'increase' },
    { name: 'Failed Messages', value: '23', change: '-2.1%', changeType: 'decrease' },
    { name: 'Avg Response Time', value: '2.3s', change: '-0.2s', changeType: 'decrease' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 3 months</option>
              <option>Last year</option>
            </select>
          </div>
          <button className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow hover:shadow-lg transition-shadow sm:p-6"
          >
            <dt className="truncate text-sm font-medium text-gray-500">{stat.name}</dt>
            <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
              <div className="flex items-baseline text-2xl font-semibold text-gray-900">
                {stat.value}
                <span className="ml-2 text-sm font-medium text-gray-500">from last period</span>
              </div>

              <div className={`inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-medium md:mt-2 lg:mt-0 ${
                stat.changeType === 'increase'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {stat.change}
              </div>
            </dd>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Delivery Trends</h2>
          <div className="h-80">
            <Line
              data={deliveryTrendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top'
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
          <h2 className="text-lg font-medium text-gray-900 mb-4">Message Status Distribution</h2>
          <div className="h-80">
            <Doughnut
              data={statusData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top'
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                    display: false
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
          <h2 className="text-lg font-medium text-gray-900 mb-4">Detailed Metrics</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="text-sm font-medium text-gray-500">Peak Hours</h3>
                <p className="mt-2 text-lg font-semibold text-gray-900">2 PM - 4 PM</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="text-sm font-medium text-gray-500">Busiest Day</h3>
                <p className="mt-2 text-lg font-semibold text-gray-900">Wednesday</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="text-sm font-medium text-gray-500">Avg. Response Rate</h3>
                <p className="mt-2 text-lg font-semibold text-gray-900">15%</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="text-sm font-medium text-gray-500">Cost per Message</h3>
                <p className="mt-2 text-lg font-semibold text-gray-900">$0.012</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}