import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import User from '../models/User';
import Candidate from '../models/Candidate';
import Election from '../models/Election';
import Vote from '../models/Vote';
import AuditLog from '../models/AuditLog';
import bcrypt from 'bcryptjs';
import { generatePDFReport, generateExcelReport, generateCSVReport } from '../utils/reports';
import { decryptVote } from '../utils/crypto';

// Bulk import voters from CSV representation
export const importVotersCSV = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { voters } = req.body; // Array of { name, email, phone, password }

    if (!Array.isArray(voters) || voters.length === 0) {
      return res.status(400).json({ message: 'Valid array of voters is required.' });
    }

    const importedVoters = [];
    const errors = [];

    const helperRandomId = () => {
      const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let r = 'SV-';
      for (let i = 0; i < 6; i++) r += chars[Math.floor(Math.random() * chars.length)];
      return r;
    };

    for (let index = 0; index < voters.length; index++) {
      const { name, email, phone, password } = voters[index];
      if (!name || !email || !phone || !password) {
        errors.push(`Row ${index + 1}: Missing fields`);
        continue;
      }

      // Check duplicates
      const exists = await User.findOne({ email });
      if (exists) {
        errors.push(`Row ${index + 1}: Email ${email} already registered`);
        continue;
      }

      const hash = await bcrypt.hash(password, 10);
      const voterID = helperRandomId();

      const newUser = new User({
        name,
        email,
        phone,
        voterID,
        passwordHash: hash,
        role: 'Voter',
        verified: true // Pre-verified since approved by Admin upload
      });

      await newUser.save();
      importedVoters.push(newUser);
    }

    // Log the bulk import
    await new AuditLog({
      action: 'ADMIN_BULK_IMPORT',
      user: req.user?.email || 'admin',
      role: 'Admin',
      ipAddress: req.ip || '127.0.0.1',
      details: `Bulk imported ${importedVoters.length} voters. Failures: ${errors.length}`
    }).save();

    res.json({
      message: `Bulk import completed. Success: ${importedVoters.length}, Failed: ${errors.length}`,
      successCount: importedVoters.length,
      errors
    });
  } catch (error) {
    next(error);
  }
};

// Admin overview data
export const getDashboardStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const totalUsers = await User.countDocuments();
    const votersCount = await User.countDocuments({ role: 'Voter' });
    const candidatesCount = await User.countDocuments({ role: 'Candidate' });
    const activeElections = await Election.countDocuments({ status: 'active' });
    
    // Live participation
    const votesCast = await Vote.countDocuments();
    const liveTurnoutRate = votersCount > 0 ? parseFloat(((votesCast / votersCount) * 100).toFixed(2)) : 0;

    const electionsList = await Election.find().sort({ startDate: -1 }).limit(5);

    res.json({
      totalUsers,
      votersCount,
      candidatesCount,
      activeElections,
      totalVotesCast: votesCast,
      liveTurnoutRate,
      recentElections: electionsList
    });
  } catch (error) {
    next(error);
  }
};

// Audit logs list
export const getAuditLogs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

// Export election report
export const exportReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { electionId, format } = req.query;

    if (!electionId || !format) {
      return res.status(400).json({ message: 'Election ID and Format (pdf/excel/csv) are required.' });
    }

    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ message: 'Election not found.' });
    }

    // Tally votes
    const votes = await Vote.find({ electionID: electionId });
    const candidates = await Candidate.find({ electionID: electionId });

    const tallyMap = new Map<string, number>();
    candidates.forEach(c => tallyMap.set(c._id.toString(), 0));

    votes.forEach(v => {
      const decrypted = decryptVote(v.encryptedVote);
      if (decrypted && decrypted.candidateId) {
        const count = tallyMap.get(decrypted.candidateId) || 0;
        tallyMap.set(decrypted.candidateId, count + 1);
      }
    });

    const candidatesData = candidates.map(c => {
      const count = tallyMap.get(c._id.toString()) || 0;
      const pct = votes.length > 0 ? parseFloat(((count / votes.length) * 100).toFixed(2)) : 0;
      return {
        name: c.name,
        party: c.party,
        votes: count,
        percentage: pct
      };
    });

    const totalVotersCount = await User.countDocuments({ role: 'Voter' });
    const turnoutRate = totalVotersCount > 0 ? parseFloat(((votes.length / totalVotersCount) * 100).toFixed(2)) : 0;

    const stats = {
      totalVotes: votes.length,
      totalVoters: totalVotersCount,
      turnoutRate,
      participationPercentage: turnoutRate // dummy/same mapping
    };

    if (format === 'pdf') {
      const pdfBuffer = await generatePDFReport(election.title, stats, candidatesData);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=election_report_${electionId}.pdf`);
      return res.send(pdfBuffer);
    } else if (format === 'excel') {
      const xlsxBuffer = await generateExcelReport(election.title, stats, candidatesData);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=election_report_${electionId}.xlsx`);
      return res.send(xlsxBuffer);
    } else if (format === 'csv') {
      const csvString = generateCSVReport(election.title, stats, candidatesData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=election_report_${electionId}.csv`);
      return res.send(csvString);
    } else {
      return res.status(400).json({ message: 'Invalid format. Supported: pdf, excel, csv' });
    }
  } catch (error) {
    next(error);
  }
};
