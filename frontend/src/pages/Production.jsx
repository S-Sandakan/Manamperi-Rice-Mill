import { useState, useEffect } from 'react';
import { productionAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineCheckCircle, HiOutlineTrendingUp, HiOutlineBeaker, HiOutlineExclamation, HiOutlinePencil, HiOutlineTrash, HiOutlineX } from 'react-icons/hi';

const EMPTY_FORM = {
    veeInputKg: '', sahalOutputKg: '', kuduOutputKg: '', riceBranOutputKg: '',
    operationalCost: '', batchDate: new Date().toISOString().split('T')[0], notes: '',
};

const Production = () => {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_FORM });

    // Edit & Delete state
    const [editBatch, setEditBatch] = useState(null); // batch being edited
    const [editForm, setEditForm] = useState({ ...EMPTY_FORM });
    const [deleteBatch, setDeleteBatch] = useState(null); // batch pending delete confirmation

    useEffect(() => { fetchBatches(); }, []);

    const fetchBatches = async () => {
        try {
            const res = await productionAPI.getBatches();
            setBatches(res.data.data || []);
        } catch (err) {
            toast.error('Failed to load batches. Make sure the backend is running.');
            console.error('Fetch error:', err);
        } finally { setLoading(false); }
    };

    // ===== CREATE =====
    const handleSubmit = async (e) => {
        e.preventDefault();
        const veeInput = parseFloat(form.veeInputKg);
        const totalOut = parseFloat(form.sahalOutputKg) + parseFloat(form.kuduOutputKg) + (parseFloat(form.riceBranOutputKg) || 0);
        if (totalOut > veeInput) { toast.error('Total output exceeds Vee input!'); return; }

        setSubmitting(true);
        try {
            const res = await productionAPI.createBatch({
                veeInputKg: veeInput,
                sahalOutputKg: parseFloat(form.sahalOutputKg),
                kuduOutputKg: parseFloat(form.kuduOutputKg),
                riceBranOutputKg: parseFloat(form.riceBranOutputKg) || null,
                operationalCost: parseFloat(form.operationalCost) || 0,
                batchDate: form.batchDate,
                notes: form.notes,
            });
            toast.success(res.data?.message || 'Batch recorded!');
            setShowForm(false);
            setForm({ ...EMPTY_FORM });
            fetchBatches();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to record batch'); }
        finally { setSubmitting(false); }
    };

    // ===== EDIT =====
    const openEdit = (b) => {
        setEditBatch(b);
        setEditForm({
            veeInputKg: b.veeInputKg || '',
            sahalOutputKg: b.sahalOutputKg || '',
            kuduOutputKg: b.kuduOutputKg || '',
            riceBranOutputKg: b.riceBranOutputKg || '',
            operationalCost: '',
            batchDate: b.batchDate || '',
            notes: b.notes || '',
        });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const veeInput = parseFloat(editForm.veeInputKg);
        const totalOut = parseFloat(editForm.sahalOutputKg) + parseFloat(editForm.kuduOutputKg) + (parseFloat(editForm.riceBranOutputKg) || 0);
        if (totalOut > veeInput) { toast.error('Total output exceeds Vee input!'); return; }

        setSubmitting(true);
        try {
            const res = await productionAPI.updateBatch(editBatch.id, {
                veeInputKg: veeInput,
                sahalOutputKg: parseFloat(editForm.sahalOutputKg),
                kuduOutputKg: parseFloat(editForm.kuduOutputKg),
                riceBranOutputKg: parseFloat(editForm.riceBranOutputKg) || null,
                operationalCost: parseFloat(editForm.operationalCost) || 0,
                batchDate: editForm.batchDate,
                notes: editForm.notes,
            });
            toast.success(res.data?.message || 'Batch updated!');
            setEditBatch(null);
            fetchBatches();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to update batch'); }
        finally { setSubmitting(false); }
    };

    // ===== DELETE =====
    const handleDelete = async () => {
        try {
            await productionAPI.deleteBatch(deleteBatch.id);
            toast.success('Batch deleted successfully');
            setDeleteBatch(null);
            fetchBatches();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete batch'); }
    };

    // Calculated values for create form live preview
    const fVee = parseFloat(form.veeInputKg) || 0;
    const fSahal = parseFloat(form.sahalOutputKg) || 0;
    const fKudu = parseFloat(form.kuduOutputKg) || 0;
    const fBran = parseFloat(form.riceBranOutputKg) || 0;
    const fTotal = fSahal + fKudu + fBran;
    const fWaste = fVee > 0 ? fVee - fTotal : 0;
    const fYield = fVee > 0 && fSahal > 0 ? ((fSahal / fVee) * 100).toFixed(2) : null;
    const fEfficient = fYield && parseFloat(fYield) >= 64;

    // Edit form live preview
    const eVee = parseFloat(editForm.veeInputKg) || 0;
    const eSahal = parseFloat(editForm.sahalOutputKg) || 0;
    const eKudu = parseFloat(editForm.kuduOutputKg) || 0;
    const eBran = parseFloat(editForm.riceBranOutputKg) || 0;
    const eTotal = eSahal + eKudu + eBran;
    const eWaste = eVee > 0 ? eVee - eTotal : 0;
    const eYield = eVee > 0 && eSahal > 0 ? ((eSahal / eVee) * 100).toFixed(2) : null;
    const eEfficient = eYield && parseFloat(eYield) >= 64;

    // Summary stats
    const completedBatches = batches.filter(b => b.status === 'COMPLETED');
    const avgYield = completedBatches.length > 0
        ? (completedBatches.reduce((sum, b) => sum + parseFloat(b.yieldPercentage || 0), 0) / completedBatches.length).toFixed(1)
        : '0.0';
    const efficientCount = batches.filter(b => b.efficiency === 'EFFICIENT').length;
    const totalVeeProcessed = completedBatches.reduce((sum, b) => sum + parseFloat(b.veeInputKg || 0), 0);

    // Reusable yield preview component
    const YieldPreview = ({ vee, sahal, kudu, waste, yieldPct, efficient }) => (
        <div className={`rounded-xl p-4 mb-5 border ${efficient ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div>
                    <p className="text-xs text-gray-400">Vee In</p>
                    <p className="text-lg font-bold text-white">{vee.toLocaleString()} kg</p>
                </div>
                <div>
                    <p className="text-xs text-gray-400">Sahal Out</p>
                    <p className="text-lg font-bold text-green-400">{sahal.toLocaleString()} kg</p>
                </div>
                <div>
                    <p className="text-xs text-gray-400">Kudu Out</p>
                    <p className="text-lg font-bold text-blue-400">{kudu.toLocaleString()} kg</p>
                </div>
                <div>
                    <p className="text-xs text-gray-400">Yield</p>
                    <p className={`text-2xl font-bold ${efficient ? 'text-green-400' : 'text-red-400'}`}>{yieldPct}%</p>
                    <span className={`badge text-xs ${efficient ? 'badge-success' : 'badge-danger'}`}>
                        {efficient ? 'EFFICIENT' : 'INEFFICIENT'}
                    </span>
                </div>
                <div>
                    <p className="text-xs text-gray-400">Waste</p>
                    <p className="text-lg font-bold text-orange-400">{waste.toFixed(1)} kg</p>
                    <p className="text-xs text-gray-500">{vee > 0 ? ((waste / vee) * 100).toFixed(1) : 0}%</p>
                </div>
            </div>
        </div>
    );

    // Reusable form fields component
    const BatchFormFields = ({ data, setData }) => (
        <>
            <div className="mb-5">
                <h3 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider mb-3">📥 Input</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Vee Input (kg) *</label>
                        <input type="number" step="0.01" value={data.veeInputKg}
                            onChange={(e) => setData({ ...data, veeInputKg: e.target.value })}
                            className="input" required placeholder="e.g. 1000" />
                        <p className="text-xs text-gray-500 mt-1">Paddy used for milling</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Batch Date *</label>
                        <input type="date" value={data.batchDate}
                            onChange={(e) => setData({ ...data, batchDate: e.target.value })}
                            className="input" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Operational Cost (Rs.)</label>
                        <input type="number" step="0.01" value={data.operationalCost}
                            onChange={(e) => setData({ ...data, operationalCost: e.target.value })}
                            className="input" placeholder="Optional" />
                    </div>
                </div>
            </div>
            <div className="mb-5">
                <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-3">📤 Output</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Sahal Output (kg) *</label>
                        <input type="number" step="0.01" value={data.sahalOutputKg}
                            onChange={(e) => setData({ ...data, sahalOutputKg: e.target.value })}
                            className="input" required placeholder="e.g. 650" />
                        <p className="text-xs text-gray-500 mt-1">Rice produced</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Kudu Output (kg) *</label>
                        <input type="number" step="0.01" value={data.kuduOutputKg}
                            onChange={(e) => setData({ ...data, kuduOutputKg: e.target.value })}
                            className="input" required placeholder="e.g. 200" />
                        <p className="text-xs text-gray-500 mt-1">Broken rice</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Rice Bran Output (kg)</label>
                        <input type="number" step="0.01" value={data.riceBranOutputKg}
                            onChange={(e) => setData({ ...data, riceBranOutputKg: e.target.value })}
                            className="input" placeholder="e.g. 80" />
                        <p className="text-xs text-gray-500 mt-1">Bran by-product</p>
                    </div>
                </div>
            </div>
            <div className="mb-5">
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Notes</label>
                <input type="text" value={data.notes}
                    onChange={(e) => setData({ ...data, notes: e.target.value })}
                    className="input" placeholder="Optional notes" />
            </div>
        </>
    );

    return (
        <div className="space-y-6 fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Production Management</h1>
                    <p className="text-sm text-gray-400">Record completed milling batches — Vee → Sahal + Kudu + Rice Bran</p>
                </div>
                <button onClick={() => { setShowForm(!showForm); if (!showForm) setForm({ ...EMPTY_FORM }); }} className="btn btn-primary">
                    <HiOutlinePlus size={18} /> Record Batch
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20"><HiOutlineCheckCircle size={22} className="text-green-400" /></div>
                    <div><p className="text-xs text-gray-400">Total Batches</p><p className="text-xl font-bold text-white">{completedBatches.length}</p></div>
                </div>
                <div className="glass-card p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20"><HiOutlineTrendingUp size={22} className="text-blue-400" /></div>
                    <div><p className="text-xs text-gray-400">Avg Yield</p><p className="text-xl font-bold text-white">{avgYield}%</p></div>
                </div>
                <div className="glass-card p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/20"><HiOutlineBeaker size={22} className="text-emerald-400" /></div>
                    <div><p className="text-xs text-gray-400">Efficient Batches</p><p className="text-xl font-bold text-white">{efficientCount}</p></div>
                </div>
                <div className="glass-card p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20"><HiOutlineBeaker size={22} className="text-purple-400" /></div>
                    <div><p className="text-xs text-gray-400">Vee Processed</p><p className="text-xl font-bold text-white">{totalVeeProcessed.toLocaleString()} kg</p></div>
                </div>
            </div>

            {/* Yield Info */}
            <div className="glass-card p-4 border-l-4 border-green-500">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="text-gray-400">Yield Formula:</span>
                    <span className="text-white font-mono">(Sahal Output / Vee Input) × 100</span>
                    <span className="text-gray-400 mx-1">|</span>
                    <span className="text-green-400 font-semibold">≥ 64% = EFFICIENT</span>
                    <span className="text-gray-400 mx-1">|</span>
                    <span className="text-red-400 font-semibold">&lt; 64% = INEFFICIENT</span>
                </div>
            </div>

            {/* Create Form */}
            {showForm && (
                <div className="glass-card p-6 slide-in border-l-4 border-green-500">
                    <h2 className="text-lg font-semibold text-white mb-1">Record Production Batch</h2>
                    <p className="text-xs text-gray-400 mb-5">Enter the milling results after production is complete.</p>
                    <form onSubmit={handleSubmit}>
                        <BatchFormFields data={form} setData={setForm} />
                        {fVee > 0 && fSahal > 0 && (
                            <YieldPreview vee={fVee} sahal={fSahal} kudu={fKudu} waste={fWaste} yieldPct={fYield} efficient={fEfficient} />
                        )}
                        {fVee > 0 && fTotal > fVee && (
                            <div className="rounded-lg p-3 mb-5 bg-red-500/10 border border-red-500/30 flex items-center gap-2">
                                <HiOutlineExclamation size={18} className="text-red-400 flex-shrink-0" />
                                <span className="text-sm text-red-300">Total output ({fTotal.toFixed(1)} kg) exceeds input ({fVee.toFixed(1)} kg).</span>
                            </div>
                        )}
                        <div className="flex gap-3 pt-2">
                            <button type="submit" disabled={submitting} className="btn btn-primary">
                                {submitting ? '⏳ Saving...' : '✅ Record Batch'}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* ===== EDIT MODAL ===== */}
            {editBatch && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 fade-in" onClick={() => setEditBatch(null)}>
                    <div className="glass-card p-6 w-full max-w-3xl mx-4 slide-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-white">Edit Batch</h2>
                                <p className="text-sm text-gray-400 font-mono">{editBatch.batchId}</p>
                            </div>
                            <button onClick={() => setEditBatch(null)} className="text-gray-400 hover:text-white transition-colors">
                                <HiOutlineX size={22} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdate}>
                            <BatchFormFields data={editForm} setData={setEditForm} />
                            {eVee > 0 && eSahal > 0 && (
                                <YieldPreview vee={eVee} sahal={eSahal} kudu={eKudu} waste={eWaste} yieldPct={eYield} efficient={eEfficient} />
                            )}
                            {eVee > 0 && eTotal > eVee && (
                                <div className="rounded-lg p-3 mb-5 bg-red-500/10 border border-red-500/30 flex items-center gap-2">
                                    <HiOutlineExclamation size={18} className="text-red-400 flex-shrink-0" />
                                    <span className="text-sm text-red-300">Total output ({eTotal.toFixed(1)} kg) exceeds input ({eVee.toFixed(1)} kg).</span>
                                </div>
                            )}
                            <div className="flex gap-3 pt-2">
                                <button type="submit" disabled={submitting} className="btn btn-primary">
                                    {submitting ? '⏳ Updating...' : '💾 Update Batch'}
                                </button>
                                <button type="button" onClick={() => setEditBatch(null)} className="btn btn-secondary">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== DELETE CONFIRMATION MODAL ===== */}
            {deleteBatch && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 fade-in" onClick={() => setDeleteBatch(null)}>
                    <div className="glass-card p-6 w-full max-w-md mx-4 slide-in" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-full bg-red-500/20">
                                <HiOutlineTrash size={24} className="text-red-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Delete Batch</h2>
                                <p className="text-sm text-gray-400">This action cannot be undone</p>
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4 mb-5">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Batch ID:</span>
                                    <span className="text-white font-mono font-semibold">{deleteBatch.batchId}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Vee Input:</span>
                                    <span className="text-white">{parseFloat(deleteBatch.veeInputKg || 0).toLocaleString()} kg</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Yield:</span>
                                    <span className={parseFloat(deleteBatch.yieldPercentage) >= 64 ? 'text-green-400' : 'text-red-400'}>
                                        {deleteBatch.yieldPercentage}%
                                    </span>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-gray-300 mb-5">
                            Are you sure you want to delete batch <strong className="text-white">{deleteBatch.batchId}</strong>?
                        </p>
                        <div className="flex gap-3">
                            <button onClick={handleDelete} className="btn flex-1" style={{ background: 'rgba(239,68,68,0.8)', color: 'white' }}>
                                <HiOutlineTrash size={16} /> Delete
                            </button>
                            <button onClick={() => setDeleteBatch(null)} className="btn btn-secondary flex-1">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Production History Table */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Production History</h2>
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Batch ID</th>
                                <th>Vee Input</th>
                                <th>Sahal</th>
                                <th>Kudu</th>
                                <th>Rice Bran</th>
                                <th>Yield %</th>
                                <th>Efficiency</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {batches.map((b) => (
                                <tr key={b.id}>
                                    <td className="font-mono text-white font-medium">{b.batchId}</td>
                                    <td>{parseFloat(b.veeInputKg || 0).toLocaleString()} kg</td>
                                    <td className="text-green-400">{b.sahalOutputKg ? `${parseFloat(b.sahalOutputKg).toLocaleString()} kg` : '—'}</td>
                                    <td className="text-blue-400">{b.kuduOutputKg ? `${parseFloat(b.kuduOutputKg).toLocaleString()} kg` : '—'}</td>
                                    <td className="text-yellow-400">{b.riceBranOutputKg ? `${parseFloat(b.riceBranOutputKg).toLocaleString()} kg` : '—'}</td>
                                    <td className={b.yieldPercentage ? (parseFloat(b.yieldPercentage) >= 64 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold') : 'text-gray-500'}>
                                        {b.yieldPercentage ? `${b.yieldPercentage}%` : '—'}
                                    </td>
                                    <td>
                                        {b.efficiency ? (
                                            <span className={`badge ${b.efficiency === 'EFFICIENT' ? 'badge-success' : 'badge-danger'}`}>
                                                {b.efficiency}
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td className="text-gray-400">{b.batchDate}</td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors" title="Edit">
                                                <HiOutlinePencil size={16} />
                                            </button>
                                            <button onClick={() => setDeleteBatch(b)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors" title="Delete">
                                                <HiOutlineTrash size={16} />
                                            </button>
                                        </div>
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
