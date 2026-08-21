const { pool, getInMemoryProducts, setInMemoryProducts } = require('../config/db');

// @desc    Get all products (with optional filter for active only)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const { includeInactive, category, search } = req.query;

    try {
      let query = 'SELECT * FROM products';
      const values = [];
      const conditions = [];

      if (includeInactive !== 'true') {
        conditions.push('is_active = TRUE');
      }

      if (category && category !== 'All') {
        values.push(category);
        conditions.push(`category = $${values.length}`);
      }

      if (search) {
        values.push(`%${search}%`);
        conditions.push(`(name ILIKE $${values.length} OR product_code ILIKE $${values.length})`);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY id ASC';

      const result = await pool.query(query, values);
      return res.status(200).json({
        success: true,
        count: result.rows.length,
        data: result.rows
      });
    } catch (dbErr) {
      console.warn('DB query failed, using in-memory products:', dbErr.message);

      let products = getInMemoryProducts();

      if (includeInactive !== 'true') {
        products = products.filter(p => p.is_active);
      }

      if (category && category !== 'All') {
        products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
      }

      if (search) {
        const q = search.toLowerCase();
        products = products.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.product_code.toLowerCase().includes(q)
        );
      }

      return res.status(200).json({
        success: true,
        count: products.length,
        data: products
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    try {
      const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      return res.status(200).json({ success: true, data: result.rows[0] });
    } catch (dbErr) {
      const products = getInMemoryProducts();
      const product = products.find(p => p.id === parseInt(id));
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      return res.status(200).json({ success: true, data: product });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res, next) => {
  try {
    const { name, product_code, category, image_url, price, description } = req.body;

    if (!name || !product_code || !image_url) {
      return res.status(400).json({
        success: false,
        message: 'Product name, product code, and image URL are required.'
      });
    }

    try {
      const query = `
        INSERT INTO products (name, product_code, category, image_url, price, description)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const values = [name, product_code, category || 'Other', image_url, price || 0, description || ''];
      const result = await pool.query(query, values);

      return res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: result.rows[0]
      });
    } catch (dbErr) {
      const products = getInMemoryProducts();
      const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
      const newProduct = {
        id: newId,
        name,
        product_code,
        category: category || 'Other',
        image_url,
        price: parseFloat(price) || 0,
        description: description || '',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };
      setInMemoryProducts([newProduct, ...products]);

      return res.status(201).json({
        success: true,
        message: 'Product created successfully (in-memory mode)',
        data: newProduct
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, product_code, category, image_url, price, description, is_active } = req.body;

    try {
      const query = `
        UPDATE products
        SET name = COALESCE($1, name),
            product_code = COALESCE($2, product_code),
            category = COALESCE($3, category),
            image_url = COALESCE($4, image_url),
            price = COALESCE($5, price),
            description = COALESCE($6, description),
            is_active = COALESCE($7, is_active),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING *
      `;
      const values = [name, product_code, category, image_url, price, description, is_active, id];
      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: result.rows[0]
      });
    } catch (dbErr) {
      let products = getInMemoryProducts();
      const index = products.findIndex(p => p.id === parseInt(id));

      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      products[index] = {
        ...products[index],
        ...(name && { name }),
        ...(product_code && { product_code }),
        ...(category && { category }),
        ...(image_url && { image_url }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(description !== undefined && { description }),
        ...(is_active !== undefined && { is_active }),
        updated_at: new Date()
      };

      setInMemoryProducts(products);

      return res.status(200).json({
        success: true,
        message: 'Product updated successfully (in-memory mode)',
        data: products[index]
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Soft delete product (set is_active = false)
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    try {
      const query = `
        UPDATE products
        SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Product deactivated successfully (soft delete)'
      });
    } catch (dbErr) {
      let products = getInMemoryProducts();
      const index = products.findIndex(p => p.id === parseInt(id));

      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      products[index].is_active = false;
      products[index].updated_at = new Date();
      setInMemoryProducts(products);

      return res.status(200).json({
        success: true,
        message: 'Product deactivated successfully (in-memory mode)'
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
