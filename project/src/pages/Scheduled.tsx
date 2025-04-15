import { useQuery, useMutation } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';

export default function Scheduled() {
  const { data: messages, refetch } = useQuery({
    queryKey: ['scheduled-messages'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('status', 'pending')
          .not('scheduled_for', 'is', null)
          .order('scheduled_for', { ascending: true });
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error fetching scheduled messages:', error);
        throw new Error('Failed to load scheduled messages');
      }
    },
  });

  const cancelMessageMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase
          .from('messages')
          .delete()
          .eq('id', id);

        if (error) throw error;
      } catch (error) {
        console.error('Error canceling message:', error);
        throw new Error('Failed to cancel message');
      }
    },
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      alert(error.message);
    }
  });

  const handleCancelMessage = async (id: string) => {
    try {
      await cancelMessageMutation.mutateAsync(id);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  if (!messages) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading scheduled messages...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Scheduled Messages</h1>
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              {messages.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No scheduled messages found
                </div>
              ) : (
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
                        Scheduled For
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
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
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {format(new Date(message.scheduled_for), 'PPpp')}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => handleCancelMessage(message.id)}
                            className="text-red-600 hover:text-red-900 transition-colors duration-200"
                            disabled={cancelMessageMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}