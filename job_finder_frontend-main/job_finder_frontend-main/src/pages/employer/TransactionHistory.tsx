import type { PageView } from '../../App';
import {
  Bell, IndianRupee, Download, Search
} from 'lucide-react';
import { useState } from 'react';
import { EmployerSidebar } from '../../components/layout/EmployerSidebar';

interface TransactionHistoryProps {
  onNavigate: (view: PageView) => void;
  onLogout?: () => void;
}

export function TransactionHistory({ onNavigate, onLogout }: TransactionHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');

  const transactions = [
    { id: 'TXN-001', date: '2026-02-14', description: 'Payment to Sarah Miller - Barista Shift', amount: -450, status: 'Completed', type: 'debit' },
    { id: 'TXN-002', date: '2026-02-13', description: 'Payment to James Doe - Cashier Shift', amount: -400, status: 'Completed', type: 'debit' },
    { id: 'TXN-003', date: '2026-02-12', description: 'Wallet Top-up', amount: 5000, status: 'Completed', type: 'credit' },
    { id: 'TXN-004', date: '2026-02-10', description: 'Payment to Emily Chen - Barista Shift', amount: -450, status: 'Completed', type: 'debit' },
    { id: 'TXN-005', date: '2026-02-08', description: 'Payment to Rahul Sharma - Server Shift', amount: -500, status: 'Pending', type: 'debit' },
    { id: 'TXN-006', date: '2026-02-05', description: 'Wallet Top-up', amount: 3000, status: 'Completed', type: 'credit' },
    { id: 'TXN-007', date: '2026-02-03', description: 'Payment to Priya Patel - Helper Shift', amount: -350, status: 'Completed', type: 'debit' },
    { id: 'TXN-008', date: '2026-02-01', description: 'Refund - Cancelled Shift', amount: 400, status: 'Completed', type: 'credit' },
  ];

  const filteredTransactions = transactions.filter(txn =>
    txn.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    txn.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSpent = transactions
    .filter(t => t.type === 'debit' && t.status === 'Completed')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalAdded = transactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-[#FFFBF0] flex">
      <EmployerSidebar activeView="employer-dashboard" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 px-4 md:px-8 py-4 pt-16 lg:pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">

              <div>
                <p className="text-sm text-gray-500">Financial Overview</p>
                <h1 className="text-2xl font-bold text-[#1A1A1A]">
                  Transaction <span className="text-[#F5C518]">History</span>
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <button
                onClick={() => onNavigate('employer-profile')}
                className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold hover:ring-2 hover:ring-[#F5C518] transition-all"
              >
                B
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-8">
          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 card-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <IndianRupee className="w-6 h-6 text-purple-500" />
                </div>
              </div>
              <p className="text-4xl font-bold text-[#1A1A1A] mb-2">₹{totalSpent.toLocaleString()}</p>
              <p className="text-gray-600 font-medium">Total Spent</p>
            </div>

            <div className="bg-white rounded-2xl p-6 card-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <IndianRupee className="w-6 h-6 text-green-500" />
                </div>
              </div>
              <p className="text-4xl font-bold text-[#1A1A1A] mb-2">₹{totalAdded.toLocaleString()}</p>
              <p className="text-gray-600 font-medium">Total Added</p>
            </div>

            <div className="bg-white rounded-2xl p-6 card-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <IndianRupee className="w-6 h-6 text-blue-500" />
                </div>
              </div>
              <p className="text-4xl font-bold text-[#1A1A1A] mb-2">₹{(totalAdded - totalSpent).toLocaleString()}</p>
              <p className="text-gray-600 font-medium">Current Balance</p>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C518] w-64"
                />
              </div>
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
              >
                <option value="all">All Time</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-white transition-colors">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-2xl card-shadow overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div className="col-span-2">Transaction ID</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-4">Description</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-2">Status</div>
            </div>

            {/* Table Rows */}
            {filteredTransactions.map((txn, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 px-6 py-4 border-t border-gray-100 items-center">
                <div className="col-span-2 text-sm font-medium text-[#1A1A1A]">{txn.id}</div>
                <div className="col-span-2 text-sm text-gray-600">{txn.date}</div>
                <div className="col-span-4 text-sm text-gray-600">{txn.description}</div>
                <div className={`col-span-2 text-sm font-semibold ${txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                  {txn.type === 'credit' ? '+' : ''}₹{Math.abs(txn.amount).toLocaleString()}
                </div>
                <div className="col-span-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${txn.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                    {txn.status}
                  </span>
                </div>
              </div>
            ))}

            {filteredTransactions.length === 0 && (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500">No transactions found matching your search.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="px-8 py-6 border-t border-gray-100">
          <p className="text-sm text-gray-400 text-center">
            © 2026 AfterBell. Made with <span className="text-red-500">♥</span> in India.
          </p>
        </footer>
      </main>
    </div>
  );
}
