import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Loader2, AlertCircle, Download, Fuel, BarChart3, TrendingUp } from 'lucide-react';

const Reports = () => {
  // Fetch fuel efficiency stats
  const { data: efficiencyData, isLoading: loadingEff } = useQuery({
    queryKey: ['fuelEfficiency'],
    queryFn: async () => {
      const res = await api.get('/reports/fuel-efficiency');
      return res.data;
    }
  });

  // Fetch utilization statistics
  const { data: utilizationData, isLoading: loadingUtil } = useQuery({
    queryKey: ['fleetUtilizationReport'],
    queryFn: async () => {
      const res = await api.get('/reports/fleet-utilization');
      return res.data;
    }
  });

  // Fetch ROI report
  const { data: roiData, isLoading: loadingRoi } = useQuery({
    queryKey: ['roiReport'],
    queryFn: async () => {
      const res = await api.get('/reports/roi');
      return res.data;
    }
  });

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/reports/export', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'fleet-roi-report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('CSV Export failed:', error);
      alert('CSV Export failed. Please try again.');
    }
  };

  const COLORS = ['#aa3bff', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

  const getPieData = () => {
    if (!utilizationData?.breakdown) return [];
    const { onTrip, inShop, available } = utilizationData.breakdown;
    return [
      { name: 'On Trip', value: onTrip || 0, color: '#06b6d4' },
      { name: 'In Shop', value: inShop || 0, color: '#f59e0b' },
      { name: 'Available', value: available || 0, color: '#10b981' }
    ].filter(item => item.value > 0);
  };

  const isDataLoading = loadingEff || loadingUtil || loadingRoi;

  if (isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Aggregating analytics data...</p>
      </div>
    );
  }

  const pieData = getPieData();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Deep dive analytics regarding vehicle performance, costs, and fleet utilization.</p>
        </div>

        <Button onClick={handleExportCSV} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm active:scale-[0.98]">
          <Download className="h-4 w-4" /> Export ROI Report (CSV)
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Fleet Status Chart */}
        <Card className="border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-cyan-500" /> Fleet Allocation Status
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 dark:text-slate-500">Allocation breakdown (Utilization: {utilizationData?.utilizationPercent ?? 0}%)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center pb-6">
            {pieData.length === 0 ? (
              <div className="text-slate-400 dark:text-slate-500 text-sm flex flex-col items-center gap-2">
                <AlertCircle className="h-6 w-6" />
                <span>No vehicles registered to analyze.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)' }}
                    formatter={(value) => [`${value} vehicle(s)`, 'Count']} 
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Fuel Efficiency Chart */}
        <Card className="border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Fuel className="h-5 w-5 text-cyan-500" /> Fuel Efficiency
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 dark:text-slate-500">Kilometers traveled per Litre of fuel consumed (higher is better)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pb-6">
            {!efficiencyData || efficiencyData.length === 0 ? (
              <div className="text-slate-400 dark:text-slate-500 text-sm flex flex-col items-center justify-center h-full gap-2">
                <AlertCircle className="h-6 w-6" />
                <span>No completed trip statistics recorded yet.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={efficiencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="regNumber" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis unit=" km/L" stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)' }}
                    formatter={(value) => [`${value} km/L`, 'Efficiency']} 
                  />
                  <Bar dataKey="efficiency" fill="#06b6d4" radius={[6, 6, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Fleet ROI Cost / Rev chart */}
        <Card className="md:col-span-2 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-cyan-500" /> Cost vs. Estimated Revenue Analysis
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 dark:text-slate-500">Comparison of operating expenses (fuel + maintenance) vs cargo delivery profits ($3.50/km)</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] pb-6">
            {!roiData || roiData.length === 0 ? (
              <div className="text-slate-400 dark:text-slate-500 text-sm flex flex-col items-center justify-center h-full gap-2">
                <AlertCircle className="h-6 w-6" />
                <span>No vehicles registered.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roiData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="regNumber" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis unit=" $" stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)' }}
                    formatter={(value) => [`$${value.toLocaleString()}`, undefined]} 
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="revenue" name="Estimated Revenue ($)" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
                  <Bar dataKey="fuelCost" name="Fuel Expense ($)" fill="#0f172a" dark={{ fill: '#f8fafc' }} radius={[6, 6, 0, 0]} barSize={24} />
                  <Bar dataKey="maintenanceCost" name="Maintenance Expense ($)" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
