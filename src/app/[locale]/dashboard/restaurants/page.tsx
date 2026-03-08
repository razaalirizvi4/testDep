"use client";
import React, { useState, useEffect } from "react";
import { Link as LocaleLink, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import RestaurantForm from "./RestaurantForm";
import MenuItemForm from "@/components/dashboard/restaurants/MenuItemForm";
import { MenuItem, Restaurant } from "@/types";
import { UserRole, ApprovalStatus } from "@/types/user";
import { useAuthStore } from "@/store/useStore";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  BuildingStorefrontIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useCurrency } from "@/hooks/useCurrency";
import { formatCurrency as formatCurrencyUtil } from "@/utils/currency";

// Carousel component for restaurant images
const RestaurantImageCarousel = ({ images, restaurantName }: { images: string[], restaurantName: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative h-full w-full">
      <Image
        src={images[currentIndex]}
        alt={restaurantName}
        fill
        className="object-cover"
      />
      {images.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 z-10 transition-all"
            aria-label="Previous image"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 z-10 transition-all"
            aria-label="Next image"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Extend Restaurant type to include additional fields from Prisma schema
type RestaurantWithExtras = Restaurant & {
  isActive: boolean;
  vendorId: string;
  country?: string | null;
  currency?: string | null;
  vendor?: {
    id: string;
    businessName: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      phoneNumber: string | null;
    };
  };
};

// Super Admin View Component - Shows all restaurants in card format
const SuperAdminRestaurantView = () => {
  const tDashboard = useTranslations("dashboard");
  const tVendor = useTranslations("vendor");
  const tCommon = useTranslations("common");

  const [restaurants, setRestaurants] = useState<RestaurantWithExtras[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  // Use global currency for super admin view (showing all restaurants)
  // Note: Using formatCurrencyUtil directly with restaurant currency when available

  const fetchAllRestaurants = React.useCallback(async () => {
    try {
      const response = await fetch("/api/restaurants");
      if (!response.ok) throw new Error("Failed to fetch restaurants");
      const data = await response.json();
      setRestaurants(data);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      toast.error(tDashboard('errorLoadingRestaurants') || "Failed to load restaurants");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllRestaurants();
  }, [fetchAllRestaurants]);

  // Calculate pagination
  const totalPages = Math.ceil(restaurants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRestaurants = restaurants.slice(startIndex, endIndex);

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">{tDashboard('loadingRestaurants')}</p>
      </div>
    );
  }

  return (
    <div className="space-t-6 ">
      <div className=" items-center pb-2">
        <div>
          <h1 className="text-2xl mb-2 font-bold text-gray-900">
            {tDashboard('allRestaurants')}
          </h1>
        </div>
        {/* <div className="text-sm text-gray-600">
          Total: <span className="font-semibold">{restaurants.length}</span>{" "}
          restaurants
          {restaurants.length > 0 && (
            <span className="ml-2">
              (Showing {startIndex + 1}-{Math.min(endIndex, restaurants.length)}{" "}
              of {restaurants.length})
            </span>
          )}
        </div> */}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">{tDashboard('noRestaurantsFound')}</p>
          </div>
        ) : (
          paginatedRestaurants.map((restaurant) => {
            // Determine which images to use
            const images = restaurant.coverImagesList && restaurant.coverImagesList.length > 0
              ? restaurant.coverImagesList
              : restaurant.coverImage
                ? [restaurant.coverImage]
                : ["https://via.placeholder.com/400x200"];

            return (
              <div
                key={restaurant.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Restaurant Image */}
                <div className="relative h-48">
                  {images.length > 1 ? (
                    <RestaurantImageCarousel images={images} restaurantName={restaurant.name} />
                  ) : (
                    <Image
                      src={images[0]}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                      fill
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    <h3 className="text-white text-xl font-bold px-4 pb-3 w-full">
                      {restaurant.name}
                    </h3>
                  </div>
                </div>

                {/* Restaurant Details */}
                <div className="p-4 space-y-3">
                  {/* Chain Name */}
                  <div className="flex items-center text-gray-700">
                    <BuildingStorefrontIcon className="h-5 w-5 mr-2 text-gray-400" />
                    <span className="text-sm font-medium">
                      {restaurant.chainName || tDashboard('independentRestaurant')}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="flex items-start text-gray-600">
                    <MapPinIcon className="h-5 w-5 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium">
                        {restaurant.area}, {restaurant.city}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {restaurant.address}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        📍 {restaurant.latitude.toFixed(4)},{" "}
                        {restaurant.longitude.toFixed(4)}
                      </p>
                    </div>
                  </div>

                  {/* Owner Information */}
                  {restaurant.vendor && (
                    <div className="border-t pt-3 mt-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                        {tDashboard('ownerInformation')}
                      </p>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-900">
                          <span className="font-medium">{tVendor('business')}:</span>{" "}
                          {restaurant.vendor.businessName}
                        </p>
                        <p className="text-gray-700">
                          <span className="font-medium">{tVendor('owner')}:</span>{" "}
                          {restaurant.vendor.user.name || tCommon('noResults')}
                        </p>
                        <p className="text-gray-600 text-xs">
                          <span className="font-medium">{tVendor('ownerEmail')}:</span>{" "}
                          {restaurant.vendor.user.email}
                        </p>
                        {restaurant.vendor.user.phoneNumber && (
                          <p className="text-gray-600 text-xs">
                            <span className="font-medium">{tVendor('ownerPhone')}:</span>{" "}
                            {restaurant.vendor.user.phoneNumber}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      <span>{restaurant.deliveryTime || "N/A"}</span>
                    </div>
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                      <span>{restaurant.minimumOrder ? formatCurrencyUtil(restaurant.minimumOrder, restaurant.currency || undefined) : "N/A"}</span>
                    </div>
                  </div>
                  {/* Delivery Charges */}
                  {/* <div className="flex items-center text-xs text-gray-500 pt-2">
                  <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                  <span>
                    Delivery:{" "}
                    {restaurant.deliveryCharges !== null &&
                    restaurant.deliveryCharges !== undefined
                      ? `$${restaurant.deliveryCharges.toFixed(2)}`
                      : "Not set"}
                  </span>
                </div> */}

                  {/* Status Badge */}
                  <div className="flex items-center justify-between pt-2">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${restaurant.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                        }`}
                    >
                      {restaurant.isActive ? tDashboard('active') : tDashboard('inactive')}
                    </span>
                    {restaurant.rating && (
                      <span className="text-sm font-medium text-gray-700">
                        ⭐ {restaurant.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {restaurants.length > itemsPerPage && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 ">
          <p className="text-sm text-gray-600">
            {tDashboard('pageInfo', { current: currentPage, total: totalPages })}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {tCommon('previous')}
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${currentPage === page
                          ? "bg-indigo-600 text-white"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                          }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return (
                      <span key={page} className="px-2 text-gray-500">
                        ...
                      </span>
                    );
                  }
                  return null;
                }
              )}
            </div>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {tCommon('next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Vendor View Component - Original functionality for vendors
const RestaurantManager = () => {
  const tDashboard = useTranslations("dashboard");
  const tVendor = useTranslations("vendor");
  const tCommon = useTranslations("common");
  const tRestaurant = useTranslations("restaurant");

  const [restaurants, setRestaurants] = useState<RestaurantWithExtras[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<RestaurantWithExtras | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMenuItemFormOpen, setIsMenuItemFormOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] =
    useState<RestaurantWithExtras | null>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const vendorId = useAuthStore((state) => state.user?.vendorProfile?.id);
  // Use global currency as fallback, but we'll use restaurant-specific currency where available
  const { formatCurrency: formatCurrencyGlobal } = useCurrency();

  // Helper function to format currency with restaurant-specific currency
  const formatCurrencyWithRestaurant = (amount: number | string | null | undefined, restaurantCurrency?: string | null) => {
    if (restaurantCurrency) {
      return formatCurrencyUtil(amount, restaurantCurrency);
    }
    return formatCurrencyGlobal(amount);
  };

  const fetchRestaurants = React.useCallback(async () => {
    if (!vendorId) return;
    console.log(vendorId, "vendorid");
    try {
      const response = await fetch(`/api/restaurants?vendorId=${vendorId}`);
      if (!response.ok) throw new Error("Failed to fetch restaurants");
      const data = await response.json();
      setRestaurants(data);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const handleSubmit = async (data: Partial<RestaurantWithExtras>) => {
    if (!vendorId) return;

    try {
      const url = editingRestaurant?.id
        ? `/api/restaurants/${editingRestaurant.id}`
        : "/api/restaurants";

      const restaurantData: Partial<RestaurantWithExtras> = {
        ...data,
        latitude:
          typeof data.latitude === "string"
            ? parseFloat(data.latitude)
            : data.latitude,
        longitude:
          typeof data.longitude === "string"
            ? parseFloat(data.longitude)
            : data.longitude,
        rating: data.rating
          ? typeof data.rating === "string"
            ? parseFloat(data.rating)
            : data.rating
          : null,
        minimumOrder: data.minimumOrder !== undefined ? (data.minimumOrder && String(data.minimumOrder).trim() !== '' ? String(data.minimumOrder).trim() : null) : undefined,
        spottedDate: data.spottedDate ? new Date(data.spottedDate) : null,
        closedDate: data.closedDate ? new Date(data.closedDate) : null,
        isActive: data.isActive ?? true,
        vendorId, // Always use
        //  current vendor's ID
      };

      const response = await fetch(url, {
        method: editingRestaurant?.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(restaurantData),
      });

      if (!response.ok) throw new Error("Failed to save restaurant");

      await fetchRestaurants();
      setIsFormOpen(false);
      setEditingRestaurant(null);
    } catch (error) {
      console.error("Error saving restaurant:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this restaurant?")) return;

    try {
      const response = await fetch(`/api/restaurants/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete restaurant");
      await fetchRestaurants();
    } catch (error) {
      console.error("Error deleting restaurant:", error);
    }
  };

  const handleMenuItemSubmit = async (data: Partial<MenuItem>) => {
    if (!selectedRestaurant) return;

    try {
      const url = editingMenuItem?.id
        ? `/api/restaurants/${selectedRestaurant.id}/menu-items/${editingMenuItem.id}`
        : `/api/restaurants/${selectedRestaurant.id}/menu-items`;

      const response = await fetch(url, {
        method: editingMenuItem?.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, restaurantId: selectedRestaurant.id }),
      });

      if (!response.ok) throw new Error("Failed to save menu item");

      await fetchRestaurants();
      setIsMenuItemFormOpen(false);
      setEditingMenuItem(null);
    } catch (error) {
      console.error("Error saving menu item:", error);
    }
  };

  const handleMenuItemDelete = async (
    restaurantId: string,
    menuItemId: string
  ) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;

    try {
      const response = await fetch(
        `/api/restaurants/${restaurantId}/menu-items/${menuItemId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) throw new Error("Failed to delete menu item");
      await fetchRestaurants();
    } catch (error) {
      console.error("Error deleting menu item:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">{tDashboard('restaurantsManagement')}</h1>
        <button
          onClick={() => {
            setEditingRestaurant(null);
            setIsFormOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          {tVendor('addRestaurant')}
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.map((restaurant) => {
          // Determine which images to use
          const images = restaurant.coverImagesList && restaurant.coverImagesList.length > 0
            ? restaurant.coverImagesList
            : restaurant.coverImage
              ? [restaurant.coverImage]
              : ["https://via.placeholder.com/400x200"];

          return (
            <div
              key={restaurant.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="relative h-48">
                {images.length > 1 ? (
                  <RestaurantImageCarousel images={images} restaurantName={restaurant.name} />
                ) : (
                  <Image
                    src={images[0]}
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                    fill
                  />
                )}
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <h3 className="text-white text-xl font-bold px-4 text-center">
                    {restaurant.name}
                  </h3>
                </div>
              </div>

              <div className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <BuildingStorefrontIcon className="h-5 w-5 mr-2" />
                    <span>
                      {restaurant.chainName || tDashboard('independentRestaurant')}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPinIcon className="h-5 w-5 mr-2" />
                    <span>
                      {restaurant.area}, {restaurant.city}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <ClockIcon className="h-5 w-5 mr-2" />
                    <span>
                      {restaurant.deliveryTime || tDashboard('deliveryTimeNotSet')}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                    <span>
                      {tRestaurant('minimumOrder')}: {restaurant.minimumOrder ? formatCurrencyWithRestaurant(restaurant.minimumOrder, restaurant.currency) : tDashboard('minOrderNotSet')}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <TruckIcon className="h-5 w-5 mr-2" />
                    <span>
                      {tRestaurant('deliveryCharges')}:{" "}
                      {restaurant.deliveryCharges !== null &&
                        restaurant.deliveryCharges !== undefined
                        ? formatCurrencyWithRestaurant(restaurant.deliveryCharges, restaurant.currency)
                        : `${tDashboard('deliveryChargesNotSet')} ${tDashboard('defaultCharges', { amount: formatCurrencyWithRestaurant(2.99, restaurant.currency) })}`}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <div className="space-x-2">
                    <button
                      onClick={() => {
                        setEditingRestaurant(restaurant);
                        setIsFormOpen(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(restaurant.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedRestaurant(restaurant);
                      setIsMenuItemFormOpen(true);
                    }}
                    className="flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                  >
                    {tVendor('addMenuItem')} <PlusIcon className="h-4 w-4 text-white" />
                  </button>
                </div>
                {restaurant.menuItems && restaurant.menuItems.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="font-semibold mb-2">{tVendor('menuItems')}</h4>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-500 [scrollbar-width:thin] [scrollbar-color:rgb(156,163,175)_rgb(243,244,246)]">
                      {restaurant.menuItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center p-2 bg-gray-50 rounded"
                        >
                          <div>
                            <div className="font-medium">{item.label}</div>
                            <div className="text-sm text-gray-600">
                              {formatCurrencyWithRestaurant(item.price, restaurant.currency)}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedRestaurant(restaurant);
                                setEditingMenuItem(item);
                                setIsMenuItemFormOpen(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleMenuItemDelete(restaurant.id, item.id)
                              }
                              className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 ">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto mt-32 mb-12">
            <h2 className="text-xl font-bold mb-4">
              {editingRestaurant ? tVendor('editRestaurant') : tVendor('addRestaurant')}
            </h2>
            <RestaurantForm
              restaurant={editingRestaurant || undefined}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingRestaurant(null);
              }}
              vendorId={vendorId}
            />
          </div>
        </div>
      )}

      {isMenuItemFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingMenuItem ? tVendor('editMenuItem') : tVendor('addMenuItem')}
            </h2>
            <MenuItemForm
              menuItem={editingMenuItem || undefined}
              onSubmit={handleMenuItemSubmit}
              onCancel={() => {
                setIsMenuItemFormOpen(false);
                setEditingMenuItem(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Main component with authorization checks
const RestaurantsPage = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  useEffect(() => {
    // Try loading user data from localStorage
    const storedUser = localStorage.getItem("auth-storage");

    if (storedUser) {
      const authUser = JSON.parse(storedUser);

      console.log(authUser.state.user, "storeduser");

      // Wait until user data is available
      if (!authUser.state.isAuthenticated) {
        router.push("/auth/login");
        return;
      }

      // Super admin doesn't need approval check
      if (!isSuperAdmin && authUser.state.user.approvalStatus !== "APPROVED") {
        router.push("/pending-approval");
        return;
      }
    }
  }, [router, isSuperAdmin]);

  // Super Admin can view all restaurants
  if (isSuperAdmin) {
    return (
      <DashboardLayout>
        <SuperAdminRestaurantView />
      </DashboardLayout>
    );
  }

  // Vendor view - requires approval and vendor profile
  if (
    !user ||
    user.role !== UserRole.VENDOR ||
    user.approvalStatus !== ApprovalStatus.APPROVED ||
    !user.vendorProfile?.id
  ) {
    return null;
  }

  return (
    <DashboardLayout>
      <RestaurantManager />
    </DashboardLayout>
  );
};

export default RestaurantsPage;
