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

const formatClassroomDate = (value?: { year?: number; month?: number; day?: number } | null): string => {
  if (!value) return 'No due date';
  const { year, month, day } = value;
  if (!year || !month || !day) return 'No due date';
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const getCourseworkFromGoogleClassroom = async (accessToken: string): Promise<CourseActivity[]> => {
  const coursesRes = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!coursesRes.ok) {
    throw new Error('Unable to load Google Classroom courses.');
  }

  const coursesData = await coursesRes.json();
  const courses = Array.isArray(coursesData.courses) ? coursesData.courses : [];

  const tasks: CourseActivity[] = [];

  for (const course of courses.slice(0, 3)) {
    const courseworkRes = await fetch(`https://classroom.googleapis.com/v1/courses/${course.id}/courseWork?orderBy=dueDate%20desc&maxResults=3`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!courseworkRes.ok) continue;

    const courseworkData = await courseworkRes.json();
    const works = Array.isArray(courseworkData.courseWork) ? courseworkData.courseWork : [];

    works.forEach((work: any, index: number) => {
      tasks.push({
        id: `${course.id}-${work.id || index}`,
        title: work.title || 'Untitled assignment',
        module: course.name || 'Google Classroom',
        instructions: work.description || 'No description provided for this activity yet.',
        due_date: formatClassroomDate(work.dueDate || null),
        points: work.maxPoints ?? 100,
        accessible_formats: ['Readable text', 'Speech-friendly format', 'Accessible submission'],
      });
    });
  }

  return tasks;
};

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
    try {
      setIsClassroomSyncing(true);
      setAuthError(null);

      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
      provider.addScope('https://www.googleapis.com/auth/classroom.coursework.students.readonly');
      provider.addScope('https://www.googleapis.com/auth/classroom.rosters.readonly');
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      if (!accessToken) {
        throw new Error('Google account connected but no Classroom access token was returned.');
      }

      const data = await getCourseworkFromGoogleClassroom(accessToken);
      setClassroomActivities(data);
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
      provider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
      provider.addScope('https://www.googleapis.com/auth/classroom.coursework.students.readonly');
      provider.addScope('https://www.googleapis.com/auth/classroom.rosters.readonly');

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      if (!accessToken) {
        throw new Error('No Google Classroom access token was returned for this account.');
      }

      const data = await getCourseworkFromGoogleClassroom(accessToken);
      setClassroomActivities(data);
      setClassroomLastSync(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
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
