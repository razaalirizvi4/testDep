import React, { useState, useEffect } from "react";
import { MenuItem, SpicyLevel } from "../../../types";
import { uploadImageToBucket } from "@/app/[locale]/utils/uploadImage";
import { useTranslations } from "next-intl";

interface MenuItemFormProps {
  menuItem?: MenuItem;
  onSubmit: (data: Partial<MenuItem>) => void;
  onCancel: () => void;
}

const MenuItemForm: React.FC<MenuItemFormProps> = ({
  menuItem,
  onSubmit,
  onCancel,
}) => {
  const tCommon = useTranslations("common");
  const tVendor = useTranslations("vendor");
  const [label, setLabel] = useState(menuItem?.label ?? "");
  const [description, setDescription] = useState(menuItem?.description ?? "");
  const [price, setPrice] = useState(menuItem?.price ?? 0);
  const [image, setImage] = useState(menuItem?.image ?? "");
  const [category, setCategory] = useState(menuItem?.category ?? "");
  const [spicy, setSpicy] = useState<SpicyLevel | null>(menuItem?.spicy ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (menuItem) {
      setLabel(menuItem.label ?? "");
      setDescription(menuItem.description ?? "");
      setPrice(menuItem.price ?? 0);
      setImage(menuItem.image ?? "");
      setCategory(menuItem.category ?? "");
      setSpicy(menuItem.spicy ?? null);
      setFile(null); // Reset file when menuItem changes
      setPreviewUrl(null); // Reset preview URL
    }
  }, [menuItem]);

  // Handle file preview URL creation and cleanup
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let imageUrl = image;
    if (file) {
      setUploading(true);
      const uploadedImageUrl = await uploadImageToBucket(file);
      if (uploadedImageUrl) {
        imageUrl = uploadedImageUrl;
      }
    }

    onSubmit({
      id: menuItem?.id,
      label,
      description,
      price,
      image: imageUrl,
      category,
      spicy: spicy || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">{tCommon("label")}</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          {tVendor("description")}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">{tCommon("price")}</label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          required
        />
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          {tVendor("coverImage")}
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
        />
      </div>

      {/* Show image preview - new file takes priority, otherwise show existing image */}
      {(previewUrl || image) && (
        <div className="mt-2">
          <p className="text-xs text-gray-500 mb-2">
            {previewUrl ? "New image preview:" : "Current image:"}
          </p>
          <img
            src={previewUrl || image}
            alt={previewUrl ? "Preview" : "Current"}
            className="w-32 h-32 object-cover rounded border border-gray-300"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          {tCommon("category")}
        </label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          {tVendor("spicyLevel")}
        </label>
        <select
          value={spicy || ""}
          onChange={(e) => setSpicy(e.target.value ? (e.target.value as SpicyLevel) : null)}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
        >
          <option value="">{tVendor("spice_notApplicable")}</option>
          <option value="MILD">{tVendor("spice_mild")} 🌶️</option>
          <option value="MEDIUM">{tVendor("spice_medium")} 🌶️🌶️</option>
          <option value="HOT">{tVendor("spice_hot")} 🌶️🌶️🌶️</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Select the spice level for this menu item. Leave as &quot;Normal&quot; if the item is not spicy.
        </p>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-300 px-4 py-2 rounded"
        >
          {tCommon("cancel")}
        </button>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={uploading}
        >
          {uploading ? tCommon("uploading") : tCommon("save")}
        </button>
      </div>
    </form>
  );
};

export default MenuItemForm;
