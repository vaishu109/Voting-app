import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User';
import Election from './models/Election';
import Candidate from './models/Candidate';
import Vote from './models/Vote';
import AuditLog from './models/AuditLog';
import { encryptVote, generateVerificationHash } from './utils/crypto';

dotenv.config();

const seed = async () => {
  try {
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/securevote';
    await mongoose.connect(dbUri);
    console.log('Seed: Connected to DB.');

    // Clear existing collections
    await User.deleteMany({});
    await Election.deleteMany({});
    await Candidate.deleteMany({});
    await Vote.deleteMany({});
    await AuditLog.deleteMany({});
    console.log('Seed: Cleared old collections.');

    // Create passwords
    const adminPass = await bcrypt.hash('adminpassword123', 10);
    const officerPass = await bcrypt.hash('officerpassword123', 10);
    const candidatePass = await bcrypt.hash('candidatepassword123', 10);
    const voterPass = await bcrypt.hash('voterpassword123', 10);

    // Create default users
    const adminUser = new User({
      name: 'System Administrator',
      email: 'admin@securevote.gov',
      phone: '+15550100',
      voterID: 'SV-ADMIN1',
      passwordHash: adminPass,
      role: 'Admin',
      verified: true
    });

    const officerUser = new User({
      name: 'Chief Election Officer',
      email: 'officer@securevote.gov',
      phone: '+15550101',
      voterID: 'SV-OFFICR',
      passwordHash: officerPass,
      role: 'Election Officer',
      verified: true
    });

    const voter1 = new User({
      name: 'John Doe',
      email: 'voter1@securevote.gov',
      phone: '+15550102',
      voterID: 'SV-VOTER1',
      passwordHash: voterPass,
      role: 'Voter',
      verified: true
    });

    const voter2 = new User({
      name: 'Jane Smith',
      email: 'voter2@securevote.gov',
      phone: '+15550103',
      voterID: 'SV-VOTER2',
      passwordHash: voterPass,
      role: 'Voter',
      verified: true
    });

    const candidateUser1 = new User({
      name: 'Senator Alice Johnson',
      email: 'alice@securevote.gov',
      phone: '+15550104',
      voterID: 'SV-CANDI1',
      passwordHash: candidatePass,
      role: 'Candidate',
      verified: true
    });

    const candidateUser2 = new User({
      name: 'Governor Robert Lee',
      email: 'robert@securevote.gov',
      phone: '+15550105',
      voterID: 'SV-CANDI2',
      passwordHash: candidatePass,
      role: 'Candidate',
      verified: true
    });

    await adminUser.save();
    await officerUser.save();
    await voter1.save();
    await voter2.save();
    await candidateUser1.save();
    await candidateUser2.save();
    console.log('Seed: Users generated successfully.');

    // Create Elections
    const presidentialElection = new Election({
      title: 'National Presidential General Election 2026',
      description: 'The national election to select the next President. All citizens aged 18+ are eligible to vote.',
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Started yesterday
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Ends in 5 days
      status: 'active',
      rules: 'One vote per registered citizen. Identity verification requires OTP token.',
      eligibility: 'Must be a registered voter and over 18 years old.',
      bannerImage: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=800'
    });

    const cityCouncilElection = new Election({
      title: 'Tech City Council Midterm Election',
      description: 'Local elections for district council members to govern municipal utilities and zoning.',
      startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Starts in 10 days
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: 'upcoming',
      rules: 'Voters must reside in Districts 1-5.',
      eligibility: 'District residency verified by government registration database.',
      bannerImage: 'https://images.unsplash.com/photo-1517089530412-f045d4c82c3c?auto=format&fit=crop&q=80&w=800'
    });

    const pastSenatorRace = new Election({
      title: 'Senate Special Seat Election 2025',
      description: 'Special runoff election for the vacancy in Senate District 9.',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      status: 'ended', // closed but results not yet published
      rules: 'Statewide registration criteria applies.',
      eligibility: 'District 9 residents only.',
      bannerImage: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=800'
    });

    await presidentialElection.save();
    await cityCouncilElection.save();
    await pastSenatorRace.save();
    console.log('Seed: Elections generated successfully.');

    // Create Candidates for Presidential Election
    const candidate1 = new Candidate({
      name: 'Senator Alice Johnson',
      party: 'Democratic Alliance',
      symbol: '🌟 Star of Progress',
      manifesto: 'Focusing on green energy infrastructure, state-funded higher education, healthcare expansion, and digital government integration.',
      biography: 'Alice Johnson has served 12 years in the Senate, spearheading technology committees and cyber-defense acts.',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
      electionID: presidentialElection._id,
      socialLinks: {
        twitter: 'https://twitter.com/alicejohnson',
        website: 'https://aliceforpresident.org'
      },
      userId: candidateUser1._id
    });

    const candidate2 = new Candidate({
      name: 'Governor Robert Lee',
      party: 'Federalist Union',
      symbol: '🦅 Liberty Eagle',
      manifesto: 'Advocating tax reductions, private sector innovation grants, national defense reinforcement, and decentralized public schools.',
      biography: 'Robert Lee is the former two-term Governor of New Virginia, known for industrial growth policies and balanced budget enforcement.',
      photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300',
      electionID: presidentialElection._id,
      socialLinks: {
        twitter: 'https://twitter.com/robertlee',
        website: 'https://lee2026.com'
      },
      userId: candidateUser2._id
    });

    // Candidates for Senate Special Seat
    const candidate3 = new Candidate({
      name: 'James Carter',
      party: 'Independent Reform',
      symbol: '⚖️ Scales of Justice',
      manifesto: 'Fighting corruption, capping campaign donations, and ensuring transparent public audits.',
      biography: 'James is a public interest defense attorney with 20 years of civil rights practice.',
      photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300',
      electionID: pastSenatorRace._id
    });

    const candidate4 = new Candidate({
      name: 'Sarah Connor',
      party: 'Democratic Alliance',
      symbol: '🛡️ Aegis Shield',
      manifesto: 'Pioneering security grids, advanced infrastructure development, and municipal safety programs.',
      biography: 'Sarah is a former aerospace logistics engineer and district commissioner.',
      photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
      electionID: pastSenatorRace._id
    });

    await candidate1.save();
    await candidate2.save();
    await candidate3.save();
    await candidate4.save();
    console.log('Seed: Candidates generated successfully.');

    // Seed some encrypted votes in the ended election (pastSenatorRace)
    // Sarah Connor gets 2 votes, James Carter gets 1 vote
    const voteData1 = encryptVote(candidate3._id.toString(), pastSenatorRace._id.toString());
    const voteData2 = encryptVote(candidate4._id.toString(), pastSenatorRace._id.toString());
    const voteData3 = encryptVote(candidate4._id.toString(), pastSenatorRace._id.toString());

    await new Vote({
      electionID: pastSenatorRace._id,
      candidateID: candidate3._id,
      encryptedVote: voteData1,
      verificationHash: generateVerificationHash(voteData1),
      timestamp: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
    }).save();

    await new Vote({
      electionID: pastSenatorRace._id,
      candidateID: candidate4._id,
      encryptedVote: voteData2,
      verificationHash: generateVerificationHash(voteData2),
      timestamp: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
    }).save();

    await new Vote({
      electionID: pastSenatorRace._id,
      candidateID: candidate4._id,
      encryptedVote: voteData3,
      verificationHash: generateVerificationHash(voteData3),
      timestamp: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
    }).save();

    console.log('Seed: Mock votes successfully cast for past election.');

    // Log the seed action
    await new AuditLog({
      action: 'SYSTEM_DB_SEEDED',
      user: 'system',
      role: 'System',
      ipAddress: '127.0.0.1',
      details: 'Populated default databases with initial mock data.'
    }).save();

    console.log('Database seeding finished successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exit(1);
  }
};

seed();
