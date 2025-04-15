import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit, Package, X, Copy } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';

const subscriptionPlanSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be 0 or greater'),
  currency: z.enum(['USD', 'SEK']),
  credits: z.number().int().min(0, 'Credits must be 0 or greater'),
  overage_cost: z.number().min(0, 'Overage cost must be 0 or greater').optional(),
  billing_cycle: z.enum(['monthly', 'yearly', 'one_time']),
  features: z.array(z.string()).min(1, 'At least one feature is required'),
  is_active: z.boolean().default(true),
});

type SubscriptionPlanForm = z.infer<typeof subscriptionPlanSchema>;

export default function SubscriptionPlans() {
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [newFeature, setNewFeature] = useState('');
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<SubscriptionPlanForm>({
    resolver: zodResolver(subscriptionPlanSchema),
    defaultValues: {
      currency: 'USD',
      features: [],
      is_active: true,
    }
  });

  const features = watch('features') || [];
  const currency = watch('currency');

  const { data: plans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const addPlanMutation = useMutation({
    mutationFn: async (data: SubscriptionPlanForm) => {
      const { error } = await supabase
        .from('subscription_plans')
        .insert([data]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      setIsAddingPlan(false);
      reset();
      toast.success('Plan added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add plan: ' + error.message);
    }
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SubscriptionPlanForm }) => {
      const { error } = await supabase
        .from('subscription_plans')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      setIsEditingPlan(false);
      setSelectedPlan(null);
      reset();
      toast.success('Plan updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update plan: ' + error.message);
    }
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('Plan deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete plan: ' + error.message);
    }
  });

  const duplicatePlanMutation = useMutation({
    mutationFn: async (plan: any) => {
      const { id, created_at, updated_at, ...planData } = plan;
      
      const { data, error } = await supabase
        .from('subscription_plans')
        .insert([{
          ...planData,
          name: `${plan.name} (Copy)`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('Plan duplicated successfully');
    },
    onError: (error) => {
      toast.error('Failed to duplicate plan: ' + error.message);
    }
  });

  const onSubmit = (data: SubscriptionPlanForm) => {
    if (isEditingPlan && selectedPlan) {
      updatePlanMutation.mutate({ id: selectedPlan.id, data });
    } else {
      addPlanMutation.mutate(data);
    }
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      const updatedFeatures = [...features, newFeature.trim()];
      setValue('features', updatedFeatures);
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    const updatedFeatures = features.filter((_, i) => i !== index);
    setValue('features', updatedFeatures);
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Plan Name</label>
          <input
            type="text"
            {...register('name')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="e.g., Basic Plan"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Billing Cycle</label>
          <select
            {...register('billing_cycle')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="one_time">One Time</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Price</label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <select
              {...register('currency')}
              className="rounded-l-md border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm"
            >
              <option value="USD">USD</option>
              <option value="SEK">SEK</option>
            </select>
            <input
              type="number"
              step="0.01"
              {...register('price', { valueAsNumber: true })}
              className="block w-full rounded-none rounded-r-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="0.00"
            />
          </div>
          {errors.price && (
            <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">SMS Credits</label>
          <input
            type="number"
            {...register('credits', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="e.g., 1000"
          />
          {errors.credits && (
            <p className="mt-1 text-sm text-red-600">{errors.credits.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Overage Cost (per SMS)
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
              {currency}
            </span>
            <input
              type="number"
              step="0.001"
              {...register('overage_cost', { valueAsNumber: true })}
              className="block w-full rounded-none rounded-r-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="0.00"
            />
          </div>
          {errors.overage_cost && (
            <p className="mt-1 text-sm text-red-600">{errors.overage_cost.message}</p>
          )}
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            {...register('description')}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Describe the plan features and benefits"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">Features</label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="text"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              className="block w-full rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g., API Access"
            />
            <button
              type="button"
              onClick={handleAddFeature}
              className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Add
            </button>
          </div>
          {errors.features && (
            <p className="mt-1 text-sm text-red-600">{errors.features.message}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {features.map((feature, index) => (
              <span
                key={index}
                className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800"
              >
                {feature}
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(index)}
                  className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-indigo-600 hover:bg-indigo-200 hover:text-indigo-900 focus:outline-none"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="col-span-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('is_active')}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Active (visible to customers)
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => {
            setIsAddingPlan(false);
            setIsEditingPlan(false);
            setSelectedPlan(null);
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
          {isEditingPlan ? 'Update' : 'Add'} Plan
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Subscription Plans</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage subscription plans and pricing
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsAddingPlan(true)}
            className="flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Plan
          </button>
        </div>
      </div>

      {(isAddingPlan || isEditingPlan) && renderForm()}

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
                      Price
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Credits
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Billing Cycle
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
                  {plans?.map((plan) => (
                    <tr key={plan.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        <div className="flex items-center">
                          <Package className="h-5 w-5 mr-2 text-gray-400" />
                          {plan.name}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {plan.currency} {plan.price}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {plan.credits.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {plan.billing_cycle.charAt(0).toUpperCase() + plan.billing_cycle.slice(1)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          plan.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {plan.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => {
                            duplicatePlanMutation.mutate(plan);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                          title="Duplicate Plan"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPlan(plan);
                            setIsEditingPlan(true);
                            reset({
                              ...plan,
                              features: plan.features || []
                            });
                          }}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this plan?')) {
                              deletePlanMutation.mutate(plan.id);
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