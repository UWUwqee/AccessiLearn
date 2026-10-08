import { collection, doc, getDoc, getDocs, limit, query, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { LMS_A11Y_FEATURES, SAMPLE_ANNOUNCEMENTS } from '../data/initialData';

// Initialize default collections into Firestore if they are empty
export async function initializeFirestoreDefaults() {
  try {
    // 1. Check & seed lms_features
    const featuresSnap = await getDocs(query(collection(db, 'lms_features'), limit(1)));
    if (featuresSnap.empty) {
      for (const feat of LMS_A11Y_FEATURES) {
        await setDoc(doc(db, 'lms_features', feat.feature_id), feat);
      }
    }

    // 2. Check & seed announcements
    const annSnap = await getDocs(query(collection(db, 'announcements'), limit(1)));
    if (annSnap.empty) {
      for (const ann of SAMPLE_ANNOUNCEMENTS) {
        await setDoc(doc(db, 'announcements', ann.id), ann);
      }
    }
  } catch (error) {
    console.warn('Firestore initial seeding check:', error);
  }
}
