import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import Candidate from '../models/Candidate';
import User from '../models/User';
import AuditLog from '../models/AuditLog';

export const createCandidate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, party, symbol, manifesto, biography, photo, electionID, userEmail } = req.body;

    if (!name || !party || !symbol || !manifesto || !biography || !electionID) {
      return res.status(400).json({ message: 'All candidate profile details are required.' });
    }

    let userId;
    if (userEmail) {
      const user = await User.findOne({ email: userEmail });
      if (user) {
        userId = user._id;
        // Promote user role to candidate if needed
        if (user.role === 'Voter') {
          user.role = 'Candidate';
          await user.save();
        }
      }
    }

    const candidate = new Candidate({
      name,
      party,
      symbol,
      manifesto,
      biography,
      photo,
      electionID,
      userId
    });

    await candidate.save();

    await new AuditLog({
      action: 'CANDIDATE_CREATED',
      user: req.user?.email || 'system',
      role: req.user?.role || 'system',
      ipAddress: req.ip || '127.0.0.1',
      details: `Created candidate: "${name}" for election ${electionID}`
    }).save();

    res.status(201).json(candidate);
  } catch (error) {
    next(error);
  }
};

export const getCandidates = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { electionId, search } = req.query;
    const filter: any = {};

    if (electionId) {
      filter.electionID = electionId;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { party: { $regex: search, $options: 'i' } }
      ];
    }

    const candidates = await Candidate.find(filter).populate('electionID', 'title status');
    res.json(candidates);
  } catch (error) {
    next(error);
  }
};

export const getCandidateById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const candidate = await Candidate.findById(req.params.id).populate('electionID', 'title status description');
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found.' });
    }
    res.json(candidate);
  } catch (error) {
    next(error);
  }
};

export const updateCandidate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, party, symbol, manifesto, biography, photo, socialLinks } = req.body;
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found.' });
    }

    // Role check: Admin/Officer can update anything, Candidate can update their own profile
    if (req.user?.role === 'Candidate') {
      if (!candidate.userId || candidate.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'You can only update your own candidate profile.' });
      }
    }

    if (name) candidate.name = name;
    if (party) candidate.party = party;
    if (symbol) candidate.symbol = symbol;
    if (manifesto) candidate.manifesto = manifesto;
    if (biography) candidate.biography = biography;
    if (photo !== undefined) candidate.photo = photo;
    if (socialLinks) candidate.socialLinks = { ...candidate.socialLinks, ...socialLinks };

    await candidate.save();

    await new AuditLog({
      action: 'CANDIDATE_UPDATED',
      user: req.user?.email || 'system',
      role: req.user?.role || 'system',
      ipAddress: req.ip || '127.0.0.1',
      details: `Updated candidate: "${candidate.name}" (ID: ${candidate._id})`
    }).save();

    res.json(candidate);
  } catch (error) {
    next(error);
  }
};

export const deleteCandidate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found.' });
    }

    const name = candidate.name;
    await Candidate.findByIdAndDelete(req.params.id);

    await new AuditLog({
      action: 'CANDIDATE_DELETED',
      user: req.user?.email || 'system',
      role: req.user?.role || 'system',
      ipAddress: req.ip || '127.0.0.1',
      details: `Deleted candidate: "${name}" (ID: ${req.params.id})`
    }).save();

    res.json({ message: 'Candidate deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
