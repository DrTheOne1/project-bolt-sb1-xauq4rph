import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import UserRoute from './components/UserRoute';
import { LogViewer } from './components/LogViewer';

// User pages
import Dashboard from './pages/Dashboard';
import SendSMS from './pages/SendSMS';
import BulkSend from './pages/BulkSend';
import Contacts from './pages/Contacts';
import Groups from './pages/Groups';
import ImportContacts from './pages/ImportContacts';
import Templates from './pages/Templates';
import Scheduled from './pages/Scheduled';
import History from './pages/History';
import Analytics from './pages/Analytics';
import Usage from './pages/Usage';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ActivationSuccess from './pages/auth/ActivationSuccess';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import GatewayManagement from './pages/admin/GatewayManagement';
import GatewayRoutes from './pages/admin/GatewayRoutes';
import GatewayLogs from './pages/admin/GatewayLogs';
import PaymentMethods from './pages/admin/PaymentMethods';
import SubscriptionPlans from './pages/admin/SubscriptionPlans';
import Messages from './pages/admin/Messages';

const AppRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/activation-success" element={<ActivationSuccess />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            {/* Admin routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/messages" element={<Messages />} />
              <Route path="/admin/send-sms" element={<SendSMS />} />
              <Route path="/admin/settings" element={<Settings />} />
              <Route path="/admin/logs" element={<LogViewer />} />
              <Route path="/admin/gateways" element={<GatewayManagement />} />
              <Route path="/admin/gateway-routes" element={<GatewayRoutes />} />
              <Route path="/admin/gateway-logs" element={<GatewayLogs />} />
              <Route path="/admin/payment-methods" element={<PaymentMethods />} />
              <Route path="/admin/subscription-plans" element={<SubscriptionPlans />} />
            </Route>

            {/* User routes */}
            <Route element={<UserRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/send" element={<SendSMS />} />
              <Route path="/bulk-send" element={<BulkSend />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/import-contacts" element={<ImportContacts />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/scheduled" element={<Scheduled />} />
              <Route path="/history" element={<History />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/usage" element={<Usage />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
        </Route>
      </Routes>
      <Toaster position="top-right" />
    </>
  );
};

export default AppRoutes; 