'use client';
import { updateProfile, type User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth, useFirestore, useUser } from '@/firebase/provider';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';


/**
 * Sets the user's display name in their Firebase Auth profile and saves their
 * profile information to a 'users' collection in Firestore.
 *
 * @param user The Firebase User object, which must not be null.
 * @param displayName The desired display name for the user.
 * @returns {Promise<void>} A promise that resolves when both the profile update
 *   and Firestore write are complete.
 */
export async function updateUserProfile(user: User, displayName: string): Promise<void> {
  // Update the user's profile in Firebase Authentication.
  await updateProfile(user, { displayName });

  const firestore = useFirestore();
  // Create a document reference in the 'users' collection with the user's UID.
  const userDocRef = doc(firestore, 'users', user.uid);

  // Set the user's profile data in the Firestore document.
  // This operation is non-blocking.
  setDocumentNonBlocking(userDocRef, {
    uid: user.uid,
    email: user.email,
    displayName: displayName,
  }, { merge: true });
}

export { useUser };
