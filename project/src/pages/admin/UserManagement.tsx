import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Edit, Shield, User as UserIcon, CreditCard, Mail, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface User {
  id: string;
  email: string;
  role: string;
  credits: number;
  gateway_id?: string;
  sender_names?: string[];
}

const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  role: z.enum(['user', 'admin']),
  gateway_id: z.string().optional(),
  sender_names: z.array(z.string()).optional()
});

type UserForm = z.infer<typeof userSchema>;

export default function UserManagement() {
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isManagingCredits, setIsManagingCredits] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'user' });
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { control: editControl, handleSubmit: handleEditSubmit, reset: resetEditForm } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
  });

  const { control: addControl } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: 'user'
    }
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: gateways, error: gatewaysError } = useQuery({
    queryKey: ['admin-gateways'],
    queryFn: async () => {
      try {
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
        
        if (error) {
          console.error('Error fetching gateways:', error);
          throw error;
        }
        
        if (!data) {
          throw new Error('No gateways found');
        }
        
        return data;
      } catch (err: any) {
        console.error('Error in gateway query:', err);
        throw err;
      }
    },
    retry: 2,
    staleTime: 30000
  });

  const addUserMutation = useMutation({
    mutationFn: async ({ email, password, role }: { email: string; password: string; role: string }) => {
      setError(null);

      // First check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        throw new Error('A user with this email already exists');
      }

      // Create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // Check if user record already exists
      const { data: existingRecord } = await supabase
        .from('users')
        .select('id')
        .eq('id', authData.user.id)
        .single();

      if (!existingRecord) {
        // Only insert if user record doesn't exist
        const { error: userError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              email,
              role,
              credits: 0,
            }
          ]);

        if (userError) throw userError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsAddingUser(false);
      setNewUser({ email: '', password: '', role: 'user' });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      setError(null);

      // Update auth email/password if changed
      if (data.email || data.password) {
        const updateData: { email?: string; password?: string } = {};
        if (data.email) updateData.email = data.email;
        if (data.password) updateData.password = data.password;

        const { error: authError } = await supabase.auth.admin.updateUserById(
          id,
          updateData
        );

        if (authError) throw authError;
      }

      // Update user profile data
      const { error: userError } = await supabase
        .from('users')
        .update({
          email: data.email,
          role: data.role,
          gateway_id: data.gateway_id || null,
          sender_names: data.sender_names || []
        })
        .eq('id', id);

      if (userError) throw userError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsEditingUser(false);
      setSelectedUser(null);
      resetEditForm();
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });

  const updateCreditsMutation = useMutation({
    mutationFn: async ({ id, credits }: { id: string; credits: number }) => {
      const { error } = await supabase
        .from('users')
        .update({ credits })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsManagingCredits(false);
      setSelectedUser(null);
      setCreditAmount(0);
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      // Delete auth user (this will cascade to the profile due to foreign key)
      const { error: authError } = await supabase.auth.admin.deleteUser(id);
      if (authError) throw authError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  const handleEditClick = (user: User) => {
    try {
      setSelectedUser(user);
      resetEditForm({
        email: user.email,
        password: '',
        role: user.role as 'user' | 'admin',
        gateway_id: user.gateway_id || '',
        sender_names: user.sender_names || []
      });
      setIsEditingUser(true);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load user data');
    }
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage user accounts and permissions
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsAddingUser(true)}
            className="flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddingUser && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50">
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">
                      Add New User
                    </h3>
                    <div className="mt-2">
                      {error && (
                        <div className="rounded-md bg-red-50 p-4 mb-4">
                          <div className="flex">
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-red-800">Error</h3>
                              <div className="mt-2 text-sm text-red-700">
                                {error}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                          </label>
                          <input
                            type="email"
                            id="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                          </label>
                          <input
                            type="password"
                            id="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                            Role
                          </label>
                          <select
                            id="role"
                            value={newUser.role}
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 space-y-2">
                  <button
                    type="button"
                    onClick={() => addUserMutation.mutate(newUser)}
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                  >
                    Add User
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingUser(false);
                      setNewUser({ email: '', password: '', role: 'user' });
                      setError(null);
                    }}
                    className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditingUser && selectedUser && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50">
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <div className="mt-3 text-left sm:mt-5">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">
                      Edit User
                    </h3>
                    <div className="mt-2">
                      {error && (
                        <div className="rounded-md bg-red-50 p-4 mb-4">
                          <div className="flex">
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-red-800">Error</h3>
                              <div className="mt-2 text-sm text-red-700">
                                {error}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {gatewaysError && (
                        <div className="rounded-md bg-yellow-50 p-4 mb-4">
                          <div className="flex">
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
                              <div className="mt-2 text-sm text-yellow-700">
                                Unable to load gateways. Please try again later or contact support.
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="edit-gateway" className="block text-sm font-medium text-gray-700 text-left">
                            Default Gateway
                          </label>
                          <Controller
                            name="gateway_id"
                            control={editControl}
                            render={({ field }) => (
                              <select
                                {...field}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                disabled={!!gatewaysError}
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
                          {gatewaysError && (
                            <p className="mt-1 text-sm text-yellow-600 text-left">
                              Gateway selection is disabled due to loading error. The current gateway will be preserved.
                            </p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="edit-sender-names" className="block text-sm font-medium text-gray-700 text-left">
                            Sender Names
                          </label>
                          <Controller
                            name="sender_names"
                            control={editControl}
                            render={({ field }) => (
                              <div className="mt-1">
                                <input
                                  type="text"
                                  {...field}
                                  value={field.value?.join(', ') || ''}
                                  onChange={(e) => {
                                    const names = e.target.value.split(',').map(name => name.trim()).filter(Boolean);
                                    field.onChange(names);
                                  }}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                  placeholder="Enter sender names separated by commas"
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                  Enter sender names separated by commas. These will be available for this user to use when sending messages.
                                </p>
                              </div>
                            )}
                          />
                        </div>
                        <div>
                          <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 text-left">
                            Email
                          </label>
                          <Controller
                            name="email"
                            control={editControl}
                            render={({ field }) => (
                              <input
                                type="email"
                                {...field}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            )}
                          />
                        </div>
                        <div>
                          <label htmlFor="edit-password" className="block text-sm font-medium text-gray-700 text-left">
                            New Password (leave blank to keep current)
                          </label>
                          <Controller
                            name="password"
                            control={editControl}
                            render={({ field }) => (
                              <input
                                type="password"
                                {...field}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            )}
                          />
                        </div>
                        <div>
                          <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 text-left">
                            Role
                          </label>
                          <Controller
                            name="role"
                            control={editControl}
                            render={({ field }) => (
                              <select
                                {...field}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                              </select>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 space-y-2">
                  <button
                    type="button"
                    onClick={handleEditSubmit((data) => updateUserMutation.mutate({ id: selectedUser.id, data }))}
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingUser(false);
                      setSelectedUser(null);
                      resetEditForm();
                      setError(null);
                    }}
                    className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Credits Modal */}
      {isManagingCredits && selectedUser && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50">
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">
                      Manage Credits
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Update credits for {selectedUser.email}
                      </p>
                      <div className="mt-4">
                        <label htmlFor="credits" className="block text-sm font-medium text-gray-700">
                          Current Credits: {selectedUser.credits}
                        </label>
                        <div className="mt-2">
                          <input
                            type="number"
                            id="credits"
                            value={creditAmount}
                            onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 space-y-2">
                  <button
                    type="button"
                    onClick={() => updateCreditsMutation.mutate({
                      id: selectedUser.id,
                      credits: selectedUser.credits + creditAmount
                    })}
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                  >
                    Add Credits
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsManagingCredits(false);
                      setSelectedUser(null);
                      setCreditAmount(0);
                    }}
                    className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
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
                      Email
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Role
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Credits
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Created At
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {users?.map((user) => (
                    <tr key={user.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {user.email}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-700/10'
                            : 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10'
                        }`}>
                          {user.role === 'admin' ? (
                            <Shield className="h-3 w-3 mr-1" />
                          ) : (
                            <UserIcon className="h-3 w-3 mr-1" />
                          )}
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {user.credits.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setIsManagingCredits(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                          title="Manage Credits"
                        >
                          <CreditCard className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditClick(user)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                          title="Edit User"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                              deleteUserMutation.mutate(user.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Delete User"
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