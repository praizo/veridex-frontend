import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import InvoiceListPage from './pages/invoices/InvoiceListPage';
import InvoiceCreatePage from './pages/invoices/InvoiceCreatePage';
import InvoiceDetailPage from './pages/invoices/InvoiceDetailPage';
import CustomerListPage from './pages/customers/CustomerListPage';
import ProductListPage from './pages/products/ProductListPage';
import ActivityLogPage from './pages/dashboard/ActivityLogPage';
import ReportB2CPage from './pages/dashboard/ReportB2CPage';
import OrganizationSettingsPage from './pages/settings/OrganizationSettingsPage';
import TeamManagementPage from './pages/settings/TeamManagementPage';



function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Protected App Routes */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/invoices" element={<InvoiceListPage />} />
            <Route path="/invoices/create" element={<InvoiceCreatePage />} />
            <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
            <Route path="/customers" element={<CustomerListPage />} />
            <Route path="/products" element={<ProductListPage />} />
            <Route path="/activity" element={<ActivityLogPage />} />
            <Route path="/reports/b2c" element={<ReportB2CPage />} />
            <Route path="/settings">
              <Route index element={<Navigate to="organization" replace />} />
              <Route path="organization" element={<OrganizationSettingsPage />} />
              <Route path="team" element={<TeamManagementPage />} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
