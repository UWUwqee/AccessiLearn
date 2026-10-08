import React, { createContext, useContext, useEffect, useState } from 'react';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { ClassroomGrade, CourseActivity, LearnerProfile, Role } from '../types';
import { initializeFirestoreDefaults } from '../services/dbInit';

const GOOGLE_TOKEN_KEY = 'accessilearn_google_token';
const ONLINE_STATUS_PERSISTENCE_SECONDS = 30;

const ADMIN_EMAIL = 'ftluzano@paterostechnologicalcollege.edu.ph';

interface AuthContextType {
  user: User | null;
  learnerProfile: LearnerProfile | null;
  classroomActivities: CourseActivity[];
  classroomGrades: ClassroomGrade[];
  isClassroomSyncing: boolean;
  classroomLastSync: string | null;
  isLoading: boolean;
  authError: string | null;
  isAdmin: boolean;
  loginWithGoogle: () => Promise<void>;
  syncGoogleClassroom: () => Promise<void>;
  updateLearnerProfile: (data: Partial<LearnerProfile>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getStoredGoogleToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(GOOGLE_TOKEN_KEY);
};

const setStoredGoogleToken = (token: string | null) => {
  if (typeof window === 'undefined') return;
  if (token) sessionStorage.setItem(GOOGLE_TOKEN_KEY, token);
  else sessionStorage.removeItem(GOOGLE_TOKEN_KEY);
};

const buildApiUrl = (path: string) => {
  const configuredBase = import.meta.env.VITE_API_BASE;

  if (configuredBase) {
    return `${configuredBase.replace(/\/$/, '')}${path}`;
  }

  if (typeof window !== 'undefined') {
    return new URL(path, window.location.origin).toString();
  }

  return path;
};

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
    alternateLink: task.alternateLink,
  }));

const normalizeClassroomGrades = (grades: any[]): ClassroomGrade[] =>
  grades.map((grade, index) => ({
    id: grade.id || `classroom-grade-${index}`,
    course: grade.course || 'Google Classroom',
    title: grade.title || 'Untitled activity',
    due_date: grade.due_date || 'No due date',
    max_points: typeof grade.max_points === 'number' ? grade.max_points : null,
    state: grade.state || 'NEW',
    assigned_grade: typeof grade.assigned_grade === 'number' ? grade.assigned_grade : undefined,
    alternateLink: grade.alternateLink,
  }));

const getRoleForEmail = (email?: string | null): Role => email === ADMIN_EMAIL ? 'admin' : 'learner';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [learnerProfile, setLearnerProfile] = useState<LearnerProfile | null>(null);
  const [classroomActivities, setClassroomActivities] = useState<CourseActivity[]>([]);
  const [classroomGrades, setClassroomGrades] = useState<ClassroomGrade[]>([]);
  const [isClassroomSyncing, setIsClassroomSyncing] = useState(false);
  const [classroomLastSync, setClassroomLastSync] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const setPresence = async (currentUser: User | null, isOnline: boolean) => {
      if (!currentUser || !currentUser.email) return;
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, {
        isOnline,
        lastSeenAt: new Date().toISOString(),
      }, { merge: true });
    };

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setAuthError(null);
        try {
          await initializeFirestoreDefaults();

          const role = getRoleForEmail(currentUser.email);
          const userRef = doc(db, 'users', currentUser.uid);
          const authProfile: LearnerProfile = {
            id: currentUser.uid,
            learner_name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Learner',
            email: currentUser.email || '',
            educational_need: 'General / Control Group',
            assistive_tech: [],
            grade_level: '',
            profile_setup_completed: false,
            experience_level: 'Intermediate',
            isResearcher: role === 'researcher' || role === 'admin',
            role,
            createdAt: new Date().toISOString(),
          };

          await setDoc(userRef, {
            id: currentUser.uid,
            learner_name: authProfile.learner_name,
            email: authProfile.email,
            role,
            isOnline: true,
            lastSeenAt: new Date().toISOString(),
            createdAt: authProfile.createdAt,
          }, { merge: true });

          const ref = doc(db, 'learners', currentUser.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data() as LearnerProfile;
            setLearnerProfile({ ...data, ...authProfile, id: currentUser.uid, profile_setup_completed: data.profile_setup_completed ?? false });
          } else {
            await setDoc(ref, authProfile);
            setLearnerProfile(authProfile);
          }
        } catch (error: any) {
          console.error('Firestore learner profile error:', error);
          setLearnerProfile({
            id: currentUser.uid,
            learner_name: currentUser.displayName || 'Learner',
            email: currentUser.email || '',
            educational_need: 'General / Control Group',
            assistive_tech: [],
            grade_level: '',
            profile_setup_completed: false,
            experience_level: 'Intermediate',
            isResearcher: currentUser.email === ADMIN_EMAIL,
            role: getRoleForEmail(currentUser.email),
          });
        }

        const visibilityHandler = () => setPresence(currentUser, !document.hidden);
        const unloadHandler = () => setPresence(currentUser, false);
        document.addEventListener('visibilitychange', visibilityHandler);
        window.addEventListener('beforeunload', unloadHandler);
        await setPresence(currentUser, true);

        const onlineInterval = window.setInterval(() => {
          setPresence(currentUser, !document.hidden);
        }, ONLINE_STATUS_PERSISTENCE_SECONDS * 1000);

        return () => {
          window.clearInterval(onlineInterval);
          document.removeEventListener('visibilitychange', visibilityHandler);
          window.removeEventListener('beforeunload', unloadHandler);
          setPresence(currentUser, false);
        };
      } else {
        setLearnerProfile(null);
        setClassroomActivities([]);
        setClassroomGrades([]);
        setClassroomLastSync(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const syncGoogleClassroom = async () => {
    const activeEmail = user?.email || auth.currentUser?.email;
    const token = getStoredGoogleToken();

    if (!activeEmail || !token) {
      setAuthError('Please sign in with a Google account before syncing classroom activity.');
      return;
    }

    try {
      setIsClassroomSyncing(true);
      setAuthError(null);

      const classroomResponse = await fetch(buildApiUrl('/api/google/classroom'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const classroomData = await classroomResponse.json();

      if (!classroomResponse.ok) {
        throw new Error(classroomData.error || 'Unable to load Google Classroom activity.');
      }

      setClassroomActivities(normalizeClassroomTasks(classroomData.tasks || []));
      setClassroomGrades(normalizeClassroomGrades(classroomData.grades || []));
      setAuthError(classroomData.gradeError || null);
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
      provider.addScope('https://www.googleapis.com/auth/classroom.student-submissions.me.readonly');
      provider.addScope('https://www.googleapis.com/auth/classroom.coursework.students.readonly');
      provider.addScope('https://www.googleapis.com/auth/classroom.rosters.readonly');
      provider.addScope('https://www.googleapis.com/auth/userinfo.email');
      provider.addScope('openid');

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;

      if (!token) {
        throw new Error('Google sign-in did not return an access token for Classroom sync.');
      }

      setStoredGoogleToken(token);

      if (auth.currentUser?.email) {
        await syncGoogleClassroom();
      }
    } catch (error: any) {
      const msg = error?.message || 'Google authentication failed';
      setAuthError(msg);
      handleFirestoreError(error, OperationType.GET, 'auth/google-login');
    }
  };

  const updateLearnerProfile = async (data: Partial<LearnerProfile>) => {
    if (!user || !learnerProfile) return;
    const updated = { ...learnerProfile, ...data };
    try {
      const ref = doc(db, 'learners', user.uid);
      await setDoc(ref, updated, { merge: true });
      setLearnerProfile(updated);
    } catch (e) {
      console.error('Error updating profile in Firestore:', e);
      throw e;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setStoredGoogleToken(null);
      setUser(null);
      setLearnerProfile(null);
      setClassroomActivities([]);
      setClassroomGrades([]);
      setClassroomLastSync(null);
      if (auth.currentUser?.uid) {
        await setDoc(doc(db, 'users', auth.currentUser.uid), { isOnline: false, lastSeenAt: new Date().toISOString() }, { merge: true });
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isAdmin = Boolean(user && learnerProfile?.role === 'admin');

  return (
    <AuthContext.Provider
      value={{
        user,
        learnerProfile,
        classroomActivities,
        classroomGrades,
        isClassroomSyncing,
        classroomLastSync,
        isLoading,
        authError,
        isAdmin,
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
