import { useState, useCallback } from 'react';

interface Category {
  id: string;
  name: string;
  parentId?: string;
  children?: Category[];
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  category: Category;
  seller?: {
    id: string;
    fullname: string;
  };
  mainImage: string | null;
  imageUrl: string[];
  attributes: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  sizes?: string[];
  colors?: Array<{name: string; colorCode: string}>;
  // Для совместимости с текущим кодом (заглушки)
  isActive: boolean;
  variantsCount: number;
  totalQuantity: number;
  minPrice: number;
  maxPrice: number;
  variants: number;
  images: number;
}

interface ProductsFilters {
  searchTerm: string;
  categoryFilter: string;
  colorFilter: string;
  sizeFilter: string;
  sellerFilter: string;
  statusFilter: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  currentPage: number;
}


interface SupportData {
  categories: Category[];
  availableSizes: string[];
  colorOptions: {name: string, colorCode: string}[];
  sellers: {id: string, fullname: string, role: string}[];
}

export function useProductsData() {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  const [supportData, setSupportData] = useState<SupportData>({
    categories: [],
    availableSizes: [],
    colorOptions: [],
    sellers: []
  });

  const [loading, setLoading] = useState({
    products: true,
    categories: false,
    colors: false,
    sizes: false,
    sellers: false,
  });

  const [supportDataRequested, setSupportDataRequested] = useState({
    categories: false,
    colors: false,
    sizes: false,
    sellers: false,
  });

  const [paginationLoading, setPaginationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузка продуктов
  const fetchProducts = useCallback(async (filters: ProductsFilters) => {
    try {
      const isPageChange = filters.currentPage > 1;
      
      if (isPageChange) {
        setPaginationLoading(true);
      } else {
        setLoading(prev => ({ ...prev, products: true }));
      }
      
      // Строим URL с параметрами
      const params = new URLSearchParams({
        page: filters.currentPage.toString(),
        limit: '50',
        sortBy: filters.sortBy === 'newest' ? 'createdAt' : filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(filters.searchTerm && { search: filters.searchTerm }),
        ...(filters.categoryFilter && { categoryId: filters.categoryFilter }),
        ...(filters.colorFilter && { color: filters.colorFilter }),
        ...(filters.sizeFilter && { size: filters.sizeFilter }),
        ...(filters.sellerFilter && { sellerId: filters.sellerFilter }),
        ...(filters.statusFilter && { status: filters.statusFilter }),
      });
      
      const response = await fetch(`/api/admin/products?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      setProducts(data.products);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.totalCount);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Products fetch error:', err);
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
      setPaginationLoading(false);
    }
  }, []);

  // Загрузка категорий
  const fetchCategories = useCallback(async () => {
    if (supportDataRequested.categories || loading.categories) return;
    
    try {
      setSupportDataRequested(prev => ({ ...prev, categories: true }));
      setLoading(prev => ({ ...prev, categories: true }));
      
      const response = await fetch('/api/admin/categories');
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      const data = await response.json();
      setSupportData(prev => ({ ...prev, categories: data }));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(prev => ({ ...prev, categories: false }));
    }
  }, [supportDataRequested.categories, loading.categories]);

  // Загрузка цветов
  const fetchColors = useCallback(async () => {
    if (supportDataRequested.colors || loading.colors) return;
    
    try {
      setSupportDataRequested(prev => ({ ...prev, colors: true }));
      setLoading(prev => ({ ...prev, colors: true }));
      
      const response = await fetch('/api/admin/colors');
      
      if (!response.ok) {
        throw new Error('Failed to fetch colors');
      }
      
      const data = await response.json();
      setSupportData(prev => ({ ...prev, colorOptions: data }));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(prev => ({ ...prev, colors: false }));
    }
  }, [supportDataRequested.colors, loading.colors]);

  // Загрузка размеров
  const fetchSizes = useCallback(async () => {
    if (supportDataRequested.sizes || loading.sizes) return;
    
    try {
      setSupportDataRequested(prev => ({ ...prev, sizes: true }));
      setLoading(prev => ({ ...prev, sizes: true }));
      
      const response = await fetch('/api/admin/sizes');
      
      if (!response.ok) {
        throw new Error('Failed to fetch sizes');
      }
      
      const data = await response.json();
      setSupportData(prev => ({ 
        ...prev, 
        availableSizes: data.map((size: { name: string }) => size.name).sort() 
      }));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(prev => ({ ...prev, sizes: false }));
    }
  }, [supportDataRequested.sizes, loading.sizes]);

  // Загрузка продавцов
  const fetchSellers = useCallback(async () => {
    if (supportDataRequested.sellers || loading.sellers) return;
    
    try {
      setSupportDataRequested(prev => ({ ...prev, sellers: true }));
      setLoading(prev => ({ ...prev, sellers: true }));
      
      const response = await fetch('/api/admin/sellers');
      
      if (!response.ok) {
        throw new Error('Failed to fetch sellers');
      }
      
      const data = await response.json();
      const filteredSellers = data.filter((seller: { role: string }) => 
        seller.role === 'ADMIN' || seller.role === 'SELLER'
      );
      setSupportData(prev => ({ ...prev, sellers: filteredSellers }));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Sellers fetch error:', err);
    } finally {
      setLoading(prev => ({ ...prev, sellers: false }));
    }
  }, [supportDataRequested.sellers, loading.sellers]);

  // Функции для ленивой загрузки
  const loadSupportData = useCallback(() => {
    fetchCategories();
    fetchColors();
    fetchSizes();
    fetchSellers();
  }, [fetchCategories, fetchColors, fetchSizes, fetchSellers]);

  return {
    // Данные
    products,
    totalPages,
    totalItems,
    categories: supportData.categories,
    availableSizes: supportData.availableSizes,
    colorOptions: supportData.colorOptions,
    sellers: supportData.sellers,
    
    // Состояние загрузки
    loading,
    paginationLoading,
    error,
    
    // Функции
    fetchProducts,
    loadSupportData,
    
    // Функции для рефетча
    refetch: {
      products: fetchProducts,
      categories: fetchCategories,
      colors: fetchColors,
      sizes: fetchSizes,
      sellers: fetchSellers,
    }
  };
}
