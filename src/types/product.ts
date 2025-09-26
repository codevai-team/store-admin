export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  sku: string;
  quantity: number;
  price: number;
  discountPrice?: number;
  attributes: ProductAttribute[];
  images: string[];
}

export interface ProductAttribute {
  name: string;
  value: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  categoryId: string;
  isActive: boolean;
  variants: ProductVariant[];
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  category: Category;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  variantsCount: number;
  totalQuantity: number;
  minPrice: number;
  maxPrice: number;
  mainImage: string | null;
  variants: number;
  images: number;
}
