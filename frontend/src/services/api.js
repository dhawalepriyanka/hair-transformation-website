import axios from 'axios';
import { normalizeTransformation } from './transformationMedia.js';
import { getStaffSession } from './adminSession.js';

const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 6000
});

// Add Authorization header if token exists
apiClient.interceptors.request.use((config) => {
  const token = getStaffSession()?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Real products from Dipali Wakale product list (Excel PRODUCT REPORT)
const mockProducts = [
  {
    id: 1,
    name: 'HAIRIVA SERUM',
    product_code: '10014',
    category: 'Hair Serum',
    image_url: '/products/hairiva-serum.png',
    price: 1345.00,
    description: 'Advanced hair serum for deep nourishment, shine and frizz control.',
    is_active: true
  },
  {
    id: 2,
    name: 'Hair Mask',
    product_code: '10027',
    category: 'Hair Treatment',
    image_url: '/products/hair-mask.png',
    price: 1245.00,
    description: 'Deep conditioning hair mask for soft, smooth and manageable hair.',
    is_active: true
  },
  {
    id: 3,
    name: 'HAIRCIN TABLET',
    product_code: '10027',
    category: 'Supplement',
    image_url: '/products/haircin-tablet.png',
    price: 210.00,
    description: 'Hair supplement tablet with essential vitamins and minerals for healthy hair growth.',
    is_active: true
  },
  {
    id: 4,
    name: 'MINOXYTOP F 2',
    product_code: '10037',
    category: 'Hair Growth',
    image_url: '/products/minoxytop-f2.png',
    price: 1075.00,
    description: 'Clinically proven hair growth solution for thinning and hair loss concerns.',
    is_active: true
  },
  {
    id: 5,
    name: 'DA Moisturizer',
    product_code: '10038',
    category: 'Skin Care',
    image_url: '/products/da-moisturizer.png',
    price: 1245.00,
    description: 'Lightweight daily moisturizer for soft, hydrated and glowing skin.',
    is_active: true
  },
  {
    id: 6,
    name: 'DA SPF SUNSCREEN',
    product_code: '10039',
    category: 'Skin Care',
    image_url: '/products/da-spf-sunscreen.png',
    price: 1245.00,
    description: 'Broad-spectrum SPF sunscreen providing protection against UV rays and tan.',
    is_active: true
  },
  {
    id: 7,
    name: 'DA NIGHT CREAM',
    product_code: '10040',
    category: 'Skin Care',
    image_url: '/products/da-night-cream.png',
    price: 3945.00,
    description: 'Intensive overnight repair night cream for deep skin renewal and radiance.',
    is_active: true
  },
  {
    id: 8,
    name: 'DA FACE WASH',
    product_code: '10041',
    category: 'Skin Care',
    image_url: '/products/da-face-wash.png',
    price: 1295.00,
    description: 'Gentle foaming face wash that cleanses deeply without stripping natural oils.',
    is_active: true
  },
  {
    id: 9,
    name: 'MINOXYTOP 5',
    product_code: '10049',
    category: 'Hair Growth',
    image_url: '/products/minoxytop-5.png',
    price: 725.00,
    description: 'Minoxidil 5% topical solution to stimulate hair regrowth effectively.',
    is_active: true
  },
  {
    id: 10,
    name: 'Hair Fact AA 2',
    product_code: '10052',
    category: 'Supplement',
    image_url: '/products/hair-fact-aa2.png',
    price: 2946.00,
    description: 'Advanced amino acid supplement for strong, thick and healthy hair from within.',
    is_active: true
  },
  {
    id: 11,
    name: 'NEW MOCOTROY PLUS TAB',
    product_code: '10053',
    category: 'Supplement',
    image_url: '/products/new-mocotroy-plus-tab.png',
    price: 219.60,
    description: 'Multivitamin supplement supporting overall hair and scalp health.',
    is_active: true
  },
  {
    id: 12,
    name: 'Advance Hair Growth Shampoo 200Ml',
    product_code: '10054',
    category: 'Hair Care',
    image_url: '/products/advance-hair-growth-shampoo-200ml.png',
    price: 1150.00,
    description: 'DHT-blocking shampoo that cleanses the scalp and promotes new hair growth.',
    is_active: true
  },
  {
    id: 13,
    name: 'Da Hair Growth Serum 100Ml',
    product_code: '10055',
    category: 'Hair Serum',
    image_url: '/products/da-hair-growth-serum-100ml.png',
    price: 1850.00,
    description: 'Potent scalp serum with active peptides to boost hair density and growth.',
    is_active: true
  },
  {
    id: 14,
    name: 'New Da Hair Oil 100Ml',
    product_code: '10057',
    category: 'Hair Oil',
    image_url: '/products/new-da-hair-oil-100ml.png',
    price: 780.00,
    description: 'Nourishing hair oil blend for scalp health, shine and reduced hair fall.',
    is_active: true
  }
];




// Real salon media sourced from Dipali Wakale's public Instagram account.
const defaultTransformations = [
  {
    id: 9100001,
    clientName: 'Hair Transformation',
    treatment: 'Real salon transformation reel',
    period: 'Instagram reel',
    video: '/instagram/reels/hair-transformation.mp4',
    category: 'Hair Transformation',
  },
  {
    id: 9100002,
    clientName: 'Hair Extensions',
    treatment: 'Length and volume transformation',
    period: 'Instagram reel',
    video: '/instagram/reels/hair-extensions.mp4',
    category: 'Hair Extensions',
  },
  {
    id: 9100003,
    clientName: 'Hair Styling',
    treatment: 'Professional salon styling',
    period: 'Instagram reel',
    video: '/instagram/reels/hair-styling.mp4',
    category: 'Hair Styling',
  },
  {
    id: 9100004,
    clientName: 'Client Transformation',
    treatment: 'Finished salon look',
    period: 'Instagram photo',
    image: '/instagram/hair-transformation-client.jpg',
    category: 'Hair Transformation',
  },
  {
    id: 9100005,
    clientName: 'Long Hair Styling',
    treatment: 'Length, texture and styling result',
    period: 'Instagram photo',
    image: '/instagram/long-hair-styling.jpg',
    category: 'Hair Styling',
  },
  {
    id: 9100006,
    clientName: 'Salon Client',
    treatment: 'Dipali Wakale salon work',
    period: 'Instagram photo',
    image: '/instagram/salon-client.jpg',
    category: 'Salon Work',
  },
];

const getStoredProducts = () => {
  try {
    const saved = localStorage.getItem('admin_custom_products');
    if (saved) {
      const list = JSON.parse(saved);
      return list;
    }
  } catch (e) {}
  return mockProducts;
};

const saveStoredProducts = (list) => {
  try {
    localStorage.setItem('admin_custom_products', JSON.stringify(list));
  } catch (e) {}
};

export const fetchProducts = async (params = {}) => {
  try {
    const response = await apiClient.get('/products', { params });
    return response.data.data;
  } catch (error) {
    let results = getStoredProducts();
    if (!params.includeInactive) {
      results = results.filter(p => p.is_active !== false);
    }
    if (params.category && params.category !== 'All') {
      results = results.filter(p => p.category && p.category.toLowerCase() === params.category.toLowerCase());
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      results = results.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.product_code && p.product_code.toLowerCase().includes(q))
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
    const list = getStoredProducts();
    return list.find(p => p.id === parseInt(id)) || null;
  }
};

export const loginAdmin = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    // Keep the local staff portal usable while the development backend is offline.
    if (!error.response) {
      const validLocalLogin =
        (credentials.role === 'admin' && credentials.username === 'admin' && credentials.password === '1234') ||
        (credentials.role === 'receptionist' && credentials.username === 'receptionist' && credentials.password === '1234');
      if (validLocalLogin) {
        return {
          success: true,
          token: `local_${credentials.role}_${Date.now()}`,
          user: { username: credentials.username, role: credentials.role }
        };
      }
    }
    throw new Error(error.response?.data?.message || 'Unable to sign in. Check your credentials and try again.');
  }
};

export const fetchPatientVisits = async () => (await apiClient.get('/patient-visits')).data.data;
export const fetchPatientVisit = async (id) => (await apiClient.get(`/patient-visits/${id}`)).data.data;
export const createPatientVisit = async (data) => (await apiClient.post('/patient-visits', data)).data.data;
export const updatePatientVisit = async (id, data) => (await apiClient.put(`/patient-visits/${id}`, data)).data.data;

export const createProduct = async (productData) => {
  try {
    const response = await apiClient.post('/products', productData);
    return response.data;
  } catch (e) {
    const list = getStoredProducts();
    const newProduct = {
      id: Date.now(),
      ...productData,
      price: productData.price ? parseFloat(productData.price) : null,
      is_active: productData.is_active !== false
    };
    const updated = [newProduct, ...list];
    saveStoredProducts(updated);
    return { success: true, data: newProduct };
  }
};

export const updateProduct = async (id, productData) => {
  try {
    const response = await apiClient.put(`/products/${id}`, productData);
    return response.data;
  } catch (e) {
    const list = getStoredProducts();
    const updated = list.map(p => p.id === parseInt(id) ? { ...p, ...productData } : p);
    saveStoredProducts(updated);
    return { success: true };
  }
};

export const deleteProduct = async (id) => {
  try {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  } catch (e) {
    const list = getStoredProducts();
    const updated = list.filter(p => p.id !== parseInt(id));
    saveStoredProducts(updated);
    return { success: true };
  }
};

/* ─────────────── TRANSFORMATIONS API ─────────────── */
const getStoredTransformations = () => {
  try {
    const saved = localStorage.getItem('admin_transformations');
    if (saved) {
      const list = JSON.parse(saved);
      if (!Array.isArray(list)) throw new Error('Invalid saved transformations');
      return list;
    }
  } catch (e) {
    throw new Error('Could not read saved transformations. Check browser storage access and try again.');
  }
  return defaultTransformations;
};

const saveStoredTransformations = (list) => {
  try {
    localStorage.setItem('admin_transformations', JSON.stringify(list));
  } catch (e) {
    throw new Error('Could not save transformations. Browser storage may be full or unavailable. Remove unused media or use a direct video URL, then try again.');
  }
};

export const fetchTransformations = async () => {
  let list = getStoredTransformations();
  // Replace the old flower demos and stock-photo seed data already stored in browsers.
  const legacyIds = new Set([1, 2, 3, 4, 5, 6, 9000001, 9000002]);
  if (list.some(item => legacyIds.has(Number(item.id)))) {
    const customItems = list.filter(item => !legacyIds.has(Number(item.id)));
    list = [...defaultTransformations, ...customItems];
    saveStoredTransformations(list);
  }
  return list;
};

export const createTransformation = async (itemData) => {
  itemData = normalizeTransformation(itemData);
  const list = getStoredTransformations();
  const newItem = {
    id: Date.now(),
    clientName: itemData.clientName || 'Client',
    village: itemData.village || 'Maharashtra',
    treatment: itemData.treatment || 'Hair Treatment',
    period: itemData.period || 'Recent',
    rating: parseInt(itemData.rating) || 5,
    testimonial: itemData.testimonial || '',
    before: itemData.before || '',
    after: itemData.after || '',
    video: itemData.video || '',
    beforeVideo: itemData.beforeVideo || '',
    afterVideo: itemData.afterVideo || '',
    category: itemData.category || 'Hair Transformation',
  };
  const updated = [newItem, ...list];
  saveStoredTransformations(updated);
  return newItem;
};

export const updateTransformation = async (id, itemData) => {
  itemData = normalizeTransformation(itemData);
  const list = getStoredTransformations();
  if (!list.some(item => item.id === Number(id))) {
    throw new Error('Transformation not found. Refresh the list and try again.');
  }
  const updated = list.map(item => item.id === parseInt(id) ? { ...item, ...itemData } : item);
  saveStoredTransformations(updated);
  return { success: true };
};

export const deleteTransformation = async (id) => {
  const list = getStoredTransformations();
  const updated = list.filter(item => item.id !== parseInt(id));
  saveStoredTransformations(updated);
  return { success: true };
};
