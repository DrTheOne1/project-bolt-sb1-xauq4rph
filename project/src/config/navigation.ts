import { 
  Home, 
  MessageSquare, 
  Users, 
  FileText, 
  Clock, 
  Settings,
  Upload,
  UserPlus,
  BarChart2,
  CreditCard,
  Server,
  Route,
  Activity,
  UserCog,
  Send,
  Wallet,
  Package
} from 'lucide-react';

interface NavigationItem {
  name: string;
  href?: string;
  icon: any;
  children?: NavigationItem[];
}

export const userNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: Home },
  { 
    name: 'Messaging',
    icon: MessageSquare,
    children: [
      { name: 'Send SMS', href: '/send', icon: MessageSquare },
      { name: 'Bulk Send', href: '/bulk-send', icon: Upload },
      { name: 'Scheduled', href: '/scheduled', icon: Clock },
      { name: 'Messages', href: '/messages', icon: MessageSquare },
    ]
  },
  {
    name: 'Contacts',
    icon: Users,
    children: [
      { name: 'All Contacts', href: '/contacts', icon: Users },
      { name: 'Groups', href: '/groups', icon: UserPlus },
      { name: 'Import', href: '/import-contacts', icon: Upload },
    ]
  },
  { name: 'Templates', href: '/templates', icon: FileText },
  {
    name: 'Reports',
    icon: BarChart2,
    children: [
      { name: 'Analytics', href: '/analytics', icon: BarChart2 },
      { name: 'Usage', href: '/usage', icon: CreditCard },
      { name: 'Billing', href: '/billing', icon: CreditCard },
    ]
  },
  { name: 'Settings', href: '/settings', icon: Settings }
];

export const adminNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'User Management', href: '/admin/users', icon: UserCog },
  { name: 'Gateway Management', href: '/admin/gateways', icon: Server },
  { name: 'Gateway Routes', href: '/admin/gateway-routes', icon: Route },
  { name: 'Gateway Logs', href: '/admin/gateway-logs', icon: Activity },
  { name: 'Test SMS', href: '/admin/test-sms', icon: Send },
  { name: 'Payment Methods', href: '/admin/payment-methods', icon: Wallet },
  { name: 'Subscription Plans', href: '/admin/subscription-plans', icon: Package },
  { name: 'Messages', href: '/admin/messages', icon: MessageSquare },
];