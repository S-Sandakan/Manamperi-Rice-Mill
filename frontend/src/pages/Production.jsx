import { useState, useEffect } from 'react';
import { productionAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineCheckCircle } from 'react-icons/hi';

const Production = () => {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showComplete, setShowComplete] = useState(null);
    const [form, setForm] = useState({ veeInputKg: '', operationalCost: '', batchDate: new Date().toISOString().split('T')[0], notes: '' });
    const [completeForm, setCompleteForm] = useState({ sahalOutputKg: '', kuduOutputKg: '' });

    useEffect(() => { fetchBatches(); }, []);

    const fetchBatches = async () => {
        try {
            const res = await productionAPI.getBatches();
            setBatches(res.data.data || []);
        } catch {
            setBatches([
                { id: 1, batchId: 'BATCH-20260420-001', veeInputKg: 2000, sahalOutputKg: 1320, kuduOutputKg: 380, yieldPercentage: 66.0, efficiency: 'EFFICIENT', status: 'COMPLETED', batchDate: '2026-04-20' },
                { id: 2, batchId: 'BATCH-20260419-001', veeInputKg: 1500, sahalOutputKg: 930, kuduOutputKg: 290, yieldPercentage: 62.0, efficiency: 'INEFFICIENT', status: 'COMPLETED', batchDate: '2026-04-19' },
            ]);
        } finally { setLoading(false); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await productionAPI.createBatch({
                veeInputKg: parseFloat(form.veeInputKg),
                operationalCost: parseFloat(form.operationalCost) || 0,
                batchDate: form.batchDate,
                notes: form.notes,
            });
            toast.success('Batch created successfully');
            setShowForm(false);
            setForm({ veeInputKg: '', operationalCost: '', batchDate: new Date().toISOString().split('T')[0], notes: '' });
            fetchBatches();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to create batch'); }
    };

    const handleComplete = async (batchId) => {
        try {
            await productionAPI.completeBatch(batchId, {
                sahalOutputKg: parseFloat(completeForm.sahalOutputKg),
                kuduOutputKg: parseFloat(completeForm.kuduOutputKg),
            });
            toast.success('Batch completed!');
            setShowComplete(null);
            setCompleteForm({ sahalOutputKg: '', kuduOutputKg: '' });
            fetchBatches();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to complete batch'); }
    };

    return (
        <div className="space-y-6 fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Production Management</h1>
                    <p className="text-sm text-gray-400">Manage milling batches — Vee → Sahal + Kudu conversion</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
                    <HiOutlinePlus size={18} /> New Batch
                </button>
            </div>

            {/* Yield Info Banner */}
            <div className="glass-card p-4 flex items-center gap-4 border-l-4 border-green-500">
                <div className="text-sm">
                    <span className="text-gray-400">Yield Formula: </span>
                    <span className="text-white font-mono">(Sahal Output / Vee Input) × 100</span>
                    <span className="text-gray-400 mx-3">|</span>
                    <span className="text-green-400 font-semibold">≥ 64% = EFFICIENT</span>
                    <span className="text-gray-400 mx-2">|</span>
                    <span className="text-red-400 font-semibold">&lt; 64% = INEFFICIENT</span>
                </div>
            </div>

            {/* Create Batch Form */}
            {showForm && (
                <div className="glass-card p-6 slide-in">
                    <h2 className="text-lg font-semibold text-white mb-4">Start New Batch</h2>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Vee Input (kg)</label>
                            <input type="number" step="0.01" value={form.veeInputKg} onChange={(e) => setForm({ ...form, veeInputKg: e.target.value })} className="input" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Operational Cost (Rs.)</label>
                            <input type="number" step="0.01" value={form.operationalCost} onChange={(e) => setForm({ ...form, operationalCost: e.target.value })} className="input" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Batch Date</label>
                            <input type="date" value={form.batchDate} onChange={(e) => setForm({ ...form, batchDate: e.target.value })} className="input" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Notes</label>
                            <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" placeholder="Optional" />
                        </div>
                        <div className="lg:col-span-4 flex gap-3 pt-2">
                            <button type="submit" className="btn btn-primary">Create Batch</button>
                            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Batches Table */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Production Batches</h2>
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Batch ID</th>
                                <th>Vee Input</th>
                                <th>Sahal Output</th>
                                <th>Kudu Output</th>
                                <th>Yield %</th>
                                <th>Efficiency</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {batches.map((b) => (
                                <tr key={b.id}>
                                    <td className="font-mono text-white font-medium">{b.batchId}</td>
                                    <td>{(b.veeInputKg || 0).toLocaleString()} kg</td>
                                    <td>{b.sahalOutputKg ? `${b.sahalOutputKg.toLocaleString()} kg` : '-'}</td>
                                    <td>{b.kuduOutputKg ? `${b.kuduOutputKg.toLocaleString()} kg` : '-'}</td>
                                    <td className={b.yieldPercentage >= 64 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                                        {b.yieldPercentage ? `${b.yieldPercentage}%` : '-'}
                                    </td>
                                    <td>
                                        {b.efficiency && (
                                            <span className={`badge ${b.efficiency === 'EFFICIENT' ? 'badge-success' : 'badge-danger'}`}>
                                                {b.efficiency}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`badge ${b.status === 'COMPLETED' ? 'badge-success' : b.status === 'IN_PROGRESS' ? 'badge-warning' : 'badge-danger'}`}>
                                            {b.status}
                                        </span>
                                    </td>
                                    <td className="text-gray-400">{b.batchDate}</td>
                                    <td>
                                        {b.status === 'IN_PROGRESS' && (
                                            showComplete === b.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input type="number" step="0.01" placeholder="Sahal kg" value={completeForm.sahalOutputKg} onChange={(e) => setCompleteForm({ ...completeForm, sahalOutputKg: e.target.value })} className="input !w-24 !py-1 !text-xs" />
                                                    <input type="number" step="0.01" placeholder="Kudu kg" value={completeForm.kuduOutputKg} onChange={(e) => setCompleteForm({ ...completeForm, kuduOutputKg: e.target.value })} className="input !w-24 !py-1 !text-xs" />
                                                    <button onClick={() => handleComplete(b.id)} className="btn btn-primary btn-sm !py-1">Save</button>
                                                    <button onClick={() => setShowComplete(null)} className="btn btn-secondary btn-sm !py-1">✕</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setShowComplete(b.id)} className="btn btn-sm btn-primary">
                                                    <HiOutlineCheckCircle size={14} /> Complete
                                                </button>
                                            )
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {batches.length === 0 && (
                                <tr><td colSpan="9" className="text-center text-gray-500 py-8">No batches found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Production;
