// ShikshaShare Seed Data & Platform Constants
// "Connecting Students, Resources & Community"

const PLATFORM_CONFIG = {
  name: 'ShikshaShare',
  tagline: 'Connecting Students, Resources & Community',
  supportingMessage: 'Find what you need. Share what you have. Support someone in your community.',
  cepProject: 'College Community Engagement Project (CEP) Initiative'
};

const EDUCATION_LEVELS = [
  { id: 'school', name: 'School: 5th–10th', description: 'Class 5 to 10 textbooks, guides & stationery' },
  { id: 'hsc', name: 'HSC: 11th–12th', description: 'Higher Secondary streams (Science, Commerce, Arts, Diploma)' },
  { id: 'college', name: 'College / Undergraduate', description: 'Degree courses, engineering, medicine, sciences, commerce' },
  { id: 'masters', name: 'Master\'s / Postgraduate', description: 'Advanced master programs & specializations' },
  { id: 'competitive', name: 'Competitive Examination', description: 'JEE, NEET, GATE, UPSC, CAT, State CETs' }
];

const SCHOOL_CLASSES = ['Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];

const STREAMS_HSC = [
  'Medical (PCB)',
  'Engineering (PCM / PCMB)',
  'Commerce',
  'Arts / Humanities',
  'Diploma',
  'Other'
];

const COLLEGE_COURSES = [
  'B.Tech / B.E.',
  'B.Sc',
  'B.Com',
  'BBA / BMS',
  'MBBS / BDS',
  'B.Pharm',
  'B.Arch',
  'BCA',
  'Other Degree'
];

const COLLEGE_BRANCHES = [
  'Computer Engineering / CS / IT',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical & Electronics',
  'Chemical Engineering',
  'Biotechnology',
  'Data Science & AI',
  'General First Year (Common)'
];

const COLLEGE_SEMESTERS = [
  'Semester 1', 'Semester 2', 'Semester 3', 'Semester 4',
  'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'
];

const MASTERS_COURSES = [
  'M.Tech / M.E.',
  'M.Sc',
  'MBA / MMS',
  'MCA',
  'MA',
  'M.Com',
  'Other Postgraduate'
];

const COMPETITIVE_EXAMS = [
  'JEE Main & Advanced',
  'NEET UG',
  'GATE (Engineering)',
  'UPSC Civil Services',
  'CAT / Management',
  'State CET / MHT-CET',
  'GRE / GMAT',
  'Banking & SSC'
];

const CATEGORIES = [
  { id: 'academic_books', name: 'Academic Books', icon: 'book' },
  { id: 'reference_books', name: 'Reference Books', icon: 'bookmark' },
  { id: 'competitive_books', name: 'Competitive Exam Books', icon: 'award' },
  { id: 'stationery', name: 'Stationery', icon: 'edit' },
  { id: 'calculators', name: 'Calculators', icon: 'calculator' },
  { id: 'engineering_instruments', name: 'Engineering Instruments', icon: 'compass' },
  { id: 'lab_equipment', name: 'Laboratory Equipment', icon: 'activity' },
  { id: 'school_bags', name: 'School Bags', icon: 'briefcase' },
  { id: 'educational_supplies', name: 'Educational Supplies', icon: 'package' },
  { id: 'other_resources', name: 'Other Useful Educational Resources', icon: 'layers' }
];

// Demo profiles removed for production deployment
const DEMO_USERS = [];

// Hardcoded, demo and sample listings removed for genuine user listings
const INITIAL_RESOURCES = [];

const INITIAL_COMMUNITY_REQUIREMENTS = [
  {
    id: 'req-1',
    title: '25 School Bags Needed for Primary & Middle School Children',
    organizationName: 'Pratham Shiksha Foundation',
    organizationType: 'Registered NGO',
    category: 'school_bags',
    quantityNeeded: 25,
    quantityReceived: 14,
    status: 'Partially Fulfilled',
    urgency: 'High',
    targetBeneficiaries: 'Economically disadvantaged students in M-Ward municipal school',
    dropLocation: 'Pratham Community Centre, Chembur Naka, Mumbai',
    contactPerson: 'Mrs. Sunita Jadhav (Project Coordinator)',
    contactPhone: '+91 98201 44521',
    datePosted: '2026-08-25',
    description: 'We are supporting 25 young students starting the new academic term. Sturdy bags in good or like-new condition will make a tremendous difference for these children.',
    verified: true
  },
  {
    id: 'req-2',
    title: '15 Mathematics & Science Guide Books Needed (Class 10 Board Exam)',
    organizationName: 'NSS Unit - VJTI Youth Wing',
    organizationType: 'NSS College Unit',
    category: 'academic_books',
    quantityNeeded: 15,
    quantityReceived: 11,
    status: 'Partially Fulfilled',
    urgency: 'Medium',
    targetBeneficiaries: 'Underprivileged 10th standard students in free weekend coaching classes',
    dropLocation: 'NSS Office, Quadrangle, VJTI College, Matunga',
    contactPerson: 'Aditya Kale (NSS Student Leader)',
    contactPhone: '+91 97690 12389',
    datePosted: '2026-08-28',
    description: 'Our NSS volunteers conduct free tuition for 45 board students every weekend. We urgently need 15 Class 10 NCERT / State Board Science & Math guides.',
    verified: true
  },
  {
    id: 'req-3',
    title: '10 Scientific Calculators Needed for Polytechnic Diploma Students',
    organizationName: 'Vidya Jyoti Educational Trust',
    organizationType: 'Education Trust & Foundation',
    category: 'calculators',
    quantityNeeded: 10,
    quantityReceived: 3,
    status: 'Open',
    urgency: 'High',
    targetBeneficiaries: '1st & 2nd year polytechnic diploma students from low-income households',
    dropLocation: 'Vidya Jyoti Library, Dadar Central, Mumbai',
    contactPerson: 'Prof. Ramesh Kulkarni',
    contactPhone: '+91 98192 87654',
    datePosted: '2026-09-01',
    description: 'Students from marginalized families cannot afford ₹1200+ scientific calculators required for their upcoming semester exams. Non-programmable models (fx-82, fx-991) requested.',
    verified: true
  },
  {
    id: 'req-4',
    title: '8 Engineering Mini Drafters Needed for 1st Year Degree Scholars',
    organizationName: 'Seva Bharati Student Aid Wing',
    organizationType: 'Community Aid Foundation',
    category: 'engineering_instruments',
    quantityNeeded: 8,
    quantityReceived: 8,
    status: 'Fulfilled',
    urgency: 'Completed',
    targetBeneficiaries: 'Deserving 1st year engineering scholars from rural districts',
    dropLocation: 'Seva Bharati Youth Centre, Thane West',
    contactPerson: 'Harshwardhan Patil',
    contactPhone: '+91 99203 55112',
    datePosted: '2026-08-20',
    description: 'All 8 mini drafters successfully gathered and handed over to scholars from remote rural backgrounds. Thank you to all community donors!',
    verified: true
  },
  {
    id: 'req-5',
    title: '30 Geometry Boxes & Compass Kits for Rural Talent Search Students',
    organizationName: 'Samarpan Child Welfare Trust',
    organizationType: 'Orphanage & Children Support Organization',
    category: 'stationery',
    quantityNeeded: 30,
    quantityReceived: 19,
    status: 'Partially Fulfilled',
    urgency: 'Medium',
    targetBeneficiaries: 'Tribal and rural scholarship students appearing for competitive Olympiad',
    dropLocation: 'Samarpan Resource Centre, Navi Mumbai',
    contactPerson: 'Meera Deshmukh',
    contactPhone: '+91 98334 77210',
    datePosted: '2026-08-30',
    description: 'Geometry instruments are critical for their technical drawing and geometry workshops. Usable or new instrument sets warmly welcomed.',
    verified: true
  }
];

const COMMUNITY_PARTNERS_LIST = [
  {
    id: 'cp-1',
    name: 'Pratham Shiksha Foundation',
    type: 'Registered NGO',
    established: '2014',
    location: 'Mumbai & Thane',
    focus: 'Primary & Secondary Education Access',
    activeDrives: 3,
    studentsBenefited: 1240,
    verified: true,
    description: 'Dedicated to helping children from marginalized communities complete elementary and secondary schooling with adequate supplies.'
  },
  {
    id: 'cp-2',
    name: 'NSS Unit - VJTI Youth Wing',
    type: 'NSS College Unit',
    established: '2008',
    location: 'Matunga, Mumbai',
    focus: 'Student Peer Tutoring & Book Banks',
    activeDrives: 2,
    studentsBenefited: 680,
    verified: true,
    description: 'Student volunteers running evening remedial classes and book banks for municipal school students across central Mumbai.'
  },
  {
    id: 'cp-3',
    name: 'Vidya Jyoti Educational Trust',
    type: 'Educational Foundation',
    established: '2018',
    location: 'Dadar, Mumbai',
    focus: 'Technical Education & Equipment Sponsorship',
    activeDrives: 4,
    studentsBenefited: 520,
    verified: true,
    description: 'Sponsoring scientific tools, calculators, and drafting equipment for diploma and vocational polytechnic scholars.'
  },
  {
    id: 'cp-4',
    name: 'Samarpan Child Welfare Trust',
    type: 'Children Welfare NGO & Orphanage Support',
    established: '2016',
    location: 'Navi Mumbai',
    focus: 'Stationery, Books & School Bags for Underprivileged',
    activeDrives: 2,
    studentsBenefited: 890,
    verified: true,
    description: 'Empowering children living in shelter homes and orphanages with complete academic kits and geometry instruments.'
  }
];

const IMPACT_STATISTICS = {
  resourcesShared: 1482,
  moneySavedRupees: 524000,
  communityDrivesCompleted: 52,
  activeDonorsPartners: 748,
  treesEquivalentSaved: 310
};
