import { useState, useEffect } from 'react';
import { productAPI, salesAPI, inventoryAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineMinus, HiOutlineTrash, HiOutlinePrinter } from 'react-icons/hi';

const POS = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [discountType, setDiscountType] = useState('');
    const [discountValue, setDiscountValue] = useState('');
    const [paymentType, setPaymentType] = useState('CASH');
    const [processing, setProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await productAPI.getSaleable();
            setProducts(res.data.data || []);
        } catch (err) {
            // Fallback demo data
            setProducts([
                { id: 2, name: 'Sahal 1kg', productType: 'SAHAL', packetSizeKg: 1, sellingPrice: 230, unit: 'packet' },
                { id: 3, name: 'Sahal 2kg', productType: 'SAHAL', packetSizeKg: 2, sellingPrice: 450, unit: 'packet' },
                { id: 4, name: 'Sahal 5kg', productType: 'SAHAL', packetSizeKg: 5, sellingPrice: 1100, unit: 'packet' },
                { id: 5, name: 'Sahal 10kg', productType: 'SAHAL', packetSizeKg: 10, sellingPrice: 2150, unit: 'packet' },
                { id: 6, name: 'Sahal 25kg', productType: 'SAHAL', packetSizeKg: 25, sellingPrice: 5250, unit: 'sack' },
                { id: 7, name: 'Sahal 50kg', productType: 'SAHAL', packetSizeKg: 50, sellingPrice: 10300, unit: 'sack' },
                { id: 8, name: 'Kudu (per kg)', productType: 'KUDU', packetSizeKg: null, sellingPrice: 55, unit: 'kg' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.productId === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.productId === product.id
                        ? { ...item, quantity: item.quantity + 1, lineTotal: (item.quantity + 1) * item.unitPrice }
                        : item
                );
            }
            return [...prev, {
                productId: product.id,
                name: product.name,
                unitPrice: product.sellingPrice,
                quantity: 1,
                lineTotal: product.sellingPrice,
                unit: product.unit,
                type: product.productType,
            }];
        });
    };

    const updateQuantity = (productId, delta) => {
        setCart((prev) =>
            prev
                .map((item) => {
                    if (item.productId === productId) {
                        const newQty = Math.max(0, item.quantity + delta);
                        return { ...item, quantity: newQty, lineTotal: newQty * item.unitPrice };
                    }
                    return item;
                })
                .filter((item) => item.quantity > 0)
        );
    };

    const updatePrice = (productId, newPrice) => {
        const price = Math.max(0, parseFloat(newPrice) || 0);
        setCart((prev) =>
            prev.map((item) =>
                item.productId === productId
                    ? { ...item, unitPrice: newPrice === '' ? '' : price, lineTotal: item.quantity * price }
                    : item
            )
        );
    };

    const setQuantity = (productId, qty) => {
        const newQty = Math.max(0, parseFloat(qty) || 0);
        if (newQty === 0) {
            setCart((prev) => prev.filter((item) => item.productId !== productId));
        } else {
            setCart((prev) =>
                prev.map((item) =>
                    item.productId === productId
                        ? { ...item, quantity: newQty, lineTotal: newQty * item.unitPrice }
                        : item
                )
            );
        }
    };

    const removeFromCart = (productId) => {
        setCart((prev) => prev.filter((item) => item.productId !== productId));
    };

    const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
    const discountAmount = discountType === 'PERCENTAGE'
        ? subtotal * (parseFloat(discountValue) || 0) / 100
        : discountType === 'FIXED'
            ? parseFloat(discountValue) || 0
            : 0;
    const total = Math.max(0, subtotal - discountAmount);

    const handleCheckout = async () => {
        if (cart.length === 0) return toast.error('Cart is empty');
        setProcessing(true);
        try {
            const payload = {
                items: cart.map((item) => ({ 
                    productId: item.productId, 
                    quantity: item.quantity,
                    customUnitPrice: parseFloat(item.unitPrice) || 0
                })),
                discountType: discountType || null,
                discountValue: parseFloat(discountValue) || 0,
                paymentType,
            };
            const res = await salesAPI.create(payload);
            toast.success(`Sale completed! Invoice: ${res.data.data?.invoiceNumber || 'Generated'}`);
            setCart([]);
            setDiscountType('');
            setDiscountValue('');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Sale failed');
        } finally {
            setProcessing(false);
        }
    };

    const formatCurrency = (val) =>
        new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 2 }).format(val);

    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fade-in">
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-white">Point of Sale</h1>
                <p className="text-sm text-gray-400">Quick and easy billing for customers</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6" style={{ height: 'calc(100vh - 140px)' }}>
                {/* LEFT: Product Grid */}
                <div className="lg:col-span-3 flex flex-col">
                    {/* Search */}
                    <div className="mb-4">
                        <input
                            type="text"
                            className="input"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1 overflow-y-auto pr-2">
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                            {filteredProducts.map((product) => (
                                <button
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    className="glass-card p-4 text-left hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5 transition-all duration-200 cursor-pointer group"
                                >
                                    <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center text-white font-bold text-sm ${product.productType === 'KUDU'
                                            ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                                            : 'bg-gradient-to-br from-green-500 to-emerald-600'
                                        }`}>
                                        {product.productType === 'KUDU' ? 'K' : `${product.packetSizeKg}`}
                                    </div>
                                    <h3 className="text-sm font-semibold text-white group-hover:text-green-400 transition-colors">{product.name}</h3>
                                    <p className="text-lg font-bold text-green-400 mt-1">{formatCurrency(product.sellingPrice)}</p>
                                    <p className="text-xs text-gray-500">per {product.unit}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Cart / Bill Panel */}
                <div className="lg:col-span-2 glass-card flex flex-col" style={{ maxHeight: 'calc(100vh - 140px)' }}>
                    {/* Cart Header */}
                    <div className="p-4 border-b border-white/5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">Current Bill</h2>
                            <span className="badge badge-info">{cart.length} items</span>
                        </div>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <HiOutlinePlus size={40} className="mb-2 opacity-30" />
                                <p className="text-sm">Click products to add to bill</p>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <div key={item.productId} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{item.name}</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <span className="text-xs text-gray-400">Rs.</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={item.unitPrice}
                                                onChange={(e) => updatePrice(item.productId, e.target.value)}
                                                className="w-16 px-1 bg-white/5 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-green-500"
                                            />
                                            <span className="text-xs text-gray-400">× {item.quantity}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => updateQuantity(item.productId, -1)} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10">
                                            <HiOutlineMinus size={14} />
                                        </button>
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => setQuantity(item.productId, e.target.value)}
                                            className="w-12 h-7 text-center bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
                                        />
                                        <button onClick={() => updateQuantity(item.productId, 1)} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10">
                                            <HiOutlinePlus size={14} />
                                        </button>
                                    </div>
                                    <p className="text-sm font-semibold text-green-400 w-20 text-right">{formatCurrency(item.lineTotal)}</p>
                                    <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-300">
                                        <HiOutlineTrash size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Bill Summary */}
                    <div className="border-t border-white/5 p-4 space-y-3">
                        {/* Discount */}
                        <div className="flex gap-2">
                            <select
                                value={discountType}
                                onChange={(e) => setDiscountType(e.target.value)}
                                className="input !w-auto flex-shrink-0"
                            >
                                <option value="">No Discount</option>
                                <option value="PERCENTAGE">% Discount</option>
                                <option value="FIXED">Fixed (Rs.)</option>
                            </select>
                            {discountType && (
                                <input
                                    type="number"
                                    value={discountValue}
                                    onChange={(e) => setDiscountValue(e.target.value)}
                                    className="input"
                                    placeholder={discountType === 'PERCENTAGE' ? 'e.g. 5' : 'e.g. 100'}
                                />
                            )}
                        </div>

                        {/* Payment Type */}
                        <div className="flex gap-2">
                            {['CASH', 'CREDIT'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setPaymentType(type)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${paymentType === type
                                            ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                                            : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        {/* Totals */}
                        <div className="space-y-1 pt-2 border-t border-white/5">
                            <div className="flex justify-between text-sm text-gray-400">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between text-sm text-amber-400">
                                    <span>Discount</span>
                                    <span>-{formatCurrency(discountAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xl font-bold text-white pt-1">
                                <span>Total</span>
                                <span className="text-green-400">{formatCurrency(total)}</span>
                            </div>
                        </div>

                        {/* Checkout Button */}
                        <button
                            onClick={handleCheckout}
                            disabled={cart.length === 0 || processing}
                            className="btn btn-primary w-full btn-lg"
                        >
                            {processing ? (
                                <>
                                    <div className="spinner !w-5 !h-5 !border-2" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <HiOutlinePrinter size={18} />
                                    Complete Sale — {formatCurrency(total)}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default POS;
