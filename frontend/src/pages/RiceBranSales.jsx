import { useState, useEffect } from 'react';
import { branAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus } from 'react-icons/hi2';

const RiceBranSales = () => {
    const [stock, setStock] = useState({ stock_kg: 0, price_per_kg: 0 });
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSaleForm, setShowSaleForm] = useState(false);
    const [showStockForm, setShowStockForm] = useState(false);
    const [saleForm, setSaleForm] = useState({ buyer_name: '', weight_kg: '', price_per_kg: '', sale_date: new Date().toISOString().split('T')[0], notes: '' });
    const [addQty, setAddQty] = useState('');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [stockRes, salesRes] = await Promise.all([branAPI.getStock(), branAPI.getSales()]);
            setStock(stockRes.data);
            setSales(salesRes.data);
            setSaleForm(prev => ({ ...prev, price_per_kg: stockRes.data.price_per_kg }));
        } catch (err) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleSale = async (e) => {
        e.preventDefault();
        try {
            await branAPI.createSale(saleForm);
            toast.success('Bran sale recorded');
            setSaleForm({ buyer_name: '', weight_kg: '', price_per_kg: stock.price_per_kg, sale_date: new Date().toISOString().split('T')[0], notes: '' });
            setShowSaleForm(false);
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Sale failed');
        }
    };

    const handleAddStock = async (e) => {
        e.preventDefault();
        try {
            await branAPI.addStock({ quantity_kg: parseFloat(addQty) });
            toast.success('Bran stock added');
            setAddQty('');
            setShowStockForm(false);
            loadData();
        } catch (err) {
            toast.error('Failed to add stock');
        }
    };

    const saleTotal = saleForm.weight_kg && saleForm.price_per_kg ? (parseFloat(saleForm.weight_kg) * parseFloat(saleForm.price_per_kg)).toFixed(2) : '0.00';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Rice Bran</h1>
                    <p className="text-gray-500 text-sm">Manage rice bran sales and stock</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowStockForm(!showStockForm)} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium">
                        Add Stock
                    </button>
                    <button onClick={() => setShowSaleForm(!showSaleForm)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm font-medium">
                        <HiOutlinePlus className="w-4 h-4" /> New Sale
                    </button>
                </div>
            </div>

            {/* Stock Card */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white">
                <h3 className="text-purple-200 text-sm font-medium">Rice Bran Stock</h3>
                <p className="text-3xl font-bold mt-1">{Number(stock.stock_kg).toLocaleString()} kg</p>
                <p className="text-purple-200 text-sm mt-1">Price: Rs. {Number(stock.price_per_kg).toFixed(2)}/kg</p>
            </div>

            {/* Add Stock Form */}
            {showStockForm && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-fade-in">
                    <h3 className="font-semibold mb-3">Add Bran Stock</h3>
                    <form onSubmit={handleAddStock} className="flex gap-3">
                        <input type="number" placeholder="Quantity (kg)" value={addQty} onChange={(e) => setAddQty(e.target.value)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" required step="0.01" />
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700">Add</button>
                    </form>
                </div>
            )}

            {/* Sale Form */}
            {showSaleForm && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-fade-in">
                    <h3 className="font-semibold mb-3">Record Bran Sale</h3>
                    <form onSubmit={handleSale} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <input type="text" placeholder="Buyer Name" value={saleForm.buyer_name} onChange={(e) => setSaleForm({ ...saleForm, buyer_name: e.target.value })} className="px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500" required />
                        <input type="number" placeholder="Weight (kg)" value={saleForm.weight_kg} onChange={(e) => setSaleForm({ ...saleForm, weight_kg: e.target.value })} className="px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500" required step="0.01" />
                        <input type="number" placeholder="Price/kg" value={saleForm.price_per_kg} onChange={(e) => setSaleForm({ ...saleForm, price_per_kg: e.target.value })} className="px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500" required step="0.01" />
                        <input type="date" value={saleForm.sale_date} onChange={(e) => setSaleForm({ ...saleForm, sale_date: e.target.value })} className="px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500" required />
                        <input type="text" placeholder="Notes (optional)" value={saleForm.notes} onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })} className="px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500" />
                        <div className="flex items-center gap-4">
                            <div className="text-sm"><span className="text-gray-500">Total:</span> <span className="font-bold text-green-600">Rs. {saleTotal}</span></div>
                            <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700">Save</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Sales Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800">Sales History</h3>
                </div>
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Buyer</th>
                            <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Weight</th>
                            <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Price/kg</th>
                            <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {sales.map((s) => (
                            <tr key={s.id} className="hover:bg-gray-50">
                                <td className="px-5 py-3 text-sm">{new Date(s.sale_date).toLocaleDateString()}</td>
                                <td className="px-5 py-3 text-sm font-medium">{s.buyer_name}</td>
                                <td className="px-5 py-3 text-sm text-right">{s.weight_kg} kg</td>
                                <td className="px-5 py-3 text-sm text-right">Rs. {Number(s.price_per_kg).toFixed(2)}</td>
                                <td className="px-5 py-3 text-sm text-right font-semibold text-green-600">Rs. {Number(s.total_amount).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {sales.length === 0 && !loading && (
                    <div className="text-center py-10 text-gray-400">No bran sales recorded yet</div>
                )}
            </div>
        </div>
    );
};

export default RiceBranSales;
