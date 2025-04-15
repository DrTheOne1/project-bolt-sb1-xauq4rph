import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit, CreditCard, Ban as Bank } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const paymentMethodSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['bank_account', 'paypal']),
  credentials: z.object({
    bank_name: z.string().optional(),
    account_number: z.string().optional(),
    routing_number: z.string().optional(),
    paypal_email: z.string().email().optional(),
  }).refine((data) => {
    if (data.bank_name || data.account_number || data.routing_number) {
      return data.bank_name && data.account_number && data.routing_number;
    }
    return data.paypal_email;
  }, {
    message: "Please provide all required fields for the selected payment method type"
  })
});

type PaymentMethodForm = z.infer<typeof paymentMethodSchema>;

export default function PaymentMethods() {
  const [isAddingMethod, setIsAddingMethod] = useState(false);
  const [isEditingMethod, setIsEditingMethod] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<PaymentMethodForm>({
    resolver: zodResolver(paymentMethodSchema)
  });

  const methodType = watch('type');

  const { data: paymentMethods } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const addMethodMutation = useMutation({
    mutationFn: async (data: PaymentMethodForm) => {
      const { error } = await supabase
        .from('payment_methods')
        .insert([{
          name: data.name,
          type: data.type,
          credentials: data.credentials
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      setIsAddingMethod(false);
      reset();
    }
  });

  const updateMethodMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PaymentMethodForm }) => {
      const { error } = await supabase
        .from('payment_methods')
        .update({
          name: data.name,
          type: data.type,
          credentials: data.credentials
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      setIsEditingMethod(false);
      setSelectedMethod(null);
      reset();
    }
  });

  const deleteMethodMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    }
  });

  const onSubmit = (data: PaymentMethodForm) => {
    if (isEditingMethod && selectedMethod) {
      updateMethodMutation.mutate({ id: selectedMethod.id, data });
    } else {
      addMethodMutation.mutate(data);
    }
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white p-6 rounded-lg shadow">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          {...register('name')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Type</label>
        <select
          {...register('type')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="bank_account">Bank Account</option>
          <option value="paypal">PayPal</option>
        </select>
      </div>

      {methodType === 'bank_account' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bank Name</label>
            <input
              type="text"
              {...register('credentials.bank_name')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Account Number</label>
            <input
              type="text"
              {...register('credentials.account_number')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Routing Number</label>
            <input
              type="text"
              {...register('credentials.routing_number')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </>
      )}

      {methodType === 'paypal' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">PayPal Email</label>
          <input
            type="email"
            {...register('credentials.paypal_email')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      )}

      {errors.credentials && (
        <p className="mt-1 text-sm text-red-600">{errors.credentials.message}</p>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => {
            setIsAddingMethod(false);
            setIsEditingMethod(false);
            setSelectedMethod(null);
            reset();
          }}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
        >
          {isEditingMethod ? 'Update' : 'Add'} Payment Method
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Payment Methods</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage payment methods for receiving customer payments
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsAddingMethod(true)}
            className="flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Method
          </button>
        </div>
      </div>

      {(isAddingMethod || isEditingMethod) && renderForm()}

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Type
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {paymentMethods?.map((method) => (
                    <tr key={method.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        <div className="flex items-center">
                          {method.type === 'bank_account' ? (
                            <Bank className="h-5 w-5 mr-2 text-gray-400" />
                          ) : (
                            <CreditCard className="h-5 w-5 mr-2 text-gray-400" />
                          )}
                          {method.name}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {method.type === 'bank_account' ? 'Bank Account' : 'PayPal'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          method.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {method.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => {
                            setSelectedMethod(method);
                            setIsEditingMethod(true);
                            reset({
                              name: method.name,
                              type: method.type,
                              credentials: method.credentials
                            });
                          }}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this payment method?')) {
                              deleteMethodMutation.mutate(method.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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