import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  User,
  MapPin,
  Package,
  ShoppingCart,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function CreateOrder() {
  const navigate = useNavigate();

  // 1. Shipping Details State
  const [shipping, setShipping] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    cityDistrict: '',
    postalCode: '',
  });

  // 2. Billing Details State
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [billing, setBilling] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    cityDistrict: '',
    postalCode: '',
  });

  // 3. Pricing State
  const [deliveryCharge, setDeliveryCharge] = useState(60);

  // 4. Items Array State
  const [items, setItems] = useState([
    {
      productId: `prod_${Date.now()}`,
      variantId: '',
      name: '',
      category: '',
      color: '',
      size: '',
      price: 0,
      quantity: 1,
      discount: 0,
      image: '',
    },
  ]);

  // Status States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✏️ Shipping Input Handler
  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShipping((prev) => ({ ...prev, [name]: value }));
  };

  // ✏️ Billing Input Handler
  const handleBillingChange = (e) => {
    const { name, value } = e.target;
    setBilling((prev) => ({ ...prev, [name]: value }));
  };

  // ➕ Add New Item to Order
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        productId: `prod_${Date.now()}_${prev.length + 1}`,
        variantId: '',
        name: '',
        category: '',
        color: '',
        size: '',
        price: 0,
        quantity: 1,
        discount: 0,
        image: '',
      },
    ]);
  };

  // ➖ Remove Item
  const handleRemoveItem = (index) => {
    if (items.length === 1) {
      alert('Order must contain at least one product item!');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // ✏️ Update Specific Item Field
  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: field === 'price' || field === 'quantity' || field === 'discount'
          ? parseFloat(value) || 0
          : value,
      };
      return updated;
    });
  };

  // 💰 Calculations
  const subtotal = items.reduce(
    (acc, item) => acc + (item.price * item.quantity - (item.discount || 0)),
    0
  );
  const grandTotal = subtotal + parseFloat(deliveryCharge || 0);

  // 🚀 Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!shipping.lastName || !shipping.address || !shipping.cityDistrict || !shipping.phone) {
      setError('Please fill in all required shipping details (Last Name, Address, City/District, Phone)');
      return;
    }

    const invalidItems = items.some((item) => !item.name || item.price <= 0);
    if (invalidItems) {
      setError('Each product item must have a Product Name and Price greater than 0.');
      return;
    }

    setLoading(true);

    // Prepare Request Payload for Backend
    const orderPayload = {
      firstName: shipping.firstName,
      lastName: shipping.lastName,
      address: shipping.address,
      cityDistrict: shipping.cityDistrict,
      postalCode: shipping.postalCode,
      phone: shipping.phone,
      price: subtotal,
      deliveryCharge: parseFloat(deliveryCharge || 0),
      billingFirstName: sameAsShipping ? shipping.firstName : billing.firstName,
      billingLastName: sameAsShipping ? shipping.lastName : billing.lastName,
      billingAddressInput: sameAsShipping ? shipping.address : billing.address,
      billingCity: sameAsShipping ? shipping.cityDistrict : billing.cityDistrict,
      billingPostalCode: sameAsShipping ? shipping.postalCode : billing.postalCode,
      billingPhone: sameAsShipping ? shipping.phone : billing.phone,
      items: items.map((item) => ({
        productId: item.productId || `prod_${Date.now()}`,
        variantId: item.variantId || null,
        name: item.name,
        category: item.category || null,
        color: item.color || null,
        size: item.size || null,
        price: parseFloat(item.price),
        quantity: parseInt(item.quantity, 10),
        discount: parseFloat(item.discount || 0),
        image: item.image || null,
      })),
    };

    try {
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });

      const data = await response.json();

      if (response.ok) {
        // Successful Order Creation -> Redirect to Order Details Page
        navigate(`/orders/${data.orderId}`);
      } else {
        setError(data.message || 'Failed to create order');
      }
    } catch (err) {
      console.error('Error creating order:', err);
      setError('Network Error: Could not connect to the backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto">
      {/* 🟢 Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/orders"
            className="p-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-surface-light dark:hover:bg-surface-dark text-text-secondary-light dark:text-text-secondary-dark transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
              Create New Order
            </h1>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
              Manually place a new order for a customer
            </p>
          </div>
        </div>
      </div>

      {/* ⚠️ Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* বাম পাশ: কাস্টমার অ্যান্ড আইটেমস ইনফরমেশন (২ কলাম) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 👤 1. Shipping Details Card */}
            <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-border-light dark:border-border-dark space-y-4 shadow-sm">
              <h2 className="font-semibold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2 border-b border-border-light dark:border-border-dark pb-3 text-base">
                <User size={18} className="text-accent-brand" />
                Shipping Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={shipping.firstName}
                    onChange={handleShippingChange}
                    placeholder="Farhan"
                    className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent-brand/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={shipping.lastName}
                    onChange={handleShippingChange}
                    placeholder="Ahmed"
                    className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent-brand/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="phone"
                    required
                    value={shipping.phone}
                    onChange={handleShippingChange}
                    placeholder="01700000000"
                    className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent-brand/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                    City / District <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="cityDistrict"
                    required
                    value={shipping.cityDistrict}
                    onChange={handleShippingChange}
                    placeholder="Dhaka"
                    className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent-brand/50"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                    Full Address <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    name="address"
                    required
                    rows={2}
                    value={shipping.address}
                    onChange={handleShippingChange}
                    placeholder="House 12, Road 5, Block B, Mirpur"
                    className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent-brand/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={shipping.postalCode}
                    onChange={handleShippingChange}
                    placeholder="1216"
                    className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent-brand/50"
                  />
                </div>
              </div>

              {/* Checkbox Same as Shipping */}
              <div className="pt-2 border-t border-border-light dark:border-border-dark">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-text-primary-light dark:text-text-primary-dark">
                  <input
                    type="checkbox"
                    checked={sameAsShipping}
                    onChange={(e) => setSameAsShipping(e.target.checked)}
                    className="rounded border-border-light dark:border-border-dark text-accent-brand focus:ring-accent-brand"
                  />
                  <span>Billing address is same as shipping address</span>
                </label>
              </div>
            </div>

            {/* 💳 2. Separate Billing Details (If Same as Shipping is false) */}
            {!sameAsShipping && (
              <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-border-light dark:border-border-dark space-y-4 shadow-sm">
                <h2 className="font-semibold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2 border-b border-border-light dark:border-border-dark pb-3 text-base">
                  <MapPin size={18} className="text-accent-brand" />
                  Billing Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={billing.firstName}
                      onChange={handleBillingChange}
                      className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={billing.lastName}
                      onChange={handleBillingChange}
                      className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={billing.phone}
                      onChange={handleBillingChange}
                      className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="cityDistrict"
                      value={billing.cityDistrict}
                      onChange={handleBillingChange}
                      className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={billing.address}
                      onChange={handleBillingChange}
                      className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 📦 3. Product Items List Card */}
            <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-border-light dark:border-border-dark space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-border-light dark:border-border-dark pb-3">
                <h2 className="font-semibold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2 text-base">
                  <Package size={18} className="text-accent-brand" />
                  Order Items
                </h2>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-accent-brand/10 text-accent-brand hover:bg-accent-brand hover:text-white transition-all"
                >
                  <Plus size={14} /> Add Item
                </button>
              </div>

              {/* Items Form Rows */}
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border border-border-light dark:border-border-dark bg-background-light/50 dark:bg-background-dark/50 space-y-3 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-accent-brand">
                        Item #{index + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-rose-500 hover:bg-rose-500/10 p-1 rounded-md transition-colors"
                          title="Remove Item"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                          Product Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          placeholder="Sports Sandal Crimson Red"
                          className="w-full px-3 py-1.5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                          Category
                        </label>
                        <input
                          type="text"
                          value={item.category}
                          onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                          placeholder="Sports Sandal"
                          className="w-full px-3 py-1.5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                          Price (৳) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={item.price}
                          onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark text-xs font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                          Discount (৳)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={item.discount}
                          onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                          Size
                        </label>
                        <input
                          type="text"
                          value={item.size}
                          onChange={(e) => handleItemChange(index, 'size', e.target.value)}
                          placeholder="41"
                          className="w-full px-3 py-1.5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                          Color
                        </label>
                        <input
                          type="text"
                          value={item.color}
                          onChange={(e) => handleItemChange(index, 'color', e.target.value)}
                          placeholder="Crimson Red"
                          className="w-full px-3 py-1.5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                          Image URL
                        </label>
                        <input
                          type="text"
                          value={item.image}
                          onChange={(e) => handleItemChange(index, 'image', e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className="w-full px-3 py-1.5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ডান পাশ: প্রাইস সামারি ও সাবমিট বাটন (১ কলাম) */}
          <div className="space-y-6">
            <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-border-light dark:border-border-dark space-y-4 shadow-sm sticky top-6">
              <h2 className="font-semibold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2 border-b border-border-light dark:border-border-dark pb-3 text-base">
                <ShoppingCart size={18} className="text-accent-brand" />
                Order Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-text-secondary-light dark:text-text-secondary-dark">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                    ৳{subtotal.toLocaleString('en-BD')}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                    Delivery Charge (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={deliveryCharge}
                    onChange={(e) => setDeliveryCharge(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark text-sm font-semibold"
                  />
                </div>

                <div className="pt-3 border-t border-border-light dark:border-border-dark flex justify-between items-center text-base font-bold">
                  <span className="text-text-primary-light dark:text-text-primary-dark">
                    Grand Total:
                  </span>
                  <span className="text-accent-brand">
                    ৳{grandTotal.toLocaleString('en-BD')}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-accent-brand text-white font-medium text-sm rounded-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Place Order Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}