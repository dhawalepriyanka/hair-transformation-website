import axios from 'axios';
import { normalizeTransformation } from './transformationMedia.js';
import { getStaffSession, setAdminSession } from './adminSession.js';
import { compressImageFile, fileToOptimizedDataUri } from './imageOptimizer.js';
import { saveToIndexedDb, getFromIndexedDb, safeSaveLocalStorage, safeGetLocalStorage } from './transformationStorage.js';

const runtimeEnv = import.meta.env || {};
const configuredApiUrl = runtimeEnv.VITE_API_URL?.trim();
const getApiBaseUrl = () => {
  if (configuredApiUrl) return configuredApiUrl;
  if (runtimeEnv.DEV) return 'http://localhost:5000/api';
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'dipaliwakale.in' || host === 'www.dipaliwakale.in') {
      return 'https://www.dipaliwakale.in/api';
    }
  }
  return '/api';
};
const API_BASE_URL = getApiBaseUrl();

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
    const url = String(error.config?.url || '');
    const isLoginRequest = url.includes('/auth/login');
    const isPublicQueueRequest = url.includes('/public-queue');
    if (error.response?.status === 401 && !isLoginRequest && !isPublicQueueRequest && getStaffSession()) {
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
    poster: '/instagram/hair-transformation-client.jpg',
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
    poster: '/instagram/long-hair-styling.jpg',
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
    poster: '/instagram/salon-client.jpg',
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
    village: 'Akole, Maharashtra',
    period: 'Instagram Post • 1.4K Likes',
    before: '/instagram/long-hair-styling.jpg',
    after: '/instagram/hair-transformation-client.jpg',
    category: 'Hair Extensions',
    rating: 5,
    likes: '1.4K',
    comments: '43',
    handle: '@wakale_dipali_',
    testimonial: 'खूप सुंदर transformation! केसांची लांबी आणि घनता दोन्ही मनसोक्त वाढले.',
    hashtags: '#beforeandafter #transformation #hairextensions #haircare #wakale_dipali_',
    duration: 10,
  },
  {
    id: 9100005,
    clientName: 'Dr. Dipali Wakale Clinic Consultation',
    treatment: 'Trichological Scalp Root & Follicle Analysis',
    village: 'Ghargaon Clinic (Pune-Nashik Hwy)',
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
    image: '/instagram/dipali-wakale-professional-solo-hero.png',
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
    id: 9100021,
    clientName: 'Nanoplastia Gold Mirror Shine Reel',
    treatment: 'Nanoplastia Organic Straightening & Gloss',
    village: 'Ghargaon Clinic (Pune-Nashik Hwy)',
    period: 'Instagram Reel • 56K Views',
    video: '/instagram/reels/nanoplastia-shine.mp4',
    category: 'Hair Transformation',
    rating: 5,
    likes: '3.2K',
    comments: '108',
    handle: '@wakale_dipali_',
    testimonial: 'शून्य फ्रिझ आणि काचेसारखी चमक! 4 ते 6 महिने केस एकदम सिल्की राहतात.',
    hashtags: '#nanoplastia #mirrorhair #organicstraightening #hairbotox #dipaliwakale',
    duration: 15,
  },
  {
    id: 9100022,
    clientName: 'Signature Bridal Hair Artistry Reel',
    treatment: 'Traditional Maharashtrian Bridal Makeover & Styling',
    village: 'Maharashtra Bridal Special',
    period: 'Instagram Reel • 64K Views',
    video: '/instagram/reels/bridal-styling.mp4',
    category: 'Bridal Styling',
    rating: 5,
    likes: '4.8K',
    comments: '142',
    handle: '@wakale_dipali_',
    testimonial: 'लग्न समारंभासाठी परिपूर्ण हेअरस्टाईल! नऊवारी साडीवर फुलांची सजावट अप्रतिम दिसली.',
    hashtags: '#marathibride #bridalmakeover #weddinghair #floralstyling #wakale_dipali_',
    duration: 15,
  },
  {
    id: 9100019,
    clientName: 'Kavita Thorat',
    treatment: 'Frizz-Control Nanoplastia & Mirror Shine',
    village: 'Sangamner, Maharashtra',
    period: 'Instagram Post • 2.1K Likes',
    before: '/instagram/salon-client.jpg',
    after: '/instagram/hair-transformation-client.jpg',
    category: 'Hair Transformation',
    rating: 5,
    likes: '2.1K',
    comments: '68',
    handle: '@wakale_dipali_',
    testimonial: 'केसांचा फ्रिझ पूर्णपणे गेला आणि एकदम रेशमी, चमकदार पोत मिळाला. थँक्यू दिपाली दीदी!',
    hashtags: '#beforeandafter #nanoplastia #hairbotox #frizzfree #dipaliwakale',
    duration: 10,
  },
  {
    id: 9100020,
    clientName: 'Rutuja Jagtap',
    treatment: 'Micro-Ring Hair Extensions Length & Density',
    village: 'Pune, Maharashtra',
    period: 'Instagram Post • 1.9K Likes',
    before: '/instagram/salon-client.jpg',
    after: '/instagram/long-hair-styling.jpg',
    category: 'Hair Extensions',
    rating: 5,
    likes: '1.9K',
    comments: '54',
    handle: '@wakale_dipali_',
    testimonial: 'Zero damage hair extensions with natural bounce. Absolutely seamless blending!',
    hashtags: '#hairextensions #naturalvolume #punehair #dipaliwakale',
    duration: 10,
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
    image: '/instagram/dipali-wakale-about-professional.png',
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
    image: '/instagram/dipali-wakale-hair-doctor-hero.png',
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
    image: '/instagram/dipali-wakale-professional-hero-v2.png',
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
export const deletePatientVisit = async (id) => patientRequest(() => apiClient.delete(`/patient-visits/${id}`));

export const SAMPLE_QUEUE_PATIENTS = [
  {
    id: 'demo_queue_1',
    token_number: 1,
    patient_name: 'Priya Sharma',
    concern: 'Keratin Smoothening & Gloss Shine',
    status: 'In Consultation',
    visit_at: new Date(Date.now() - 25 * 60000).toISOString()
  },
  {
    id: 'demo_queue_2',
    token_number: 2,
    patient_name: 'Snehal Patil',
    concern: 'Seamless Hair Extensions Blend',
    status: 'Waiting',
    visit_at: new Date(Date.now() - 15 * 60000).toISOString()
  },
  {
    id: 'demo_queue_3',
    token_number: 3,
    patient_name: 'Anjali Kulkarni',
    concern: 'Hair Regrowth & Scalp Therapy',
    status: 'Waiting',
    visit_at: new Date(Date.now() - 8 * 60000).toISOString()
  },
  {
    id: 'demo_queue_4',
    token_number: 4,
    patient_name: 'Pooja More',
    concern: 'Salon Blowdry & Curls Styling',
    status: 'Waiting',
    visit_at: new Date(Date.now() - 3 * 60000).toISOString()
  }
];

export const fetchPublicPatientQueue = async () => {
  // 1. Primary: Public TV Queue API (no authentication required)
  try {
    const response = await apiClient.get('/patient-visits/public-queue');
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      if (response.data.data.length > 0) {
        return response.data.data;
      }
    }
  } catch (err) {
    // Backend offline or route pending deployment
  }

  // 2. Direct Staff API query if staff session token exists in sessionStorage/localStorage
  try {
    const token = getStaffSession()?.token;
    if (token) {
      const visits = await fetchPatientVisits();
      if (Array.isArray(visits) && visits.length > 0) {
        const liveQueue = visits
          .filter(v => {
            const st = String(v.status || '').trim().toLowerCase();
            return st === 'waiting' || st === 'in consultation';
          })
          .sort((a, b) => {
            const aIn = String(a.status || '').trim().toLowerCase() === 'in consultation';
            const bIn = String(b.status || '').trim().toLowerCase() === 'in consultation';
            if (aIn && !bIn) return -1;
            if (!aIn && bIn) return 1;
            return new Date(a.visit_at) - new Date(b.visit_at);
          })
          .map((v, idx) => ({
            id: v.id,
            token_number: idx + 1,
            patient_name: v.patient_name,
            concern: v.concern || 'Hair & Skin Consultation',
            status: v.status,
            visit_at: v.visit_at
          }));
        if (liveQueue.length > 0) {
          try {
            localStorage.setItem('clinic_patient_queue', JSON.stringify(liveQueue));
          } catch (_) {}
          return liveQueue;
        }
      }
    }
  } catch (_) {}

  // 3. Fallback: check local storage sync from Receptionist Dashboard
  try {
    const local = localStorage.getItem('clinic_patient_queue');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (_) {}

  // 4. Fallback: check all cached visits in localStorage
  try {
    const allVisitsRaw = localStorage.getItem('clinic_all_visits');
    if (allVisitsRaw) {
      const allVisits = JSON.parse(allVisitsRaw);
      if (Array.isArray(allVisits) && allVisits.length > 0) {
        const live = allVisits
          .filter(v => {
            const st = String(v.status || '').trim().toLowerCase();
            return st === 'waiting' || st === 'in consultation';
          })
          .map((v, idx) => ({
            id: v.id,
            token_number: idx + 1,
            patient_name: v.patient_name,
            concern: v.concern || 'Hair & Skin Consultation',
            status: v.status,
            visit_at: v.visit_at
          }));
        if (live.length > 0) return live;
      }
    }
  } catch (_) {}

  // 5. Fallback: If no live patients in queue, check slideshow settings to show sample clinic queue
  try {
    const settings = fetchSlideshowSettings();
    if (settings.queueAutoDemo !== false) {
      return SAMPLE_QUEUE_PATIENTS;
    }
  } catch (_) {
    return SAMPLE_QUEUE_PATIENTS;
  }

  return [];
};

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
  imageDuration: 7,          // 7 seconds for images & Before/After split sliders
  videoDurationMode: 'end',  // 'end' = switch after video finishes playing
  videoDuration: 15,         // fallback for iframe embeds
  hideTextInFullscreen: true, // remove right-side text when in fullscreen / 55" TV mode
  showTimerBadge: true,      // show on-screen countdown / progress
  // Live Patient Waiting List on TV settings:
  showPatientQueueSlide: true, // Enable / Disable Waiting List slide on TV
  queueSlideDuration: 7,     // 7 seconds for Patient Waiting List slide on TV
  queueSlidePlacement: 'repeat', // 'repeat' (after every N videos) | 'first' (slide #1) | 'last' (end of playlist) | 'specific' (specific slide number)
  queueSlideFrequency: 2,    // Show after every N transformation reels in repeat mode (default: 2)
  queueSlideSpecificIndex: 1, // Specific slide position (1-based) if placement is 'specific'
  queueAutoDemo: true,       // Show sample appointments when live queue is empty
  version: 2
};

export const fetchSlideshowSettings = () => {
  try {
    const saved = localStorage.getItem('admin_slideshow_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.version !== 2) {
        const upgraded = {
          ...DEFAULT_SLIDESHOW_SETTINGS,
          ...parsed,
          imageDuration: (parsed.imageDuration === 8 || parsed.imageDuration === 5) ? 7 : (parsed.imageDuration || 7),
          queueSlideDuration: (parsed.queueSlideDuration === 15 || parsed.queueSlideDuration === 10) ? 7 : (parsed.queueSlideDuration || 7),
          videoDurationMode: parsed.videoDurationMode === 'fixed' ? 'end' : (parsed.videoDurationMode || 'end'),
          version: 2
        };
        localStorage.setItem('admin_slideshow_settings', JSON.stringify(upgraded));
        return upgraded;
      }
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

/**
 * Uploads media file to Cloudinary / Backend Storage or compresses for storage
 */
export const uploadTransformationMediaFile = async (file, field = 'media') => {
  try {
    let uploadFile = file;
    if (file instanceof Blob && file.type.startsWith('image/')) {
      uploadFile = await compressImageFile(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.82 });
    }
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('field', field);
    const response = await apiClient.post('/transformations/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000
    });
    if (response.data && response.data.success && response.data.url) {
      return response.data.url;
    }
  } catch (err) {
    console.warn('[Upload] Media upload failed, falling back to local optimized data URI:', err.message);
  }
  // Offline or direct upload fallback: return optimized data URI
  if (file instanceof Blob) {
    return await fileToOptimizedDataUri(file);
  }
  return file;
};

const getStoredTransformations = () => {
  try {
    const saved = safeGetLocalStorage('admin_transformations') || (typeof localStorage !== 'undefined' ? localStorage.getItem('admin_transformations') : null);
    if (saved) {
      const list = typeof saved === 'string' ? JSON.parse(saved) : saved;
      if (!Array.isArray(list)) throw new Error('Invalid saved transformations');
      return list;
    }
  } catch (e) {
    throw new Error('Could not read saved transformations. Check browser storage access and try again.');
  }
  return defaultTransformations;
};

export const broadcastTransformationsChange = (action, item) => {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('transformations_changed', { detail: { action, item } }));
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('dipali_transformations_sync');
        bc.postMessage({ action, item, timestamp: Date.now() });
        bc.close();
      }
      try {
        localStorage.setItem('admin_transformations_last_updated', String(Date.now()));
      } catch (_) {}
    }
  } catch (e) {
    console.warn('[Sync] Broadcast note:', e.message);
  }
};

export const clearBulkyLocalStorage = () => {
  try {
    if (typeof localStorage === 'undefined') return;
    const raw = localStorage.getItem('admin_transformations');
    if (raw && raw.length > 500000) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        // Only strip bulky base64 images that exceed 200KB; NEVER wipe video fields
        const cleaned = list.map(item => {
          const c = { ...item };
          ['before', 'after', 'image'].forEach(f => {
            if (typeof c[f] === 'string' && c[f].startsWith('data:image/') && c[f].length > 200000) {
              c[f] = '';
            }
          });
          return c;
        });
        localStorage.setItem('admin_transformations', JSON.stringify(cleaned));
      }
    }
  } catch (e) {
    try { localStorage.removeItem('admin_transformations'); } catch (_) {}
  }
};

const saveStoredTransformations = (list) => {
  try {
    safeSaveLocalStorage('admin_transformations', list);
    if (typeof window === 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('admin_transformations', JSON.stringify(list));
    }
  } catch (e) {
    if (typeof window === 'undefined') {
      throw new Error('Could not save transformations. Browser storage may be full or unavailable. Remove unused media or use a direct video URL, then try again.');
    }
    console.warn('[Storage] localStorage write note:', e.message);
  }
};

export const checkTransformationsVersion = async () => {
  try {
    const response = await apiClient.get('/transformations/check');
    if (response.data && response.data.success) {
      return response.data;
    }
  } catch (err) {
    // Silently ignore network warning on version check
  }
  return null;
};

export const fetchTransformations = async () => {
  let backendItems = null;
  try {
    const response = await apiClient.get('/transformations');
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      backendItems = response.data.data;
    }
  } catch (err) {
    console.warn('Backend /api/transformations fetch failed, falling back to cached storage:', err.message);
  }

  // Load existing local/cached transformations (from IndexedDB or localStorage)
  let localList = [];
  try {
    localList = (await getFromIndexedDb()) || getStoredTransformations() || [];
  } catch (e) {
    localList = getStoredTransformations() || [];
  }
  if (!Array.isArray(localList)) localList = [];

  const defaultIdSet = new Set(defaultTransformations.map(item => String(item.id)));
  const legacyIds = new Set(['1', '2', '3', '4', '5', '6', '9000001', '9000002']);

  const isDummyStock = (item) => {
    if (!item) return false;
    const idStr = String(item.id);
    if (!legacyIds.has(idStr)) return false;
    const str = JSON.stringify(item);
    return str.includes('images.unsplash.com') ||
      item.clientName === 'Old stock entry' ||
      item.clientName === 'Video Demo' ||
      item.clientName === 'Before & After Video Demo' ||
      (!item.video && !item.beforeVideo && !item.image && (!item.before || !item.after));
  };

  // Re-assign a fresh unique ID for any real user-customized item with a legacy ID
  // so it is permanently preserved and migrates into the persistent database
  localList = localList.map(item => {
    const idStr = String(item?.id);
    if (legacyIds.has(idStr) && !isDummyStock(item)) {
      return {
        ...item,
        id: String(Date.now() + Math.floor(Math.random() * 10000))
      };
    }
    return item;
  });

  // If backend returned items:
  if (backendItems) {
    const backendIdSet = new Set(backendItems.map(item => String(item.id)));

    // Attempt to migrate any unsynced local custom items to the database
    const itemsToMigrate = localList.filter(item => {
      const idStr = String(item.id);
      return !backendIdSet.has(idStr) && !defaultIdSet.has(idStr) && !isDummyStock(item);
    });

    if (itemsToMigrate.length > 0) {
      console.log(`[Migration] Migrating ${itemsToMigrate.length} local transformations to persistent database...`);
      try {
        const migrateRes = await apiClient.post('/transformations/migrate', itemsToMigrate);
        if (migrateRes.data && migrateRes.data.success && Array.isArray(migrateRes.data.data)) {
          backendItems = [...backendItems, ...migrateRes.data.data];
        }
      } catch (migErr) {
        console.warn('[Migration] Batch sync note:', migErr.message);
      }
    }

    // Crucial: Keep any custom transformations created locally that aren't yet in backend
    const currentBackendIdSet = new Set(backendItems.map(item => String(item.id)));
    const unmergedLocal = localList.filter(item => {
      const idStr = String(item.id);
      return !currentBackendIdSet.has(idStr) && !defaultIdSet.has(idStr) && !isDummyStock(item);
    });

    const sortByDisplayOrder = (arr) => {
      return [...arr].sort((a, b) => {
        const orderA = (a.displayOrder !== undefined && a.displayOrder !== null && a.displayOrder !== '') ? Number(a.displayOrder) : 999999;
        const orderB = (b.displayOrder !== undefined && b.displayOrder !== null && b.displayOrder !== '') ? Number(b.displayOrder) : 999999;
        if (orderA !== orderB) return orderA - orderB;
        return 0;
      });
    };

    const merged = sortByDisplayOrder([...unmergedLocal, ...backendItems]);

    try {
      safeSaveLocalStorage('admin_transformations', merged);
      saveToIndexedDb(merged);
    } catch (e) {}
    return merged;
  }

  // Fallback to local storage when backend is unreachable
  let list = localList.length > 0 ? localList : getStoredTransformations();
  const hasLegacy = Array.isArray(list) && list.some(item => isDummyStock(item));
  if (hasLegacy) {
    const customItems = list.filter(item => !isDummyStock(item) && !legacyIds.has(String(item.id)) && !(Number(item.id) >= 9100001 && Number(item.id) <= 9100099));
    list = [...defaultTransformations, ...customItems];
    try {
      saveStoredTransformations(list);
      saveToIndexedDb(list);
    } catch (e) {}
  }
  return [...list].sort((a, b) => {
    const orderA = (a.displayOrder !== undefined && a.displayOrder !== null && a.displayOrder !== '') ? Number(a.displayOrder) : 999999;
    const orderB = (b.displayOrder !== undefined && b.displayOrder !== null && b.displayOrder !== '') ? Number(b.displayOrder) : 999999;
    if (orderA !== orderB) return orderA - orderB;
    return 0;
  });
};

export const reorderTransformationsApi = async (items) => {
  try {
    await apiClient.post('/transformations/reorder', { items });
  } catch (err) {
    console.warn('Backend reorder notice:', err.message);
  }
};

export const createTransformation = async (itemData) => {
  itemData = normalizeTransformation(itemData);
  let savedItem = null;
  try {
    const response = await apiClient.post('/transformations', itemData);
    if (response.data && response.data.success && response.data.data) {
      savedItem = response.data.data;
    }
  } catch (err) {
    console.warn('Backend /api/transformations create failed, using local storage fallback:', err.message);
  }

  let list = [];
  try {
    list = (await getFromIndexedDb()) || getStoredTransformations() || [];
  } catch (e) {
    list = getStoredTransformations() || [];
  }
  if (!Array.isArray(list)) list = [];

  const newItem = savedItem || {
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

  const updated = [newItem, ...list.filter(i => String(i.id) !== String(newItem.id))];
  try {
    saveStoredTransformations(updated);
    safeSaveLocalStorage('admin_transformations', updated);
    await saveToIndexedDb(updated);
  } catch (storageErr) {
    if (typeof window === 'undefined' && !savedItem) throw storageErr;
    console.warn('Local storage cache update warning:', storageErr.message);
  }
  broadcastTransformationsChange('create', newItem);
  return newItem;
};

export const updateTransformation = async (id, itemData) => {
  if (itemData.clientName && itemData.village && itemData.treatment) {
    try {
      itemData = normalizeTransformation(itemData);
    } catch (_) {}
  } else if (itemData.displayOrder !== undefined) {
    itemData.displayOrder = Number(itemData.displayOrder);
  }
  let backendSuccess = false;
  try {
    const response = await apiClient.put(`/transformations/${id}`, itemData);
    if (response.data && response.data.success) {
      backendSuccess = true;
    }
  } catch (err) {
    console.warn('Backend /api/transformations update failed, using local storage fallback:', err.message);
  }

  let list = [];
  try {
    list = (await getFromIndexedDb()) || getStoredTransformations() || [];
  } catch (e) {
    list = getStoredTransformations() || [];
  }
  if (!Array.isArray(list)) list = [];

  const numericId = Number(id);
  if (!list.some(item => Number(item.id) === numericId || String(item.id) === String(id))) {
    if (!backendSuccess) {
      throw new Error('Transformation not found. Refresh the list and try again.');
    }
  }
  const updated = list.map(item => (Number(item.id) === numericId || String(item.id) === String(id)) ? {
    ...item,
    ...itemData,
    duration: itemData.duration ? parseInt(itemData.duration, 10) : undefined,
  } : item);

  try {
    saveStoredTransformations(updated);
    safeSaveLocalStorage('admin_transformations', updated);
    await saveToIndexedDb(updated);
  } catch (storageErr) {
    if (!backendSuccess) throw storageErr;
    console.warn('Local storage cache update warning:', storageErr.message);
  }
  broadcastTransformationsChange('update', { id, ...itemData });
  return { success: true };
};

export const deleteTransformation = async (id) => {
  let backendSuccess = false;
  try {
    const response = await apiClient.delete(`/transformations/${id}`);
    if (response.data && response.data.success) {
      backendSuccess = true;
    }
  } catch (err) {
    console.warn('Backend /api/transformations delete failed, using local storage fallback:', err.message);
  }

  let list = [];
  try {
    list = (await getFromIndexedDb()) || getStoredTransformations() || [];
  } catch (e) {
    list = getStoredTransformations() || [];
  }
  if (!Array.isArray(list)) list = [];

  const numericId = Number(id);
  const updated = list.filter(item => Number(item.id) !== numericId && String(item.id) !== String(id));

  try {
    saveStoredTransformations(updated);
    safeSaveLocalStorage('admin_transformations', updated);
    await saveToIndexedDb(updated);
  } catch (storageErr) {
    if (!backendSuccess) throw storageErr;
    console.warn('Local storage cache update warning:', storageErr.message);
  }
  broadcastTransformationsChange('delete', { id });
  return { success: true };
};
