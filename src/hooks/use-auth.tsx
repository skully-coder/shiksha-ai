
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, isFirebaseConfigured, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface UserProfile {
    uid: string;
    name: string;
    email: string;
    role: 'teacher' | 'student';
    class?: string;
    section?: string;
    rollNumber?: string;
    classroomId?: string;
}

export interface Classroom {
  id: string;
  grade: string;
  section: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  classrooms: Classroom[];
  loading: boolean;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function MissingConfigMessage() {
    return (
         <div className="flex h-screen items-center justify-center bg-background p-4">
          <div className="w-full max-w-md rounded-lg border bg-card p-8 text-center shadow-lg">
            <h1 className="text-2xl font-bold text-destructive">Service Unavailable</h1>
            <p className="mt-4 text-muted-foreground">
              The application is currently under maintenance. Please try again later.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              If this issue persists, please contact support.
            </p>
          </div>
        </div>
    );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth && db) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setUser(user);
        if (user && db) {
          // Fetch profile
          let userProfile: UserProfile | null = null;
          try {
            // Try fetching from 'teachers' collection first
            let docRef = doc(db, 'teachers', user.uid);
            let docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                userProfile = docSnap.data() as UserProfile;
            } else {
                // If not found, try 'students' collection
                docRef = doc(db, 'students', user.uid);
                docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    userProfile = docSnap.data() as UserProfile;
                }
            }
          } catch(e) {
            console.error("Failed to fetch user profile", e)
          }
          setProfile(userProfile);
          
          if (userProfile?.role === 'teacher' && db) {
            setClassrooms([]);
            try {
              const database = db; // Create a non-null reference for TypeScript
              const teacherRef = doc(database, 'teachers', user.uid);
              const teacherSnap = await getDoc(teacherRef);
              if (teacherSnap.exists()) {
                const teacherData = teacherSnap.data();
                if (teacherData.classroomIds && teacherData.classroomIds.length > 0) {
                  const classroomPromises = teacherData.classroomIds.map((id: string) => getDoc(doc(database, 'classrooms', id)));
                  const classroomDocs = await Promise.all(classroomPromises);
                  const classroomsData = classroomDocs
                    .filter(d => d.exists())
                    .map(d => ({ id: d.id, ...d.data() } as Classroom));
                  setClassrooms(classroomsData);
                }
              }
            } catch (error) {
              console.error("Error fetching classrooms:", error);
            }
          }
        } else {
          setProfile(null);
          setClassrooms([]);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  if (!isFirebaseConfigured) {
    return <MissingConfigMessage />;
  }

  const authContextValue = useMemo(() => ({
    user,
    profile,
    loading,
    classrooms,
    setProfile
  }), [user, profile, loading, classrooms, setProfile]);

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
