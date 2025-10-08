/**
 * Authentication Routes
 * Handles user authentication and session management
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import security from '../core/security/index.js';
import { Logger } from '../core/logger/index.js';

const router = express.Router();
const logger = new Logger('AuthRoutes');

// Validation middleware
const validateLogin = [
  body('playerId').notEmpty().withMessage('Player ID is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const validateRegister = [
  body('playerId').notEmpty().withMessage('Player ID is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
];

// Login endpoint
router.post(
  '/login',
  security.authRateLimit,
  validateLogin,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
          requestId: req.requestId,
        });
      }

      const { playerId, password, deviceInfo } = req.body;

      // TODO: Implement actual user authentication
      // For now, we'll create a session for any valid playerId
      const sessionId = security.createSession(playerId, { deviceInfo });
      const token = security.generateToken({ playerId, sessionId });

      security.logSecurityEvent('player_login', {
        playerId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        deviceInfo,
      });

      res.json({
        success: true,
        token,
        sessionId,
        requestId: req.requestId,
      });
    } catch (error) {
      logger.error('Login failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Login failed',
        requestId: req.requestId,
      });
    }
  }
);

// Register endpoint
router.post(
  '/register',
  security.authRateLimit,
  validateRegister,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
          requestId: req.requestId,
        });
      }

      const { playerId, password, email, deviceInfo } = req.body;

      // TODO: Implement actual user registration
      // For now, we'll create a session for any valid registration
      const sessionId = security.createSession(playerId, { deviceInfo, email });
      const token = security.generateToken({ playerId, sessionId });

      security.logSecurityEvent('player_register', {
        playerId,
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        deviceInfo,
      });

      res.json({
        success: true,
        token,
        sessionId,
        message: 'Registration successful',
        requestId: req.requestId,
      });
    } catch (error) {
      logger.error('Registration failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Registration failed',
        requestId: req.requestId,
      });
    }
  }
);

// Logout endpoint
router.post('/logout', security.sessionValidation, (req, res) => {
  try {
    const { sessionId } = req.user;

    security.destroySession(sessionId);

    security.logSecurityEvent('player_logout', {
      playerId: req.user.playerId,
      ip: req.ip,
    });

    res.json({
      success: true,
      message: 'Logged out successfully',
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('Logout failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      requestId: req.requestId,
    });
  }
});

// Refresh token endpoint
router.post('/refresh', security.sessionValidation, (req, res) => {
  try {
    const { playerId, sessionId } = req.user;

    // Validate session is still active
    const session = security.validateSession(sessionId);
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Session expired',
        requestId: req.requestId,
      });
    }

    // Generate new token
    const newToken = security.generateToken({ playerId, sessionId });

    res.json({
      success: true,
      token: newToken,
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('Token refresh failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      requestId: req.requestId,
    });
  }
});

// Get user profile endpoint
router.get('/profile', security.sessionValidation, (req, res) => {
  try {
    const { playerId } = req.user;

    // TODO: Implement actual user profile retrieval
    const profile = {
      playerId,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      // Add more profile fields as needed
    };

    res.json({
      success: true,
      profile,
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('Profile retrieval failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Profile retrieval failed',
      requestId: req.requestId,
    });
  }
});

export default router;
