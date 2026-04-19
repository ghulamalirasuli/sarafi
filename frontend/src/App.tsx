import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// Auth & routing
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Login } from './pages/Login'
import { HomeRedirect } from './pages/HomeRedirect'

// Layouts
import { AdminLayout } from './layouts/AdminLayout'
import { UserLayout } from './layouts/UserLayout'

// Dashboards
import { AdminDashboard, UserDashboard } from './pages/dashboard'

// Transaction pages
import { SendHawalaPage } from './pages/transactions/SendHawalaPage'
import { ReceiveHawalaPage } from './pages/transactions/ReceiveHawalaPage'
import { ExchangePage } from './pages/transactions/ExchangePage'
import { TransferPage } from './pages/transactions/TransferPage'

// Finance pages
import { DepositPage } from './pages/finance/DepositPage'
import { CashBoxPage } from './pages/finance/CashBoxPage'
import { BankBoxPage } from './pages/finance/BankBoxPage'
import { ExpensePage } from './pages/finance/ExpensePage'

// Admin pages
import { UsersPage } from './pages/admin/UsersPage'
import { SystemSettingsPage } from './pages/admin/SystemSettingsPage'
import { MasterEntity } from './pages/admin/MasterEntity'

// Report pages
import { ReportsPage } from './pages/reports/ReportsPage'
import { CustomerLedgerPage } from './pages/reports/CustomerLedgerPage'
import { CustomerLedgerDetailPage } from './pages/reports/CustomerLedgerDetailPage'
import { AgencyLedgerPage } from './pages/reports/AgencyLedgerPage'
import { AgencyLedgerDetailPage } from './pages/reports/AgencyLedgerDetailPage'

function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<HomeRedirect />} />

        {/* ── Admin workspace ─────────────────────────────────── */}
        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />

            {/* User & system management */}
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/system-settings" element={<SystemSettingsPage />} />

            {/* Master data (CMS) */}
            <Route path="/admin/currencies" element={<MasterEntity name="currencies" />} />
            <Route path="/admin/agencies" element={<MasterEntity name="agencies" />} />
            <Route path="/admin/banks" element={<MasterEntity name="banks" />} />
            <Route path="/admin/customers" element={<MasterEntity name="customers" />} />

            {/* Hawala */}
            <Route path="/admin/send-hawala" element={<SendHawalaPage />} />
            <Route path="/admin/receive-hawala" element={<ReceiveHawalaPage />} />
            <Route path="/admin/exchange" element={<ExchangePage />} />
            <Route path="/admin/transfer" element={<TransferPage />} />

            {/* Deposits */}
            <Route path="/admin/deposits" element={<DepositPage />} />

            {/* Finance */}
            <Route path="/admin/cash-box" element={<CashBoxPage />} />
            <Route path="/admin/bank-box" element={<BankBoxPage />} />
            <Route path="/admin/expenses" element={<ExpensePage />} />

            {/* Reports */}
            <Route path="/admin/customer-ledger" element={<CustomerLedgerPage />} />
            <Route path="/admin/customer-ledger/:id" element={<CustomerLedgerDetailPage />} />
            <Route path="/admin/agency-ledger" element={<AgencyLedgerPage />} />
            <Route path="/admin/agency-ledger/:id" element={<AgencyLedgerDetailPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
          </Route>
        </Route>

        {/* ── User workspace ──────────────────────────────────── */}
        <Route element={<ProtectedRoute roles={['user']} />}>
          <Route element={<UserLayout />}>
            <Route path="/user" element={<UserDashboard />} />

            {/* Master data (CMS) */}
            <Route path="/user/currencies" element={<MasterEntity name="currencies" />} />
            <Route path="/user/agencies" element={<MasterEntity name="agencies" />} />
            <Route path="/user/banks" element={<MasterEntity name="banks" />} />
            <Route path="/user/customers" element={<MasterEntity name="customers" />} />

            {/* Hawala */}
            <Route path="/user/send-hawala" element={<SendHawalaPage />} />
            <Route path="/user/receive-hawala" element={<ReceiveHawalaPage />} />
            <Route path="/user/exchange" element={<ExchangePage />} />
            <Route path="/user/transfer" element={<TransferPage />} />

            {/* Deposits */}
            <Route path="/user/deposits" element={<DepositPage />} />

            {/* Finance */}
            <Route path="/user/cash-box" element={<CashBoxPage />} />
            <Route path="/user/bank-box" element={<BankBoxPage />} />
            <Route path="/user/expenses" element={<ExpensePage />} />

            {/* Reports */}
            <Route path="/user/customer-ledger" element={<CustomerLedgerPage />} />
            <Route path="/user/customer-ledger/:id" element={<CustomerLedgerDetailPage />} />
            <Route path="/user/agency-ledger" element={<AgencyLedgerPage />} />
            <Route path="/user/agency-ledger/:id" element={<AgencyLedgerDetailPage />} />
            <Route path="/user/reports" element={<ReportsPage />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  )
}

export default App
