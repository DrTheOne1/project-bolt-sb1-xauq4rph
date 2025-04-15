import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { logger } from '../../utils/logger';

interface Message {
  id: string;
  message: string;
  status: string;
  recipient: string;
  created_at: string;
  user_id: string;
  scheduled_for: string | null;
  sent_at: string | null;
}

export default function Messages() {
  useEffect(() => {
    const checkAndSetAdminRole = async () => {
      try {
        // Check authentication status
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          logger.error('Session error:', sessionError);
          return;
        }

        if (!session) {
          logger.error('No active session found');
          return;
        }

        const user = session.user;
        logger.info('Current user:', { id: user.id, email: user.email });

        // Check if user exists in the users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (userError) {
          logger.error('Error checking user role:', userError);
          return;
        }

        logger.info('User role check:', { role: userData?.role });

        // If user doesn't have admin role, set it
        if (!userData || userData.role !== 'admin') {
          logger.info('Setting admin role for user');
          const { error: updateError } = await supabase
            .from('users')
            .update({ role: 'admin' })
            .eq('id', user.id);

          if (updateError) {
            logger.error('Error setting admin role:', updateError);
          } else {
            logger.info('Admin role set successfully');
          }
        }
      } catch (err) {
        logger.error('Error in checkAndSetAdminRole:', err as Error);
      }
    };

    checkAndSetAdminRole();
  }, []);

  const { data: messages, isLoading, error } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: async () => {
      try {
        // Check authentication status
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          logger.error('Session error:', sessionError);
          throw new Error('Authentication error: ' + sessionError.message);
        }

        if (!session) {
          logger.error('No active session found');
          throw new Error('Not authenticated');
        }

        const user = session.user;
        logger.info('Fetching messages for user:', { id: user.id, email: user.email });

        // Check user role
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (userError) {
          logger.error('Error checking user role:', userError);
          throw new Error('Error checking user role: ' + userError.message);
        }

        logger.info('User role:', { role: userData?.role });

        if (userData?.role !== 'admin') {
          logger.error('User is not an admin');
          throw new Error('Not authorized: User is not an admin');
        }

        // Fetch messages
        logger.info('Fetching messages...');
        const { data, error } = await supabase
          .from('messages')
          .select(`
            id,
            message,
            status,
            recipient,
            created_at,
            user_id,
            scheduled_for,
            sent_at
          `)
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (error) {
          logger.error('Error fetching messages:', error);
          console.error('Message fetch error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          throw new Error('Error fetching messages: ' + error.message);
        }
        
        logger.info('Successfully fetched messages:', { count: data?.length });
        return data as Message[];
      } catch (err) {
        logger.error('Failed to fetch messages:', err as Error);
        throw err;
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
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Message History</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all messages in the system including their status and details.
          </p>
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
                      Recipient
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Message
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Created At
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Scheduled For
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Sent At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {messages.map((message) => (
                    <tr key={message.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {message.recipient}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {message.message}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          message.status === 'sent' ? 'bg-green-100 text-green-800' :
                          message.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {message.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {format(new Date(message.created_at), 'PPpp')}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {message.scheduled_for ? format(new Date(message.scheduled_for), 'PPpp') : '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {message.sent_at ? format(new Date(message.sent_at), 'PPpp') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 