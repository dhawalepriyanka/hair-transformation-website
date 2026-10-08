import axios from 'axios';
import { normalizeTransformation } from './transformationMedia.js';
import { getStaffSession, setAdminSession } from './adminSession.js';

const runtimeEnv = import.meta.env || {};
const configuredApiUrl = runtimeEnv.VITE_API_URL?.trim();
const API_BASE_URL = configuredApiUrl || (runtimeEnv.DEV ? 'http://localhost:5000/api' : '/api');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 20000
});

// Add Authorization header if token exists
apiClient.interceptors.request.use((config) => {
  const token = getStaffSession()?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Clear stale credentials when the API rejects a protected request.
apiClient.interceptors.response.use(
  response => response,
  error => {
    const isLoginRequest = String(error.config?.url || '').includes('/auth/login');
    if (error.response?.status === 401 && !isLoginRequest && getStaffSession()) {
      setAdminSession(null);
      if (window.location.pathname !== '/admin/login') {
        window.location.replace('/admin/login?expired=1');
      }
    }
    return Promise.reject(error);
  }
);

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




// Real salon & clinic media sourced from Dipali Wakale's public Instagram account (@wakale_dipali_).
const defaultTransformations = [
  {
    id: 9100001,
    clientName: 'Hair Transformation Reel',
    treatment: 'Keratin Smoothening & Gloss Shine',
    village: 'Sangamner, Maharashtra',
    period: 'Instagram Reel • 48K Views',
    video: '/instagram/reels/hair-transformation.mp4',
    category: 'Hair Transformation',
    rating: 5,
    likes: '2.8K',
    comments: '94',
    handle: '@wakale_dipali_',
    testimonial: 'केसांचा पोत एकदम मऊ आणि शायनी झाला. Dipali didi यांचे काम अप्रतिम आहे!',
    hashtags: '#dipaliwakale #hairtransformation #botoxhair #sangamner #salonlife',
    duration: 15,
  },
  {
    id: 9100002,
    clientName: 'Hair Extensions Reel',
    treatment: 'Seamless Length & Volume Blend',
    village: 'Nashik, Maharashtra',
    period: 'Instagram Reel • 36K Views',
    video: '/instagram/reels/hair-extensions.mp4',
    category: 'Hair Extensions',
    rating: 5,
    likes: '2.1K',
    comments: '78',
    handle: '@wakale_dipali_',
    testimonial: 'Instant length and natural thickness with seamless blending. Truly amazed!',
    hashtags: '#hairextensions #naturalvolume #hairgoals #dipaliwakale #nashik',
    duration: 15,
  },
  {
    id: 9100003,
    clientName: 'Hair Styling Reel',
    treatment: 'Professional Salon Blowdry & Curls',
    village: 'Ghargaon, Sangamner',
    period: 'Instagram Reel • 29K Views',
    video: '/instagram/reels/hair-styling.mp4',
    category: 'Hair Styling',
    rating: 5,
    likes: '1.9K',
    comments: '62',
    handle: '@wakale_dipali_',
    testimonial: 'Bouncy curls and salon finish that lasted through the entire family occasion.',
    hashtags: '#blowout #saloncurls #hairstyling #dipaliwakalestudio',
    duration: 15,
  },
  {
    id: 9100004,
    clientName: 'Pooja Kadam',
    treatment: 'Full Volume Hair Extensions Makeover',
    village: 'Akole',
    period: 'Instagram Post • 1.4K Likes',
    before: '/instagram/long-hair-styling.jpg',
    after: '/instagram/hair-transformation-client.jpg',
    category: 'Hair Extensions',
    rating: 5,
    likes: '1.4K',
    comments: '43',
    handle: '@wakale_dipali_',
    testimonial: 'खूप सुंदर transformation! केसांची लांबी आणि घनता दोन्ही मनसोक्त वाढले.',
    hashtags: '#beforeandafter #transformation #hairextensions #haircare',
    duration: 10,
  },
  {
    id: 9100005,
    clientName: 'Dr. Dipali Wakale Clinic Consultation',
    treatment: 'Trichological Scalp Root & Follicle Analysis',
    village: 'Ghargaon Clinic',
    period: 'Clinic Session • Social Spotlight',
    image: '/instagram/dipali-wakale-hair-doctor-hero.png',
    category: 'Hair Regrowth',
    rating: 5,
    likes: '3.4K',
    comments: '112',
    handle: '@wakale_dipali_',
    testimonial: 'Comprehensive root analysis with personalized medicated lotion and shampoo regimen for hair fall reversal.',
    hashtags: '#hairdoctor #trichology #scalpanalysis #hairfallcontrol #dipaliwakale',
    duration: 10,
  },
  {
    id: 9100006,
    clientName: 'French Balayage & Caramel Melt',
    treatment: 'Custom Dimensional Hair Color & Gloss',
    village: 'Pune, Maharashtra',
    period: 'Instagram Post • 2.6K Likes',
    image: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=1200&q=80',
    category: 'Hair Color',
    rating: 5,
    likes: '2.6K',
    comments: '88',
    handle: '@wakale_dipali_',
    testimonial: 'Natural sun-kissed blending without brassiness. Hair feels super healthy and soft!',
    hashtags: '#balayage #caramelhighlights #haircolor #glossyhair #trendinghair',
    duration: 9,
  },
  {
    id: 9100007,
    clientName: 'Meera Deshmukh',
    treatment: 'Nanoplastia Gold Mirror Shine Treatment',
    village: 'Sangamner',
    period: 'Instagram Post • 1.8K Likes',
    image: '/instagram/hair-transformation-client.jpg',
    category: 'Hair Transformation',
    rating: 5,
    likes: '1.8K',
    comments: '56',
    handle: '@wakale_dipali_',
    testimonial: 'Nanoplastia treatment gave zero frizz and mirror-like gloss that lasts for months!',
    hashtags: '#nanoplastia #straighthair #hairbotox #frizfreehair',
    duration: 8,
  },
  {
    id: 9100008,
    clientName: 'Russian Manicure & Nail Art',
    treatment: 'Precision Cuticle Care & Gel Extension Art',
    village: 'Sangamner Studio',
    period: 'Instagram Story & Post • 1.2K Likes',
    image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=1200&q=80',
    category: 'Nail Art',
    rating: 5,
    likes: '1.2K',
    comments: '39',
    handle: '@wakale_dipali_',
    testimonial: 'Flawless clean cuticle finish with durable nail extensions and bridal chrome shine.',
    hashtags: '#russianmanicure #nailart #gelnails #bridalnails #dipaliwakale',
    duration: 8,
  },
  {
    id: 9100009,
    clientName: 'Rutuja Jagtap',
    treatment: 'Textured Blowout & Glass Hair Finish',
    village: 'Pune',
    period: 'Instagram Post • 1.5K Likes',
    image: '/instagram/long-hair-styling.jpg',
    category: 'Hair Styling',
    rating: 5,
    likes: '1.5K',
    comments: '47',
    handle: '@wakale_dipali_',
    testimonial: 'Love the bouncy waves and shine! Dipali didi takes time to explain aftercare.',
    hashtags: '#texturedblowout #glasshair #salonfinish #dipaliwakale',
    duration: 8,
  },
  {
    id: 9100010,
    clientName: 'HydraFacial & Glass Skin Glow',
    treatment: '7-Step Hydra Extraction & Serum Infusion',
    village: 'Sangamner Clinic',
    period: 'Instagram Reel • 32K Views',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80',
    category: 'Skin Care',
    rating: 5,
    likes: '2.3K',
    comments: '71',
    handle: '@wakale_dipali_',
    testimonial: 'Instant deep pore cleaning, intense hydration and spotless glowing skin!',
    hashtags: '#hydrafacial #skinglow #glassskin #facialtreatment #dipaliwakale',
    duration: 9,
  },
  {
    id: 9100011,
    clientName: 'Kavita Thorat',
    treatment: 'Frizz-Control Keratin Therapy',
    village: 'Sangamner',
    period: 'Instagram Post • 1.6K Likes',
    image: '/instagram/salon-client.jpg',
    category: 'Hair Transformation',
    rating: 5,
    likes: '1.6K',
    comments: '51',
    handle: '@wakale_dipali_',
    testimonial: 'Dipali Wakale salon is my go-to place for all hair and skin treatments.',
    hashtags: '#keratintreatment #frizzfree #silkyhair #sangamner',
    duration: 8,
  },
  {
    id: 9100012,
    clientName: 'Dipali Wakale Scalp Care Clinic',
    treatment: 'Custom Scalp Rejuvenation & Density Support',
    village: 'Ghargaon',
    period: 'Clinic Care • Verified Results',
    image: '/instagram/dipali-wakale-hair-doctor-about.png',
    category: 'Hair Regrowth',
    rating: 5,
    likes: '3.1K',
    comments: '98',
    handle: '@wakale_dipali_',
    testimonial: 'Targeted hair regrowth protocol supporting active follicles and healthy hair growth cycle.',
    hashtags: '#hairregrowth #hairlossreversal #trichologist #hairclinic',
    duration: 10,
  },
  {
    id: 9100013,
    clientName: 'Bridal Hair Artistry by Dipali',
    treatment: 'Signature Bridal Hair Makeover & Floral Accessories',
    village: 'Maharashtra',
    period: 'Instagram Spotlight • 4.2K Likes',
    image: '/instagram/dipali-wakale-professional-hero.png',
    category: 'Bridal Styling',
    rating: 5,
    likes: '4.2K',
    comments: '135',
    handle: '@wakale_dipali_',
    testimonial: 'Grand bridal styling with durable hold, traditional touch and glamorous finish.',
    hashtags: '#bridalhair #marathibride #weddinglook #hairstylist #dipaliwakale',
    duration: 8,
  },
  {
    id: 9100014,
    clientName: 'Pre-Bridal Skin & Hair Glow Protocol',
    treatment: 'Complete Pre-Wedding Beauty & Scalp Makeover',
    village: 'Sangamner',
    period: 'Instagram Feature • 2.7K Likes',
    image: '/instagram/dipali-wakale-about-professional-v2.png',
    category: 'Full Makeover',
    rating: 5,
    likes: '2.7K',
    comments: '82',
    handle: '@wakale_dipali_',
    testimonial: 'Customized 3-session program for radiant bridal skin and glossy, bouncy hair.',
    hashtags: '#prebridal #bridalmakeover #weddingglow #skincareroutine',
    duration: 9,
  },
  {
    id: 9100015,
    clientName: 'Anti-Dandruff Scalp Detox & High-Frequency',
    treatment: 'Deep Scalp Clarifying & Ozone Therapy',
    village: 'Ghargaon Clinic',
    period: 'Instagram Post • 1.9K Likes',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
    category: 'Hair Care',
    rating: 5,
    likes: '1.9K',
    comments: '64',
    handle: '@wakale_dipali_',
    testimonial: 'Cleared stubborn dandruff flakes and soothed itchy scalp in just two sessions.',
    hashtags: '#antidandruff #scalpdetox #hairhealth #trichologycare',
    duration: 8,
  },
  {
    id: 9100016,
    clientName: 'Dipali Wakale Trichology Masterclass',
    treatment: 'Advanced Hair & Scalp Professional Training',
    village: 'Sangamner & Pune',
    period: 'Instagram Reel • 52K Views',
    image: '/instagram/dipali-wakale-about-professional-v3.png',
    category: 'Hair Doctor',
    rating: 5,
    likes: '3.9K',
    comments: '124',
    handle: '@wakale_dipali_',
    testimonial: 'Empowering salon stylists and hair professionals with scientific trichology knowledge.',
    hashtags: '#masterclass #hairacademy #hairdoctor #professionalhaircare',
    duration: 9,
  },
  {
    id: 9100017,
    clientName: 'Dipali Wakale - Hair Doctor',
    treatment: 'Certified Hair Specialist & Trichology Care',
    village: 'Ghargaon, Sangamner',
    period: 'Instagram Bio @wakale_dipali_',
    image: '/instagram/dipali-wakale-portrait.jpg',
    category: 'Full Makeover',
    rating: 5,
    likes: '5.1K',
    comments: '180',
    handle: '@wakale_dipali_',
    testimonial: 'Dedicated to helping clients regain confidence with thick, healthy, nourished hair.',
    hashtags: '#hairdoctor #dipaliwakale #sangamner #nashik #pune',
    duration: 8,
  },
  {
    id: 9100018,
    clientName: 'Micro-Ring Hair Extensions Density',
    treatment: '100% Remy Human Hair Extensions Integration',
    village: 'Nashik',
    period: 'Instagram Post • 2.2K Likes',
    image: '/instagram/dipali-wakale-professional-hero-v2.png',
    category: 'Hair Extensions',
    rating: 5,
    likes: '2.2K',
    comments: '75',
    handle: '@wakale_dipali_',
    testimonial: 'Zero heat, zero glue application with seamless blend and natural hair movement.',
    hashtags: '#microrings #humanhair #extensionsspecialist #dipaliwakale',
    duration: 8,
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
    if (runtimeEnv.DEV && !error.response) {
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

const patientRequest = async (request) => {
  try {
    return (await request()).data.data;
  } catch (error) {
    if (!error.response) {
      throw new Error('The clinic service could not be reached. Please check the connection and try again.');
    }
    throw new Error(error.response.data?.message || 'The patient record could not be processed.');
  }
};

export const fetchPatientVisits = async () => patientRequest(() => apiClient.get('/patient-visits'));
export const fetchPatientVisit = async (id) => patientRequest(() => apiClient.get(`/patient-visits/${id}`));
export const createPatientVisit = async (data) => patientRequest(() => apiClient.post('/patient-visits', data));
export const updatePatientVisit = async (id, data) => patientRequest(() => apiClient.put(`/patient-visits/${id}`, data));

export const createProduct = async (productData) => {
  try {
    const response = await apiClient.post('/products', productData);
    return response.data;
  } catch (e) {
    if (!runtimeEnv.DEV) throw new Error(e.response?.data?.message || 'Product was not saved. Please try again.');
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
    if (!runtimeEnv.DEV) throw new Error(e.response?.data?.message || 'Product changes were not saved. Please try again.');
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
    if (!runtimeEnv.DEV) throw new Error(e.response?.data?.message || 'Product was not removed. Please try again.');
    const list = getStoredProducts();
    const updated = list.filter(p => p.id !== parseInt(id));
    saveStoredProducts(updated);
    return { success: true };
  }
};

/* ─────────────── SLIDESHOW & 55" TV SETTINGS ─────────────── */
export const DEFAULT_SLIDESHOW_SETTINGS = {
  autoSwitch: true,
  imageDuration: 5,          // seconds for images & sliders
  videoDurationMode: 'fixed', // 'fixed' = switch after videoDuration secs | 'end' = switch after video ends
  videoDuration: 15,         // seconds for videos in fixed mode
  hideTextInFullscreen: true, // remove right-side text when in fullscreen / 55" TV mode
  showTimerBadge: true,      // show on-screen countdown / progress
};

export const fetchSlideshowSettings = () => {
  try {
    const saved = localStorage.getItem('admin_slideshow_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_SLIDESHOW_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.warn('Could not read slideshow settings, using defaults');
  }
  return DEFAULT_SLIDESHOW_SETTINGS;
};

export const saveSlideshowSettings = (newSettings) => {
  try {
    const current = fetchSlideshowSettings();
    const updated = { ...current, ...newSettings };
    localStorage.setItem('admin_slideshow_settings', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('slideshow_settings_changed', { detail: updated }));
    return updated;
  } catch (e) {
    throw new Error('Failed to save slideshow settings. Check browser storage permissions.');
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
  // Automatically migrate legacy IDs if stored items contain old demo/stock entries
  const legacyIds = new Set([1, 2, 3, 4, 5, 6, 9000001, 9000002]);
  const hasLegacy = list.some(item => legacyIds.has(Number(item.id)));
  if (hasLegacy) {
    const customItems = list.filter(item => !legacyIds.has(Number(item.id)) && !(item.id >= 9100001 && item.id <= 9100050));
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
    image: itemData.image || '',
    video: itemData.video || '',
    beforeVideo: itemData.beforeVideo || '',
    afterVideo: itemData.afterVideo || '',
    duration: itemData.duration ? parseInt(itemData.duration, 10) : undefined,
    category: itemData.category || 'Hair Transformation',
  };
  const updated = [newItem, ...list];
  saveStoredTransformations(updated);
  return newItem;
};

export const updateTransformation = async (id, itemData) => {
  itemData = normalizeTransformation(itemData);
  const list = getStoredTransformations();
  const numericId = Number(id);
  if (!list.some(item => Number(item.id) === numericId || String(item.id) === String(id))) {
    throw new Error('Transformation not found. Refresh the list and try again.');
  }
  const updated = list.map(item => (Number(item.id) === numericId || String(item.id) === String(id)) ? {
    ...item,
    ...itemData,
    duration: itemData.duration ? parseInt(itemData.duration, 10) : undefined,
  } : item);
  saveStoredTransformations(updated);
  return { success: true };
};

export const deleteTransformation = async (id) => {
  const list = getStoredTransformations();
  const numericId = Number(id);
  const updated = list.filter(item => Number(item.id) !== numericId && String(item.id) !== String(id));
  saveStoredTransformations(updated);
  return { success: true };
};
