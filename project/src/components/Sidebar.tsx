import { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Disclosure } from '@headlessui/react';
import { MessageSquare, X, ChevronDown } from 'lucide-react';
import { classNames } from '../utils/classNames';
import { adminNavigation, userNavigation } from '../config/navigation';

interface SidebarProps {
  isAdmin?: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({ isAdmin, sidebarOpen, setSidebarOpen }: SidebarProps) {
  const location = useLocation();
  const navigation = isAdmin ? adminNavigation : userNavigation;

  const isActive = (href?: string) => {
    if (!href) return false;
    return location.pathname === href;
  };

  return (
    <>
      <div
        className={classNames(
          sidebarOpen ? 'block' : 'hidden',
          'lg:hidden fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-sm'
        )}
        onClick={() => setSidebarOpen(false)}
      />

      <div
        className={classNames(
          'fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-white px-4 pb-4 sm:px-6 lg:px-8',
          'transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 shrink-0 items-center">
          <Link to="/" className="flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-indigo-600" />
            <span className="text-2xl font-bold text-gray-900">SMS Speed</span>
          </Link>
          <button
            type="button"
            className="ml-auto lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-8">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            {navigation.map((item) => (
              <li key={item.name}>
                {item.children ? (
                  <Disclosure as="div" defaultOpen={item.children.some(child => isActive(child.href))}>
                    {({ open }) => (
                      <>
                        <Disclosure.Button
                          className="flex w-full items-center gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          {item.name}
                          <ChevronDown
                            className={classNames(
                              'ml-auto h-5 w-5 shrink-0 transition-transform',
                              open && 'rotate-180'
                            )}
                          />
                        </Disclosure.Button>
                        <Disclosure.Panel className="mt-1 space-y-1 px-2">
                          {item.children.map((subItem) => (
                            <Link
                              key={subItem.name}
                              to={subItem.href || ''}
                              className={classNames(
                                isActive(subItem.href)
                                  ? 'bg-gray-50 text-indigo-600'
                                  : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600',
                                'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                              )}
                            >
                              <subItem.icon className="h-5 w-5 shrink-0" />
                              {subItem.name}
                            </Link>
                          ))}
                        </Disclosure.Panel>
                      </>
                    )}
                  </Disclosure>
                ) : (
                  <Link
                    to={item.href || ''}
                    className={classNames(
                      isActive(item.href)
                        ? 'bg-gray-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600',
                      'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.name}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}