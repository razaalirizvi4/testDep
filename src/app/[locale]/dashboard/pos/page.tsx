'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import PaymentModal from '@/components/pos/PaymentModal';
import ReceiptModal from '@/components/pos/ReceiptModal';
import ShiftModal from '@/components/pos/ShiftModal';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuthStore } from '@/store/useStore';
import { authService } from '@/services/authService';
import { useCurrency } from '@/hooks/useCurrency';
import { useTranslations } from 'next-intl';
import {
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  BanknotesIcon,
  ClockIcon,
  ArchiveBoxIcon,
  PlusIcon,
  MinusIcon,
  MapPinIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  taxRate?: number;
  serviceChargeRate?: number;
  isTaxIncluded?: boolean;
  currency?: string | null;
}

interface MenuItem {
  id: string;
  label: string;
  price: number;
  image?: string | null;
}

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface POSOrder {
  id: string;
  orderId: string; // Add this
  order?: { id: string }; // Optional relation
  type: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  taxAmount: number;
  serviceCharge: number;
  discountAmount: number;
  notes?: string;
  items?: any[];
}

interface Shift {
  id: string;
  openedAt: string;
  openingFloat: number;
  cashIn: number;
  cashOut: number;
  cashSales: number;
  cardSales: number;
  qrSales: number;
  expectedCash?: number;
}

export default function POSPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const vendorId = !isSuperAdmin ? user?.vendorProfile?.id : undefined;
  const isVendor = Boolean(vendorId);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [activeOrders, setActiveOrders] = useState<POSOrder[]>([]);
  const [currentOrder, setCurrentOrder] = useState<POSOrder | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const tDashboard = useTranslations("dashboard");
  const tOrder = useTranslations("order");
  const tCart = useTranslations("cart");
  const tCommon = useTranslations("common");

  // New state for payment/receipt
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Use ref to track active POSOrder ID (internal) to prevent infinite loop in useEffect
  const orderIdRef = useRef<string | null>(null);

  // Use currency hook for proper currency display
  const { formatCurrency } = useCurrency(selectedRestaurant?.currency);

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync orderIdRef when currentOrder.id changes
  useEffect(() => {
    if (currentOrder?.id) {
      orderIdRef.current = currentOrder.id;
    } else {
      orderIdRef.current = null;
    }
  }, [currentOrder?.id]);

  // Debounced cart sync - only depends on cart, not currentOrder
  useEffect(() => {
    // Debounced sync when cart changes
    if (orderIdRef.current && cart.length > 0) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        syncCartWithBackend();
      }, 1000);
    }
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [cart]); // Removed currentOrder from dependencies to prevent loop

  useEffect(() => {
    if (vendorId) {
      loadInitialData();
    } else {
      setLoading(false);
    }
  }, [vendorId]);


  const loadInitialData = async () => {
    if (!vendorId) return;
    try {
      const token = await authService.getAccessToken();
      if (!token) return;
      const res = await fetch(`/api/restaurants?vendorId=${vendorId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const restaurantsData = await res.json();
      setRestaurants(Array.isArray(restaurantsData) ? restaurantsData : []);

      // Auto-select if only one restaurant
      if (Array.isArray(restaurantsData) && restaurantsData.length === 1) {
        setSelectedRestaurant(restaurantsData[0]);
        loadRestaurantData(restaurantsData[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRestaurantData = async (restaurantId: string) => {
    try {
      const token = await authService.getAccessToken();
      if (!token) return;
      const menuRes = await fetch(`/api/restaurants/${restaurantId}/menu-items`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const menuData = await menuRes.json();
      setMenuItems(Array.isArray(menuData) ? menuData : []);

      const shiftRes = await fetch(`/api/pos/shift?restaurantId=${restaurantId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const shiftData = await shiftRes.json();
      setCurrentShift(shiftData.error ? null : shiftData);

      const ordersRes = await fetch(`/api/pos/order?restaurantId=${restaurantId}&status=OPEN`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const ordersData = await ordersRes.json();
      // ORDERS DATA should now contain `order: { id: ... }` from the include
      setActiveOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (error) {
      console.error('Error loading restaurant data:', error);
    }
  };

  const syncCartWithBackend = async () => {
    if (!orderIdRef.current) return;
    setIsSyncing(true);
    setError(null);
    try {
      const token = await authService.getAccessToken();
      if (!token) return;
      const res = await fetch(`/api/pos/order/${orderIdRef.current}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items: cart })
      });
      if (!res.ok) {
        throw new Error('Failed to sync cart');
      }
      const updatedOrder = await res.json();
      // Only update specific fields to avoid triggering infinite loop
      setCurrentOrder(prev => prev ? {
        ...prev,
        totalAmount: updatedOrder.totalAmount,
        taxAmount: updatedOrder.taxAmount,
        serviceCharge: updatedOrder.serviceCharge,
        items: updatedOrder.items,
        orderId: updatedOrder.orderId // Update orderId if changed?
      } : updatedOrder);
    } catch (error) {
      console.error('Error syncing cart:', error);
      setError('Failed to sync cart with server');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestaurantSelect = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    loadRestaurantData(restaurant.id);
  };

  const createNewOrder = async () => {
    if (!selectedRestaurant) {
      console.error('No restaurant selected');
      return null;
    }
    if (!currentShift) {
      alert("Please open a shift first");
      setIsShiftModalOpen(true);
      return null;
    }
    const token = await authService.getAccessToken();
    if (!token) {
      alert('Authentication error. Please log in again.');
      return null;
    }
    try {
      console.log('Creating order with:', {
        restaurantId: selectedRestaurant.id,
        type: 'walkin',
        hasToken: !!token
      });

      const res = await fetch('/api/pos/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          restaurantId: selectedRestaurant.id,
          type: 'walkin'
        })
      });

      const responseData = await res.json();

      if (!res.ok) {
        const errorMessage = responseData?.error || `HTTP ${res.status}: ${res.statusText}`;
        console.error('Order creation failed:', {
          status: res.status,
          statusText: res.statusText,
          error: errorMessage,
          responseData
        });
        alert(`Failed to create order: ${errorMessage}`);
        return null;
      }

      if (!responseData?.id) {
        console.error('Order created but missing ID:', responseData);
        alert('Order created but missing ID. Please try again.');
        return null;
      }

      console.log('Order created successfully:', responseData.id);
      setCurrentOrder(responseData);
      orderIdRef.current = responseData.id;
      if (cart.length > 0) setCart([]);
      return responseData;
    } catch (error) {
      console.error('Error creating order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to create order: ${errorMessage}`);
      return null;
    }
  };

  const addToCart = (menuItem: MenuItem) => {
    if (!currentShift) {
      setIsShiftModalOpen(true);
      return;
    }
    const existing = cart.find(item => item.menuItemId === menuItem.id);
    if (existing) {
      setCart(cart.map(item =>
        item.menuItemId === menuItem.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        menuItemId: menuItem.id,
        name: menuItem.label,
        price: menuItem.price,
        quantity: 1
      }]);
    }
  };

  const updateCartQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.menuItemId !== menuItemId));
    } else {
      setCart(cart.map(item =>
        item.menuItemId === menuItemId
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const calculateTotal = () => {
    // Current simple total, backend will calculate tax/charges
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleProceedToPayment = async () => {
    if (!currentShift) {
      alert("Please open a shift first");
      setIsShiftModalOpen(true);
      return;
    }
    if (!currentOrder?.id) {
      // Create order first if not exists
      const newOrder = await createNewOrder();
      if (!newOrder?.id) {
        // Failed to create order, don't proceed
        return;
      }
    }
    // Final sync before opening modal
    await syncCartWithBackend();
    setIsPaymentModalOpen(true);
  };

  const handleSendToKitchen = async () => {
    if (!currentOrder?.id) return;
    const token = await authService.getAccessToken();
    if (!token) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/pos/order/${currentOrder.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cart,
          status: 'PREPARING'
        })
      });
      if (res.ok) {
        // Refresh orders
        if (selectedRestaurant) loadRestaurantData(selectedRestaurant.id);
        setCurrentOrder(null);
        orderIdRef.current = null;
        setCart([]);
      }
    } catch (error) {
      console.error('Error sending to kitchen:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const onPaymentComplete = async (method: string, amount: number) => {
    if (!currentOrder?.id) return;
    const token = await authService.getAccessToken();
    if (!token) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/pos/order/${currentOrder.id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ method, amount })
      });

      if (res.ok) {
        const receiptRes = await fetch(`/api/pos/order/${currentOrder.id}/receipt`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const receipt = await receiptRes.json();
        setReceiptData(receipt);

        setIsPaymentModalOpen(false);
        setIsReceiptModalOpen(true);

        // Reset current order
        setCurrentOrder(null);
        orderIdRef.current = null;
        setCart([]);
        // Refresh active orders
        if (selectedRestaurant) loadRestaurantData(selectedRestaurant.id);
      }
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredMenuItems = Array.isArray(menuItems) ? menuItems.filter(item =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // POS is only for vendors; super admin or non-vendor users see Not Found
  if (!isVendor) {
    notFound();
  }

  return (
    <DashboardLayout>
      <div className="w-full h-[calc(100vh-64px)] overflow-hidden flex flex-col bg-gray-100">

        {/* POS Header */}
        <div className="bg-white shadow-sm px-6 py-3 flex justify-between items-center z-10 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <BanknotesIcon className="w-6 h-6 text-blue-600" />
              {tDashboard("pos")}
            </h1>
            {selectedRestaurant && (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                {selectedRestaurant.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Shift Status Badge */}
            <button
              onClick={() => setIsShiftModalOpen(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${currentShift
                ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200 animate-pulse'
                }`}
            >
              <ClockIcon className="w-4 h-4" />
              <span className="text-sm font-bold">
                {currentShift ? `${tDashboard("shift")} (${new Date(currentShift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : `${tDashboard("shift")}`}
              </span>
            </button>

            {selectedRestaurant && (
              <button
                onClick={() => setSelectedRestaurant(null)}
                className="text-gray-500 hover:text-red-500 text-sm font-medium underline"
              >
                {tDashboard("switchRestaurant")}
              </button>
            )}
          </div>
        </div>

        {!selectedRestaurant ? (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl mx-auto text-center font-bold text-gray-800 mb-6">Select Location</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.map((restaurant) => (
                  <div
                    key={restaurant.id}
                    onClick={() => handleRestaurantSelect(restaurant)}
                    className="bg-white transition-all cursor-pointer border border-gray-200 hover:border-gray-300 px-4 py-6 group"
                  >
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary transition-colors mb-2 flex items-start gap-2">
                      <BuildingStorefrontIcon className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                      {restaurant.name}
                    </h3>
                    <p className="text-gray-600 flex items-start gap-2">
                      <MapPinIcon className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                      {restaurant.address}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">

            {/* LEFT SIDE: MENU & ORDERS */}
            <div className="flex-1 flex flex-col min-w-0 bg-gray-50">

              {/* Search & Filters */}
              <div className="p-4 bg-white border-b border-gray-100 flex gap-4 sticky top-0 z-10">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-0 rounded-lg transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Menu Grid */}
                <div className="flex-1 overflow-y-auto py-4 pr-4">
                  <div className="grid grid-cols-2 lg:grid-cols-3  gap-4">
                    {filteredMenuItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => addToCart(item)}
                        className="bg-white p-4 rounded-lg   cursor-pointer border border-gray-200  hover:border-gray-300 transition-all flex gap-3 h-32 group"
                      >
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <h3 className="font-medium text-gray-800 leading-tight  line-clamp-2">{item.label}</h3>
                          <div className="flex items-center justify-between mt-auto">
                            <span className="text-lg font-medium text-gray-900">{formatCurrency(item.price)}</span>
                            <div className="w-8 h-8 rounded-full bg-blue-50 hover:text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <PlusIcon className="w-5 h-5" />
                            </div>
                          </div>
                        </div>
                        <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                          <Image
                            src={item.image || "/images/food-placeholder.jpg"}
                            alt={item.label}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {filteredMenuItems.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                      <ArchiveBoxIcon className="w-16 h-16 mb-2 opacity-50" />
                      <p>{tCommon("noItems")}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: CART & ACTIVE ORDERS */}
            <div className="w-[400px] bg-white  flex flex-col z-20 border-l border-t border-gray-200">

              {/* Tab Switcher (Cart vs Orders) - Simplified to just Cart for now with Active Orders list below */}
              <div className="flex-1 flex flex-col h-1/2 min-h-0 border-b border-gray-100">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                  <h2 className="font-bold text-gray-800 flex items-center gap-2">
                    <ShoppingCartIcon className="w-5 h-5" />
                    {tCart("cart")}
                    {currentOrder?.orderId && (
                      // Show unified Order ID if available, else fallback
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        #{currentOrder.orderId.slice(-5) || currentOrder.id.slice(-5)}
                      </span>
                    )}
                  </h2>
                  <button
                    onClick={createNewOrder}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wide"
                  >
                    {tDashboard("newOrder")}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {Array.isArray(cart) && cart.map((item) => (
                    <div key={item.menuItemId} className="flex gap-4 items-start group">
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(item.price)} x {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                        <button
                          onClick={() => updateCartQuantity(item.menuItemId, item.quantity - 1)}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-white shadow-sm transition-all text-gray-600"
                        >
                          <MinusIcon className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.menuItemId, item.quantity + 1)}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-white shadow-sm transition-all text-blue-600"
                        >
                          <PlusIcon className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-sm font-bold w-16 text-right">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}

                  {(!Array.isArray(cart) || cart.length === 0) && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                      <ShoppingCartIcon className="w-12 h-12 mb-2" />
                      <p className="text-sm">{tCart("empty")}</p>
                      <p className="text-xs">{tCart("addMoreItems")}</p>
                    </div>
                  )}
                </div>

                {/* Totals Section */}
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{tDashboard("subtotal")}</span>
                      <span>{formatCurrency(calculateTotal())}</span>
                    </div>
                    {currentOrder && currentOrder.taxAmount > 0 && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{tDashboard("tax")}</span>
                        <span>{formatCurrency(currentOrder.taxAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                      <span>{tDashboard("total")}</span>
                      <span>{formatCurrency(currentOrder?.totalAmount || calculateTotal())}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleSendToKitchen}
                      disabled={cart.length === 0 || isProcessing || isSyncing}
                      className="bg-orange-100 text-orange-700 py-3 rounded-xl font-bold hover:bg-orange-200 disabled:opacity-50 transition-colors"
                    >
                      {tDashboard("kitchen")}
                    </button>
                    <button
                      onClick={handleProceedToPayment}
                      disabled={cart.length === 0 && (!currentOrder || currentOrder.totalAmount === 0)}
                      className="bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 transition-all hover:scale-[1.02]"
                    >
                      {tDashboard("payment")}
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Orders List (Bottom Half) */}
              <div className="flex-1 min-h-0 bg-white border-t-4 border-gray-100 flex flex-col">
                <div className="p-3 bg-gray-50 border-b border-gray-100">
                  <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">{tOrder("activeOrders")}</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {activeOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => {
                        setCurrentOrder(order);
                        setCart(order.items?.map(item => ({
                          menuItemId: item.menuItemId,
                          name: item.name,
                          price: item.price,
                          quantity: item.quantity
                        })) || []);
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${currentOrder?.id === order.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-blue-300'
                        }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-gray-800 text-sm">#{order.orderId ? order.orderId.slice(-5) : (order.id?.slice(-5) || 'N/A')}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${order.status === 'PREPARING' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="font-bold text-gray-900">{formatCurrency(order.totalAmount)}</span>
                      </div>
                    </div>
                  ))}
                  {activeOrders.length === 0 && (
                    <div className="py-8 text-center text-gray-400 text-xs italic">
                      {tDashboard("noActiveOrders")}
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Modals */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalAmount={currentOrder?.totalAmount || calculateTotal()}
        onPaymentComplete={onPaymentComplete}
        isLoading={isProcessing}
        restaurantCurrency={selectedRestaurant?.currency}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receiptData={receiptData}
        restaurantCurrency={selectedRestaurant?.currency}
      />

      <ShiftModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        restaurantId={selectedRestaurant?.id || ''}
        currentShift={currentShift}
        onShiftUpdate={setCurrentShift}
        restaurantCurrency={selectedRestaurant?.currency}
      />
    </DashboardLayout>
  );
}