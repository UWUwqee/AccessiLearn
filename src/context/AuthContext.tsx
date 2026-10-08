import React, { createContext, useContext, useEffect, useState } from 'react';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { EducationalNeed, LearnerProfile } from '../types';
import { initializeFirestoreDefaults } from '../services/dbInit';

interface AuthContextType {
  user: User | null;
  learnerProfile: LearnerProfile | null;
  isLoading: boolean;
  authError: string | null;
  loginWithGoogle: () => Promise<void>;
  updateLearnerProfile: (data: Partial<LearnerProfile>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [learnerProfile, setLearnerProfile] = useState<LearnerProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setAuthError(null);
        try {
          // Initialize defaults into Firestore if empty
          await initializeFirestoreDefaults();

          const ref = doc(db, 'learners', currentUser.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data() as LearnerProfile;
            setLearnerProfile({ ...data, id: currentUser.uid });
          } else {
            // First time login - initialize learner profile in Firestore
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
          // Set a basic learner profile from auth user
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
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      setAuthError(null);
      const provider = new GoogleAuthProvider();
      // Allow any Google account: both institutional Workspace (@*.edu.ph) and personal (@gmail.com)
      provider.setCustomParameters({
        prompt: 'select_account',
      });
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
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        learnerProfile,
        isLoading,
        authError,
        loginWithGoogle,
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
