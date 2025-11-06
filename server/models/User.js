const pool = require('../config/database');

class User {
  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  static async findById(userId) {
    const result = await pool.query(
      'SELECT id, name, email, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0];
  }

  static async create(name, email, passwordHash) {
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
      [name, email, passwordHash]
    );
    return result.rows[0];
  }

  static async update(userId, updates) {
    const allowedFields = ['name', 'email'];
    const setClauses = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (setClauses.length === 0) {
      throw new Error('No valid fields to update');
    }

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${setClauses.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, email, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async updateById(userId, updates){
      return User.update(userId, updates);
  }
}

module.exports = User;
