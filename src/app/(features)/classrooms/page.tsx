
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, collection, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/loading-spinner';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, CheckCircle, ArrowRight } from 'lucide-react';
import FeaturePageSkeleton from "@/components/skeletons/FeaturePageSkeleton";

interface Classroom {
  id: string;
  grade: string;
  section: string;
  teacherIds?: string[];
  studentIds?: string[];
}

export default function ClassroomsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [joinedClassrooms, setJoinedClassrooms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading || !db) {
      return;
    }

    let isMounted = true;
    setLoading(true);

    const fetchClassrooms = async () => {
      const fdb = db!;
      try {
        // Teacher: list all classrooms; also load joined IDs for button state
        if (profile?.role === 'teacher' && user) {
          const allSnap = await getDocs(collection(fdb,'schools', profile.school!, 'classrooms'));
          if (isMounted) {
            const rooms = allSnap.docs.map(d => ({ id: d.id, ...d.data() } as Classroom));
            setClassrooms(rooms);
          }

          const teacherSnap = await getDoc(doc(fdb, 'teachers', user.uid));
          if (teacherSnap.exists()) {
            const teacherData = teacherSnap.data() as { classroomIds?: string[] };
            const ids = teacherData.classroomIds || [];
            if (isMounted) setJoinedClassrooms(ids);
          } else if (isMounted) {
            setJoinedClassrooms([]);
          }
          // Student: load their single classroom if present
        } else if (profile?.role === 'student') {
          if ((profile as any).classroomId) {
            const c = await getDoc(doc(fdb, 'schools', profile.school!, 'classrooms', (profile as any).classroomId));
            if (isMounted) setClassrooms(c.exists() ? [{ id: c.id, ...c.data() } as Classroom] : []);
          } else if (isMounted) {
            setClassrooms([]);
          }
        } else if (isMounted) {
          // Unknown role or not signed in
          setClassrooms([]);
        }
      } catch (error: any) {
        console.error('Error fetching classrooms:', error);
        let description = 'Could not load classrooms.';
        if (error.code === 'permission-denied') {
          description = "You don't have permission to view classrooms. Please check your Firestore security rules.";
        } else if (error.code === 'failed-precondition') {
          description = `A Firestore index is required for this query. Please create it in your Firebase console. The error was: "${error.message}"`;
        }
        if (isMounted) {
          toast({ variant: 'destructive', title: 'Error Loading Classrooms', description, duration: 9000 });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchClassrooms();

    return () => { isMounted = false; };
  }, [authLoading, profile, user, toast, db]);

  const handleJoinLeave = async (classroomId: string, isJoined: boolean) => {
    if (!user || !db || profile?.role !== 'teacher') return;

    const classroomRef = doc(db, 'schools', profile.school!, 'classrooms', classroomId);
    const teacherRef = doc(db, 'teachers', user.uid);

    try {
      if (isJoined) {
        await updateDoc(classroomRef, { teacherIds: arrayRemove(user.uid) });
        await updateDoc(teacherRef, { classroomIds: arrayRemove(classroomId) });
        setJoinedClassrooms(prev => prev.filter(id => id !== classroomId));
        toast({ title: 'Success', description: 'You have left the classroom.' });
      } else {
        await updateDoc(classroomRef, { teacherIds: arrayUnion(user.uid) });
        await updateDoc(teacherRef, { classroomIds: arrayUnion(classroomId) });
        setJoinedClassrooms(prev => [...prev, classroomId]);
        toast({ title: 'Success', description: 'You have joined the classroom.' });
      }
    } catch (error: any) {
      console.error('Error joining/leaving classroom:', error);
      let description = 'An error occurred. Please try again.';
      if (error.code === 'permission-denied') {
        description = "You don't have permission to join or leave a classroom. Please check your Firestore security rules to allow teachers to update their own profile and the classroom's 'teacherIds'.";
      }
      toast({ variant: 'destructive', title: 'Update Error', description, duration: 9000 });
    }
  };

  if (authLoading || loading) {
    return <FeaturePageSkeleton cardCount={6} />;
}

  if (profile?.role === 'student') {
    const studentClassroom = classrooms.find(c => c.id === profile.classroomId);
    return (
      <div className="flex flex-col h-full">
        <header className="flex items-center justify-between p-4 border-b md:hidden">
          <h1 className="font-headline text-xl font-bold text-primary">Your Classroom</h1>
          <SidebarTrigger />
        </header>
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Your Classroom</CardTitle>
              <CardDescription>View messages and updates from your teachers.</CardDescription>
            </CardHeader>
            <CardContent>
              {studentClassroom ? (
                <Link href={`/classrooms/${studentClassroom.id}`} passHref className="block w-full">
                  <Card className="transition-colors cursor-pointer hover:bg-accent">
                    <CardHeader className="p-8">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Grade {studentClassroom.grade} - Section {studentClassroom.section}</CardTitle>
                          <CardDescription className="mt-1">Click to enter</CardDescription>
                        </div>
                        <ArrowRight className="w-6 h-6 text-muted-foreground"/>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ) : (
                <p className="text-muted-foreground">You are not currently assigned to a classroom.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b md:hidden">
        <h1 className="font-headline text-xl font-bold text-primary">Manage Classrooms</h1>
        <SidebarTrigger />
      </header>
      <div className="flex-1 p-4 md:p-8 overflow-auto">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Manage Classrooms</CardTitle>
            <CardDescription>Join classrooms to interact with students and post updates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {classrooms.length > 0 ? classrooms.map(classroom => {
              const isJoined = joinedClassrooms.includes(classroom.id);
              return (
                <div key={classroom.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-bold">Grade {classroom.grade} - Section {classroom.section}</h3>
                    {isJoined && <Link href={`/classrooms/${classroom.id}`} className="text-sm text-primary hover:underline">View Classroom</Link>}
                  </div>
                  <Button
                    variant={isJoined ? 'outline' : 'default'}
                    onClick={() => handleJoinLeave(classroom.id, isJoined)}
                  >
                    {isJoined ? <CheckCircle className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                    {isJoined ? 'Joined' : 'Join'}
                  </Button>
                </div>
              );
            }) : (
              <p className="text-center text-muted-foreground">No classrooms have been created yet. Generate students in the admin panel to create classrooms.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
