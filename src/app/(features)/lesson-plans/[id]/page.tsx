
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookText, Edit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/loading-spinner';


interface LessonPlan {
    id: string;
    topic: string;
    subject: string;
    gradeLevel: string;
    weeklyPlan: string;
    authorId: string;
    authorName: string;
    createdAt: any;
}

const LessonPlanSkeleton = () => (
    <div className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
            <Skeleton className="h-9 w-24 mb-4 -ml-4" />
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4">
                        <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
                        <div className="flex-1 space-y-2 mt-1 w-full">
                            <Skeleton className="h-8 w-3/4" />
                            <Skeleton className="h-5 w-1/2" />
                            <Skeleton className="h-4 w-1/3" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <div className="pt-4 space-y-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
);


export default function LessonPlanViewerPage() {
    const params = useParams();
    const lessonPlanId = params.id as string;
    const router = useRouter();
    const { user, profile, loading: authLoading } = useAuth();
    const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedPlan, setEditedPlan] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (authLoading || !user || !db) return;
        
        if (!lessonPlanId) {
            setLoading(false);
            return;
        }

        const fetchLessonPlan = async () => {
            setLoading(true);
            try {
                const lessonPlanRef = doc(db, 'lessonPlans', lessonPlanId);
                const lessonPlanSnap = await getDoc(lessonPlanRef);

                if (lessonPlanSnap.exists()) {
                    const data = lessonPlanSnap.data();
                    setLessonPlan({ id: lessonPlanSnap.id, ...data } as LessonPlan);
                    setEditedPlan(data.weeklyPlan || '');
                } else {
                    console.log('No such document!');
                    toast({ variant: "destructive", title: "Not Found", description: "Lesson plan not found."});
                }
            } catch (error) {
                console.error("Error fetching lesson plan:", error);
                toast({ variant: "destructive", title: "Error", description: "Could not load the lesson plan."});
            } finally {
                setLoading(false);
            }
        };

        fetchLessonPlan();
    }, [lessonPlanId, user, authLoading, toast]);
    
    const handleSave = async () => {
        if (!lessonPlanId || !db) return;
        setIsSaving(true);
        try {
            const lessonPlanRef = doc(db, 'lessonPlans', lessonPlanId);
            await updateDoc(lessonPlanRef, {
                weeklyPlan: editedPlan
            });

            if (lessonPlan) {
                setLessonPlan({ ...lessonPlan, weeklyPlan: editedPlan });
            }
            
            setIsEditing(false);
            toast({ title: "Success", description: "Lesson plan updated." });

        } catch (error: any) {
            console.error("Error updating lesson plan:", error);
            let description = 'Could not save the lesson plan.';
            if (error.code === 'permission-denied') {
              description = "You don't have permission to edit this lesson plan. Please check Firestore rules.";
            }
            toast({ variant: "destructive", title: "Update Error", description, duration: 9000 });
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading || loading) {
        return <LessonPlanSkeleton />;
    }
    
    if (!lessonPlan) {
        return (
             <div className="flex-1 p-4 md:p-8 overflow-auto">
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-xl text-muted-foreground mt-20">Lesson Plan not found.</p>
                    <Button variant="outline" onClick={() => router.back()} className="mt-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }
    
    const canEdit = user?.uid === lessonPlan?.authorId && profile?.role === 'teacher';

    return (
        <div className="flex-1 p-4 md:p-8 overflow-auto">
            <div className="max-w-4xl mx-auto">
                 <Button variant="ghost" onClick={() => router.back()} className="mb-4 -ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4">
                             <div className="p-3 bg-primary/10 rounded-lg mb-4 sm:mb-0 w-min">
                                 <BookText className="h-6 w-6 text-primary" />
                             </div>
                             <div className="flex-1">
                                <CardTitle className="font-headline text-3xl">{lessonPlan.topic}</CardTitle>
                                <CardDescription className="text-md mt-1">
                                    Subject: {lessonPlan.subject} | Grade: {lessonPlan.gradeLevel}
                                </CardDescription>
                                <CardDescription className="text-xs mt-2">
                                    Shared by {lessonPlan.authorName} on {new Date(lessonPlan.createdAt?.toDate()).toLocaleDateString()}
                                </CardDescription>
                             </div>
                             {canEdit && !isEditing && (
                                <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                                    <Edit className="h-5 w-5" />
                                </Button>
                             )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isEditing ? (
                            <div className="space-y-4">
                                <Textarea 
                                    value={editedPlan}
                                    onChange={(e) => setEditedPlan(e.target.value)}
                                    rows={25}
                                    className="font-mono text-sm"
                                />
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</Button>
                                    <Button onClick={handleSave} disabled={isSaving}>
                                        {isSaving && <LoadingSpinner className="mr-2 h-4 w-4" />}
                                        Save
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{lessonPlan.weeklyPlan}</ReactMarkdown>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

