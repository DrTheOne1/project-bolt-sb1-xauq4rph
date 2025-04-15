import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function GatewayRoutes() {
  const [isAddingRoute, setIsAddingRoute] = useState(false);
  const [newRoute, setNewRoute] = useState({
    gateway_id: '',
    country_codes: [''],
    priority: 1
  });
  const queryClient = useQueryClient();

  const { data: gateways } = useQuery({
    queryKey: ['gateways'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gateways')
        .select('*')
        .eq('status', 'active') // Changed from is_active to status
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: routes } = useQuery({
    queryKey: ['gateway-routes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gateway_routes')
        .select(`
          *,
          gateway:gateways (
            name
          )
        `)
        .order('priority', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const addRouteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('gateway_routes')
        .insert([newRoute]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateway-routes'] });
      setIsAddingRoute(false);
      setNewRoute({ gateway_id: '', country_codes: [''], priority: 1 });
    }
  });

  const deleteRouteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('gateway_routes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateway-routes'] });
    }
  });

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Gateway Routes</h1>
          <p className="mt-2 text-sm text-gray-700">
            Configure routing rules for different countries
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsAddingRoute(true)}
            className="flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Route
          </button>
        </div>
      </div>

      {isAddingRoute && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              Add New Route
            </h3>
            <div className="mt-5">
              <div className="rounded-md bg-gray-50 p-4">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="gateway" className="block text-sm font-medium text-gray-700">
                      Gateway
                    </label>
                    <select
                      id="gateway"
                      value={newRoute.gateway_id}
                      onChange={(e) => setNewRoute({ ...newRoute, gateway_id: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="">Select a gateway</option>
                      {gateways?.map((gateway) => (
                        <option key={gateway.id} value={gateway.id}>
                          {gateway.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="country_codes" className="block text-sm font-medium text-gray-700">
                      Country Codes
                    </label>
                    <input
                      type="text"
                      id="country_codes"
                      value={newRoute.country_codes.join(', ')}
                      onChange={(e) => setNewRoute({ 
                        ...newRoute, 
                        country_codes: e.target.value.split(',').map(code => code.trim()).filter(Boolean)
                      })}
                      placeholder="e.g., US, GB, SE"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                      Priority
                    </label>
                    <input
                      type="number"
                      id="priority"
                      value={newRoute.priority}
                      onChange={(e) => setNewRoute({ ...newRoute, priority: parseInt(e.target.value) })}
                      min="1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsAddingRoute(false)}
                      className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => addRouteMutation.mutate()}
                      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Gateway
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Country Codes
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Priority
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {routes?.map((route) => (
                    <tr key={route.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {route.gateway.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {route.country_codes.join(', ')}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {route.priority}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => deleteRouteMutation.mutate(route.id)}
                          className="text-red-600 hover:text-red-900 mr-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button className="text-indigo-600 hover:text-indigo-900">
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