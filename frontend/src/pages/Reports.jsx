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
      { name: 'On Trip', value: onTrip || 0, color: '#3b82f6' },
      { name: 'In Shop', value: inShop || 0, color: '#f59e0b' },
      { name: 'Available', value: available || 0, color: '#10b981' }
    ].filter(item => item.value > 0);
  };

  const isDataLoading = loadingEff || loadingUtil || loadingRoi;

  if (isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm font-medium">Aggregating analytics data...</p>
      </div>
    );
  }

  const pieData = getPieData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">Deep dive analytics regarding vehicle performance, costs, and fleet utilization.</p>
        </div>

        <Button onClick={handleExportCSV} className="flex items-center gap-2">
          <Download className="h-4 w-4" /> Export ROI Report (CSV)
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Fleet Status Chart */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Fleet Allocation Status
            </CardTitle>
            <CardDescription>Breakdown of vehicle allocation (Current Utilization: {utilizationData?.utilizationPercent ?? 0}%)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {pieData.length === 0 ? (
              <div className="text-muted-foreground text-sm flex flex-col items-center gap-1">
                <AlertCircle className="h-6 w-6 text-muted-foreground" />
                No vehicles registered to analyze.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} vehicle(s)`, 'Count']} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Fuel Efficiency Chart */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Fuel className="h-5 w-5 text-primary" /> Fuel Efficiency
            </CardTitle>
            <CardDescription>Kilometers traveled per Litre of fuel consumed (higher is better)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {!efficiencyData || efficiencyData.length === 0 ? (
              <div className="text-muted-foreground text-sm flex flex-col items-center justify-center h-full gap-1">
                <AlertCircle className="h-6 w-6 text-muted-foreground" />
                No completed trip statistics recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={efficiencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="regNumber" />
                  <YAxis unit=" km/L" />
                  <Tooltip formatter={(value) => [`${value} km/L`, 'Efficiency']} />
                  <Bar dataKey="efficiency" fill="#aa3bff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Fleet ROI Cost / Rev chart */}
        <Card className="md:col-span-2 border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> Cost vs. Estimated Revenue Analysis
            </CardTitle>
            <CardDescription>Comparison of operating expenses (fuel + maintenance) vs cargo delivery profits ($3.50/km)</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {!roiData || roiData.length === 0 ? (
              <div className="text-muted-foreground text-sm flex flex-col items-center justify-center h-full gap-1">
                <AlertCircle className="h-6 w-6 text-muted-foreground" />
                No vehicles registered.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roiData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="regNumber" />
                  <YAxis unit=" $" />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, undefined]} />
                  <Legend />
                  <Bar dataKey="revenue" name="Estimated Revenue ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="fuelCost" name="Fuel Expense ($)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="maintenanceCost" name="Maintenance Expense ($)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
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
