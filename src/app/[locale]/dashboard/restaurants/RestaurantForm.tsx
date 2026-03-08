import React, { useState } from "react";
import { Restaurant } from "@/types";
import MapWindow from "@/components/dashboard/restaurants/MapWindow";
import { uploadImageToBucket } from "../../utils/uploadImage";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { COUNTRIES, getCurrencyByCountry } from "@/constants/countries";
import { useTranslations } from "next-intl";

type RestaurantFormData = Restaurant & {
  isActive: boolean;
  vendorId: string;
};

interface RestaurantFormProps {
  restaurant?: Partial<RestaurantFormData>;
  onSubmit: (data: Partial<RestaurantFormData>) => void;
  onCancel: () => void;
  vendorId?: string;
}

const RestaurantForm: React.FC<RestaurantFormProps> = ({
  restaurant,
  onSubmit,
  onCancel,
  vendorId,
}) => {
  const tRestaurant = useTranslations("restaurant");
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [imageMode, setImageMode] = useState<'single' | 'multiple'>(
    restaurant?.coverImagesList && restaurant.coverImagesList.length > 0 ? 'multiple' : 'single'
  );
  const [formData, setFormData] = useState({
    name: restaurant?.name || "",
    chainName: restaurant?.chainName || "",
    address: restaurant?.address || "",
    latitude: restaurant?.latitude || 0,
    longitude: restaurant?.longitude || 0,
    cuisineType: restaurant?.cuisineType || "",
    segment: restaurant?.segment || "",
    city: restaurant?.city || "",
    area: restaurant?.area || "",
    rating: restaurant?.rating || null,
    coverImage: restaurant?.coverImage || "",
    coverImagesList: restaurant?.coverImagesList || [],
    deliveryTime: restaurant?.deliveryTime || "",
    minimumOrder: restaurant?.minimumOrder ?? "",
    deliveryCharges: restaurant?.deliveryCharges || "",
    spottedDate: restaurant?.spottedDate
      ? new Date(restaurant.spottedDate).toISOString().split("T")[0]
      : "",
    closedDate: restaurant?.closedDate
      ? new Date(restaurant.closedDate).toISOString().split("T")[0]
      : "",
    isActive: restaurant?.isActive ?? true,
    vendorId: restaurant?.vendorId || vendorId || "",
    country: restaurant?.country || "",
    currency: restaurant?.currency || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const submitData: any = {
      ...formData,
      latitude: parseFloat(formData.latitude.toString()),
      longitude: parseFloat(formData.longitude.toString()),
      rating: formData.rating ? parseFloat(formData.rating.toString()) : null,
      deliveryCharges: formData.deliveryCharges ? parseFloat(formData.deliveryCharges.toString()) : null,
      minimumOrder: formData.minimumOrder && formData.minimumOrder.trim() !== '' ? formData.minimumOrder.trim() : null,
      spottedDate: formData.spottedDate ? new Date(formData.spottedDate) : null,
      closedDate: formData.closedDate ? new Date(formData.closedDate) : null,
    };

    // Clear the unused image field based on mode
    if (imageMode === 'single') {
      submitData.coverImagesList = []; // Use empty array for Prisma arrays
    } else {
      submitData.coverImage = null;
    }

    onSubmit(submitData);
  };

  const [uploading, setUploading] = useState(false);

  // Handle single image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      try {
        const imageUrl = await uploadImageToBucket(file);
        setFormData({ ...formData, coverImage: imageUrl || "" });
      } catch (error) {
        console.error("Error uploading image:", error);
      } finally {
        setUploading(false);
      }
    }
  };

  // Handle multiple images upload
  const handleMultipleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploading(true);
      try {
        const uploadPromises = Array.from(files).map(file => uploadImageToBucket(file));
        const imageUrls = await Promise.all(uploadPromises);
        const validUrls = imageUrls.filter(url => url !== null && url !== undefined) as string[];
        setFormData({
          ...formData,
          coverImagesList: [...(formData.coverImagesList || []), ...validUrls]
        });
      } catch (error) {
        console.error("Error uploading images:", error);
      } finally {
        setUploading(false);
      }
    }
  };

  // Remove image from coverImagesList
  const handleRemoveImage = (index: number) => {
    const updatedList = [...(formData.coverImagesList || [])];
    updatedList.splice(index, 1);
    setFormData({ ...formData, coverImagesList: updatedList });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 mt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name*
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Chain Name*
            </label>
            <input
              type="text"
              value={formData.chainName}
              onChange={(e) =>
                setFormData({ ...formData, chainName: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Cuisine Type*
            </label>
            <input
              type="text"
              value={formData.cuisineType}
              onChange={(e) =>
                setFormData({ ...formData, cuisineType: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Segment*
            </label>
            <input
              type="text"
              value={formData.segment}
              onChange={(e) =>
                setFormData({ ...formData, segment: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              City*
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Area*
            </label>
            <input
              type="text"
              value={formData.area}
              onChange={(e) =>
                setFormData({ ...formData, area: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Country*
            </label>
            <select
              value={formData.country}
              onChange={(e) => {
                const selectedCountry = e.target.value;
                const currency = getCurrencyByCountry(selectedCountry);
                setFormData({ 
                  ...formData, 
                  country: selectedCountry,
                  currency: currency
                });
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            >
              <option value="">Select Country</option>
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name} ({country.currencyCode})
                </option>
              ))}
            </select>
            {formData.country && (
              <p className="mt-1 text-xs text-gray-500">
                Currency: {formData.currency || getCurrencyByCountry(formData.country)}
              </p>
            )}
          </div>

          <div className="col-span-2">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Location Coordinates*
              </label>
              <button
                type="button"
                onClick={() => setIsMapOpen(true)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Get Coordinates From GoogleMap
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Latitude*
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      latitude: parseFloat(e.target.value),
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Longitude*
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      longitude: parseFloat(e.target.value),
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Address*
            </label>
            <textarea
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
              rows={3}
            />
          </div>

          {/* Image Upload Section */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Image Type
            </label>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="imageMode"
                  value="single"
                  checked={imageMode === 'single'}
                  onChange={(e) => {
                    setImageMode('single');
                    if (e.target.checked) {
                      setFormData({ ...formData, coverImagesList: [] });
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Single Image</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="imageMode"
                  value="multiple"
                  checked={imageMode === 'multiple'}
                  onChange={(e) => {
                    setImageMode('multiple');
                    if (e.target.checked) {
                      setFormData({ ...formData, coverImage: "" });
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Multiple Images (Carousel)</span>
              </label>
            </div>

            {imageMode === 'single' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Upload Cover Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {uploading && <p className="text-sm text-gray-500">Uploading...</p>}
                {formData.coverImage && !uploading && (
                  <div className="mt-2">
                    <img
                      src={formData.coverImage}
                      alt="Cover"
                      className="w-32 h-32 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Upload Cover Images (Multiple)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleMultipleImagesUpload}
                  disabled={uploading}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {uploading && <p className="text-sm text-gray-500">Uploading...</p>}
                {formData.coverImagesList && formData.coverImagesList.length > 0 && !uploading && (
                  <div className="mt-4 grid grid-cols-4 gap-4">
                    {formData.coverImagesList.map((imageUrl, index) => (
                      <div key={index} className="relative">
                        <img
                          src={imageUrl}
                          alt={`Cover ${index + 1}`}
                          className="w-full h-32 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 bg-white border border-gray-300 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs hover:bg-gray-50"
                        >
                          <XMarkIcon className="h-6 w-6 text-primary-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Rating
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={formData.rating || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  rating: e.target.value ? parseFloat(e.target.value) : null,
                })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Delivery Time
            </label>
            <input
              type="text"
              value={formData.deliveryTime}
              onChange={(e) =>
                setFormData({ ...formData, deliveryTime: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="e.g., 30-45 mins"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Minimum Order
            </label>
            <input
              type="text"
              value={formData.minimumOrder || ""}
              onChange={(e) =>
                setFormData({ ...formData, minimumOrder: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="e.g., 15.00"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter the minimum order amount (without currency symbol)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Delivery Charges ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.deliveryCharges}
              onChange={(e) =>
                setFormData({ ...formData, deliveryCharges: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="e.g., 2.99"
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave empty to use default delivery charges
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Spotted Date
            </label>
            <input
              type="date"
              value={formData.spottedDate}
              onChange={(e) =>
                setFormData({ ...formData, spottedDate: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Closed Date
            </label>
            <input
              type="date"
              value={formData.closedDate}
              onChange={(e) =>
                setFormData({ ...formData, closedDate: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Vendor ID
            </label>
            <input
              type="text"
              value={formData.vendorId}
              readOnly
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Save
          </button>
        </div>
      </form>

      <MapWindow
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelectLocation={(lat, lng, address) => {
          setFormData((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            address: address,
          }));
        }}
        initialAddress={formData.address}
      />
    </>
  );
};

export default RestaurantForm;
