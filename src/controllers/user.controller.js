const UserModel = require('../models/user.model');
const jwt = require('jsonwebtoken');

class UserController {
  async register(req, res) {
    try {
      const existingUser = await UserModel.getUserByEmail(req.body.email);
      if (existingUser) {
        return res.status(400).json({
          error: 'Email already registered',
        });
      }
      const user = await UserModel.createUser(req.body);
      const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
      res.status(201).json({ user, token });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await UserModel.getUserByEmail(email);
      console.log(user, 'ni isi user');

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await UserModel.validatePassword(user, password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });

      // Create a new user object without the password
      const { password: _, ...userWithoutPassword } = user;
      
      // Log the user without password if needed
      console.log(userWithoutPassword, 'user without password');

      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getUserProfile(req, res) {
    try {
      const user = await UserModel.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateUserProfile(req, res) {
    try {
      const user = await UserModel.updateUser(req.user.id, req.body);
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new UserController();
