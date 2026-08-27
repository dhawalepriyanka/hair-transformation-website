import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 6000
});

// Add Authorization header if token exists
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Static mock dataset for Dipali Wakale Hair Artist Catalogue
const mockProducts = [
  {
    id: 1,
    name: 'Long Layered Haircut & Blowdry',
    product_code: 'H001',
    category: 'Haircut',
    image_url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=800',
    price: 1500.00,
    description: 'Modern long layered cut with face-framing texture and salon blowdry finishing.',
    is_active: true
  },
  {
    id: 2,
    name: 'Trendy Butterfly Cut & Styling',
    product_code: 'H002',
    category: 'Haircut',
    image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800',
    price: 1800.00,
    description: 'Voluminous butterfly layers adding movement and lightness to long hair.',
    is_active: true
  },
  {
    id: 3,
    name: 'Premium Keratin Hair Extensions',
    product_code: 'H003',
    category: 'Hair Extension',
    image_url: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&q=80&w=800',
    price: 12000.00,
    description: '100% natural human hair extensions offering instant length and dense volume.',
    is_active: true
  },
  {
    id: 4,
    name: 'Full Volume Hair Transformation',
    product_code: 'H004',
    category: 'Hair Transformation',
    image_url: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=800',
    price: 8500.00,
    description: 'Complete hair makeover including texturizing, extension blend, and gloss finish.',
    is_active: true
  },
  {
    id: 5,
    name: 'Chic Bob & Short Haircut Transformation',
    product_code: 'H005',
    category: 'Hair Transformation',
    image_url: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&q=80&w=800',
    price: 2200.00,
    description: 'Stylish short haircut makeover designed to suit individual facial contours.',
    is_active: true
  },
  {
    id: 6,
    name: 'Soft Feathered Layer Haircut',
    product_code: 'H006',
    category: 'Haircut',
    image_url: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&q=80&w=800',
    price: 1600.00,
    description: 'Delicate soft feathered layers creating effortless grace and everyday bounce.',
    is_active: true
  },
  {
    id: 7,
    name: 'Face Framing Curtain Bangs & Waves',
    product_code: 'H007',
    category: 'Hair Styling',
    image_url: 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?auto=format&fit=crop&q=80&w=800',
    price: 1400.00,
    description: 'Trending curtain bangs paired with soft glossy beach waves.',
    is_active: true
  },
  {
    id: 8,
    name: 'Sleek & Straight Hair Styling',
    product_code: 'H008',
    category: 'Hair Styling',
    image_url: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&q=80&w=800',
    price: 1200.00,
    description: 'Ultra-smooth glass hair shine straightening treatment and styling.',
    is_active: true
  },
  {
    id: 9,
    name: 'Voluminous Glam Curls Styling',
    product_code: 'H009',
    category: 'Hair Styling',
    image_url: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=800',
    price: 1600.00,
    description: 'Bouncy celebrity style red carpet curls with long-lasting hold.',
    is_active: true
  },
  {
    id: 10,
    name: 'Balayage & Ombre Hair Color',
    product_code: 'H010',
    category: 'Hair Color',
    image_url: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&q=80&w=800',
    price: 6500.00,
    description: 'Sun-kissed hand-painted balayage highlights seamlessly blended for depth.',
    is_active: true
  },
  {
    id: 11,
    name: 'Royal Bridal Hairstyle & Accessories',
    product_code: 'H011',
    category: 'Bridal Style',
    image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800',
    price: 4500.00,
    description: 'Intricate traditional bridal hair updo accessorized with floral pins.',
    is_active: true
  },
  {
    id: 12,
    name: 'Elegant Party Updo & Braid',
    product_code: 'H012',
    category: 'Hair Styling',
    image_url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=800',
    price: 2500.00,
    description: 'Sophisticated French braid updo suitable for receptions and festive occasions.',
    is_active: true
  }
];

export const fetchProducts = async (params = {}) => {
  try {
    const response = await apiClient.get('/products', { params });
    return response.data.data;
  } catch (error) {
    console.warn('API connection failed, loading fallback hair styles dataset:', error.message);
    let results = [...mockProducts];
    if (params.category && params.category !== 'All') {
      results = results.filter(p => p.category.toLowerCase() === params.category.toLowerCase());
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      results = results.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.product_code.toLowerCase().includes(q)
      );
    }
    return results;
  }
};

export const fetchProductById = async (id) => {
  try {
    const response = await apiClient.get(`/products/${id}`);
    return response.data.data;
  } catch (error) {
    console.warn('API get product failed, using fallback:', error.message);
    return mockProducts.find(p => p.id === parseInt(id)) || null;
  }
};

export const loginAdmin = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Invalid admin credentials');
  }
};

export const createProduct = async (productData) => {
  const response = await apiClient.post('/products', productData);
  return response.data;
};

export const updateProduct = async (id, productData) => {
  const response = await apiClient.put(`/products/${id}`, productData);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await apiClient.delete(`/products/${id}`);
  return response.data;
};
