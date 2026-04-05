export interface Speaker {
  name: string
  role: string
  org: string
}

export interface Talk {
  id: string
  title: string
  speakers: Speaker[]
  description: string
  time: string
  endTime: string
  room: Room
  track: Track
}

export type Room = 'main' | 'room1' | 'room2' | 'room3' | 'room4' | 'room5'
export type Track = 'main' | 'local' | 'health' | 'education' | 'dev' | 'marketing'

export const ROOM_LABELS: Record<Room, string> = {
  main: 'Main Space',
  room1: 'Room 1',
  room2: 'Room 2',
  room3: 'Room 3',
  room4: 'Room 4',
  room5: 'Room 5',
}

export const ROOM_SHORT: Record<Room, string> = {
  main: 'MN',
  room1: 'R1',
  room2: 'R2',
  room3: 'R3',
  room4: 'R4',
  room5: 'R5',
}

export const TRACK_LABELS: Record<Track, string> = {
  main: 'Main',
  local: 'Local Stories',
  health: 'Health Tech',
  education: 'EdTech',
  dev: 'NN1 Dev Club',
  marketing: 'Digital Marketing',
}

export const TRACK_TO_ROOM: Record<Track, Room> = {
  main: 'main',
  local: 'room1',
  health: 'room2',
  education: 'room3',
  dev: 'room4',
  marketing: 'room5',
}

export const TRACK_CSS: Record<Track, string> = {
  main: 'track-main',
  local: 'track-local',
  health: 'track-health',
  education: 'track-education',
  dev: 'track-dev',
  marketing: 'track-marketing',
}

export const EVENT_DATE = new Date('2026-06-26T09:30:00+01:00')
export const EVENT_NAME = 'Merged Futures 8'
export const EVENT_TAGLINE = 'Digital Northants 8th Annual Innovation Showcase'
export const EVENT_VENUE = 'Learning Hub, Waterside Campus, University of Northampton'
export const EVENT_ADDRESS = 'University Drive, Northampton NN1 5PH'

export const TIME_SLOTS = ['10:00', '10:10', '11:00', '12:00', '12:45', '13:30', '14:30', '15:15'] as const

export const talks: Talk[] = [
  // Main Space
  {
    id: 'main-welcome',
    title: 'Welcome',
    speakers: [{ name: 'Alexandra Vujcich', role: 'Director of IT', org: 'University of Northampton' }],
    description: 'Opening welcome to Merged Futures 8.',
    time: '10:00',
    endTime: '10:10',
    room: 'main',
    track: 'main',
  },
  {
    id: 'main-keynote',
    title: 'Reimagine Education',
    speakers: [{ name: 'Steph Lee-Vae', role: 'Curriculum Manager, School of Arts', org: 'Northampton College' }],
    description: 'Education is evolving and so must the way we prepare young people. This keynote explores digital innovation and social action integration across real-world learning pathways.',
    time: '10:10',
    endTime: '10:45',
    room: 'main',
    track: 'main',
  },
  {
    id: 'main-closing',
    title: 'The Future of Work: From Assistant to Operator',
    speakers: [{ name: 'Eric Bye', role: 'Founder', org: 'Erictron AI' }],
    description: 'A look at how AI systems are transitioning beyond assistance to operational capability, reshaping the future of work.',
    time: '15:15',
    endTime: '15:30',
    room: 'main',
    track: 'main',
  },

  // Room 1 - Local Stories
  {
    id: 'local-copilot',
    title: 'Same Tool, Different Contexts',
    speakers: [
      { name: 'Valentina Meninno', role: 'Staff', org: 'Northampton College' },
      { name: 'Rob Howe', role: 'Staff', org: 'University of Northampton' },
      { name: 'Karl Downing', role: 'Staff', org: 'University of Northampton' },
    ],
    description: 'What happens when higher and further education institutions both adopt Microsoft Copilot? This session examines the different adoption factors and lessons learned.',
    time: '11:00',
    endTime: '11:45',
    room: 'room1',
    track: 'local',
  },
  {
    id: 'local-art-tech',
    title: 'Supporting Life Through Art and Technology',
    speakers: [{ name: 'James Steventon', role: 'Director', org: 'Fermynwoods Contemporary Art' }],
    description: 'Art, education, environment and digital practice — supporting creative learning through experimental locative technology and immersive installations.',
    time: '12:00',
    endTime: '12:45',
    room: 'room1',
    track: 'local',
  },
  {
    id: 'local-robotics',
    title: 'Autonomous Robotics in Agriculture',
    speakers: [{ name: 'Chris Horton', role: 'Founder', org: 'Dynium' }],
    description: 'Details to be announced.',
    time: '13:30',
    endTime: '14:15',
    room: 'room1',
    track: 'local',
  },
  {
    id: 'local-council',
    title: 'Digital Development at West Northamptonshire Council',
    speakers: [
      { name: 'Kiri Crequer', role: 'Staff', org: 'West Northamptonshire Council' },
      { name: 'Kevin White', role: 'Staff', org: 'West Northamptonshire Council' },
    ],
    description: 'Details to be announced.',
    time: '14:30',
    endTime: '15:15',
    room: 'room1',
    track: 'local',
  },

  // Room 2 - Health Tech
  {
    id: 'health-data',
    title: 'Plan, Personalise, Prevent',
    speakers: [{ name: 'Matthew Hutton', role: 'Staff', org: 'Integrated Care Northamptonshire' }],
    description: 'The Northamptonshire Care Record connects 829,000 people\'s records from GPs, hospitals, community teams, social care and mental health services for proactive healthcare.',
    time: '11:00',
    endTime: '11:45',
    room: 'room2',
    track: 'health',
  },
  {
    id: 'health-wavevr',
    title: 'WaveVR: Immersive VR for Emotional Wellbeing',
    speakers: [{ name: 'Dr Mu Mu', role: 'Professor of Human-Centred Data Intelligence', org: 'University of Northampton' }],
    description: 'A VR experience for emotional regulation — school pilots showed 86% of participants felt better after sessions.',
    time: '12:00',
    endTime: '12:45',
    room: 'room2',
    track: 'health',
  },
  {
    id: 'health-empathy',
    title: 'Immersive Empathy: VR Supporting Trauma-Informed Fostering',
    speakers: [{ name: 'Robert Fuller', role: 'Practice Manager', org: 'Northamptonshire Children\'s Trust' }],
    description: 'VR scenarios help foster carers understand trauma impacts on children in care, building empathy through immersive experience.',
    time: '13:30',
    endTime: '14:15',
    room: 'room2',
    track: 'health',
  },
  {
    id: 'health-ai-therapy',
    title: 'Generative-AI Self-Assessment Tool for Therapy Services',
    speakers: [
      { name: 'Pedro Santos', role: 'Staff', org: 'North Northamptonshire Council' },
      { name: 'Henry Stratford', role: 'Staff', org: 'Beam' },
    ],
    description: 'Nora and Amy — AI-powered assessment tools that replicate therapist conversations to identify functional challenges and meaningful outcomes.',
    time: '14:30',
    endTime: '15:15',
    room: 'room2',
    track: 'health',
  },

  // Room 3 - EdTech
  {
    id: 'edu-immersive',
    title: 'The Power of Collaborative Immersive Spaces',
    speakers: [
      { name: 'Mike Smith', role: 'Staff', org: 'Northampton College' },
      { name: 'Nick Budden', role: 'Staff', org: 'Northampton College' },
    ],
    description: 'How immersive rooms enable collaborative problem-solving, skills development, and inclusive learning design across physical boundaries.',
    time: '11:00',
    endTime: '11:45',
    room: 'room3',
    track: 'education',
  },
  {
    id: 'edu-dark-arts',
    title: 'Unlocking the Dark Arts of AI in Education',
    speakers: [{ name: 'Ray Meadham', role: 'Curriculum Leader', org: 'Northampton International Academy' }],
    description: 'Practical, classroom-ready strategies for prompt structure, curriculum design, AI-powered assessment, and ethical guardrails.',
    time: '12:00',
    endTime: '12:45',
    room: 'room3',
    track: 'education',
  },
  {
    id: 'edu-scaling',
    title: 'From Vision to Practice: Scaling Active Digital Education',
    speakers: [
      { name: 'Rob Howe', role: 'Staff', org: 'University of Northampton' },
      { name: 'Dr Helen Caldwell', role: 'Staff', org: 'University of Northampton' },
      { name: 'Dr Emma Whewell', role: 'Staff', org: 'University of Northampton' },
    ],
    description: 'Case studies from "Digital Horizons" and "Study Smart 3" demonstrating research-informed principles embedded across curriculum and learning environments.',
    time: '13:30',
    endTime: '14:15',
    room: 'room3',
    track: 'education',
  },
  {
    id: 'edu-nocode',
    title: 'No-Code, High Impact: Creating Interactive Learning Experiences',
    speakers: [{ name: 'Jacqui Hughes', role: 'Head of Digital Innovation', org: 'Moulton College' }],
    description: 'Interactive session with live demonstrations using no-code and AI-supported tools to create engaging learning experiences.',
    time: '14:30',
    endTime: '15:15',
    room: 'room3',
    track: 'education',
  },

  // Room 4 - NN1 Dev Club
  {
    id: 'dev-ai-sprint',
    title: 'From Task to Invention: Hands-on AI Sprint',
    speakers: [{ name: 'Eric Bye', role: 'Founder', org: 'Erictron AI' }],
    description: 'A structured exercise that pushes from task all the way to invention — identifying hidden value in AI applications.',
    time: '11:00',
    endTime: '11:45',
    room: 'room4',
    track: 'dev',
  },
  {
    id: 'dev-bins',
    title: 'What a Load of Crap: Tech Behind Bin Collection',
    speakers: [{ name: 'Kevin White', role: 'Software Engineering Manager', org: 'West Northamptonshire Council' }],
    description: 'The surprisingly complex infrastructure behind waste management — featuring AWS services, chatbots, and automations.',
    time: '12:00',
    endTime: '12:45',
    room: 'room4',
    track: 'dev',
  },
  {
    id: 'dev-fullstack',
    title: 'AI Full Stack Speedrun',
    speakers: [{ name: 'Roger Hughes', role: 'Staff', org: 'Sign In Solutions' }],
    description: 'Building a progressive web app rapidly using free-tier AI, backend, and frontend tools.',
    time: '13:30',
    endTime: '14:15',
    room: 'room4',
    track: 'dev',
  },
  {
    id: 'dev-pm',
    title: 'Product Management: A Jargon-Free Guide',
    speakers: [{ name: 'Kiran Patel', role: 'Product Manager', org: '' }],
    description: 'Interactive session removing jargon to show how anyone, in any role, can use basic product management habits to get better results.',
    time: '14:30',
    endTime: '15:15',
    room: 'room4',
    track: 'dev',
  },

  // Room 5 - Digital Marketing
  {
    id: 'mkt-rugby',
    title: 'From Socials to Scrums: Marketing the Women\'s Rugby World Cup',
    speakers: [{ name: 'Holly Skelton', role: 'Communications and Engagement Business Partner', org: 'West Northamptonshire Council' }],
    description: 'How digital marketing drove 48,800+ match attendees, record town-centre footfall, 2.27 million digital views and contributed to a projected \u00A347.6 million for the local economy.',
    time: '11:00',
    endTime: '11:45',
    room: 'room5',
    track: 'marketing',
  },
  {
    id: 'mkt-seo',
    title: 'SEO, Innit? Why Fundamentals Beat Jargon',
    speakers: [{ name: 'Nikki Pilkington', role: 'SEO Consultant', org: '' }],
    description: 'Cut through the noise on trending acronyms and focus on foundational SEO principles that drive actual business inquiries. 30+ years of experience distilled.',
    time: '12:00',
    endTime: '12:45',
    room: 'room5',
    track: 'marketing',
  },
]

export function getTalkById(id: string): Talk | undefined {
  return talks.find(t => t.id === id)
}

export function getTalksByTrack(track: Track): Talk[] {
  return talks.filter(t => t.track === track).sort((a, b) => a.time.localeCompare(b.time))
}

export function getTalksByTime(time: string): Talk[] {
  return talks.filter(t => t.time === time)
}

export function getAllTracks(): Track[] {
  return ['main', 'local', 'health', 'education', 'dev', 'marketing']
}
