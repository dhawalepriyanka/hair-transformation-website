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

// Real products from Dipali Wakale product list (Excel PRODUCT REPORT)
const mockProducts = [
  {
    id: 1,
    name: 'HAIRIVA SERUM',
    product_code: '10014',
    category: 'Hair Serum',
    image_url: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&q=80&w=800',
    price: 1345.00,
    description: 'Advanced hair serum for deep nourishment, shine and frizz control.',
    is_active: true
  },
  {
    id: 2,
    name: 'Hair Mask',
    product_code: '10027',
    category: 'Hair Treatment',
    image_url: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=80&w=800',
    price: 1245.00,
    description: 'Deep conditioning hair mask for soft, smooth and manageable hair.',
    is_active: true
  },
  {
    id: 3,
    name: 'HAIRCIN TABLET',
    product_code: '10027',
    category: 'Supplement',
    image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800',
    price: 210.00,
    description: 'Hair supplement tablet with essential vitamins and minerals for healthy hair growth.',
    is_active: true
  },
  {
    id: 4,
    name: 'MINOXYTOP F 2',
    product_code: '10037',
    category: 'Hair Growth',
    image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800',
    price: 1075.00,
    description: 'Clinically proven hair growth solution for thinning and hair loss concerns.',
    is_active: true
  },
  {
    id: 5,
    name: 'DA Moisturizer',
    product_code: '10038',
    category: 'Skin Care',
    image_url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=800',
    price: 1245.00,
    description: 'Lightweight daily moisturizer for soft, hydrated and glowing skin.',
    is_active: true
  },
  {
    id: 6,
    name: 'DA SPF SUNSCREEN',
    product_code: '10039',
    category: 'Skin Care',
    image_url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=800',
    price: 1245.00,
    description: 'Broad-spectrum SPF sunscreen providing protection against UV rays and tan.',
    is_active: true
  },
  {
    id: 7,
    name: 'DA NIGHT CREAM',
    product_code: '10040',
    category: 'Skin Care',
    image_url: 'https://images.unsplash.com/photo-1611080541599-8c6dbde6ed28?auto=format&fit=crop&q=80&w=800',
    price: 3045.00,
    description: 'Intensive overnight repair night cream for deep skin renewal and radiance.',
    is_active: true
  },
  {
    id: 8,
    name: 'DA FACE WASH',
    product_code: '10041',
    category: 'Skin Care',
    image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=800',
    price: 1295.00,
    description: 'Gentle foaming face wash that cleanses deeply without stripping natural oils.',
    is_active: true
  },
  {
    id: 9,
    name: 'MINOXYTOP 5',
    product_code: '10049',
    category: 'Hair Growth',
    image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800',
    price: 725.00,
    description: 'Minoxidil 5% topical solution to stimulate hair regrowth effectively.',
    is_active: true
  },
  {
    id: 10,
    name: 'Hair Fact AA 2',
    product_code: '10052',
    category: 'Supplement',
    image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800',
    price: 2946.00,
    description: 'Advanced amino acid supplement for strong, thick and healthy hair from within.',
    is_active: true
  },
  {
    id: 11,
    name: 'New Mocotrop Plus Tab',
    product_code: '10053',
    category: 'Supplement',
    image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800',
    price: 219.60,
    description: 'Multivitamin supplement supporting overall hair and scalp health.',
    is_active: true
  },
  {
    id: 12,
    name: 'Advance Hair Growth Shampoo 200Ml',
    product_code: '10054',
    category: 'Hair Care',
    image_url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&q=80&w=800',
    price: 1150.00,
    description: 'DHT-blocking shampoo that cleanses the scalp and promotes new hair growth.',
    is_active: true
  },
  {
    id: 13,
    name: 'Da Hair Growth Serum 100Ml',
    product_code: '10055',
    category: 'Hair Serum',
    image_url: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&q=80&w=800',
    price: 1850.00,
    description: 'Potent scalp serum with active peptides to boost hair density and growth.',
    is_active: true
  },
  {
    id: 14,
    name: 'New Da Hair Oil 100Ml',
    product_code: '10057',
    category: 'Hair Oil',
    image_url: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&q=80&w=800',
    price: 780.00,
    description: 'Nourishing hair oil blend for scalp health, shine and reduced hair fall.',
    is_active: true
  }
];




// Initial default transformations list
const defaultTransformations = [
  {
    id: 1,
    clientName: 'Priya Deshmukh',
    village: 'Nashik, Maharashtra',
    treatment: 'Premium Keratin Hair Extensions',
    period: 'June 2024 · 3 hrs',
    rating: 5,
    testimonial: '"माझ्या केसांमध्ये एवढी volume येईल असं वाटलं नव्हतं! Dipali didi खूप छान करतात।"',
    before: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800&h=700',
    after:  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800&h=700',
    category: 'Hair Extensions',
  },
  {
    id: 2,
    clientName: 'Savita Kulkarni',
    village: 'Ahmednagar, Maharashtra',
    treatment: 'Butterfly Cut & Layer Styling',
    period: 'July 2024 · 2 hrs',
    rating: 5,
    testimonial: '"खूप छान काम केलं! माझ्या केसांमध्ये आता खूप volume आहे।"',
    before: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&q=80&w=800&h=700',
    after:  'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&q=80&w=800&h=700',
    category: 'Haircut Transformation',
  },
  {
    id: 3,
    clientName: 'Anita Shinde',
    village: 'Pune, Maharashtra',
    treatment: 'Full Volume Hair Transformation',
    period: 'August 2024 · 4 hrs',
    rating: 5,
    testimonial: '"Dipali tai ne maza look completely badlun takla! Khup khush aahe mi."',
    before: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=800&h=700',
    after:  'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=800&h=700',
    category: 'Full Makeover',
  },
  {
    id: 4,
    clientName: 'Rekha Jadhav',
    village: 'Aurangabad, Maharashtra',
    treatment: 'Royal Bridal Hairstyle & Updo',
    period: 'September 2024 · 3.5 hrs',
    rating: 5,
    testimonial: '"माझ्या लग्नाचा दिवस perfect झाला Dipali didi मुळे! Thank you so much."',
    before: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=800&h=700',
    after:  'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=800&h=700',
    category: 'Bridal Styling',
  },
  {
    id: 5,
    clientName: 'Meena Patil',
    village: 'Kolhapur, Maharashtra',
    treatment: 'Balayage & Ombre Color',
    period: 'October 2024 · 5 hrs',
    rating: 5,
    testimonial: '"Color ekdum natural disto! Mala watla nahi itka sundar hoel."',
    before: 'https://images.unsplash.com/photo-1487412947147-5cebf96c66de?auto=format&fit=crop&q=80&w=800&h=700',
    after:  'https://images.unsplash.com/photo-1487412947147-5cebf96c66de?auto=format&fit=crop&q=80&w=800&h=700',
    category: 'Color Transformation',
  },
  {
    id: 6,
    clientName: 'Kavita Bhosale',
    village: 'Solapur, Maharashtra',
    treatment: 'Chic Bob & Short Haircut',
    period: 'November 2024 · 1.5 hrs',
    rating: 5,
    testimonial: '"मला खूप धाडस वाटत होतं short cut साठी, पण result पाहून मी खूश झाले!"',
    before: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&q=80&w=800&h=700',
    after:  'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&q=80&w=800&h=700',
    category: 'Haircut Makeover',
  },
];

const getStoredProducts = () => {
  try {
    const saved = localStorage.getItem('admin_custom_products');
    if (saved) return JSON.parse(saved);
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
    // Graceful offline admin authentication fallback
    if (
      (credentials.username === 'dipali_admin' && credentials.password === 'Dipali@Studio#2026') ||
      (credentials.username === 'admin' && credentials.password === 'admin123')
    ) {
      return {
        success: true,
        message: 'Admin authentication successful',
        token: 'admin_token_' + Date.now(),
        user: { username: credentials.username, role: 'admin' }
      };
    }
    throw new Error(error.response?.data?.message || 'Invalid admin credentials');
  }
};

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
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return defaultTransformations;
};

const saveStoredTransformations = (list) => {
  try {
    localStorage.setItem('admin_transformations', JSON.stringify(list));
  } catch (e) {}
};

export const fetchTransformations = async () => {
  return getStoredTransformations();
};

export const createTransformation = async (itemData) => {
  const list = getStoredTransformations();
  const newItem = {
    id: Date.now(),
    clientName: itemData.clientName || 'Client',
    village: itemData.village || 'Maharashtra',
    treatment: itemData.treatment || 'Hair Treatment',
    period: itemData.period || 'Recent',
    rating: parseInt(itemData.rating) || 5,
    testimonial: itemData.testimonial || '',
    before: itemData.before || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800',
    after: itemData.after || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800',
    category: itemData.category || 'Hair Transformation',
  };
  const updated = [newItem, ...list];
  saveStoredTransformations(updated);
  return newItem;
};

export const updateTransformation = async (id, itemData) => {
  const list = getStoredTransformations();
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

