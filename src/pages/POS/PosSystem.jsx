import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts, fetchCategories } from "../../store/slices/productSlice";
import {
  Search,
  Barcode,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Printer,
  CreditCard,
  Banknote,
  QrCode,
  UserPlus,
  RotateCcw,
  Tag,
  Loader2,
} from "lucide-react";

export default function PosSystem() {
  const dispatch = useDispatch();

  // Redux Store থেকে ডেটা রিড করা
  const { items: products = [], categories: reduxCategories = [], loading, error } = useSelector(
    (state) => state.products || {}
  );

  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [customer, setCustomer] = useState("Walk-in Customer");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent] = useState(5); // ৫% ট্যাক্স
  const [barcodeInput, setBarcodeInput] = useState("");

  const searchInputRef = useRef(null);
  const barcodeInputRef = useRef(null);

  // ১. কম্পোনেন্ট লোড হলে Redux Thunk দিয়ে ডেটা লোড
  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  // Categories ফরম্যাটিং
  const categories = [
    "All",
    ...new Set(
      reduxCategories.length > 0
        ? reduxCategories.map((c) => (typeof c === "object" ? c.name : c))
        : products.map((p) => (typeof p.category === "object" ? p.category?.name : p.category)).filter(Boolean)
    ),
  ];

  // Add to Cart Logic
  const addToCart = useCallback((productItem) => {
    const itemId = productItem.id;
    const stockLimit = productItem.stock ?? 0;

    if (stockLimit <= 0) {
      alert("Product is out of stock!");
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === itemId);
      if (existing) {
        if (existing.qty >= stockLimit) {
          alert("Stock limit reached for this item!");
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === itemId ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prevCart, { ...productItem, qty: 1 }];
    });
  }, []);

  // Barcode / Nested SKU Scan Logic
  const handleBarcodeScan = useCallback(
    (code) => {
      const cleanCode = String(code).trim().toLowerCase();
      if (!cleanCode) return;

      let matchedProduct = null;
      let matchedVariant = null;
      let matchedSize = null;

      // nested variants -> sizes -> sku খুজে বের করা
      for (const p of products) {
        if (p.variants && Array.isArray(p.variants)) {
          for (const v of p.variants) {
            if (v.sizes && Array.isArray(v.sizes)) {
              const size = v.sizes.find(
                (s) => String(s.sku || "").trim().toLowerCase() === cleanCode
              );
              if (size) {
                matchedProduct = p;
                matchedVariant = v;
                matchedSize = size;
                break;
              }
            }
          }
        }
        // Direct barcode field check (যদি সরাসরি থাকে)
        if (!matchedProduct && String(p.barcode || "").toLowerCase() === cleanCode) {
          matchedProduct = p;
          break;
        }
        if (matchedProduct) break;
      }

      if (matchedProduct && matchedSize) {
        // Nested SKU পাওয়া গেলে নির্দিষ্ট Size ও Variant সহ Cart Item তৈরি
        const cartItem = {
          id: `${matchedProduct.id}_${matchedVariant.id}_${matchedSize.id}`,
          productId: matchedProduct.id,
          name: `${matchedProduct.name} (${matchedVariant.color?.name || ""} - Size: ${matchedSize.size})`,
          price: matchedProduct.price,
          stock: matchedSize.stock,
          image: matchedVariant.images?.[0] || matchedProduct.image,
          sku: matchedSize.sku,
        };

        addToCart(cartItem);
        setBarcodeInput("");
      } else if (matchedProduct) {
        // সরাসরি প্রোডাক্ট মিললে (Default First Variant)
        const firstVariant = matchedProduct.variants?.[0];
        const firstSize = firstVariant?.sizes?.[0];
        const totalStock =
          matchedProduct.stock ??
          matchedProduct.quantity ??
          firstSize?.stock ??
          0;

        const cartItem = {
          id: matchedProduct.id,
          productId: matchedProduct.id,
          name: matchedProduct.name,
          price: matchedProduct.price,
          stock: totalStock,
          image: firstVariant?.images?.[0] || matchedProduct.image,
          sku: firstSize?.sku || matchedProduct.sku || "",
        };

        addToCart(cartItem);
        setBarcodeInput("");
      } else {
        alert(`Product with barcode/SKU "${code}" not found!`);
        setBarcodeInput("");
      }
    },
    [products, addToCart]
  );

  // ৩. Barcode Scanner Hardware Listener
  useEffect(() => {
    let buffer = "";
    let timeout;

    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
        return;
      }

      if (e.key === "Enter") {
        if (buffer.length > 0) {
          handleBarcodeScan(buffer);
          buffer = "";
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
        clearTimeout(timeout);
        timeout = setTimeout(() => (buffer = ""), 150);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleBarcodeScan]);

  // Update Quantity
  const updateQty = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            if (newQty > item.stock) {
              alert("Stock limit reached!");
              return item;
            }
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  // Remove & Clear Cart
  const removeFromCart = (id) => setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  const clearCart = () => setCart([]);

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + Number(item.price || 0) * item.qty, 0);
  const discountAmount = (subtotal * Math.min(Math.max(discountPercent, 0), 100)) / 100;
  const taxAmount = ((subtotal - discountAmount) * taxPercent) / 100;
  const grandTotal = subtotal - discountAmount + taxAmount;

  // Filtered Products (Nested SKU Search support)
  const filteredProducts = products.filter((p) => {
    const pCategory = typeof p.category === "object" ? p.category?.name : p.category;
    const matchesCategory = selectedCategory === "All" || pCategory === selectedCategory;

    const query = searchQuery.toLowerCase();
    const nameMatch = p.name?.toLowerCase().includes(query);
    const directSkuMatch = String(p.sku || "").toLowerCase().includes(query);
    const barcodeMatch = String(p.barcode || "").toLowerCase().includes(query);

    // Nested SKU Check
    const nestedSkuMatch = p.variants?.some((v) =>
      v.sizes?.some((s) => String(s.sku || "").toLowerCase().includes(query))
    );

    return matchesCategory && (nameMatch || directSkuMatch || barcodeMatch || nestedSkuMatch);
  });

  // Thermal Print Receipt Function
  const handlePrintReceipt = () => {
    if (cart.length === 0) return alert("Cart is empty!");

    const printWindow = window.open("", "_blank");
    if (!printWindow) return alert("Please allow pop-ups for receipt printing.");

    const receiptContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>POS Receipt</title>
          <style>
            @media print {
              @page { margin: 0; }
              body { margin: 0; padding: 5px; }
            }
            body { 
              font-family: 'Courier New', monospace, sans-serif; 
              width: 280px; 
              padding: 8px; 
              font-size: 13px; 
              font-weight: 600; /* Semi-bold base font for high contrast */
              color: #000;
              margin: 0 auto; 
              line-height: 1.3;
            }
            .text-center { text-align: center; }
            .flex { display: flex; justify-content: space-between; align-items: flex-start; }
            .line { border-bottom: 2px dashed #000; margin: 8px 0; }
            .bold { font-weight: 800; font-size: 14px; }
            .title { font-weight: 900; font-size: 18px; margin: 0 0 4px 0; }
            .sub-text { font-size: 11px; font-weight: 600; }
            .item-name { width: 65%; word-break: break-word; }
            .item-price { width: 35%; text-align: right; }
          </style>
        </head>
        <body>
          <div class="text-center">
            <h2 class="title">TITTO OUTLET</h2>
            <p class="sub-text" style="margin: 0;">123 Commerce Way, Dhaka</p>
            <p class="sub-text" style="margin: 2px 0 0 0;">Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
          </div>

          <div class="line"></div>
          <p style="margin: 4px 0;"><strong>Customer:</strong> ${customer}</p>
          <div class="line"></div>

          ${cart
            .map(
              (item) => `
            <div class="flex" style="margin-bottom: 4px;">
              <span class="item-name"><strong>${item.name}</strong> <small>x${item.qty}</small></span>
              <span class="item-price">৳${(Number(item.price) * item.qty).toFixed(2)}</span>
            </div>
          `
            )
            .join("")}

          <div class="line"></div>
          <div class="flex"><span>Subtotal:</span><span>৳${subtotal.toFixed(2)}</span></div>
          <div class="flex"><span>Discount (${discountPercent}%):</span><span>-৳${discountAmount.toFixed(2)}</span></div>
          <div class="flex"><span>Tax (${taxPercent}%):</span><span>৳${taxAmount.toFixed(2)}</span></div>
          
          <div class="line"></div>
          <div class="flex bold"><span>TOTAL:</span><span>৳${grandTotal.toFixed(2)}</span></div>
          <div class="flex"><span>Payment:</span><strong>${paymentMethod.toUpperCase()}</strong></div>
          
          <div class="line"></div>
          <p class="text-center sub-text" style="margin-top: 10px;">Thank you for shopping with us!</p>
        </body>
      </html>
    `;

    printWindow.document.write(receiptContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 overflow-hidden">
      {/* 🛍️ LEFT SIDE: Product Grid & Search */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden border-r border-gray-200 dark:border-gray-800">
        {/* Top Bar: Search & Barcode Input */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search product by Name, SKU..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (barcodeInput) handleBarcodeScan(barcodeInput);
            }}
            className="relative w-52"
          >
            <Barcode className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              ref={barcodeInputRef}
              type="text"
              autoFocus
              placeholder="Scan Barcode & Enter"
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
            />
          </form>
        </div>

        {/* Categories Bar */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading / Error States */}
        {loading?.products ? (
          <div className="flex-1 flex flex-col items-center justify-center text-indigo-600">
            <Loader2 className="animate-spin mb-2" size={32} />
            <p className="text-sm font-medium">Loading products...</p>
          </div>
        ) : error?.products ? (
          <div className="flex-1 flex items-center justify-center text-red-500 text-sm">
            Failed to load products: {error.products}
          </div>
        ) : (
          /* Product Cards Grid */
          <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pr-1">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-10 text-gray-400 text-sm">
                No products found
              </div>
            ) : (
              filteredProducts.map((p) => {
                const itemId = p.id || p._id;
                const productImage = p.variants?.[0]?.images?.[0] || p.image;
                const totalStock =
                  p.stock ??
                  p.quantity ??
                  p.variants?.reduce(
                    (vSum, v) => vSum + (v.sizes?.reduce((sSum, s) => sSum + (s.stock || 0), 0) || 0),
                    0
                  ) ??
                  0;

                return (
                  <div
                    key={itemId}
                    onClick={() =>
                      addToCart({
                        id: itemId,
                        productId: itemId,
                        name: p.name,
                        price: p.price,
                        stock: totalStock,
                        image: productImage,
                      })
                    }
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 flex flex-col justify-between cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all active:scale-[0.98]"
                  >
                    <div>
                      {/* Product Image */}
                      <div className="w-full h-32 mb-2 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center">
                        {productImage ? (
                          <img
                            src={productImage}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://via.placeholder.com/150?text=No+Image";
                            }}
                          />
                        ) : (
                          <span className="text-xs text-gray-400">No Image</span>
                        )}
                      </div>

                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-semibold px-2 py-0.5 rounded">
                          {p.brand?.name || "No Brand"}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${
                            totalStock > 0
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {totalStock > 0 ? `${totalStock} left` : "Out of stock"}
                        </span>
                      </div>

                      <h3 className="font-semibold text-sm line-clamp-1">{p.name}</h3>
                    </div>

                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                        ৳{p.price}
                      </span>
                      <button className="p-1.5 bg-indigo-50 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 rounded-lg">
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 🛒 RIGHT SIDE: Cart & Checkout Section */}
      <div className="w-full lg:w-105 bg-white dark:bg-gray-800 flex flex-col h-full border-l border-gray-200 dark:border-gray-700 shadow-xl">
        {/* Customer Selector */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <select
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium focus:outline-none"
            >
              <option value="Walk-in Customer">Walk-in Customer</option>
              <option value="Rahim Uddin">Rahim Uddin (+8801700000000)</option>
              <option value="Karim Chowdhury">Karim Chowdhury (+8801800000000)</option>
            </select>
            <button
              title="Add Customer"
              className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <UserPlus size={18} />
            </button>
          </div>

          <div className="flex justify-between items-center text-sm font-medium">
            <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <ShoppingCart size={18} /> Cart Items ({cart.reduce((a, b) => a + b.qty, 0)})
            </span>
            <button
              onClick={clearCart}
              className="text-red-500 hover:text-red-600 flex items-center gap-1 text-xs font-semibold"
            >
              <RotateCcw size={14} /> Clear
            </button>
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingCart size={48} className="mb-2 stroke-1" />
              <p className="text-sm">No items in the cart</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">{item.name}</h4>
                  <p className="text-xs text-gray-500">৳{item.price} each</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQty(item.id, -1)}
                    className="p-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-100"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-semibold w-5 text-center">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.id, 1)}
                    className="p-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-100"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div className="text-right">
                  <p className="font-bold text-sm">৳{Number(item.price) * item.qty}</p>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Billing & Payment Calculations */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Subtotal</span>
            <span>৳{subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Tag size={14} /> Discount (%)
            </span>
            <input
              type="number"
              min="0"
              max="100"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(Number(e.target.value))}
              className="w-16 px-2 py-0.5 text-right border rounded dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:outline-none"
            />
          </div>

          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Tax ({taxPercent}%)</span>
            <span>৳{taxAmount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700 text-base font-bold">
            <span>Total Payable</span>
            <span className="text-indigo-600 dark:text-indigo-400">
              ৳{grandTotal.toFixed(2)}
            </span>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {[
              { id: "cash", label: "Cash", icon: Banknote },
              { id: "card", label: "Card", icon: CreditCard },
              { id: "bkash", label: "Mobile Pay", icon: QrCode },
            ].map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`flex items-center justify-center gap-1 py-2 px-1 rounded-lg border text-xs font-medium transition-all ${
                    paymentMethod === method.id
                      ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <Icon size={14} />
                  {method.label}
                </button>
              );
            })}
          </div>

          {/* Checkout & Print Action */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={handlePrintReceipt}
              className="flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-semibold rounded-xl transition-all shadow-sm active:scale-[0.98]"
            >
              <Printer size={18} /> Print
            </button>
            <button
              onClick={() => {
                if (cart.length === 0) return alert("Cart is empty!");
                alert("Order placed successfully!");
                clearCart();
              }}
              className="flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-md active:scale-[0.98]"
            >
              Pay ৳{grandTotal.toFixed(0)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}