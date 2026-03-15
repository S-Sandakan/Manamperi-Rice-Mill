import { useState, useEffect, useRef } from 'react';
import { productsAPI, salesAPI, customersAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineMagnifyingGlass, HiOutlineTrash, HiOutlinePlus, HiOutlineMinus, HiOutlinePrinter } from 'react-icons/hi2';

const POS = () => {
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState('');
    const [cashReceived, setCashReceived] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [loading, setLoading] = useState(false);
    const [completedSale, setCompletedSale] = useState(null);
    const searchRef = useRef(null);
    const printRef = useRef(null);

    useEffect(() => {
        loadData();
        searchRef.current?.focus();
    }, []);

    const loadData = async () => {
        try {
            const [prodRes, custRes] = await Promise.all([
                productsAPI.getAll(),
                customersAPI.getAll(),
            ]);
            setProducts(prodRes.data);
            setCustomers(custRes.data);
        } catch (err) {
            toast.error('Failed to load data');
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.rice_type.toLowerCase().includes(search.toLowerCase())
    );

    const addToCart = (product) => {
        const existing = cart.find(item => item.product_id === product.id);
        if (existing) {
            setCart(cart.map(item =>
                item.product_id === product.id
                    ? { ...item, quantity_kg: item.quantity_kg + 1 }
                    : item
            ));
        } else {
            setCart([...cart, {
                product_id: product.id,
                name: product.name,
                unit_price: product.price_per_kg,
                quantity_kg: 1,
                max_stock: product.stock_kg,
            }]);
        }
    };

    const updateQuantity = (productId, qty) => {
        if (qty <= 0) {
            setCart(cart.filter(item => item.product_id !== productId));
        } else {
            setCart(cart.map(item =>
                item.product_id === productId ? { ...item, quantity_kg: qty } : item
            ));
        }
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.product_id !== productId));
    };

    const total = cart.reduce((sum, item) => sum + (item.quantity_kg * item.unit_price), 0);
    const balance = cashReceived ? parseFloat(cashReceived) - total : 0;

    const handleSale = async () => {
        if (cart.length === 0) return toast.error('Cart is empty');
        if (!cashReceived || parseFloat(cashReceived) < total) return toast.error('Insufficient cash');
        setLoading(true);
        try {
            const saleData = {
                customer_id: selectedCustomer || null,
                items: cart.map(({ product_id, quantity_kg, unit_price }) => ({ product_id, quantity_kg, unit_price })),
                cash_received: parseFloat(cashReceived),
            };
            const res = await salesAPI.create(saleData);
            setCompletedSale(res.data);
            toast.success(`Sale completed! Invoice: ${res.data.invoice_number}`);
            setCart([]);
            setCashReceived('');
            setSelectedCustomer('');
            loadData(); // Refresh stock
        } catch (err) {
            toast.error(err.response?.data?.message || 'Sale failed');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${completedSale.invoice_number}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; width: 300px; margin: 0 auto; padding: 20px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 2px 0; }
          </style>
        </head>
        <body>
          <div class="center bold" style="font-size:16px">Manamperi Rice Mill</div>
          <div class="center">POS Receipt</div>
          <div class="line"></div>
          <div class="row"><span>Invoice:</span><span>${completedSale.invoice_number}</span></div>
          <div class="row"><span>Date:</span><span>${new Date(completedSale.sale_date).toLocaleString()}</span></div>
          <div class="line"></div>
          <table>
            <tr><td class="bold">Item</td><td class="bold" style="text-align:right">Qty</td><td class="bold" style="text-align:right">Price</td><td class="bold" style="text-align:right">Total</td></tr>
            ${completedSale.items.map(item => `
              <tr><td>${item.product_name}</td><td style="text-align:right">${item.quantity_kg}kg</td><td style="text-align:right">${Number(item.unit_price).toFixed(2)}</td><td style="text-align:right">${Number(item.subtotal).toFixed(2)}</td></tr>
            `).join('')}
          </table>
          <div class="line"></div>
          <div class="row bold"><span>Total:</span><span>Rs. ${Number(completedSale.total_amount).toFixed(2)}</span></div>
          <div class="row"><span>Cash:</span><span>Rs. ${Number(completedSale.cash_received).toFixed(2)}</span></div>
          <div class="row"><span>Balance:</span><span>Rs. ${Number(completedSale.balance).toFixed(2)}</span></div>
          <div class="line"></div>
          <div class="center">Thank you for your purchase!</div>
          <div class="center" style="font-size:10px;margin-top:10px">Manamperi Rice Mill - Quality Rice Products</div>
        </body>
      </html>
    `);
        printWindow.document.close();
        printWindow.print();
    };

    const newSale = () => {
        setCompletedSale(null);
        setCart([]);
        setCashReceived('');
        setSelectedCustomer('');
        searchRef.current?.focus();
    };

    // Show receipt after sale
    if (completedSale) {
        return (
            <div className="max-w-lg mx-auto animate-fade-in">
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-3xl">✅</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Sale Completed!</h2>
                        <p className="text-gray-500">{completedSale.invoice_number}</p>
                    </div>
                    <div className="space-y-2 mb-4">
                        {completedSale.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-100">
                                <span>{item.product_name} × {item.quantity_kg}kg</span>
                                <span className="font-medium">Rs. {Number(item.subtotal).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span className="text-green-600">Rs. {Number(completedSale.total_amount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Cash Received</span>
                            <span>Rs. {Number(completedSale.cash_received).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold text-blue-600">
                            <span>Balance</span>
                            <span>Rs. {Number(completedSale.balance).toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                            <HiOutlinePrinter className="w-4 h-4" /> Print Bill
                        </button>
                        <button onClick={newSale} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors">
                            New Sale
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-6 h-[calc(100vh-7rem)]">
            {/* Products Panel */}
            <div className="flex-1 flex flex-col">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold text-gray-800">Point of Sale</h1>
                    <p className="text-gray-500 text-sm">Search and add products to cart</p>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                    <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        ref={searchRef}
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search rice products..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
                    />
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto grid grid-cols-2 xl:grid-cols-3 gap-3 content-start">
                    {filteredProducts.map((product) => (
                        <button
                            key={product.id}
                            onClick={() => addToCart(product)}
                            className="bg-white p-4 rounded-xl border border-gray-100 hover:border-green-300 hover:shadow-md transition-all text-left group"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-semibold text-gray-800 group-hover:text-green-700 transition-colors">{product.name}</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">{product.rice_type}</p>
                                </div>
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{product.stock_kg} kg</span>
                            </div>
                            <p className="text-lg font-bold text-green-600 mt-2">Rs. {Number(product.price_per_kg).toFixed(2)}<span className="text-xs font-normal text-gray-400">/kg</span></p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Cart Panel */}
            <div className="w-96 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                <div className="p-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-800">Cart ({cart.length} items)</h2>
                </div>

                {/* Customer Select */}
                <div className="px-4 pt-3">
                    <select
                        value={selectedCustomer}
                        onChange={(e) => setSelectedCustomer(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <option value="">Walk-in Customer</option>
                        {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                            Add products to cart
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.product_id} className="bg-gray-50 rounded-xl p-3">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h4 className="font-medium text-gray-800 text-sm">{item.name}</h4>
                                        <p className="text-xs text-gray-500">Rs. {item.unit_price}/kg</p>
                                    </div>
                                    <button onClick={() => removeFromCart(item.product_id)} className="text-red-400 hover:text-red-600">
                                        <HiOutlineTrash className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => updateQuantity(item.product_id, item.quantity_kg - 1)} className="w-7 h-7 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-100">
                                            <HiOutlineMinus className="w-3 h-3" />
                                        </button>
                                        <input
                                            type="number"
                                            value={item.quantity_kg}
                                            onChange={(e) => updateQuantity(item.product_id, parseFloat(e.target.value) || 0)}
                                            className="w-16 text-center text-sm font-medium border border-gray-200 rounded-lg py-1 outline-none"
                                            min="0"
                                            step="0.5"
                                        />
                                        <button onClick={() => updateQuantity(item.product_id, item.quantity_kg + 1)} className="w-7 h-7 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-100">
                                            <HiOutlinePlus className="w-3 h-3" />
                                        </button>
                                        <span className="text-xs text-gray-400">kg</span>
                                    </div>
                                    <span className="font-semibold text-gray-800">Rs. {(item.quantity_kg * item.unit_price).toFixed(2)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Payment Section */}
                <div className="border-t border-gray-100 p-4 space-y-3">
                    <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-green-600">Rs. {total.toFixed(2)}</span>
                    </div>
                    <input
                        type="number"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        placeholder="Cash received"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {cashReceived && (
                        <div className={`flex justify-between font-semibold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            <span>Balance</span>
                            <span>Rs. {balance.toFixed(2)}</span>
                        </div>
                    )}
                    <button
                        onClick={handleSale}
                        disabled={loading || cart.length === 0}
                        className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-green-200"
                    >
                        {loading ? 'Processing...' : `Complete Sale — Rs. ${total.toFixed(2)}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default POS;
