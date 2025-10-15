
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, updateDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/loading-spinner';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Terminal, Edit, BookText, ArrowRight } from 'lucide-react';
import PageSkeleton from '@/components/skeletons/PageSkeleton';
import ProfileSkeleton from '@/components/skeletons/ProfileSkeleton';


const profileUpdateSchema = z.object({
    class: z.coerce.number({ invalid_type_error: "Grade must be a number." })
    .min(1, { message: "Grade must be 1 or higher." })
    .max(12, { message: "Grade must be 12 or lower." })
    .optional(),
    section: z.string().optional(),
});

type ProfileUpdateFormValues = z.infer<typeof profileUpdateSchema>;

interface LessonPlan {
    id: string;
    topic: string;
    subject: string;
    gradeLevel: string;
    createdAt: any;
}

export default function ProfilePage() {
    const { user, profile, setProfile, loading: authLoading } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const { toast } = useToast();

    const form = useForm<ProfileUpdateFormValues>({
        resolver: zodResolver(profileUpdateSchema),
    });

    useEffect(() => {
        if (profile) {
            form.reset({
                class: profile.class || '',
                section: profile.section || '',
            });
        }
    }, [profile, form, isEditing]);

    useEffect(() => {
        if (profile?.role === 'teacher' && user && db) {
            const fetchHistory = async () => {
                setHistoryLoading(true);
                try {
                    const q = query(
                        collection(db, 'lessonPlans'), 
                        where('authorId', '==', user.uid),
                        orderBy('createdAt', 'desc')
                    );
                    const querySnapshot = await getDocs(q);
                    const plans = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LessonPlan));
                    setLessonPlans(plans);
                } catch (error: any) {
                    console.error("Error fetching lesson plan history:", error);
                     let description = "Could not load your lesson plan history.";
                     if (error.code === 'failed-precondition') {
                        description = `A Firestore index is required for this query. Please check the browser console for a link to create it, then try again.`;
                    }
                    toast({
                        variant: 'destructive',
                        title: 'Error',
                        description,
                        duration: 9000,
                    });
                } finally {
                    setHistoryLoading(false);
                }
            };
            fetchHistory();
        } else {
            setHistoryLoading(false);
        }
    }, [user, profile, toast]);

    async function onSubmit(values: ProfileUpdateFormValues) {
        if (!user || profile?.role !== 'teacher' || !db) return;
        setIsUpdating(true);
        try {
            const teacherRef = doc(db, 'teachers', user.uid);
            await updateDoc(teacherRef, {
                class: values.class,
                section: values.section,
            });

            setProfile(prev => prev ? { ...prev, class: values.class, section: values.section } as UserProfile : null);

            toast({ title: "Success", description: "Profile updated successfully." });
            setIsEditing(false);
        } catch (error: any) {
            console.error("Error updating profile:", error);
            let description = 'An unknown error occurred while updating your profile.';
            if (error.code === 'permission-denied') {
              description = "You don't have permission to update your profile. Please check your Firestore security rules to ensure a teacher can write to their own document in the 'teachers' collection.";
            }
            toast({ 
                variant: 'destructive', 
                title: 'Update Failed', 
                description: description,
                duration: 9000,
            });
        } finally {
            setIsUpdating(false);
        }
    }


    if (authLoading) {
        return <ProfileSkeleton />;       
    }
    
    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-4 border-b md:hidden">
                <h1 className="font-headline text-xl font-bold text-primary">Profile</h1>
                <SidebarTrigger />
            </header>
            <div className="flex-1 p-4 md:p-8 overflow-auto">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="font-headline text-2xl">User Profile</CardTitle>
                                <CardDescription>View and edit your account details below.</CardDescription>
                            </div>
                             {profile?.role === 'teacher' && !isEditing && (
                                <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} aria-label="Edit Profile">
                                    <Edit className="h-5 w-5" />
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!profile && (
                             <Alert variant="destructive">
                                <Terminal className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>We couldn’t find a profile for your account.</AlertDescription>
                            </Alert>
                        )}

                        {profile && !isEditing && (
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Name</span>
                                    <span className="font-medium">{profile.name}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Email</span>
                                    <span className="font-medium">{profile.email}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Role</span>
                                    <span className="font-medium capitalize">{profile.role}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">School</span>
                                    <span className="font-medium capitalize">{profile.school}</span>
                                </div>
                                {profile.role === 'teacher' && (
                                    <>
                                        <div className="flex justify-between border-b pb-2">
                                            <span className="text-muted-foreground">Grade</span>
                                            <span className="font-medium">{profile.class || 'Not set'}</span>
                                        </div>
                                        <div className="flex justify-between border-b pb-2">
                                            <span className="text-muted-foreground">Section</span>
                                            <span className="font-medium">{profile.section || 'Not set'}</span>
                                        </div>
                                    </>
                                )}
                                {profile.role === 'student' && (
                                    <>
                                        <div className="flex justify-between border-b pb-2">
                                            <span className="text-muted-foreground">Class</span>
                                            <span className="font-medium">{profile.class}</span>
                                        </div>
                                        <div className="flex justify-between border-b pb-2">
                                            <span className="text-muted-foreground">Section</span>
                                            <span className="font-medium">{profile.section}</span>
                                        </div>
                                        <div className="flex justify-between border-b pb-2">
                                            <span className="text-muted-foreground">Roll Number</span>
                                            <span className="font-medium">{profile.rollNumber}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                        
                        {profile?.role === 'teacher' && isEditing && (
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="class"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Grade</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g., 5" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="section"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Section</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g., B" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-4">
                                        <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                                        <Button type="submit" disabled={isUpdating}>
                                            {isUpdating ? <LoadingSpinner className="mr-2 h-4 w-4" /> : null}
                                            Save Changes
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        )}
                    </CardContent>
                    {profile?.role === 'teacher' && (
                        <CardFooter className="pt-0">
                             <Card className="w-full mt-6">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <BookText className="h-6 w-6 text-primary" />
                                        <div>
                                            <CardTitle className="font-headline text-xl">Lesson Plan History</CardTitle>
                                            <CardDescription>A list of lesson plans you have created.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {historyLoading ? (
                                        <div className="space-y-3">
                                            <Skeleton className="h-16 w-full" />
                                            <Skeleton className="h-16 w-full" />
                                            <Skeleton className="h-16 w-full" />
                                        </div>
                                    ) : lessonPlans.length > 0 ? (
                                        <ul className="space-y-3">
                                            {lessonPlans.map((plan) => (
                                                <li key={plan.id}>
                                                    <Link href={`/lesson-plans/${plan.id}`} passHref className="block p-4 border rounded-lg hover:bg-muted transition-colors">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <p className="font-semibold">{plan.topic}</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {plan.subject} | Grade {plan.gradeLevel} | {new Date(plan.createdAt?.toDate()).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 ml-4" />
                                                        </div>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            You have not created any lesson plans yet.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </CardFooter>
                    )}
                </Card>
            </div>
        </div>
    );
}

// NOTE: This interface was duplicated here to satisfy the type checker.
// It is defined in use-auth.tsx and could be exported from there in a real-world scenario.
interface UserProfile {
    uid: string;
    name: string;
    email: string;
    role: 'teacher' | 'student';
    class?: string;
    section?: string;
    rollNumber?: string;
}
