import { CourseActivity, LMSFeatureItem } from '../types';

export const LMS_A11Y_FEATURES: LMSFeatureItem[] = [
  {
    feature_id: 'A1',
    feature_name: 'Adjustable Text Size & Contrast Controls',
    feature_description: 'Toggle/scale text (100% to 150%); high-contrast switch (Dark, Light, Yellow-on-Black); Dyslexia font option.',
    prototype_implementation: 'Persistent top accessibility toolbar with instant visual updates, custom high-contrast CSS overrides, and font scaling.',
    wcag_criterion: 'WCAG 2.2 SC 1.4.3 (Contrast Minimum), SC 1.4.4 (Resize Text), SC 1.4.12 (Text Spacing)',
    category: 'Accessibility Support',
    status: 'Active',
  },
  {
    feature_id: 'A2',
    feature_name: 'Screen Reader & Keyboard Navigation Support',
    feature_description: 'Semantic labels; tab-only navigation; no mouse required; visible focus indicators; built-in speech reader.',
    prototype_implementation: 'Full keyboard tab indexes, ARIA live region announcers, 3px high-visibility focus borders, and built-in Web Speech API voice synthesis.',
    wcag_criterion: 'WCAG 2.2 SC 2.1.1 (Keyboard), SC 2.4.7 (Focus Visible), SC 4.1.2 (Name, Role, Value)',
    category: 'Accessibility Support',
    status: 'Active',
  },
  {
    feature_id: 'A3',
    feature_name: 'Alternative Text for All Images',
    feature_description: 'Descriptive alt attributes hidden for regular view but present for assistive technology, plus a toggleable Alt-Text Inspector.',
    prototype_implementation: 'All graphics have rich descriptive alt attributes, plus an evaluator inspector mode displaying alt text directly on cards.',
    wcag_criterion: 'WCAG 2.2 SC 1.1.1 (Non-text Content)',
    category: 'Accessibility Support',
    status: 'Active',
  },
  {
    feature_id: 'A4',
    feature_name: 'Video Captions & Transcripts',
    feature_description: 'Toggle captions on/off; downloadable text version; interactive timestamped transcript jump.',
    prototype_implementation: 'Captions overlay synchronized to video playback, full transcript panel with search, audio controls, and one-click jump to timestamps.',
    wcag_criterion: 'WCAG 2.2 SC 1.2.2 (Captions Prerecorded), SC 1.2.3 (Audio Description or Media Alternative)',
    category: 'Accessibility Support',
    status: 'Active',
  },
  {
    feature_id: 'A5',
    feature_name: 'Clear, Consistent Navigation Structure',
    feature_description: 'Menus in fixed position; breadcrumbs; accessible "Skip to content" keyboard link.',
    prototype_implementation: 'Fixed topbar and sidebar navigation, dynamic breadcrumb tracking current module, and visible skip-to-content anchor on Tab press.',
    wcag_criterion: 'WCAG 2.2 SC 2.4.1 (Bypass Blocks), SC 2.4.8 (Location), SC 3.2.3 (Consistent Navigation)',
    category: 'Accessibility Support',
    status: 'Active',
  },
  {
    feature_id: 'A6',
    feature_name: 'Consistent Color & Readable Typography',
    feature_description: 'WCAG 2.2 compliant contrast ratios; status badges combine color, icon, and explicit text (no color-only cues).',
    prototype_implementation: 'High color-contrast ratios, multi-modal status tags with icons and text badges, generous line-height and spacing.',
    wcag_criterion: 'WCAG 2.2 SC 1.4.1 (Use of Color), SC 1.4.8 (Visual Presentation)',
    category: 'Accessibility Support',
    status: 'Active',
  },
  {
    feature_id: 'A7',
    feature_name: 'Organized, Uncluttered Content Layout',
    feature_description: 'Grouped materials; clear semantic headings (H1-H3); short bite-sized sections; optional reading ruler focus guide.',
    prototype_implementation: 'Clean chunked card sections, visual reading ruler overlay following focus, collapsible modules to reduce cognitive load.',
    wcag_criterion: 'WCAG 2.2 SC 1.3.1 (Info and Relationships), SC 2.4.10 (Section Headings)',
    category: 'Accessibility Support',
    status: 'Active',
  },
];

export const SAMPLE_ACTIVITIES: CourseActivity[] = [
  {
    id: 'act-101',
    title: 'Laboratory Activity 1: Evaluating Digital Barriers in Educational Software',
    module: 'Module 1: Principles of Universal Design for Learning (UDL)',
    instructions: `### Objective
Analyze an online educational interface and identify at least three accessibility barriers according to Republic Act No. 11650 and WCAG 2.2 criteria.

### Tasks to Complete:
1. Examine the navigation menu, multimedia elements, and color contrast.
2. Verify whether alternative text exists for all instructional diagrams.
3. Formulate two design recommendations that would assist learners with visual, auditory, or motor impairments.

### Submission Guidelines:
Submit your analysis in the response text box below or attach a document. Assistive voice notes or bullet-point responses are fully accepted.`,
    due_date: 'October 24, 2026 at 11:59 PM',
    points: 50,
    accessible_formats: ['Screen Reader Formatted Text', 'Audio Transcription Ready', 'Large Print View'],
  },
  {
    id: 'act-102',
    title: 'Assignment 2: Drafting Accessible Multi-Modal Content for SEN Students',
    module: 'Module 2: Assistive Technologies and Multi-Modal Learning',
    instructions: `### Objective
Design a short 3-slide lesson plan or outline that integrates closed captioning, descriptive image alt text, and keyboard navigation shortcuts.

### Requirements:
- Step 1: Write explicit descriptive text for an instructional image.
- Step 2: Provide a transcript snippet with timestamps.
- Step 3: Explain how a student utilizing a screen magnifier or single-switch device interacts with the content.`,
    due_date: 'November 05, 2026 at 11:59 PM',
    points: 100,
    accessible_formats: ['Rich Plain Text', 'Audio Summary Available'],
  },
];

export const SAMPLE_ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    title: 'Welcome to the AccessiLearn Prototype & Research Evaluation Session',
    author: 'Institute of Information and Computing Technology (IICT) - Pateros Technological College',
    date: 'August 09, 2026',
    content: 'Welcome, participants! This Learning Management System prototype was developed to evaluate digital accessibility (A1–A7) and user experience for learners with Special Educational Needs. Please explore the materials, test the accessibility controls, submit an activity response, and then complete the Post-Experience Survey.',
    priority: 'High',
  },
  {
    id: 'ann-2',
    title: 'Orientation on Accessibility Toolbar & Speech Reader',
    author: 'Research Team / Prof. Adviser',
    date: 'August 08, 2026',
    content: 'You can customize your experience at any time using the Accessibility Toolbar at the top. Test the High Contrast themes, Dyslexia Font, Reading Ruler guide, and built-in "Read Aloud" voice speaker.',
    priority: 'Normal',
  },
];

export const VIDEO_TRANSCRIPT_DATA = [
  { time: '0:00', text: 'Welcome to this introductory session on Web Accessibility and Universal Design for Learning.' },
  { time: '0:18', text: 'Republic Act 11650 mandates equitable access to quality education for learners with disabilities.' },
  { time: '0:35', text: 'In digital education, an accessible LMS ensures learners with visual, auditory, motor, and cognitive needs can fully participate.' },
  { time: '0:55', text: 'Notice how keyboard focus indicators and semantic headings allow non-mouse navigation without physical strain.' },
  { time: '1:15', text: 'Alternative text provides vital contextual information to learners relying on screen reader software.' },
  { time: '1:35', text: 'Thank you for testing AccessiLearn and helping create an inclusive educational environment!' },
];
