import React, { createContext, useContext, useEffect, useState } from 'react';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { CourseActivity, LearnerProfile } from '../types';
import { initializeFirestoreDefaults } from '../services/dbInit';

interface AuthContextType {
  user: User | null;
  learnerProfile: LearnerProfile | null;
  classroomActivities: CourseActivity[];
  isClassroomSyncing: boolean;
  classroomLastSync: string | null;
  isLoading: boolean;
  authError: string | null;
  loginWithGoogle: () => Promise<void>;
  syncGoogleClassroom: () => Promise<void>;
  updateLearnerProfile: (data: Partial<LearnerProfile>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

const formatClassroomDate = (value?: { year?: number; month?: number; day?: number } | null): string => {
  if (!value) return 'No due date';
  const { year, month, day } = value;
  if (!year || !month || !day) return 'No due date';
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const normalizeClassroomTasks = (tasks: any[]): CourseActivity[] =>
  tasks.map((task, index) => ({
    id: task.id || `classroom-${index}`,
    title: task.title || 'Untitled activity',
    module: task.module || 'Google Classroom',
    instructions: task.instructions || 'No description provided for this activity yet.',
    due_date: task.due_date || 'No due date',
    points: task.points ?? 100,
    accessible_formats: task.accessible_formats || ['Readable text', 'Speech-friendly format'],
  }));

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [learnerProfile, setLearnerProfile] = useState<LearnerProfile | null>(null);
  const [classroomActivities, setClassroomActivities] = useState<CourseActivity[]>([]);
  const [isClassroomSyncing, setIsClassroomSyncing] = useState(false);
  const [classroomLastSync, setClassroomLastSync] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setAuthError(null);
        try {
          await initializeFirestoreDefaults();

          const ref = doc(db, 'learners', currentUser.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data() as LearnerProfile;
            setLearnerProfile({ ...data, id: currentUser.uid });
          } else {
            const initialProfile: LearnerProfile = {
              id: currentUser.uid,
              learner_name: currentUser.displayName || 'Learner',
              email: currentUser.email || '',
              educational_need: 'Visual Impairment',
              assistive_tech: ['Screen Reader (NVDA/JAWS/TalkBack)', 'High Contrast Display'],
              grade_level: 'College / Senior High',
              experience_level: 'Intermediate',
              isResearcher: currentUser.email === 'kyledesillarico@gmail.com',
              createdAt: new Date().toISOString(),
            };
            await setDoc(ref, initialProfile);
            setLearnerProfile(initialProfile);
          }
        } catch (error: any) {
          console.error('Firestore learner profile error:', error);
          setLearnerProfile({
            id: currentUser.uid,
            learner_name: currentUser.displayName || 'Learner',
            email: currentUser.email || '',
            educational_need: 'General / Control Group',
            assistive_tech: [],
            grade_level: 'College Student',
            experience_level: 'Intermediate',
            isResearcher: currentUser.email === 'kyledesillarico@gmail.com',
          });
        }

      } else {
        setLearnerProfile(null);
        setClassroomActivities([]);
        setClassroomLastSync(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const syncGoogleClassroom = async () => {
    if (!user?.email) {
      setAuthError('Please sign in with a Google account before syncing classroom activity.');
      return;
    }

    try {
      setIsClassroomSyncing(true);
      setAuthError(null);

      const authUrlResponse = await fetch(`${API_BASE}/api/google/auth-url`);
      const authUrlData = await authUrlResponse.json();

      if (!authUrlResponse.ok || !authUrlData.url) {
        throw new Error(authUrlData.error || 'Failed to prepare Google Classroom authorization.');
      }

      const popup = window.open(authUrlData.url, 'googleClassroomAuth', 'width=500,height=700');
      if (!popup) {
        throw new Error('Pop-up blocked. Please allow pop-ups to connect Google Classroom.');
      }

      const result = await new Promise<{ email: string }>((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error('Google Classroom authorization timed out.')), 180000);

        const handleMessage = (event: MessageEvent) => {
          const payload = event.data;
          if (!payload || payload.type !== 'google-classroom-auth') return;

          window.clearTimeout(timeout);
          window.removeEventListener('message', handleMessage);
          if (payload.success) resolve({ email: payload.email });
          else reject(new Error('Google Classroom authorization was cancelled.'));
        };

        window.addEventListener('message', handleMessage);

        const checkPopup = window.setInterval(() => {
          if (popup.closed) {
            window.clearInterval(checkPopup);
            window.clearTimeout(timeout);
            window.removeEventListener('message', handleMessage);
            reject(new Error('Google Classroom authorization window was closed before completion.'));
          }
        }, 500);
      });

      if (!result.email) {
        throw new Error('No Google account email was returned from Classroom authorization.');
      }

      const classroomResponse = await fetch(`${API_BASE}/api/google/classroom?email=${encodeURIComponent(result.email)}`);
      const classroomData = await classroomResponse.json();

      if (!classroomResponse.ok) {
        throw new Error(classroomData.error || 'Unable to load Google Classroom activity.');
      }

      setClassroomActivities(normalizeClassroomTasks(classroomData.tasks || []));
      setClassroomLastSync(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
    } catch (error: any) {
      const msg = error?.message || 'Google Classroom sync failed.';
      setAuthError(msg);
      console.warn(msg);
    } finally {
      setIsClassroomSyncing(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setAuthError(null);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      const msg = error?.message || 'Google authentication failed';
      setAuthError(msg);
      handleFirestoreError(error, OperationType.GET, 'auth/google-login');
    }
  };

  const updateLearnerProfile = async (data: Partial<LearnerProfile>) => {
    if (!user || !learnerProfile) return;
    const updated = { ...learnerProfile, ...data };
    setLearnerProfile(updated);
    try {
      const ref = doc(db, 'learners', user.uid);
      await setDoc(ref, updated, { merge: true });
    } catch (e) {
      console.error('Error updating profile in Firestore:', e);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setLearnerProfile(null);
      setClassroomActivities([]);
      setClassroomLastSync(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        learnerProfile,
        classroomActivities,
        isClassroomSyncing,
        classroomLastSync,
        isLoading,
        authError,
        loginWithGoogle,
        syncGoogleClassroom,
        updateLearnerProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
