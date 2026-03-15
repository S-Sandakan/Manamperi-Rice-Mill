import { useState, useEffect } from 'react';
import { productsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineExclamationTriangle } from 'react-icons/hi2';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', rice_type: '', price_per_kg: '', stock_kg: '', low_stock_threshold: '50', description: '' });

    useEffect(() => { loadProducts(); }, []);

    const loadProducts = async () => {
        try {
            const res = await productsAPI.getAll();
            setProducts(res.data);
        } catch (err) {
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await productsAPI.update(editing.id, form);
                toast.success('Product updated');
            } else {
                await productsAPI.create(form);
                toast.success('Product created');
            }
            setShowModal(false);
            setEditing(null);
            setForm({ name: '', rice_type: '', price_per_kg: '', stock_kg: '', low_stock_threshold: '50', description: '' });
            loadProducts();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed');
        }
    };

    const handleEdit = (product) => {
        setEditing(product);
        setForm({
            name: product.name,
            rice_type: product.rice_type,
            price_per_kg: product.price_per_kg,
            stock_kg: product.stock_kg,
            low_stock_threshold: product.low_stock_threshold,
            description: product.description || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await productsAPI.delete(id);
            toast.success('Product deleted');
            loadProducts();
        } catch (err) {
            toast.error('Failed to delete');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Products</h1>
                    <p className="text-gray-500 text-sm">Manage rice products</p>
                </div>
                <button onClick={() => { setEditing(null); setForm({ name: '', rice_type: '', price_per_kg: '', stock_kg: '', low_stock_threshold: '50', description: '' }); setShowModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-medium">
                    <HiOutlinePlus className="w-4 h-4" /> Add Product
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                            <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Price/kg</th>
                            <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                            <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {products.map((product) => (
                            <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-5 py-3">
                                    <p className="font-medium text-gray-800">{product.name}</p>
                                    {product.description && <p className="text-xs text-gray-400">{product.description}</p>}
                                </td>
                                <td className="px-5 py-3 text-sm text-gray-600">{product.rice_type}</td>
                                <td className="px-5 py-3 text-right text-sm font-semibold">Rs. {Number(product.price_per_kg).toFixed(2)}</td>
                                <td className="px-5 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {product.stock_kg <= product.low_stock_threshold && (
                                            <HiOutlineExclamationTriangle className="w-4 h-4 text-amber-500" />
                                        )}
                                        <span className={`text-sm font-medium ${product.stock_kg <= product.low_stock_threshold ? 'text-amber-600' : 'text-gray-800'}`}>
                                            {product.stock_kg} kg
                                        </span>
                                    </div>
                                </td>
                                <td className="px-5 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => handleEdit(product)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><HiOutlinePencil className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(product.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><HiOutlineTrash className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {products.length === 0 && !loading && (
                    <div className="text-center py-10 text-gray-400">No products found</div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 animate-fade-in">
                        <h2 className="text-lg font-bold mb-4">{editing ? 'Edit Product' : 'Add Product'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="text" placeholder="Product Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm" required />
                            <input type="text" placeholder="Rice Type" value={form.rice_type} onChange={(e) => setForm({ ...form, rice_type: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm" required />
                            <div className="grid grid-cols-2 gap-3">
                                <input type="number" placeholder="Price/kg" value={form.price_per_kg} onChange={(e) => setForm({ ...form, price_per_kg: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm" required step="0.01" />
                                <input type="number" placeholder="Stock (kg)" value={form.stock_kg} onChange={(e) => setForm({ ...form, stock_kg: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm" step="0.01" />
                            </div>
                            <input type="number" placeholder="Low Stock Threshold" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm" />
                            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm" rows="2" />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700">{editing ? 'Update' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
