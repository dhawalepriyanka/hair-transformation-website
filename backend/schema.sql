-- PostgreSQL Schema for Dipali Wakale Hair Artist Catalogue

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    product_code VARCHAR(50) NOT NULL,
    category VARCHAR(100),
    image_url TEXT NOT NULL,
    price DECIMAL(10,2),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product codes in the supplied report are not unique (10027 appears twice).
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_product_code_key;
CREATE INDEX IF NOT EXISTS idx_products_product_code ON products(product_code);

-- Remove the previous sample hairstyle catalogue and seed the clinic's real list.
DELETE FROM products WHERE product_code ~ '^H0[0-9]{2}$';

WITH clinic_products (name, product_code, category, image_url, price, description) AS (
    VALUES
    ('HAIRIVA SERUM', '10014', 'Hair Serum', '/products/hairiva-serum.png', 1345.00, 'Advanced hair serum for deep nourishment, shine and frizz control.'),
    ('Hair Mask', '10027', 'Hair Treatment', '/products/hair-mask.png', 1245.00, 'Deep conditioning hair mask for soft, smooth and manageable hair.'),
    ('HAIRCIN TABLET', '10027', 'Supplement', '/products/haircin-tablet.png', 210.00, 'Hair supplement tablet with essential vitamins and minerals.'),
    ('MINOXYTOP F 2', '10037', 'Hair Growth', '/products/minoxytop-f2.png', 1075.00, 'Topical hair and scalp-care solution.'),
    ('DA Moisturizer', '10038', 'Skin Care', '/products/da-moisturizer.png', 1245.00, 'Lightweight daily moisturizer for soft and hydrated skin.'),
    ('DA SPF SUNSCREEN', '10039', 'Skin Care', '/products/da-spf-sunscreen.png', 1245.00, 'Daily sunscreen for broad-spectrum UV protection.'),
    ('DA NIGHT CREAM', '10040', 'Skin Care', '/products/da-night-cream.png', 3945.00, 'Overnight cream for moisturising and supporting the skin barrier.'),
    ('DA FACE WASH', '10041', 'Skin Care', '/products/da-face-wash.png', 1295.00, 'Gentle face wash that cleanses without stripping natural oils.'),
    ('MINOXYTOP 5', '10049', 'Hair Growth', '/products/minoxytop-5.png', 725.00, 'Topical hair and scalp-care solution.'),
    ('Hair Fact AA 2', '10052', 'Supplement', '/products/hair-fact-aa2.png', 2946.00, 'Amino-acid hair supplement for use as directed by the clinic.'),
    ('NEW MOCOTROY PLUS TAB', '10053', 'Supplement', '/products/new-mocotroy-plus-tab.png', 219.60, 'Multivitamin supplement for use as directed by the clinic.'),
    ('Advance Hair Growth Shampoo 200Ml', '10054', 'Hair Care', '/products/advance-hair-growth-shampoo-200ml.png', 1150.00, 'Scalp-cleansing shampoo for the clinic hair-care routine.'),
    ('Da Hair Growth Serum 100Ml', '10055', 'Hair Serum', '/products/da-hair-growth-serum-100ml.png', 1850.00, 'Scalp serum for the clinic hair-care routine.'),
    ('New Da Hair Oil 100Ml', '10057', 'Hair Oil', '/products/new-da-hair-oil-100ml.png', 780.00, 'Nourishing hair oil for scalp care and shine.')
)
INSERT INTO products (name, product_code, category, image_url, price, description)
SELECT cp.*
FROM clinic_products cp
WHERE NOT EXISTS (
    SELECT 1 FROM products p
    WHERE p.name = cp.name AND p.product_code = cp.product_code
);

CREATE TABLE IF NOT EXISTS staff_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'receptionist')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    age INTEGER CHECK (age BETWEEN 0 AND 130),
    gender VARCHAR(30),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patient_visits (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    concern TEXT NOT NULL,
    medical_conditions TEXT,
    allergies TEXT,
    current_medicines TEXT,
    previous_treatments TEXT,
    receptionist_notes TEXT,
    visit_at TIMESTAMP NOT NULL,
    appointment_at TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'Waiting',
    sent_to_admin BOOLEAN NOT NULL DEFAULT FALSE,
    sent_to_admin_at TIMESTAMP,
    created_by INTEGER REFERENCES staff_users(id),
    updated_by INTEGER REFERENCES staff_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consultations (
    id SERIAL PRIMARY KEY,
    visit_id INTEGER UNIQUE NOT NULL REFERENCES patient_visits(id) ON DELETE CASCADE,
    consultation_notes TEXT,
    diagnosis TEXT,
    recommended_treatment TEXT,
    follow_up_date DATE,
    private_admin_notes TEXT,
    updated_by INTEGER REFERENCES staff_users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_recommendations (
    id SERIAL PRIMARY KEY,
    visit_id INTEGER UNIQUE NOT NULL REFERENCES patient_visits(id) ON DELETE CASCADE,
    created_by INTEGER REFERENCES staff_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recommended_product_items (
    id SERIAL PRIMARY KEY,
    recommendation_id INTEGER NOT NULL REFERENCES product_recommendations(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    usage_instructions TEXT
);

ALTER TABLE recommended_product_items ADD COLUMN IF NOT EXISTS frequency VARCHAR(100);
ALTER TABLE recommended_product_items ADD COLUMN IF NOT EXISTS duration VARCHAR(100);
ALTER TABLE recommended_product_items ADD COLUMN IF NOT EXISTS timing VARCHAR(100);
ALTER TABLE recommended_product_items ADD COLUMN IF NOT EXISTS food_timing VARCHAR(100);
ALTER TABLE recommended_product_items ADD COLUMN IF NOT EXISTS additional_instructions TEXT;

CREATE TABLE IF NOT EXISTS patient_consents (
    id SERIAL PRIMARY KEY,
    visit_id INTEGER NOT NULL REFERENCES patient_visits(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    accepted BOOLEAN NOT NULL DEFAULT FALSE,
    physical_signature BOOLEAN NOT NULL DEFAULT FALSE,
    patient_signature TEXT,
    specialist_signature TEXT,
    witness_signature TEXT,
    patient_questions TEXT,
    consented_at TIMESTAMP,
    recorded_by INTEGER REFERENCES staff_users(id),
    locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (visit_id, version)
);
