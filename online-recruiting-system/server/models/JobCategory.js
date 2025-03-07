const pool = require('../config/db');

/**
 * JobCategory model for PostgreSQL
 * Uses Data Access Object (DAO) pattern
 */
const JobCategory = {
  /**
   * Find all job categories
   * @returns {Promise<Array>} All job categories
   */
  findAll: async () => {
    try {
      const query = 'SELECT * FROM job_categories ORDER BY name';
      const result = await pool.query(query);
      
      return result.rows.map(category => ({
        _id: category.id,
        name: category.name,
        description: category.description
      }));
    } catch (error) {
      console.error('Error in JobCategory.findAll:', error);
      throw error;
    }
  },
  
  /**
   * Find category by ID
   * @param {Number} id - Category ID
   * @returns {Promise<Object>} Category
   */
  findById: async (id) => {
    try {
      const query = 'SELECT * FROM job_categories WHERE id = $1';
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const category = result.rows[0];
      return {
        _id: category.id,
        name: category.name,
        description: category.description
      };
    } catch (error) {
      console.error('Error in JobCategory.findById:', error);
      throw error;
    }
  },
  
  /**
   * Find category by name
   * @param {String} name - Category name
   * @returns {Promise<Object>} Category
   */
  findByName: async (name) => {
    try {
      const query = 'SELECT * FROM job_categories WHERE name ILIKE $1';
      const result = await pool.query(query, [name]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const category = result.rows[0];
      return {
        _id: category.id,
        name: category.name,
        description: category.description
      };
    } catch (error) {
      console.error('Error in JobCategory.findByName:', error);
      throw error;
    }
  },
  
  /**
   * Create a new job category
   * @param {Object} categoryData - Category data
   * @param {String} categoryData.name - Category name
   * @param {String} categoryData.description - Category description
   * @returns {Promise<Object>} Created category
   */
  create: async (categoryData) => {
    try {
      const { name, description } = categoryData;
      
      const query = `
        INSERT INTO job_categories (name, description)
        VALUES ($1, $2)
        RETURNING *
      `;
      
      const result = await pool.query(query, [name, description]);
      
      const category = result.rows[0];
      return {
        _id: category.id,
        name: category.name,
        description: category.description
      };
    } catch (error) {
      console.error('Error in JobCategory.create:', error);
      throw error;
    }
  },
  
  /**
   * Update a job category
   * @param {Number} id - Category ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated category
   */
  update: async (id, updates) => {
    try {
      const { name, description } = updates;
      
      const query = `
        UPDATE job_categories
        SET name = COALESCE($1, name),
            description = COALESCE($2, description)
        WHERE id = $3
        RETURNING *
      `;
      
      const result = await pool.query(query, [name, description, id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const category = result.rows[0];
      return {
        _id: category.id,
        name: category.name,
        description: category.description
      };
    } catch (error) {
      console.error('Error in JobCategory.update:', error);
      throw error;
    }
  },
  
  /**
   * Delete a job category
   * @param {Number} id - Category ID
   * @returns {Promise<Boolean>} Success status
   */
  delete: async (id) => {
    try {
      // Check if category is being used by any job postings
      const checkQuery = 'SELECT COUNT(*) FROM job_postings WHERE category_id = $1';
      const checkResult = await pool.query(checkQuery, [id]);
      
      if (parseInt(checkResult.rows[0].count) > 0) {
        throw new Error('Cannot delete category that is being used by job postings');
      }
      
      const query = 'DELETE FROM job_categories WHERE id = $1 RETURNING id';
      const result = await pool.query(query, [id]);
      
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error in JobCategory.delete:', error);
      throw error;
    }
  },
  
  /**
   * Get categories with job counts
   * @returns {Promise<Array>} Categories with job counts
   */
  getCategoriesWithCounts: async () => {
    try {
      const query = `
        SELECT 
          c.id, 
          c.name, 
          c.description,
          COUNT(j.id) as job_count
        FROM job_categories c
        LEFT JOIN job_postings j ON c.id = j.category_id 
          AND j.is_active = true 
          AND j.due_date >= CURRENT_DATE
        GROUP BY c.id, c.name, c.description
        ORDER BY job_count DESC, c.name
      `;
      
      const result = await pool.query(query);
      
      return result.rows.map(category => ({
        _id: category.id,
        name: category.name,
        description: category.description,
        jobCount: parseInt(category.job_count)
      }));
    } catch (error) {
      console.error('Error in JobCategory.getCategoriesWithCounts:', error);
      throw error;
    }
  }
};

module.exports = JobCategory;