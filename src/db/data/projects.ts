import { test__flagTitles, test__tagTitles } from ".";

export const projectData = (ID: string) => [
  {
    id: `prjkt-001-${ID}`,
    title: "Chatbot Assistant",
    description:
      "An AI-powered chatbot to provide helpful information to users",
    supervisorId: 0,
    tags: [test__tagTitles[0], test__tagTitles[7], test__tagTitles[16]],
    flags: [test__flagTitles[0]],
  },
  {
    id: `prjkt-002-${ID}`,
    title: "Mobile Calendar App",
    description:
      "A calendar app for managing events and reminders on mobile devices",
    supervisorId: 0,
    tags: [test__tagTitles[1], test__tagTitles[11]],
    flags: [test__flagTitles[0], test__flagTitles[2]],
  },
  {
    id: `prjkt-003-${ID}`,
    title: "Social Media Dashboard",
    description:
      "An analytics dashboard to track key social media metrics and engagement",
    supervisorId: 0,
    tags: [test__tagTitles[3], test__tagTitles[9], test__tagTitles[10]],
    flags: [test__flagTitles[0], test__flagTitles[1]],
  },
  {
    id: `prjkt-004-${ID}`,
    title: "Location-Based Travel App",
    description:
      "An app to recommend attractions, restaurants, and accommodations based on the user's location",
    supervisorId: 0,
    tags: [test__tagTitles[3], test__tagTitles[11], test__tagTitles[14]],
    flags: [test__flagTitles[0], test__flagTitles[2]],
  },
  {
    id: `prjkt-005-${ID}`,
    title: "Customizable CMS",
    description:
      "A content management system that allows easy customization and extensibility",
    supervisorId: 1,
    tags: [test__tagTitles[5], test__tagTitles[10], test__tagTitles[13]],
    flags: [test__flagTitles[0], test__flagTitles[1]],
  },
  {
    id: `prjkt-006-${ID}`,
    title: "Productivity Chrome Extension",
    description:
      "A browser extension to track time spent on websites and manage tabs",
    supervisorId: 1,
    tags: [test__tagTitles[3], test__tagTitles[10]],
    flags: [test__flagTitles[0]],
  },
  {
    id: `prjkt-007-${ID}`,
    title: "Weather Forecast App",
    description:
      "Real-time weather forecasts and predictive weather alerts for any location",
    supervisorId: 1,
    tags: [test__tagTitles[0], test__tagTitles[9]],
    flags: [test__flagTitles[0], test__flagTitles[1], test__flagTitles[2]],
  },
  {
    id: `prjkt-008-${ID}`,
    title: "Personal Finance Tracker",
    description:
      "A web application for tracking personal expenses, incomes, and investments.",
    supervisorId: 1,
    tags: [test__tagTitles[3], test__tagTitles[10], test__tagTitles[13]],
    flags: [test__flagTitles[0], test__flagTitles[1]],
  },
  {
    id: `prjkt-009-${ID}`,
    title: "Virtual Workout Coach",
    description:
      "An interactive app providing personalised workout plans and real-time guidance.",
    supervisorId: 2,
    tags: [test__tagTitles[0], test__tagTitles[11]],
    flags: [test__flagTitles[0]],
  },
  {
    id: `prjkt-010-${ID}`,
    title: "Online Recipe Organiser",
    description:
      "A platform for users to discover, save, and share their favourite recipes.",
    supervisorId: 2,
    tags: [test__tagTitles[4], test__tagTitles[10]],
    flags: [test__flagTitles[0], test__flagTitles[1], test__flagTitles[2]],
  },
  {
    id: `prjkt-011-${ID}`,
    title: "Remote Team Collaboration Tool",
    description:
      "A suite of online tools designed to enhance productivity and communication for remote teams.",
    specialTechnicalRequirements:
      "Experience with WebRTC or similar real-time communication protocols",
    supervisorId: 2,
    tags: [test__tagTitles[3], test__tagTitles[15], test__tagTitles[14]],
    flags: [test__flagTitles[0], test__flagTitles[1]],
  },
  {
    id: `prjkt-012-${ID}`,
    title: "E-Learning Platform",
    description:
      "An educational platform offering courses and resources for various subjects.",
    specialTechnicalRequirements:
      "Familiarity with Learning Management Systems (LMS) and SCORM standards",
    supervisorId: 2,
    tags: [test__tagTitles[0], test__tagTitles[10], test__tagTitles[14]],
    flags: [test__flagTitles[0]],
  },
  {
    id: `prjkt-013-${ID}`,
    title: "Event Planning Portal",
    description:
      "A comprehensive tool for organising, managing, and promoting events.",
    specialTechnicalRequirements:
      "Knowledge of event management software and APIs",
    supervisorId: 3,
    tags: [test__tagTitles[3], test__tagTitles[10], test__tagTitles[13]],
    flags: [test__flagTitles[0], test__flagTitles[2]],
  },
  {
    id: `prjkt-014-${ID}`,
    title: "Digital Art Portfolio",
    description:
      "An online portfolio platform for digital artists to showcase their work.",
    specialTechnicalRequirements:
      "Proficiency in graphic design software and image optimization techniques",
    supervisorId: 3,
    tags: [test__tagTitles[3], test__tagTitles[6], test__tagTitles[10]],
    flags: [test__flagTitles[0], test__flagTitles[1]],
  },
  {
    id: `prjkt-015-${ID}`,
    title: "Virtual Reality Estate Tours",
    description:
      "A VR platform offering virtual tours of real estate properties.",
    specialTechnicalRequirements:
      "Experience with Unity or Unreal Engine for VR development",
    supervisorId: 3,
    tags: [test__tagTitles[2], test__tagTitles[18], test__tagTitles[17]],
    flags: [test__flagTitles[0]],
  },
  {
    id: `prjkt-016-${ID}`,
    title: "Task Automation System",
    description:
      "A system to automate repetitive tasks using custom scripts and integrations.",
    specialTechnicalRequirements:
      "Strong scripting skills (Python, Bash, etc.) and understanding of automation tools",
    supervisorId: 3,
    tags: [test__tagTitles[0], test__tagTitles[15]],
    flags: [test__flagTitles[1]],
  },
  {
    id: `prjkt-017-${ID}`,
    title: "Pet Adoption Platform",
    description:
      "An online service connecting potential pet owners with animals in need of a home.",
    specialTechnicalRequirements:
      "Experience with building user-friendly web applications and database management",
    supervisorId: 4,
    tags: [test__tagTitles[4], test__tagTitles[10], test__tagTitles[13]],
    flags: [test__flagTitles[0]],
  },
  {
    id: `prjkt-018-${ID}`,
    title: "Freelancer Marketplace",
    description:
      "A marketplace for freelancers to offer their services and for clients to find them.",
    specialTechnicalRequirements:
      "Knowledge of payment gateways and escrow systems integration",
    supervisorId: 4,
    tags: [test__tagTitles[5], test__tagTitles[10], test__tagTitles[12]],
    flags: [test__flagTitles[0], test__flagTitles[2]],
  },
  {
    id: `prjkt-019-${ID}`,
    title: "Secure File Transfer Service",
    description:
      "A platform for securely sending and receiving large files over the internet.",
    specialTechnicalRequirements:
      "Understanding of encryption algorithms and secure file transfer protocols",
    supervisorId: 4,
    tags: [test__tagTitles[1], test__tagTitles[12]],
    flags: [test__flagTitles[0], test__flagTitles[1]],
  },
  {
    id: `prjkt-020-${ID}`,
    title: "Green Energy Monitoring System",
    description:
      "A tool for monitoring and managing energy consumption with a focus on sustainability.",
    specialTechnicalRequirements:
      "Familiarity with IoT devices and data visualization tools",
    supervisorId: 4,
    tags: [test__tagTitles[9], test__tagTitles[10]],
    flags: [test__flagTitles[0]],
  },
];
