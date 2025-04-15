import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { logger } from '../../utils/logger';
import { Search, Filter, Download, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  message: string;
  status: string;
  recipient: string;
  created_at: string;
  user_id: string;
  scheduled_for: string | null;
  sent_at: string | null;
  user_email?: string;
  gateway_name?: string;
}

export default function Messages() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Check database connection first
  useEffect(() => {
    const checkDatabaseConnection = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('count')
          .limit(1);

        if (error) {
          console.error('Database connection error:', error);
          toast.error(`Database connection error: ${error.message}`);
        } else {
          console.log('Database connection successful');
        }
      } catch (err) {
        console.error('Error checking database connection:', err);
        toast.error('Failed to connect to database');
      }
    };

    checkDatabaseConnection();
  }, []);

  const { data: messages, isLoading, error } = useQuery<Message[]>({
    queryKey: ['admin-messages', searchQuery, statusFilter, dateRange],
    queryFn: async () => {
      try {
        console.log('Starting query with filters:', { searchQuery, statusFilter, dateRange });
        
        // First get all messages
        let query = supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false });

        // Apply search filter
        if (searchQuery) {
          query = query.or(`recipient.ilike.%${searchQuery}%,message.ilike.%${searchQuery}%`);
        }

        // Apply status filter
        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }

        // Apply date range filter
        query = query
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);

        console.log('Executing query...');
        const { data: messages, error: messagesError } = await query;

        if (messagesError) {
          console.error('Database error details:', {
            message: messagesError.message,
            code: messagesError.code,
            details: messagesError.details,
            hint: messagesError.hint
          });
          toast.error(`Database error: ${messagesError.message}`);
          throw messagesError;
        }

        // Get unique user IDs and gateway IDs
        const userIds = [...new Set(messages.map(m => m.user_id))];
        const gatewayIds = [...new Set(messages.map(m => m.gateway_id))];

        // Fetch user details
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, email')
          .in('id', userIds);

        if (usersError) {
          console.error('Error fetching users:', usersError);
        }

        // Fetch gateway details
        const { data: gateways, error: gatewaysError } = await supabase
          .from('gateways')
          .select('id, name')
          .in('id', gatewayIds);

        if (gatewaysError) {
          console.error('Error fetching gateways:', gatewaysError);
        }

        // Map user and gateway details to messages
        const messagesWithDetails = messages.map(message => ({
          ...message,
          user_email: users?.find(u => u.id === message.user_id)?.email,
          gateway_name: gateways?.find(g => g.id === message.gateway_id)?.name
        }));

        console.log('Query successful, data:', messagesWithDetails);
        return messagesWithDetails;
      } catch (error) {
        console.error('Query error details:', error);
        toast.error('Failed to fetch messages');
        throw error;
      }
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading messages</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>There was a problem loading the message history. Please try again later.</p>
              <p className="mt-1 text-xs">Error: {(error as Error).message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="rounded-md bg-yellow-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">No messages found</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>There are no messages in the system yet.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Message History</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all messages in the system including their status and details.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="Search messages..."
            />
          </div>
        </div>
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          >
            <option value="all">All Status</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Message
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Recipient
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      User
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Gateway
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-sm text-gray-500">
                        Loading messages...
                      </td>
                    </tr>
                  ) : messages?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-sm text-gray-500">
                        No messages found
                      </td>
                    </tr>
                  ) : (
                    messages?.map((message) => (
                      <tr key={message.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          <div className="flex items-center">
                            <MessageSquare className="h-5 w-5 mr-2 text-gray-400" />
                            <span className="truncate max-w-xs">{message.message}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {message.recipient}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {message.user_email || 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {message.gateway_name || 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            message.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            message.status === 'failed' ? 'bg-red-100 text-red-800' :
                            message.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {format(new Date(message.created_at), 'MMM d, yyyy HH:mm')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 