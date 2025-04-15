import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  MessageSquare, 
  Settings, 
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Globe,
  Server
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
import { supabase } from '../../lib/supabase';
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

export default function AdminDashboard() {
  const { data: adminStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      // TODO: Implement actual admin stats fetching
      return {
        totalUsers: 1234,
        activeUsers: 890,
        totalRevenue: 45678,
        monthlyGrowth: 15.8,
        totalMessages: 50000,
        failedMessages: 150,
        activeGateways: 8,
        systemHealth: 99.9
      };
    }
  });

  const cards = [
    { 
      name: 'Total Users', 
      value: adminStats?.totalUsers.toLocaleString() ?? 0,
      subValue: `${adminStats?.activeUsers ?? 0} active`,
      icon: Users,
      trend: '+12.5%',
      color: 'bg-blue-500'
    },
    { 
      name: 'Total Revenue', 
      value: `$${adminStats?.totalRevenue.toLocaleString() ?? 0}`,
      subValue: 'This month',
      icon: DollarSign,
      trend: '+8.2%',
      color: 'bg-green-500'
    },
    { 
      name: 'Message Volume', 
      value: adminStats?.totalMessages.toLocaleString() ?? 0,
      subValue: `${adminStats?.failedMessages ?? 0} failed`,
      icon: MessageSquare,
      trend: '+5.4%',
      color: 'bg-purple-500'
    },
    { 
      name: 'System Health', 
      value: `${adminStats?.systemHealth ?? 0}%`,
      subValue: `${adminStats?.activeGateways ?? 0} gateways active`,
      icon: Server,
      trend: '+0.1%',
      color: 'bg-indigo-500'
    }
  ];

  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: [4500, 5200, 4800, 5800, 6000, 6500],
        fill: true,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderColor: 'rgb(34, 197, 94)',
        tension: 0.4
      }
    ]
  };

  const userActivityData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Active Users',
        data: [320, 420, 380, 450, 400, 280, 250],
        backgroundColor: 'rgba(99, 102, 241, 0.8)'
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            System overview and key metrics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </button>
          <button className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500">
            <AlertTriangle className="h-4 w-4 mr-2" />
            System Alerts
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow hover:shadow-lg transition-all sm:p-6"
          >
            <div className="flex items-center">
              <div className={`${card.color} rounded-md p-3`}>
                <card.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div className="ml-4 flex-1">
                <dt className="truncate text-sm font-medium text-gray-500">{card.name}</dt>
                <dd className="mt-1">
                  <div className="text-2xl font-semibold text-gray-900">{card.value}</div>
                  <div className="flex items-baseline">
                    <div className="text-sm text-gray-500">{card.subValue}</div>
                    <div className={`ml-2 text-sm font-medium ${
                      card.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {card.trend}
                    </div>
                  </div>
                </dd>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Revenue Overview</h2>
            <select className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500">
              <option>Last 6 months</option>
              <option>Last year</option>
              <option>All time</option>
            </select>
          </div>
          <div className="h-80">
            <Line
              data={revenueData}
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
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => `$${value}`
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">User Activity</h2>
            <select className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500">
              <option>This week</option>
              <option>Last week</option>
              <option>This month</option>
            </select>
          </div>
          <div className="h-80">
            <Bar
              data={userActivityData}
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
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent System Events</h2>
          <div className="flow-root">
            <ul role="list" className="-mb-8">
              {[
                {
                  event: 'Gateway Error',
                  description: 'AWS SNS Gateway experiencing high latency',
                  time: '5 minutes ago',
                  icon: AlertTriangle,
                  iconBackground: 'bg-red-500'
                },
                {
                  event: 'New User Signup',
                  description: 'Enterprise customer from Germany',
                  time: '30 minutes ago',
                  icon: Users,
                  iconBackground: 'bg-green-500'
                },
                {
                  event: 'System Update',
                  description: 'Successfully deployed v2.1.0',
                  time: '1 hour ago',
                  icon: Settings,
                  iconBackground: 'bg-blue-500'
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
                          className={`${item.iconBackground} h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white`}
                        >
                          <item.icon className="h-5 w-5 text-white" aria-hidden="true" />
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.event}</p>
                          <p className="text-sm text-gray-500">{item.description}</p>
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
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">System Health</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-900">API Response Time</div>
                <div className="text-sm font-medium text-green-600">98ms</div>
              </div>
              <div className="mt-2 overflow-hidden rounded-full bg-gray-200">
                <div className="h-2 rounded-full bg-green-500" style={{ width: '95%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-900">Database Load</div>
                <div className="text-sm font-medium text-yellow-600">75%</div>
              </div>
              <div className="mt-2 overflow-hidden rounded-full bg-gray-200">
                <div className="h-2 rounded-full bg-yellow-500" style={{ width: '75%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-900">Memory Usage</div>
                <div className="text-sm font-medium text-blue-600">60%</div>
              </div>
              <div className="mt-2 overflow-hidden rounded-full bg-gray-200">
                <div className="h-2 rounded-full bg-blue-500" style={{ width: '60%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-900">Storage</div>
                <div className="text-sm font-medium text-purple-600">45%</div>
              </div>
              <div className="mt-2 overflow-hidden rounded-full bg-gray-200">
                <div className="h-2 rounded-full bg-purple-500" style={{ width: '45%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}