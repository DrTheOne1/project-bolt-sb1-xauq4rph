import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, Wallet, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PhoneInput from '../components/PhoneInput';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';

interface User {
  credits: number;
}

interface GatewayCredits {
  balance: number;
  currency: string;
}

const sendSMSSchema = z.object({
  gateway_id: z.string().min(1, 'Gateway is required'),
  sender_id: z.string().min(1, 'Sender is required'),
  recipient: z.string().min(1, 'Recipient is required'),
  message: z.string().min(1, 'Message is required').max(160, 'Message must be less than 160 characters'),
  scheduledFor: z.string().optional(),
});

type SendSMSForm = z.infer<typeof sendSMSSchema>;

export default function SendSMS() {
  const [loading, setLoading] = useState(false);

  const { data: user } = useQuery<User>({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('users')
        .select('credits')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    }
  });

  const { data: gateways } = useQuery({
    queryKey: ['active-gateways'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gateways')
        .select(`
          id,
          name,
          provider,
          status,
          credentials
        `)
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const { control, handleSubmit, watch, formState: { errors }, reset } = useForm<SendSMSForm>({
    resolver: zodResolver(sendSMSSchema),
  });

  const selectedGatewayId = watch('gateway_id');
  const selectedGatewayData = gateways?.find(g => g.id === selectedGatewayId);

  // Get gateway credits with proper error handling and caching
  const { data: gatewayCredits, error: creditsError } = useQuery({
    queryKey: ['gateway-credits', selectedGatewayId] as const,
    queryFn: async (): Promise<GatewayCredits | null> => {
      if (!selectedGatewayId) return null;

      const gateway = gateways?.find(g => g.id === selectedGatewayId);
      if (!gateway || gateway.provider !== 'twilio') return null;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('No access token found');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-twilio-credits?gateway_id=${selectedGatewayId}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch gateway credits');
      }

      const data = await response.json();
      return data as GatewayCredits;
    },
    enabled: !!selectedGatewayId && gateways?.find(g => g.id === selectedGatewayId)?.provider === 'twilio',
    refetchInterval: 60000, // Refresh every minute
    retry: 2,
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  const onSubmit = async (data: SendSMSForm) => {
    try {
      if (!gatewayCredits || gatewayCredits.balance <= 0) {
        toast.error('Insufficient gateway balance. Please contact your administrator.', {
          duration: 5000,
          style: {
            background: '#EF4444',
            color: '#fff',
          },
        });
        return;
      }

      setLoading(true);

      // First create the message record
      const { data: messageData, error: dbError } = await supabase.from('messages').insert({
        gateway_id: data.gateway_id,
        recipient: data.recipient,
        message: data.message,
        scheduled_for: data.scheduledFor || null,
        status: data.scheduledFor ? 'pending' : 'sent'
      }).select().single();

      if (dbError) throw dbError;

      if (!data.scheduledFor) {
        // Send immediately via Twilio
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error('No access token found');

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-twilio-sms`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              gateway_id: data.gateway_id,
              sender_id: data.sender_id,
              recipient: data.recipient,
              message: data.message,
            }),
          }
        );

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to send message');
        }
      }

      reset();
      toast.success(data.scheduledFor ? 'Message scheduled successfully!' : 'Message sent successfully!', {
        duration: 3000,
        style: {
          background: '#10B981',
          color: '#fff',
        },
      });
    } catch (err: any) {
      console.error('Error:', err);
      toast.error(err.message || 'Failed to send message. Please try again.', {
        duration: 5000,
        style: {
          background: '#EF4444',
          color: '#fff',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Send SMS</h1>
          <p className="mt-2 text-sm text-gray-700">
            Send messages through configured gateways
          </p>
        </div>
        <div className="mt-4 sm:mt-0 space-y-2">
          <div className="flex items-center bg-white rounded-lg shadow px-4 py-2">
            <CreditCard className="h-5 w-5 text-indigo-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-gray-900">Your Credits</p>
              <p className="text-lg font-semibold text-indigo-600">
                {user?.credits?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
          {selectedGatewayId && (
            <div className="flex items-center bg-white rounded-lg shadow px-4 py-2">
              <Wallet className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-900">Gateway Balance</p>
                {creditsError ? (
                  <p className="text-sm text-red-600">Error loading balance</p>
                ) : !gatewayCredits ? (
                  <p className="text-sm text-gray-500">Loading...</p>
                ) : (
                  <p className="text-lg font-semibold text-green-600">
                    {gatewayCredits.balance} {gatewayCredits.currency}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6 bg-white p-6 rounded-lg shadow">
        {(!user?.credits || user.credits <= 0) && (
          <div className="rounded-md bg-yellow-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Insufficient Credits</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  You have no credits remaining. Please purchase more credits to continue sending messages.
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="gateway" className="block text-sm font-medium text-gray-700">
            Gateway
          </label>
          <Controller
            name="gateway_id"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select a gateway</option>
                {gateways?.map((gateway) => (
                  <option key={gateway.id} value={gateway.id}>
                    {gateway.name} ({gateway.provider})
                  </option>
                ))}
              </select>
            )}
          />
          {errors.gateway_id && (
            <p className="mt-1 text-sm text-red-600">{errors.gateway_id.message}</p>
          )}
        </div>

        {selectedGatewayData && (
          <div>
            <label htmlFor="sender" className="block text-sm font-medium text-gray-700">
              Sender ID
            </label>
            <Controller
              name="sender_id"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select a sender ID</option>
                  <option value={selectedGatewayData.credentials.sender_number}>
                    {selectedGatewayData.credentials.sender_number}
                  </option>
                </select>
              )}
            />
            {errors.sender_id && (
              <p className="mt-1 text-sm text-red-600">{errors.sender_id.message}</p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="recipient" className="block text-sm font-medium text-gray-700">
            Recipient Phone Number
          </label>
          <Controller
            name="recipient"
            control={control}
            render={({ field }) => (
              <PhoneInput
                value={field.value}
                onChange={field.onChange}
                error={errors.recipient?.message}
              />
            )}
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">
            Message
          </label>
          <Controller
            name="message"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            )}
          />
          {errors.message && (
            <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="scheduledFor" className="block text-sm font-medium text-gray-700">
            Schedule For (Optional)
          </label>
          <Controller
            name="scheduledFor"
            control={control}
            render={({ field }) => (
              <input
                type="datetime-local"
                {...field}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            )}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !selectedGatewayId || !gatewayCredits || gatewayCredits.balance <= 0}
          className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          <Send className="h-4 w-4 mr-2" />
          {loading ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
}