import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit, Power, PowerOff, Wallet } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function GatewayManagement() {
  const [isAddingGateway, setIsAddingGateway] = useState(false);
  const [isEditingGateway, setIsEditingGateway] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [gatewayConfig, setGatewayConfig] = useState<Record<string, string>>({});
  const [gatewayName, setGatewayName] = useState('');
  const [selectedGateway, setSelectedGateway] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: providers } = useQuery({
    queryKey: ['gateway-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gateway_providers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: gateways } = useQuery({
    queryKey: ['gateways'],
    queryFn: async () => {
      const { data: gatewaysData, error: gatewaysError } = await supabase
        .from('gateways')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (gatewaysError) throw gatewaysError;

      const { data: providersData, error: providersError } = await supabase
        .from('gateway_providers')
        .select('name, code');

      if (providersError) throw providersError;

      return gatewaysData.map(gateway => ({
        ...gateway,
        provider: providersData.find(p => p.code === gateway.provider) || { name: 'Unknown', code: gateway.provider }
      }));
    }
  });

  const { data: gatewayBalances } = useQuery({
    queryKey: ['gateway-balances'],
    queryFn: async () => {
      if (!gateways) return {};

      const balances: Record<string, { balance: number; currency: string }> = {};

      for (const gateway of gateways) {
        if (gateway.provider.code === 'twilio') {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) continue;

            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-twilio-credits?gateway_id=${gateway.id}`,
              {
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (response.ok) {
              const data = await response.json();
              balances[gateway.id] = data;
            }
          } catch (error) {
            console.error(`Error fetching balance for gateway ${gateway.id}:`, error);
          }
        }
      }

      return balances;
    },
    enabled: !!gateways,
    refetchInterval: 300000, // Refresh every 5 minutes
    staleTime: 60000, // Consider data stale after 1 minute
    cacheTime: 300000, // Keep data in cache for 5 minutes
    retry: 3, // Retry failed requests 3 times
  });

  const addGatewayMutation = useMutation({
    mutationFn: async () => {
      setError(null);
      const selectedProviderData = providers?.find(p => p.code === selectedProvider);
      
      if (!selectedProviderData) {
        throw new Error('Please select a provider');
      }

      const configSchema = selectedProviderData.config_schema;
      const requiredFields = configSchema.required || [];
      
      // Validate required fields
      for (const field of requiredFields) {
        if (!gatewayConfig[field]) {
          throw new Error(`${field} is required`);
        }

        // Validate field format if validation exists
        const validation = configSchema.validation?.[field];
        if (validation?.pattern) {
          const regex = new RegExp(validation.pattern);
          if (!regex.test(gatewayConfig[field])) {
            throw new Error(validation.message || `Invalid ${field} format`);
          }
        }

        if (validation?.enum && !validation.enum.includes(gatewayConfig[field])) {
          throw new Error(validation.message || `Invalid ${field} value`);
        }
      }

      const { error: dbError } = await supabase.from('gateways').insert({
        provider: selectedProvider,
        name: gatewayName,
        credentials: gatewayConfig,
        status: 'inactive'
      });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateways'] });
      setIsAddingGateway(false);
      setSelectedProvider('');
      setGatewayConfig({});
      setGatewayName('');
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    }
  });

  const updateGatewayMutation = useMutation({
    mutationFn: async () => {
      setError(null);
      const selectedProviderData = providers?.find(p => p.code === selectedGateway.provider.code);
      
      if (!selectedProviderData) {
        throw new Error('Invalid provider');
      }

      const configSchema = selectedProviderData.config_schema;
      const requiredFields = configSchema.required || [];
      
      // Validate required fields
      for (const field of requiredFields) {
        if (!gatewayConfig[field]) {
          throw new Error(`${field} is required`);
        }

        // Validate field format if validation exists
        const validation = configSchema.validation?.[field];
        if (validation?.pattern) {
          const regex = new RegExp(validation.pattern);
          if (!regex.test(gatewayConfig[field])) {
            throw new Error(validation.message || `Invalid ${field} format`);
          }
        }

        if (validation?.enum && !validation.enum.includes(gatewayConfig[field])) {
          throw new Error(validation.message || `Invalid ${field} value`);
        }
      }

      const { error: dbError } = await supabase
        .from('gateways')
        .update({
          name: gatewayName,
          credentials: gatewayConfig
        })
        .eq('id', selectedGateway.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateways'] });
      setIsEditingGateway(false);
      setSelectedGateway(null);
      setGatewayConfig({});
      setGatewayName('');
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    }
  });

  const toggleGatewayMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('gateways')
        .update({ status: isActive ? 'inactive' : 'active' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateways'] });
    }
  });

  const deleteGatewayMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('gateways')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateways'] });
    }
  });

  const handleEditGateway = (gateway: any) => {
    setSelectedGateway(gateway);
    setGatewayName(gateway.name);
    setGatewayConfig(gateway.credentials);
    setIsEditingGateway(true);
  };

  const selectedProviderConfig = isEditingGateway 
    ? providers?.find(p => p.code === selectedGateway?.provider.code)?.config_schema
    : providers?.find(p => p.code === selectedProvider)?.config_schema;

  const renderGatewayForm = (isEditing: boolean) => (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-base font-semibold leading-6 text-gray-900">
          {isEditing ? 'Edit Gateway' : 'Add New Gateway'}
        </h3>
        <div className="mt-5">
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-md bg-gray-50 p-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Gateway Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={gatewayName}
                  onChange={(e) => setGatewayName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>

              {!isEditing && (
                <div>
                  <label htmlFor="provider" className="block text-sm font-medium text-gray-700">
                    Provider
                  </label>
                  <select
                    id="provider"
                    value={selectedProvider}
                    onChange={(e) => {
                      setSelectedProvider(e.target.value);
                      setGatewayConfig({});
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="">Select a provider</option>
                    {providers?.map((provider) => (
                      <option key={provider.id} value={provider.code}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedProviderConfig && (
                <div className="space-y-4">
                  {selectedProviderConfig.required.map((field: string) => (
                    <div key={field}>
                      <label htmlFor={field} className="block text-sm font-medium text-gray-700">
                        {field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </label>
                      {selectedProviderConfig.validation?.[field]?.enum ? (
                        <select
                          id={field}
                          value={gatewayConfig[field] || ''}
                          onChange={(e) => setGatewayConfig({ ...gatewayConfig, [field]: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          required
                        >
                          <option value="">Select {field.split('_').join(' ')}</option>
                          {selectedProviderConfig.validation[field].enum.map((option: string) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.includes('password') || field.includes('token') || field.includes('secret') ? 'password' : 'text'}
                          id={field}
                          value={gatewayConfig[field] || ''}
                          onChange={(e) => setGatewayConfig({ ...gatewayConfig, [field]: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          required
                        />
                      )}
                    </div>
                  ))}

                  {selectedProviderConfig.optional?.map((field: string) => (
                    <div key={field}>
                      <label htmlFor={field} className="block text-sm font-medium text-gray-700">
                        {field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} (Optional)
                      </label>
                      {selectedProviderConfig.validation?.[field]?.enum ? (
                        <select
                          id={field}
                          value={gatewayConfig[field] || ''}
                          onChange={(e) => setGatewayConfig({ ...gatewayConfig, [field]: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="">Select {field.split('_').join(' ')}</option>
                          {selectedProviderConfig.validation[field].enum.map((option: string) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.includes('password') || field.includes('token') || field.includes('secret') ? 'password' : 'text'}
                          id={field}
                          value={gatewayConfig[field] || ''}
                          onChange={(e) => setGatewayConfig({ ...gatewayConfig, [field]: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    if (isEditing) {
                      setIsEditingGateway(false);
                      setSelectedGateway(null);
                    } else {
                      setIsAddingGateway(false);
                      setSelectedProvider('');
                    }
                    setGatewayConfig({});
                    setGatewayName('');
                    setError(null);
                  }}
                  className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => isEditing ? updateGatewayMutation.mutate() : addGatewayMutation.mutate()}
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  {isEditing ? 'Save Changes' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Gateway Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Configure and manage SMS gateway providers
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsAddingGateway(true)}
            className="flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Gateway
          </button>
        </div>
      </div>

      {isAddingGateway && renderGatewayForm(false)}
      {isEditingGateway && renderGatewayForm(true)}

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
                      Provider
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Balance
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
                  {gateways?.map((gateway) => (
                    <tr key={gateway.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {gateway.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {gateway.provider.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {gatewayBalances?.[gateway.id] ? (
                          <div className="flex items-center text-green-600">
                            <Wallet className="h-4 w-4 mr-1" />
                            {gatewayBalances[gateway.id].balance} {gatewayBalances[gateway.id].currency}
                          </div>
                        ) : (
                          <span className="text-gray-400">Not available</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          gateway.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {gateway.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => toggleGatewayMutation.mutate({ id: gateway.id, isActive: gateway.status === 'active' })}
                          className={`mr-2 ${gateway.status === 'active' ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'}`}
                        >
                          {gateway.status === 'active' ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => deleteGatewayMutation.mutate(gateway.id)}
                          className="text-red-600 hover:text-red-900 mr-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditGateway(gateway)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit className="h-4 w-4" />
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