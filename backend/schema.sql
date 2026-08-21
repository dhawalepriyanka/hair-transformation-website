-- PostgreSQL Schema for Dipali Wakale Hair Artist Catalogue

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    product_code VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(100),
    image_url TEXT NOT NULL,
    price DECIMAL(10,2),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Hair Styles & Transformations Dataset
INSERT INTO products (name, product_code, category, image_url, price, description) VALUES
('Long Layered Haircut & Blowdry', 'H001', 'Haircut', 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=800', 1500.00, 'Modern long layered cut with face-framing texture and salon blowdry finishing.'),
('Trendy Butterfly Cut & Styling', 'H002', 'Haircut', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800', 1800.00, 'Voluminous butterfly layers adding movement and lightness to long hair.'),
('Premium Keratin Hair Extensions', 'H003', 'Hair Extension', 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&q=80&w=800', 12000.00, '100% natural human hair extensions offering instant length and dense volume.'),
('Full Volume Hair Transformation', 'H004', 'Hair Transformation', 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=800', 8500.00, 'Complete hair makeover including texturizing, extension blend, and gloss finish.'),
('Chic Bob & Short Haircut Transformation', 'H005', 'Hair Transformation', 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&q=80&w=800', 2200.00, 'Stylish short haircut makeover designed to suit individual facial contours.'),
('Soft Feathered Layer Haircut', 'H006', 'Haircut', 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&q=80&w=800', 1600.00, 'Delicate soft feathered layers creating effortless grace and everyday bounce.'),
('Face Framing Curtain Bangs & Waves', 'H007', 'Hair Styling', 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?auto=format&fit=crop&q=80&w=800', 1400.00, 'Trending curtain bangs paired with soft glossy beach waves.'),
('Sleek & Straight Hair Styling', 'H008', 'Hair Styling', 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&q=80&w=800', 1200.00, 'Ultra-smooth glass hair shine straightening treatment and styling.'),
('Voluminous Glam Curls Styling', 'H009', 'Hair Styling', 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=800', 1600.00, 'Bouncy celebrity style red carpet curls with long-lasting hold.'),
('Balayage & Ombre Hair Color', 'H010', 'Hair Color', 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&q=80&w=800', 6500.00, 'Sun-kissed hand-painted balayage highlights seamlessly blended for depth.'),
('Royal Bridal Hairstyle & Accessories', 'H011', 'Bridal Style', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800', 4500.00, 'Intricate traditional bridal hair updo accessorized with floral or floral pins.'),
('Elegant Party Updo & Braid', 'H012', 'Hair Styling', 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=800', 2500.00, 'Sophisticated French braid updo suitable for receptions and festive occasions.')
ON CONFLICT (product_code) DO NOTHING;
