export type EducationalNeed = 
  | 'Visual Impairment'
  | 'Hearing Impairment'
  | 'Motor Impairment'
  | 'Cognitive / Dyslexia'
  | 'Low Vision / Color Blindness'
  | 'Multiple Needs'
  | 'General / Control Group';

export type AssistiveTech = 
  | 'Screen Reader (NVDA/JAWS/TalkBack)'
  | 'Screen Magnifier'
  | 'High Contrast Display'
  | 'Keyboard-Only Navigation'
  | 'Captions & Transcripts'
  | 'Voice Dictation'
  | 'Reading Ruler / Focus Aid';

export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface LearnerProfile {
  id: string;
  learner_name: string;
  email: string;
  educational_need: EducationalNeed;
  assistive_tech: AssistiveTech[];
  grade_level: string;
  profile_setup_completed?: boolean;
  experience_level: ExperienceLevel;
  createdAt?: string;
  isResearcher?: boolean;
}

export interface LMSFeatureItem {
  feature_id: 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6' | 'A7';
  feature_name: string;
  feature_description: string;
  prototype_implementation: string;
  wcag_criterion: string;
  category: 'Accessibility Support' | 'Functional Module';
  status: 'Active' | 'Tested' | 'Needs Improvement';
}

export interface AccessibilityAssessmentRecord {
  id?: string;
  learner_id: string;
  learner_name?: string;
  feature_id: string;
  feature_name: string;
  accessibility_rating: number; // 1-5
  helpful: boolean;
  difficult: boolean;
  accessibility_issue?: string;
  comments?: string;
  createdAt?: string;
}

export interface UserExperienceEvaluationRecord {
  id?: string;
  learner_id: string;
  learner_name: string;
  educational_need: EducationalNeed;
  ease_of_use: number; // 1-5
  clarity_understanding: number; // 1-5
  navigation: number; // 1-5
  convenience: number; // 1-5
  satisfaction: number; // 1-5
  overall_average: number;
  problems_encountered: string;
  suggestions: string;
  feature_checklist?: Record<string, { helpful: boolean; difficult: boolean; rating: number }>;
  createdAt?: string;
}

export interface FeedbackRecord {
  id?: string;
  learner_id: string;
  learner_name: string;
  educational_need?: EducationalNeed;
  feedback_text: string;
  suggestion: string;
  category: 'visual' | 'auditory' | 'cognitive' | 'navigation' | 'general';
  createdAt?: string;
}

export interface CourseActivity {
  id: string;
  title: string;
  module: string;
  instructions: string;
  due_date: string;
  points: number;
  accessible_formats: string[];
  alternateLink?: string;
}

export interface ClassroomGrade {
  id: string;
  course: string;
  title: string;
  due_date: string;
  max_points: number | null;
  state: string;
  assigned_grade?: number;
  alternateLink?: string;
}

export interface ActivitySubmission {
  id?: string;
  activity_id: string;
  activity_title: string;
  learner_id: string;
  learner_name: string;
  response_text: string;
  attachment_name?: string;
  status: 'submitted' | 'graded';
  score?: number;
  feedback?: string;
  submitted_at: string;
}

export interface DirectMessage {
  id?: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'learner' | 'instructor' | 'researcher';
  recipient_id: string;
  content: string;
  createdAt: string;
}

export interface AgileSprintRecommendation {
  id: string;
  priority: 'High' | 'Medium' | 'Low';
  dimension: string;
  issue: string;
  proposed_action: string;
  agile_phase: 'Plan' | 'Design' | 'Develop' | 'Test' | 'Deploy' | 'Review';
  status: 'Identified' | 'In Progress' | 'Implemented & Validated';
}
