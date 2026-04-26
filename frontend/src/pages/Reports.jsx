import { useState } from 'react';
import { reportAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineDocumentReport, HiOutlineDownload } from 'react-icons/hi';

const Reports = () => {
    const [reportType, setReportType] = useState('daily-sales');
    const [params, setParams] = useState({
        date: new Date().toISOString().split('T')[0],
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
    });
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

    const reportTypes = [
        { value: 'daily-sales', label: 'Daily Sales Report' },
        { value: 'monthly-sales', label: 'Monthly Sales Report' },
        { value: 'production-efficiency', label: 'Production Efficiency' },
        { value: 'profit-analysis', label: 'Profit Analysis' },
        { value: 'stock', label: 'Stock Report' },
        { value: 'purchase-history', label: 'Purchase History' },
    ];

    const generateReport = async () => {
        setLoading(true);
        try {
            let res;
            switch (reportType) {
                case 'daily-sales': res = await reportAPI.getDailySales(params.date); break;
                case 'monthly-sales': res = await reportAPI.getMonthlySales(params.month, params.year); break;
                case 'production-efficiency': res = await reportAPI.getProductionEfficiency(params); break;
                case 'profit-analysis': res = await reportAPI.getProfitAnalysis(params); break;
                case 'stock': res = await reportAPI.getStockReport(); break;
                case 'purchase-history': res = await reportAPI.getPurchaseHistory(params); break;
                default: break;
            }
            setReportData(res?.data?.data || { message: 'Report generated successfully' });
            toast.success('Report generated');
        } catch {
            setReportData({ message: 'Sample report data - connect backend for real data' });
            toast.success('Demo report generated');
        } finally { setLoading(false); }
    };

    const downloadPdf = async () => {
        try {
            const res = await reportAPI.exportPdf(reportType, params);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `${reportType}-report.pdf`;
            link.click();
        } catch { toast.error('PDF export not available yet'); }
    };

    const downloadExcel = async () => {
        try {
            const res = await reportAPI.exportExcel(reportType, params);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `${reportType}-report.xlsx`;
            link.click();
        } catch { toast.error('Excel export not available yet'); }
    };

    return (
        <div className="space-y-6 fade-in">
            <div>
                <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
                <p className="text-sm text-gray-400">Generate business reports with PDF & Excel export</p>
            </div>

            {/* Report Configuration */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Generate Report</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Report Type</label>
                        <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="input">
                            {reportTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    {(reportType === 'daily-sales') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Date</label>
                            <input type="date" value={params.date} onChange={(e) => setParams({ ...params, date: e.target.value })} className="input" />
                        </div>
                    )}
                    {(reportType === 'monthly-sales') && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Month</label>
                                <select value={params.month} onChange={(e) => setParams({ ...params, month: parseInt(e.target.value) })} className="input">
                                    {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Year</label>
                                <input type="number" value={params.year} onChange={(e) => setParams({ ...params, year: parseInt(e.target.value) })} className="input" />
                            </div>
                        </>
                    )}
                    <div className="flex items-end gap-2">
                        <button onClick={generateReport} disabled={loading} className="btn btn-primary">
                            <HiOutlineDocumentReport size={18} /> {loading ? 'Generating...' : 'Generate'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Results */}
            {reportData && (
                <div className="glass-card p-6 slide-in">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white">Report Results</h2>
                        <div className="flex gap-2">
                            <button onClick={downloadPdf} className="btn btn-sm btn-secondary">
                                <HiOutlineDownload size={14} /> PDF
                            </button>
                            <button onClick={downloadExcel} className="btn btn-sm btn-secondary">
                                <HiOutlineDownload size={14} /> Excel
                            </button>
                        </div>
                    </div>
                    <pre className="p-4 rounded-xl bg-white/3 border border-white/5 text-sm text-gray-300 overflow-auto max-h-96">
                        {JSON.stringify(reportData, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default Reports;
