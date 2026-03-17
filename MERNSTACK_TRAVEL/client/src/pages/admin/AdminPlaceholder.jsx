import AdminLayout from '../../components/AdminLayout';
import { Construction } from 'lucide-react';

export default function AdminPlaceholder({ title }) {
  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{title}</h1>
        <div className="mt-8 bg-white border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center">
          <Construction className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-lg font-semibold text-slate-600">Coming Soon</p>
          <p className="text-sm text-slate-400 mt-1">This section is under development</p>
        </div>
      </div>
    </AdminLayout>
  );
}
