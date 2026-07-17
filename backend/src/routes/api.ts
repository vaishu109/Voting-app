import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';

// Controllers
import * as authController from '../controllers/authController';
import * as electionController from '../controllers/electionController';
import * as candidateController from '../controllers/candidateController';
import * as voteController from '../controllers/voteController';
import * as userController from '../controllers/userController';
import * as adminController from '../controllers/adminController';

const router = Router();

// ==========================================
// Authentication Routes
// ==========================================
router.post('/auth/register', authLimiter, authController.register);
router.post('/auth/verify-email', authLimiter, authController.verifyEmail);
router.post('/auth/login', authLimiter, authController.login);
router.post('/auth/verify-2fa', authLimiter, authController.verify2FALogin);
router.post('/auth/refresh', authController.refreshToken);
router.post('/auth/logout', authController.logout);
router.post('/auth/forgot-password', authLimiter, authController.forgotPassword);
router.post('/auth/reset-password', authLimiter, authController.resetPassword);
router.post('/auth/2fa', authenticateToken, authController.toggle2FA);

// ==========================================
// User Profiles & Management
// ==========================================
router.get('/users/profile', authenticateToken, userController.getProfile);
router.put('/users/profile', authenticateToken, userController.updateProfile);
router.put('/users/change-password', authenticateToken, userController.changePassword);

// Admin-only user management
router.get('/users', authenticateToken, requireRole(['Admin', 'Election Officer']), userController.getAllUsers);
router.put('/users/verification', authenticateToken, requireRole(['Admin', 'Election Officer']), userController.updateUserVerification);
router.delete('/users/:id', authenticateToken, requireRole(['Admin']), userController.deleteUser);

// ==========================================
// Election Routes
// ==========================================
router.get('/elections', authenticateToken, electionController.getElections);
router.get('/elections/:id', authenticateToken, electionController.getElectionById);

// Admin/Officer-only election controls
router.post('/elections', authenticateToken, requireRole(['Admin', 'Election Officer']), electionController.createElection);
router.put('/elections/:id', authenticateToken, requireRole(['Admin', 'Election Officer']), electionController.updateElection);
router.delete('/elections/:id', authenticateToken, requireRole(['Admin']), electionController.deleteElection);
router.patch('/elections/:id/status', authenticateToken, requireRole(['Admin', 'Election Officer']), electionController.updateElectionStatus);

// ==========================================
// Candidate Routes
// ==========================================
router.get('/candidates', authenticateToken, candidateController.getCandidates);
router.get('/candidates/:id', authenticateToken, candidateController.getCandidateById);

// Creation / editing controls
router.post('/candidates', authenticateToken, requireRole(['Admin', 'Election Officer']), candidateController.createCandidate);
router.put('/candidates/:id', authenticateToken, candidateController.updateCandidate); // internally checks matching userId for candidates
router.delete('/candidates/:id', authenticateToken, requireRole(['Admin', 'Election Officer']), candidateController.deleteCandidate);

// ==========================================
// Voting Process Routes
// ==========================================
router.post('/votes/initiate', authenticateToken, authLimiter, voteController.initiateVote);
router.post('/votes/cast', authenticateToken, authLimiter, voteController.castVote);
router.get('/votes/verify/:hash', voteController.verifyReceipt); // public endpoint
router.get('/votes/results/:id', authenticateToken, voteController.getResults); // role verification handled inside controller

// ==========================================
// Admin Reports & Bulk Import
// ==========================================
router.get('/admin/stats', authenticateToken, requireRole(['Admin', 'Election Officer']), adminController.getDashboardStats);
router.post('/admin/import', authenticateToken, requireRole(['Admin']), adminController.importVotersCSV);
router.get('/admin/audit-logs', authenticateToken, requireRole(['Admin']), adminController.getAuditLogs);
router.get('/admin/export', authenticateToken, requireRole(['Admin', 'Election Officer']), adminController.exportReport);

export default router;
