import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Package, Users, Activity, ShoppingCart, DollarSign, TrendingUp, AlertTriangle, PieChart, History, CheckSquare } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../lib/formatters';
import { usePermissions } from '../hooks/usePermissions';
import { SkeletonCards } from '../components/ui/EmptyState';

export function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [intelligence, setIntelligence] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { hasPermission, isEmployee } = usePermissions();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('@ERP:token');
      try {
        const [resReporting, resForecast, resAnomalies] = await Promise.all([
           fetch('/api/reporting/dashboard', { headers: { 'Authorization': `Bearer ${token}` } }),
           fetch('/api/intelligence/forecasts', { headers: { 'Authorization': `Bearer ${token}` } }),
           fetch('/api/intelligence/anomalies', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        const jsonReporting = await resReporting.json();
        const jsonForecast = await resForecast.json();
        const jsonAnomalies = await resAnomalies.json();
        
        if (jsonReporting.success) setData(jsonReporting.data);
        
        setIntelligence({
           forecast: jsonForecast.success ? jsonForecast.data : null,
           anomalies: jsonAnomalies.success ? jsonAnomalies.data : null
        });

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Dynamic menu items filtered by permissions
  const allMenuItems = [
    { label: 'PDV', icon: ShoppingCart, color: 'text-green-600', bg: 'bg-green-100', path: '/pdv', perm: 'pos.access' },
    { label: 'Vendas', icon: History, color: 'text-amber-600', bg: 'bg-amber-100', path: '/sales-history', perm: 'sales.view' },
    { label: 'Produtos', icon: Package, color: 'text-blue-600', bg: 'bg-blue-100', path: '/products', perm: 'products.view' },
    { label: 'Estoque', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-100', path: '/stock', perm: 'stock.view' },
    { label: 'Financeiro', icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-100', path: '/financial', perm: 'financial.view' },
    { label: 'Clientes', icon: Users, color: 'text-orange-600', bg: 'bg-orange-100', path: '/people', perm: 'customers.view' },
    { label: 'Demandas', icon: CheckSquare, color: 'text-cyan-600', bg: 'bg-cyan-100', path: '/demands', perm: 'demands.view' },
    { label: 'Relatórios', icon: PieChart, color: 'text-rose-600', bg: 'bg-rose-100', path: '/reports', perm: 'reports.view' },
  ];

  const menuItems = allMenuItems.filter(item => hasPermission(item.perm));

  const trendData = data?.commercial?.trend || [];

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight font-sans">Bem Vindo à sua Área de Trabalho</h1>
        <p className="text-sm text-neutral-500 mt-1">Dashboard Executivo Estratégico</p>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
        {menuItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.04 }}
            onClick={() => navigate(item.path)}
            className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-4 flex flex-col items-center justify-center cursor-pointer hover:shadow-md hover:border-indigo-100 transition-all text-center gap-3"
          >
            <div className={`p-3 rounded-xl ${item.bg}`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 truncate w-full">{item.label}</h3>
          </motion.div>
        ))}
      </div>

      {/* KPI + Charts */}
      {loading ? (
        <div className="space-y-6">
          <SkeletonCards count={3} />
          <div className="animate-pulse h-72 bg-neutral-100 rounded-2xl w-full" />
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* KPIs - only show financial data to users with permission */}
          {hasPermission('financial.view') && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-neutral-100/80 min-w-0">
                <div className="flex justify-between items-start mb-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-neutral-400 mb-1 truncate">Receita Mensal (Vendas)</p>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-black font-mono text-neutral-900 truncate">{formatCurrency(data?.commercial?.totalRevenueMonth)}</h3>
                  </div>
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-xl flex-shrink-0"><TrendingUp className="w-5 h-5" /></div>
                </div>
                <div className="text-xs sm:text-sm text-neutral-500 font-semibold">{data?.commercial?.totalSalesMonth || 0} vendas este mês</div>
              </div>
              
              <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-neutral-100/80 min-w-0">
                <div className="flex justify-between items-start mb-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-neutral-400 mb-1 truncate">Inadimplência Projetada</p>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-black font-mono text-neutral-900 truncate">{formatCurrency(data?.financial?.overdueReceivablesAmount)}</h3>
                  </div>
                  <div className="w-10 h-10 bg-orange-50 text-orange-600 flex items-center justify-center rounded-xl flex-shrink-0"><AlertTriangle className="w-5 h-5" /></div>
                </div>
                <div className="text-xs sm:text-sm text-red-600 font-bold flex items-center gap-1">Atenção Crítica</div>
              </div>

              <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-neutral-100/80 min-w-0">
                <div className="flex justify-between items-start mb-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-neutral-400 mb-1 truncate">Valuation de Estoque</p>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-black font-mono text-neutral-900 truncate">{formatCurrency(data?.inventory?.totalValuationCost)}</h3>
                  </div>
                  <div className="w-10 h-10 bg-teal-50 text-teal-600 flex items-center justify-center rounded-xl flex-shrink-0"><Package className="w-5 h-5" /></div>
                </div>
                <div className="text-xs sm:text-sm text-neutral-500 font-semibold flex items-center gap-1 truncate">{data?.inventory?.totalItemsInStock || 0} itens rastreados</div>
              </div>
            </div>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {hasPermission('financial.view') && trendData.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
                <h2 className="text-lg font-bold text-neutral-900 mb-6 font-sans">Tendência de Receita</h2>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                      <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                      <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-neutral-900 font-sans">Insights Operacionais</h2>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-4 p-4 rounded-xl bg-orange-50/50">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-neutral-900">Ruptura de Estoque</p>
                    <p className="text-xs text-neutral-600 mt-1">{data?.inventory?.criticalStockCount || 0} produtos com nível crítico e necessitam de reposição.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4 p-4 rounded-xl bg-green-50/50">
                  <TrendingUp className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-neutral-900">Ticket Médio</p>
                    <p className="text-xs text-neutral-600 mt-1">Ticket médio atual: {formatCurrency(data?.commercial?.averageTicket)} nos últimos 30 dias.</p>
                  </div>
                </li>
                {intelligence?.forecast?.revenueForecast?.next7Days > 0 && (
                  <li className="flex items-start gap-4 p-4 rounded-xl bg-indigo-50/50">
                    <TrendingUp className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-neutral-900">Previsão (7 dias)</p>
                      <p className="text-xs text-neutral-600 mt-1">Projeção de {formatCurrency(intelligence?.forecast?.revenueForecast?.next7Days)} em receita.</p>
                    </div>
                  </li>
                )}
                
                {intelligence?.anomalies?.map((anomaly: any) => (
                  <li key={anomaly.id} className="flex items-start gap-4 p-4 rounded-xl bg-red-50/50">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-neutral-900">Anomalia: {anomaly.type}</p>
                      <p className="text-xs text-neutral-600 mt-1">{anomaly.message}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </MainLayout>
  );
}
