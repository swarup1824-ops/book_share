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

// Realistic demo profiles for instant role testing
const DEMO_USERS = [
  {
    id: 'user-student',
    name: 'Swarup Patil',
    email: 'swarup.student@vjti.ac.in',
    role: 'student',
    roleLabel: 'Student',
    institution: 'VJTI College of Engineering, Mumbai',
    educationLevel: 'college',
    stream: 'B.Tech / B.E.',
    branch: 'Computer Engineering / CS / IT',
    semester: 'Semester 3',
    city: 'Mumbai',
    avatar: 'SP'
  },
  {
    id: 'user-provider',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@gmail.com',
    role: 'provider',
    roleLabel: 'Resource Provider',
    institution: 'Final Year Student Provider, Andheri',
    location: 'Campus Library Gate / Andheri, Mumbai',
    activeListingsCount: 4,
    avatar: 'AS'
  },
  {
    id: 'user-donor',
    name: 'Priya Iyer',
    email: 'priya.iyer@alumni.org',
    role: 'donor',
    roleLabel: 'Resource Donor',
    institution: 'College Alumna & Community Supporter',
    location: 'Vile Parle West, Mumbai',
    totalDonations: 8,
    avatar: 'PI'
  },
  {
    id: 'user-community',
    name: 'Aditya Kale (NSS VJTI)',
    email: 'nss.coordinator@vjti.ac.in',
    role: 'community',
    roleLabel: 'Community Partner (NSS Unit)',
    organizationName: 'NSS Unit - VJTI Youth Wing',
    organizationType: 'NSS College Unit',
    location: 'Matunga, Mumbai',
    verified: true,
    activeDrives: 2,
    avatar: 'NK'
  },
  {
    id: 'user-admin',
    name: 'Prof. M. K. Deshmukh',
    email: 'admin.cep@shikshashare.org',
    role: 'admin',
    roleLabel: 'System Administrator (CEP Lead)',
    institution: 'College Community Engagement Project Cell',
    location: 'Mumbai',
    avatar: 'AD'
  }
];

const INITIAL_RESOURCES = [
  // Free Community Resources (Priority 1)
  {
    id: 'res-free-1',
    title: 'Operating System Concepts (Silberschatz Dinosaur Book) - 10th Edition',
    category: 'academic_books',
    educationLevel: 'college',
    stream: 'B.Tech / B.E.',
    branch: 'Computer Engineering / CS / IT',
    semester: 'Semester 3',
    subject: 'Operating Systems & Architecture',
    condition: 'Good',
    type: 'free',
    price: 0,
    originalPrice: 890,
    location: 'Vile Parle West, Mumbai',
    providerName: 'Priya Iyer',
    providerRole: 'Donor',
    description: 'Passed my 3rd semester exam and donating this classic textbook to any student who needs it. Hardcover, completely intact with diagrams and index tables.',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    availability: 'Available for Free Collection',
    dateAdded: '2026-09-02',
    featured: true
  },
  {
    id: 'res-free-2',
    title: 'Ergonomic Waterproof School Backpack with Laptop/Book Sleeves',
    category: 'school_bags',
    educationLevel: 'school',
    stream: '',
    branch: '',
    semester: '',
    subject: 'General School Supplies',
    condition: 'Like New',
    type: 'free',
    price: 0,
    originalPrice: 1200,
    location: 'Kurla West, Mumbai',
    providerName: 'Rotary Community Youth Wing',
    providerRole: 'Donor',
    description: 'Padded back, 3 spacious compartments, water bottle pockets, reinforced zippers. Donated surplus from our school kit initiative for students in need.',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
    availability: 'Free for Eligible Student',
    dateAdded: '2026-09-02',
    featured: true
  },
  {
    id: 'res-free-3',
    title: '10th Standard SSC Maharashtra Board Science & Technology Master Digest',
    category: 'academic_books',
    educationLevel: 'school',
    stream: '',
    branch: '',
    semester: '',
    subject: 'Science & Technology (Class 10)',
    condition: 'Good',
    type: 'free',
    price: 0,
    originalPrice: 380,
    location: 'Dadar Central, Mumbai',
    providerName: 'Rajesh Nair',
    providerRole: 'Donor',
    description: 'Complete syllabus with past board paper questions solved. Donated for 10th board students who cannot afford coaching guides.',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
    availability: 'Available for Immediate Handover',
    dateAdded: '2026-08-30',
    featured: false
  },
  {
    id: 'res-free-4',
    title: 'HC Verma Concepts of Physics (Part 1 & 2) Complete Set',
    category: 'academic_books',
    educationLevel: 'hsc',
    stream: 'Engineering (PCM / PCMB)',
    branch: '',
    semester: '',
    subject: 'Physics (11th & 12th)',
    condition: 'Good',
    type: 'free',
    price: 0,
    originalPrice: 750,
    location: 'Powai, Mumbai',
    providerName: 'Siddharth Roy',
    providerRole: 'Donor',
    description: 'Cleared JEE and giving away the essential foundation physics books to an aspiring student. Contains all exercises and conceptual notes.',
    image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=600&q=80',
    availability: 'Available for Student Pickup',
    dateAdded: '2026-09-03',
    featured: true
  },

  // Affordable Student Resources (For Sale)
  {
    id: 'res-sale-1',
    title: 'Data Structures and Algorithms in C++ (4th Edition)',
    category: 'academic_books',
    educationLevel: 'college',
    stream: 'B.Tech / B.E.',
    branch: 'Computer Engineering / CS / IT',
    semester: 'Semester 3',
    subject: 'Data Structures & Algorithms',
    condition: 'Like New',
    type: 'buy',
    price: 320,
    originalPrice: 850,
    location: 'Campus Library Gate / Andheri, Mumbai',
    providerName: 'Aarav Sharma',
    providerRole: 'Student / Provider',
    description: 'Crisp pages with no highlighting or pencil marks. Includes companion code algorithms CD and quick reference cheat sheet. Essential for 3rd semester CS/IT students.',
    image: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=600&q=80',
    availability: 'Available for Campus Pickup',
    dateAdded: '2026-09-01',
    featured: true
  },
  {
    id: 'res-sale-2',
    title: 'Casio fx-991CW ClassWiz Non-Programmable Scientific Calculator',
    category: 'calculators',
    educationLevel: 'college',
    stream: 'B.Tech / B.E.',
    branch: 'Computer Engineering / CS / IT',
    semester: 'Semester 3',
    subject: 'Discrete Mathematics & Engineering Maths',
    condition: 'Like New',
    type: 'buy',
    price: 680,
    originalPrice: 1595,
    location: 'Hostel Block C, Powai, Mumbai',
    providerName: 'Rohan Deshmukh',
    providerRole: 'Resource Provider',
    description: 'Fully functional, approved for university semester exams. Hard slide-on casing included. Brand new battery installed last month.',
    image: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=600&q=80',
    availability: 'Immediate Pickup / Hostel Handover',
    dateAdded: '2026-09-02',
    featured: true
  },
  {
    id: 'res-sale-3',
    title: 'Omega Engineering Mini Drafter with Steel Clamp & Protractor Head',
    category: 'engineering_instruments',
    educationLevel: 'college',
    stream: 'B.Tech / B.E.',
    branch: 'General First Year (Common)',
    semester: 'Semester 1',
    subject: 'Engineering Graphics & Drawing',
    condition: 'Like New',
    type: 'buy',
    price: 380,
    originalPrice: 950,
    location: 'Matunga / College Workshop, Mumbai',
    providerName: 'Nikhil Rane',
    providerRole: 'Student / Provider',
    description: 'Used for one semester in Engineering Drawing. Smooth arms with zero wobbling, clear graduated metric scales, and original padded carry canvas bag.',
    image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80',
    availability: 'Available for Campus Handover',
    dateAdded: '2026-08-28',
    featured: true
  },
  {
    id: 'res-sale-4',
    title: 'Camlin Exam Geometry Box & Drawing Instruments Set',
    category: 'stationery',
    educationLevel: 'school',
    stream: '',
    branch: '',
    semester: '',
    subject: 'Mathematics & Geometry',
    condition: 'Like New',
    type: 'buy',
    price: 60,
    originalPrice: 180,
    location: 'Mulund West, Mumbai',
    providerName: 'Devansh Joshi',
    providerRole: 'Student / Provider',
    description: 'Includes self-centering compass, divider, protractor, set squares, sharpener, and eraser in tin container. Used for one exam session only.',
    image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&q=80',
    availability: 'Available for Pickup',
    dateAdded: '2026-08-27',
    featured: false
  },
  {
    id: 'res-sale-5',
    title: 'Disha 45 Years JEE Advanced + 22 Years JEE Main Solved Papers',
    category: 'competitive_books',
    educationLevel: 'competitive',
    stream: '',
    branch: '',
    semester: '',
    subject: 'JEE Main & Advanced Physics, Chem, Maths',
    condition: 'Good',
    type: 'buy',
    price: 450,
    originalPrice: 1450,
    location: 'Nerul, Navi Mumbai',
    providerName: 'Tanmay Mehta',
    providerRole: 'Student / Provider',
    description: 'Detailed step-by-step solutions for every previous year question. Highlighted shortcuts and key formulas for fast revision.',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
    availability: 'Available for Pickup',
    dateAdded: '2026-08-31',
    featured: false
  },
  {
    id: 'res-sale-6',
    title: 'Digital Vernier Caliper & Screw Gauge Set for Mechanical Lab',
    category: 'engineering_instruments',
    educationLevel: 'college',
    stream: 'B.Tech / B.E.',
    branch: 'Mechanical Engineering',
    semester: 'Semester 3',
    subject: 'Metrology & Mechanical Workshop',
    condition: 'Like New',
    type: 'buy',
    price: 480,
    originalPrice: 1400,
    location: 'Matunga, Mumbai',
    providerName: 'Sameer Joshi',
    providerRole: 'Student / Provider',
    description: 'Precision measuring instruments in foam-lined protective wooden case. Calibrated and accurate, essential for mechanical lab exams.',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    availability: 'Available for Pickup',
    dateAdded: '2026-09-01',
    featured: false
  },
  {
    id: 'res-sale-7',
    title: 'MTG 36 Years NEET Chapterwise Biology & Chemistry Guides',
    category: 'competitive_books',
    educationLevel: 'competitive',
    stream: '',
    branch: '',
    semester: '',
    subject: 'NEET UG',
    condition: 'Like New',
    type: 'buy',
    price: 350,
    originalPrice: 950,
    location: 'Sion East, Mumbai',
    providerName: 'Ananya Sen',
    providerRole: 'Provider',
    description: 'Extensive question bank with answer keys and NCERT extract pointers. Clean condition without stains or loose sheets.',
    image: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=600&q=80',
    availability: 'Immediate Pickup',
    dateAdded: '2026-09-03',
    featured: false
  }
];

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
