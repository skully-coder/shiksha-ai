
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs, writeBatch, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, firebaseConfig } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Users, UserPlus, ArrowLeft, Trash2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const studentGenerationSchema = z.object({
  grade: z.string().min(1, 'Grade is required.'),
  section: z.string().min(1, 'Section is required.'),
  count: z.coerce.number().min(1, 'Must generate at least 1 student.').max(100, 'Cannot generate more than 100 students at a time.'),
});

const teacherGenerationSchema = z.object({
  count: z.coerce.number().min(1, 'Must generate at least 1 teacher.').max(100, 'Cannot generate more than 100 teachers at a time.'),
});

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  useEffect(() => {
    if (!isDevMode) {
      router.replace('/login');
    }
  }, [isDevMode, router]);

  const studentForm = useForm<z.infer<typeof studentGenerationSchema>>({
    resolver: zodResolver(studentGenerationSchema),
    defaultValues: {
      grade: '5',
      section: 'A',
      count: 10,
    },
  });

  const teacherForm = useForm<z.infer<typeof teacherGenerationSchema>>({
    resolver: zodResolver(teacherGenerationSchema),
    defaultValues: {
      count: 5,
    },
  });

  const startOperation = (type: 'generation' | 'deletion') => {
    if (type === 'generation') setIsGenerating(true);
    if (type === 'deletion') setIsDeleting(true);
    setProgress(0);
    setLog([]);
  }

  const endGeneration = (createdCount: number, totalCount: number, userType: string) => {
    toast({
      title: 'Generation Complete',
      description: `Successfully created ${createdCount} out of ${totalCount} ${userType} accounts.`,
    });
    setIsGenerating(false);
  }

  const handleGenerationError = (error: any, index: number, email: string) => {
    console.error(`Failed to create user ${index}:`, error);
    setLog(prev => [...prev, `Error creating ${email}: ${error.message}`]);
    toast({
      variant: 'destructive',
      title: `Generation Failed at User ${index}`,
      description: `Error: ${error.message}. Check logs for details.`,
      duration: 9000
    });
    setIsGenerating(false);
  }

  async function onStudentSubmit(values: z.infer<typeof studentGenerationSchema>) {
    startOperation('generation');
    let createdCount = 0;
    const updateLog = (message: string) => setLog(prev => [...prev, message]);

    if (!db) {
      toast({
        variant: 'destructive',
        title: 'Service Unavailable',
        description: 'Service is currently unavailable. Please try again later.',
      });
      setIsGenerating(false);
      return;
    }

    try {
        const grade = values.grade;
        const section = values.section.toUpperCase();
        
        updateLog(`Querying for existing students in Grade ${grade} Section ${section}...`);
        const studentsQuery = query(collection(db, 'students'), where('class', '==', grade), where('section', '==', section));
        const querySnapshot = await getDocs(studentsQuery);

        let lastRollNumber = 0;
        querySnapshot.forEach((doc) => {
            const studentData = doc.data();
            if (studentData.rollNumber) {
                const currentRollNumber = parseInt(studentData.rollNumber, 10);
                if (!isNaN(currentRollNumber) && currentRollNumber > lastRollNumber) {
                    lastRollNumber = currentRollNumber;
                }
            }
        });

        updateLog(`Highest existing roll number is ${lastRollNumber}. Starting new students from ${lastRollNumber + 1}.`);

        for (let i = 0; i < values.count; i++) {
            const rollNumber = lastRollNumber + i + 1;
            const email = `student${grade}${section}_${rollNumber}@example.com`;
            const password = `student${grade}${section}_${rollNumber}`;
            const name = `Student ${rollNumber}`;
            
            try {
                updateLog(`[${i + 1}/${values.count}] Creating student: ${email}...`);
                
                const tempAppName = `student-creator-${Date.now()}-${rollNumber}`;
                const tempApp = initializeApp(firebaseConfig, tempAppName);
                const tempAuth = getAuth(tempApp);

                const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
                const user = userCredential.user;

                const classroomId = `${grade}-${section}`.toUpperCase();
                const studentData = {
                    uid: user.uid,
                    email,
                    name,
                    role: 'student',
                    class: grade,
                    section: section,
                    rollNumber: String(rollNumber),
                    dev_generated: true,
                    classroomId: classroomId,
                };
                
                const studentDocRef = doc(db, 'students', user.uid);
                await setDoc(studentDocRef, studentData);
                
                // Add student to classroom
                const classroomRef = doc(db, 'classrooms', classroomId);
                await setDoc(classroomRef, {
                    grade: grade,
                    section: section,
                    studentIds: arrayUnion(user.uid)
                }, { merge: true });

                await deleteApp(tempApp);
                
                updateLog(`- Successfully created ${email} and added to classroom ${classroomId}.`);
                createdCount++;
            } catch (error: any) {
                handleGenerationError(error, i + 1, email);
                return; // Stop generation on first error
            } finally {
                setProgress(((i + 1) / values.count) * 100);
            }
        }
        endGeneration(createdCount, values.count, 'student');
    } catch (error: any) {
        console.error("Failed to query for students:", error);
        let description = 'Could not query existing students. An unknown error occurred.';
         if (error.code === 'failed-precondition') {
            description = `A Firestore index is required. Please create it in your Firebase console. The error was: "${error.message}"`;
        } else if (error.code === 'permission-denied') {
            description = 'Permission denied. Please check your Firestore security rules to ensure you can query the "students" collection.';
        }
        toast({
            variant: 'destructive',
            title: 'Generation Failed',
            description,
            duration: 9000,
        });
        setIsGenerating(false);
    }
  }

  async function onTeacherSubmit(values: z.infer<typeof teacherGenerationSchema>) {
    startOperation('generation');
    let createdCount = 0;
    const updateLog = (message: string) => setLog(prev => [...prev, message]);

    if (!db) {
      toast({
        variant: 'destructive',
        title: 'Service Unavailable',
        description: 'Service is currently unavailable. Please try again later.',
      });
      setIsGenerating(false);
      return;
    }

    try {
      updateLog(`Querying for existing teachers...`);
      const teachersQuery = query(collection(db, 'teachers'));
      const querySnapshot = await getDocs(teachersQuery);

      let lastTeacherNumber = 0;
      querySnapshot.forEach((doc) => {
        const teacherData = doc.data();
        if (teacherData.name && typeof teacherData.name === 'string') {
          const nameParts = teacherData.name.split(' ');
          if (nameParts.length > 0) {
            const lastPart = nameParts[nameParts.length - 1];
            const currentNumber = parseInt(lastPart, 10);
            if (!isNaN(currentNumber) && currentNumber > lastTeacherNumber) {
              lastTeacherNumber = currentNumber;
            }
          }
        }
      });
      
      updateLog(`Highest existing teacher number is ${lastTeacherNumber}. Starting new teachers from ${lastTeacherNumber + 1}.`);
      
      let teacherNumber = lastTeacherNumber;
      while (createdCount < values.count) {
        teacherNumber++;
        const email = `teacher${teacherNumber}@example.com`;
        const password = `teacher${teacherNumber}`;
        const name = `Teacher ${teacherNumber}`;

        try {
          updateLog(`[${createdCount + 1}/${values.count}] Attempting to create teacher: ${email}...`);
          
          const tempAppName = `teacher-creator-${Date.now()}-${teacherNumber}`;
          const tempApp = initializeApp(firebaseConfig, tempAppName);
          const tempAuth = getAuth(tempApp);

          const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
          const user = userCredential.user;

          const teacherData = {
            uid: user.uid,
            email,
            name: name,
            role: 'teacher',
            dev_generated: true,
          };

          await setDoc(doc(db, 'teachers', user.uid), teacherData);
          await deleteApp(tempApp);
          
          updateLog(`- Successfully created ${email}.`);
          createdCount++;
        } catch (error: any) {
          if (error.code === 'auth/email-already-in-use') {
            updateLog(`- SKIPPED: ${email} already exists.`);
            continue; // Skip to the next number
          }
          // For any other error, stop the generation process.
          handleGenerationError(error, createdCount + 1, email);
          return;
        } finally {
          setProgress(((createdCount) / values.count) * 100);
        }
      }
      endGeneration(createdCount, values.count, 'teacher');
    } catch (error: any) {
        console.error("Failed to query for teachers:", error);
        let description = 'Could not query existing teachers. An unknown error occurred.';
         if (error.code === 'failed-precondition') {
            description = `A Firestore index is required. Please create it in your Firebase console. The error was: "${error.message}"`;
        } else if (error.code === 'permission-denied') {
            description = 'Permission denied. Please check your Firestore security rules to ensure you can query the "teachers" collection.';
        }
        toast({
            variant: 'destructive',
            title: 'Generation Failed',
            description,
            duration: 9000,
        });
        setIsGenerating(false);
    }
  }

  async function handleMassDelete() {
    startOperation('deletion');
    const updateLog = (message: string) => setLog(prev => [...prev, message]);

    if (!db) {
      toast({
        variant: 'destructive',
        title: 'Service Unavailable',
        description: 'Service is currently unavailable. Please try again later.',
      });
      setIsDeleting(false);
      return;
    }

    try {
        updateLog('Querying for developer-generated users...');
        const studentsQuery = query(collection(db, 'students'), where('dev_generated', '==', true));
        const teachersQuery = query(collection(db, 'teachers'), where('dev_generated', '==', true));

        const [studentSnap, teacherSnap] = await Promise.all([
            getDocs(studentsQuery),
            getDocs(teachersQuery)
        ]);
        
        const allUsers = [...studentSnap.docs, ...teacherSnap.docs];

        if (allUsers.length === 0) {
            toast({
                title: 'No Users to Delete',
                description: 'No developer-generated users were found in Firestore.',
            });
            setIsDeleting(false);
            return;
        }
        updateLog(`Found ${allUsers.length} user(s) to delete.`);

        const batch = writeBatch(db);
        let deletedAuthCount = 0;

        for (let i = 0; i < allUsers.length; i++) {
            const userDoc = allUsers[i];
            const userData = userDoc.data();
            const email = userData.email;
            
            updateLog(`\n[${i + 1}/${allUsers.length}] Processing ${email}...`);

            try {
                let password = '';
                if (userData.role === 'student') {
                    const { class: grade, section, rollNumber } = userData;
                    if (!grade || !section || !rollNumber) {
                        throw new Error(`Student data for ${email} is incomplete for password generation.`);
                    }
                    password = `student${grade}${section}_${rollNumber}`;
                } else if (userData.role === 'teacher') {
                    const number = userData.name.split(' ').pop();
                    if (!number || !/^\d+$/.test(number)) {
                        throw new Error(`Could not parse teacher number from name: "${userData.name}"`);
                    }
                    password = `teacher${number}`;
                } else {
                     throw new Error(`Unknown role for ${email}: ${userData.role}`);
                }
                
                const tempAppName = `deleter-${Date.now()}-${i}`;
                const tempApp = initializeApp(firebaseConfig, tempAppName);
                const tempAuth = getAuth(tempApp);
                
                const userCredential = await signInWithEmailAndPassword(tempAuth, email, password);
                updateLog(`- Signed in as ${email}. Deleting auth account...`);
                
                await userCredential.user.delete();
                updateLog(`- Auth account for ${email} deleted.`);
                
                await deleteApp(tempApp);

                batch.delete(userDoc.ref);
                updateLog(`- Firestore profile queued for deletion.`);
                deletedAuthCount++;

            } catch (error: any) {
                updateLog(`- FAILED: ${error.message}`);
                console.error(`Failed to delete user ${email}:`, error);
            } finally {
                setProgress(((i + 1) / allUsers.length) * 100);
            }
        }
        
        if (deletedAuthCount > 0) {
            updateLog(`\nCommitting deletion of ${deletedAuthCount} Firestore profile(s)...`);
            await batch.commit();
            updateLog('Firestore profiles deleted.');
        } else {
            updateLog(`\nNo users were successfully deleted.`);
        }

        toast({
            title: 'Deletion Complete',
            description: `Deleted ${deletedAuthCount} of ${allUsers.length} users. See log for details.`
        });
    } catch (error: any) {
        console.error("Mass delete error:", error);
        let description = 'An unknown error occurred during deletion.';
        if (error.code === 'failed-precondition') {
            description = 'Firestore needs an index for this query. Please check the browser console for a link to create it, then try again.';
        } else if (error.code === 'permission-denied') {
            description = 'Permission denied. Please check your Firestore security rules.';
        } else {
            description = error.message;
        }
        toast({
            variant: 'destructive',
            title: 'Deletion Failed',
            description,
            duration: 9000,
        });
    } finally {
        setIsDeleting(false);
    }
  }

  if (!isDevMode) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <Card className="m-4">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>This page is only available in development mode.</CardDescription>
          </CardHeader>
            <CardContent>
                <Link href="/login" passHref>
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Login
                    </Button>
                </Link>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
        <header className="flex items-center justify-between p-4 border-b">
            <h1 className="font-headline text-xl font-bold text-primary">Admin Panel</h1>
             <Link href="/login" passHref>
                <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                </Button>
            </Link>
        </header>
        <div className="flex-1 p-4 md:p-8 overflow-auto">
            <Alert variant="destructive" className="mb-8">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Development Mode Active</AlertTitle>
                <AlertDescription>
                This admin panel is for development and testing only. Do not use in a production environment.
                </AlertDescription>
            </Alert>

            <div className="grid gap-8 lg:grid-cols-2">
                 <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Users className="h-8 w-8 text-primary" />
                            <div>
                                <CardTitle className="font-headline text-2xl">Generate Student Accounts</CardTitle>
                                <CardDescription>Bulk-create student users for a specific grade and section.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Form {...studentForm}>
                        <form onSubmit={studentForm.handleSubmit(onStudentSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField control={studentForm.control} name="grade" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Grade</FormLabel>
                                        <FormControl><Input placeholder="e.g., 5" {...field} disabled={isGenerating || isDeleting} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={studentForm.control} name="section" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Section</FormLabel>
                                        <FormControl><Input placeholder="e.g., B" {...field} disabled={isGenerating || isDeleting} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </div>
                            <FormField control={studentForm.control} name="count" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Number of Students</FormLabel>
                                    <FormControl><Input type="number" placeholder="e.g., 20" {...field} disabled={isGenerating || isDeleting} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <Button type="submit" disabled={isGenerating || isDeleting}>
                                {isGenerating ? <LoadingSpinner className="mr-2" /> : null}
                                Generate Students
                            </Button>
                        </form>
                        </Form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                         <div className="flex items-center gap-4">
                            <UserPlus className="h-8 w-8 text-primary" />
                            <div>
                                <CardTitle className="font-headline text-2xl">Generate Teacher Accounts</CardTitle>
                                <CardDescription>Bulk-create teacher users.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                      <Form {...teacherForm}>
                        <form onSubmit={teacherForm.handleSubmit(onTeacherSubmit)} className="space-y-6">
                          <FormField control={teacherForm.control} name="count" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Number of Teachers</FormLabel>
                                    <FormControl><Input type="number" placeholder="e.g., 5" {...field} disabled={isGenerating || isDeleting} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <Button type="submit" disabled={isGenerating || isDeleting}>
                                {isGenerating ? <LoadingSpinner className="mr-2" /> : null}
                                Generate Teachers
                            </Button>
                        </form>
                      </Form>
                    </CardContent>
                </Card>
            </div>

            <Card className="mt-8">
                <CardHeader>
                     <div className="flex items-center gap-4">
                        <Trash2 className="h-8 w-8 text-destructive" />
                        <div>
                            <CardTitle className="font-headline text-2xl">Mass Delete Users</CardTitle>
                            <CardDescription>Delete all developer-generated users.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Heads up!</AlertTitle>
                        <AlertDescription>
                          This action will permanently delete both the Firestore profiles and the Firebase Authentication accounts for all users with the 'dev_generated' flag. This process can be slow and cannot be undone.
                        </AlertDescription>
                    </Alert>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="mt-4" disabled={isGenerating || isDeleting}>
                            {isDeleting ? <LoadingSpinner className="mr-2" /> : <Trash2 className="mr-2" />}
                            Mass Delete Generated Users
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete all generated user accounts and their associated data from Firebase Authentication and Firestore. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleMassDelete} className="bg-destructive hover:bg-destructive/90">
                            Yes, delete them all
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
           
            {(isGenerating || isDeleting || log.length > 0) && (
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>
                            {isGenerating ? 'Generation Log' : (isDeleting ? 'Deletion Log' : 'Log')}
                        </CardTitle>
                        {(isGenerating || isDeleting) && <Progress value={progress} className="mt-2" />}
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 overflow-y-auto rounded-md bg-muted p-4 font-mono text-xs">
                            {log.map((logEntry, index) => (
                                <pre key={index} className="whitespace-pre-wrap">{logEntry}</pre>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    </div>
  );
}
