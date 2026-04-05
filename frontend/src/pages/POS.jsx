import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
    HiOutlineMagnifyingGlass,
    HiOutlineTrash,
    HiOutlinePlus,
    HiOutlineMinus,
    HiOutlinePrinter,
    HiOutlineShoppingCart,
    HiOutlineReceiptPercent,
} from 'react-icons/hi2';

export default function POS() {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState('');
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [discount, setDiscount] = useState(0);
    const [cashReceived, setCashReceived] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [checkingOut, setCheckingOut] = useState(false);
    const searchRef = useRef(null);

    useEffect(() => {
        loadData();
        searchRef.current?.focus();
    }, []);

    const loadData = async () => {
        try {
            const [prodRes, custRes] = await Promise.all([
                api.get('/products/?is_active=true&page_size=200'),
                api.get('/customers/?page_size=200'),
            ]);
            setProducts(prodRes.data.results || prodRes.data);
            setCustomers(custRes.data.results || custRes.data);
        } catch (err) {
            toast.error('Failed to load data');
        }
    };

    const filteredProducts = products.filter(
        (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.category_display?.toLowerCase().includes(search.toLowerCase())
    );

    const addToCart = (product) => {
        const existing = cart.find((c) => c.product_id === product.id);
        if (existing) {
            setCart(
                cart.map((c) =>
                    c.product_id === product.id
                        ? { ...c, quantity_kg: parseFloat(c.quantity_kg) + 1 }
                        : c
                )
            );
        } else {
            setCart([
                ...cart,
                {
                    product_id: product.id,
                    name: product.name,
                    price: parseFloat(product.price_per_kg),
                    quantity_kg: 1,
                    stock: parseFloat(product.stock_kg),
                },
            ]);
        }
    };

    const updateQty = (productId, qty) => {
        const q = parseFloat(qty);
        if (isNaN(q) || q <= 0) {
            setCart(cart.filter((c) => c.product_id !== productId));
            return;
        }
        const item = cart.find((c) => c.product_id === productId);
        if (item && q > item.stock) {
            toast.error(`Only ${item.stock} kg available`);
            return;
        }
        setCart(cart.map((c) => (c.product_id === productId ? { ...c, quantity_kg: q } : c)));
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter((c) => c.product_id !== productId));
    };

    const subtotal = cart.reduce((s, c) => s + c.price * c.quantity_kg, 0);
    const netAmount = subtotal - parseFloat(discount || 0);
    const balance = parseFloat(cashReceived || 0) - netAmount;

    const fmt = (v) => `Rs. ${Number(v).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

    const handleCheckout = async () => {
        if (cart.length === 0) {
            toast.error('Cart is empty');
            return;
        }
        if (paymentMethod === 'cash' && parseFloat(cashReceived || 0) < netAmount) {
            toast.error('Insufficient cash received');
            return;
        }
        setCheckingOut(true);
        try {
            const { data } = await api.post('/sales/checkout/', {
                customer_id: selectedCustomer || null,
                items: cart.map((c) => ({
                    product_id: c.product_id,
                    quantity_kg: c.quantity_kg,
                })),
                discount: parseFloat(discount || 0),
                payment_method: paymentMethod,
                cash_received: parseFloat(cashReceived || 0),
            });
            toast.success(`Sale ${data.invoice_number} completed!`);

            // Open invoice PDF in new tab
            window.open(`/api/sales/${data.id}/invoice/`, '_blank');

            // Reset
            setCart([]);
            setDiscount(0);
            setCashReceived('');
            setSelectedCustomer('');
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Checkout failed');
        } finally {
            setCheckingOut(false);
        }
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-dark-800">Point of Sale</h1>
                <p className="text-dark-400 text-sm">Create a new sale transaction</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                {/* Product Grid (left) */}
                <div className="lg:col-span-3">
                    <div className="glass-card p-5">
                        {/* Search */}
                        <div className="relative mb-4">
                            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                            <input
                                ref={searchRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="form-input pl-10"
                                placeholder="Search products by name or category..."
                                id="pos-search"
                            />
                        </div>

                        {/* Products Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-1">
                            {filteredProducts.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => addToCart(p)}
                                    disabled={p.stock_kg <= 0}
                                    className={`text-left p-4 rounded-xl border transition-all duration-200
                    ${p.stock_kg <= 0
                                            ? 'bg-dark-50 border-dark-200 opacity-50 cursor-not-allowed'
                                            : 'bg-white border-dark-100 hover:border-primary-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]'
                                        }`}
                                    id={`product-${p.id}`}
                                >
                                    <p className="font-semibold text-dark-800 text-sm truncate">{p.name}</p>
                                    <p className="text-xs text-dark-400 mt-0.5">{p.category_display}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-sm font-bold text-primary-600">
                                            Rs. {parseFloat(p.price_per_kg).toFixed(2)}
                                        </span>
                                        <span className={`text-xs font-medium ${p.is_low_stock ? 'text-red-500' : 'text-emerald-500'}`}>
                                            {parseFloat(p.stock_kg).toFixed(0)} kg
                                        </span>
                                    </div>
                                </button>
                            ))}
                            {filteredProducts.length === 0 && (
                                <div className="col-span-full text-center py-12 text-dark-400 text-sm">
                                    No products found
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Cart & Checkout (right) */}
                <div className="lg:col-span-2">
                    <div className="glass-card p-5 sticky top-6">
                        <div className="flex items-center gap-2 mb-4">
                            <HiOutlineShoppingCart className="w-5 h-5 text-primary-500" />
                            <h2 className="text-lg font-bold text-dark-800">Cart</h2>
                            <span className="badge-info ml-auto">{cart.length} items</span>
                        </div>

                        {/* Cart Items */}
                        <div className="space-y-2 max-h-[30vh] overflow-y-auto mb-4">
                            {cart.map((item) => (
                                <div
                                    key={item.product_id}
                                    className="flex items-center gap-3 p-3 bg-dark-50 rounded-xl"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-dark-800 truncate">
                                            {item.name}
                                        </p>
                                        <p className="text-xs text-dark-400">
                                            {fmt(item.price)} / kg
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => updateQty(item.product_id, item.quantity_kg - 1)}
                                            className="p-1 rounded-lg hover:bg-dark-200 transition-colors"
                                        >
                                            <HiOutlineMinus className="w-3.5 h-3.5" />
                                        </button>
                                        <input
                                            type="number"
                                            value={item.quantity_kg}
                                            onChange={(e) => updateQty(item.product_id, e.target.value)}
                                            className="w-16 text-center text-sm font-semibold border border-dark-200
                                 rounded-lg py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                                            step="0.5"
                                            min="0.5"
                                        />
                                        <button
                                            onClick={() => updateQty(item.product_id, item.quantity_kg + 1)}
                                            className="p-1 rounded-lg hover:bg-dark-200 transition-colors"
                                        >
                                            <HiOutlinePlus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <p className="text-sm font-bold text-dark-700 w-24 text-right">
                                        {fmt(item.price * item.quantity_kg)}
                                    </p>
                                    <button
                                        onClick={() => removeFromCart(item.product_id)}
                                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <HiOutlineTrash className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {cart.length === 0 && (
                                <p className="text-center py-8 text-dark-400 text-sm">No items in cart</p>
                            )}
                        </div>

                        {/* Customer + Payment */}
                        <div className="border-t border-dark-100 pt-4 space-y-3">
                            <select
                                value={selectedCustomer}
                                onChange={(e) => setSelectedCustomer(e.target.value)}
                                className="form-select"
                                id="pos-customer"
                            >
                                <option value="">Walk-in Customer</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>

                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="form-select"
                                id="pos-payment"
                            >
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="credit">Credit</option>
                            </select>

                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="text-xs font-medium text-dark-400 mb-1 block">Discount</label>
                                    <input
                                        type="number"
                                        value={discount}
                                        onChange={(e) => setDiscount(e.target.value)}
                                        className="form-input"
                                        placeholder="0.00"
                                        min="0"
                                    />
                                </div>
                                {paymentMethod === 'cash' && (
                                    <div className="flex-1">
                                        <label className="text-xs font-medium text-dark-400 mb-1 block">Cash Received</label>
                                        <input
                                            type="number"
                                            value={cashReceived}
                                            onChange={(e) => setCashReceived(e.target.value)}
                                            className="form-input"
                                            placeholder="0.00"
                                            min="0"
                                            id="pos-cash"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="border-t border-dark-100 pt-4 mt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-dark-400">Subtotal</span>
                                <span className="font-semibold">{fmt(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-dark-400">Discount</span>
                                <span className="font-semibold text-red-500">-{fmt(discount || 0)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold border-t border-dark-200 pt-2">
                                <span>Total</span>
                                <span className="text-primary-600">{fmt(netAmount)}</span>
                            </div>
                            {paymentMethod === 'cash' && cashReceived && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-dark-400">Balance</span>
                                    <span className={`font-bold ${balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {fmt(balance)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Checkout Button */}
                        <button
                            onClick={handleCheckout}
                            disabled={checkingOut || cart.length === 0}
                            className="btn-primary w-full mt-4 flex items-center justify-center gap-2 py-3"
                            id="pos-checkout"
                        >
                            {checkingOut ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <HiOutlinePrinter className="w-5 h-5" />
                                    Complete Sale & Print Bill
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
