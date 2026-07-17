import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import Election from '../models/Election';
import Candidate from '../models/Candidate';
import AuditLog from '../models/AuditLog';

// Helper to broadcast socket updates
const broadcastElectionUpdate = (req: AuthenticatedRequest, election: any) => {
  const io = req.app.get('io');
  if (io) {
    io.emit('election_update', {
      electionId: election._id,
      title: election.title,
      status: election.status
    });
  }
};

export const createElection = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, startDate, endDate, rules, eligibility, bannerImage } = req.body;

    if (!title || !description || !startDate || !endDate) {
      return res.status(400).json({ message: 'Title, description, startDate, and endDate are required.' });
    }

    const election = new Election({
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'upcoming',
      rules,
      eligibility,
      bannerImage
    });

    await election.save();

    await new AuditLog({
      action: 'ELECTION_CREATED',
      user: req.user?.email || 'system',
      role: req.user?.role || 'system',
      ipAddress: req.ip || '127.0.0.1',
      details: `Created election: "${title}" (ID: ${election._id})`
    }).save();

    res.status(201).json(election);
  } catch (error) {
    next(error);
  }
};

export const getElections = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const elections = await Election.find().sort({ startDate: -1 });
    res.json(elections);
  } catch (error) {
    next(error);
  }
};

export const getElectionById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: 'Election not found.' });
    }
    res.json(election);
  } catch (error) {
    next(error);
  }
};

export const updateElection = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, startDate, endDate, rules, eligibility, bannerImage } = req.body;
    
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: 'Election not found.' });
    }

    if (title) election.title = title;
    if (description) election.description = description;
    if (startDate) election.startDate = new Date(startDate);
    if (endDate) election.endDate = new Date(endDate);
    if (rules !== undefined) election.rules = rules;
    if (eligibility !== undefined) election.eligibility = eligibility;
    if (bannerImage !== undefined) election.bannerImage = bannerImage;

    await election.save();

    await new AuditLog({
      action: 'ELECTION_UPDATED',
      user: req.user?.email || 'system',
      role: req.user?.role || 'system',
      ipAddress: req.ip || '127.0.0.1',
      details: `Updated election: "${election.title}" (ID: ${election._id})`
    }).save();

    broadcastElectionUpdate(req, election);

    res.json(election);
  } catch (error) {
    next(error);
  }
};

export const deleteElection = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: 'Election not found.' });
    }

    const title = election.title;
    await Election.findByIdAndDelete(req.params.id);
    // Remove associated candidates
    await Candidate.deleteMany({ electionID: req.params.id });

    await new AuditLog({
      action: 'ELECTION_DELETED',
      user: req.user?.email || 'system',
      role: req.user?.role || 'system',
      ipAddress: req.ip || '127.0.0.1',
      details: `Deleted election: "${title}" (ID: ${req.params.id})`
    }).save();

    res.json({ message: 'Election and its candidates deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

export const updateElectionStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    if (!status || !['upcoming', 'active', 'paused', 'ended', 'published'].includes(status)) {
      return res.status(400).json({ message: 'Valid status required.' });
    }

    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: 'Election not found.' });
    }

    const oldStatus = election.status;
    election.status = status;
    await election.save();

    await new AuditLog({
      action: `ELECTION_STATUS_CHANGE`,
      user: req.user?.email || 'system',
      role: req.user?.role || 'system',
      ipAddress: req.ip || '127.0.0.1',
      details: `Election "${election.title}" status changed from "${oldStatus}" to "${status}"`
    }).save();

    broadcastElectionUpdate(req, election);

    res.json(election);
  } catch (error) {
    next(error);
  }
};
