
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateLessonPlan } from '@/ai/flows/ai-lesson-planner';
import { generateLearningObjectives } from '@/ai/flows/generate-learning-objectives';
import { LoadingSpinner } from '@/components/loading-spinner';
import { SidebarTrigger } from '@/components/ui/sidebar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Download, BookText, Share2, Edit, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import FeaturePageSkeleton from "@/components/skeletons/FeaturePageSkeleton";


const lessonPlannerSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  topic: z.string().min(1, 'Topic is required'),
  gradeLevel: z.string().min(1, 'Grade level is required'),
  learningObjectives: z.string().min(1, 'Learning objectives are required'),
  localLanguage: z.string().min(1, 'Language is required'),
  additionalDetails: z.string().optional(),
});

type LessonPlannerFormValues = z.infer<typeof lessonPlannerSchema>;

export default function LessonPlannerPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratingObjectives, setIsGeneratingObjectives] = useState(false);
  const [lessonPlan, setLessonPlan] = useState('');
  const [editedLessonPlan, setEditedLessonPlan] = useState('');
  const { toast } = useToast();
  const { user, profile, loading: authLoading, classrooms } = useAuth();
  const lessonPlanRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const [isSharing, setIsSharing] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState('');


  useEffect(() => {
    if (!authLoading && profile && profile.role !== 'teacher') {
        router.replace('/profile');
    }
  }, [authLoading, profile, router]);

  const form = useForm<LessonPlannerFormValues>({
    resolver: zodResolver(lessonPlannerSchema),
    defaultValues: {
      subject: '',
      topic: '',
      gradeLevel: '',
      learningObjectives: '',
      localLanguage: 'English',
      additionalDetails: '',
    },
  });

  const topicValue = form.watch('topic');

  async function onSubmit(values: LessonPlannerFormValues) {
    if (!user || !db) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be signed in to generate a lesson plan."
      });
      return;
    }

    setIsLoading(true);
    setLessonPlan('');
    setIsEditing(false);
    try {
      const result = await generateLessonPlan(values);
      setLessonPlan(result.weeklyPlan);
    } catch (error) {
      console.error('Error generating lesson plan:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate lesson plan. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleGenerateObjectives = async () => {
    const topic = form.getValues('topic');
    const gradeLevel = form.getValues('gradeLevel');

    if (!topic || !gradeLevel) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please enter a Topic and Grade Level first.',
      });
      return;
    }

    setIsGeneratingObjectives(true);
    try {
      const result = await generateLearningObjectives({ topic, gradeLevel });
      form.setValue('learningObjectives', result.learningObjectives, {
        shouldValidate: true,
      });
    } catch (error) {
      console.error('Error generating learning objectives:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate learning objectives. Please try again.',
      });
    } finally {
      setIsGeneratingObjectives(false);
    }
  };


  const handleSaveEdit = () => {
    setLessonPlan(editedLessonPlan);
    setIsEditing(false);
    toast({ title: "Success", description: "Lesson plan updated." });
  }

  const handleExportToPdf = () => {
    const input = lessonPlanRef.current;
    if (!input) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not find the lesson plan content to export.',
      });
      return;
    }

    setIsPdfLoading(true);
    html2canvas(input, { scale: 2, useCORS: true })
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const imgWidth = imgProps.width;
        const imgHeight = imgProps.height;
        
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        
        pdf.addImage(
          imgData,
          'PNG',
          imgX,
          0,
          imgWidth * ratio,
          imgHeight * ratio
        );
        pdf.save('lesson-plan.pdf');
      })
      .catch((error) => {
        console.error('Error generating PDF:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to export lesson plan as PDF. Please try again.',
        });
      })
      .finally(() => {
        setIsPdfLoading(false);
      });
  };

  const handleShare = async () => {
    if (!user || !profile || !selectedClassroom || !lessonPlan) {
      toast({
        variant: "destructive",
        title: "Sharing Error",
        description: "Missing user, classroom, or lesson plan information."
      });
      return;
    }

    setIsSharing(true);
    try {
      const lessonPlanData = {
        authorId: user.uid,
        authorName: profile.name,
        createdAt: serverTimestamp(),
        subject: form.getValues('subject'),
        topic: form.getValues('topic'),
        gradeLevel: form.getValues('gradeLevel'),
        weeklyPlan: lessonPlan,
      };
      const lessonPlanRef = await addDoc(collection(db, 'lessonPlans'), lessonPlanData);

      const postData = {
        authorId: user.uid,
        authorName: profile.name,
        school: profile.school,
        createdAt: serverTimestamp(),
        type: 'lessonPlan',
        lessonPlanId: lessonPlanRef.id,
        topic: form.getValues('topic'),
        subject: form.getValues('subject'),
      };

      if (db) {
        await addDoc(collection(db, 'schools', profile.school!.id, 'classrooms', selectedClassroom, 'posts'), postData);
      }
      
      const classroom = classrooms.find(c => c.id === selectedClassroom);
      toast({
        title: 'Success',
        description: `Lesson plan shared with Grade ${classroom?.grade} - Section ${classroom?.section}.`,
      });
      setIsShareDialogOpen(false);
      setSelectedClassroom('');

    } catch (error) {
      console.error("Error sharing lesson plan:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not share the lesson plan. Please try again.',
      });
    } finally {
      setIsSharing(false);
    }
  };

  if (authLoading || !profile || profile.role !== 'teacher') {
    return <FeaturePageSkeleton cardCount={6} />;
  }

  return (
    <div className="flex flex-col h-full">
       <header className="flex items-center justify-between p-4 border-b md:hidden gap-4">
            <div className="flex-1 min-w-0">
                <h1 className="font-headline text-xl font-bold text-primary truncate">Lesson Planner</h1>
            </div>
            <SidebarTrigger className="flex-shrink-0" />
        </header>
      <div className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-8 items-start">
              <Card className="lg:col-span-1">
                  <CardHeader className="p-4 md:p-6">
                  <CardTitle className="font-headline text-2xl">AI Lesson Planner</CardTitle>
                  <CardDescription>Generate a detailed weekly lesson plan for your class.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                  <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                          control={form.control}
                          name="subject"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>Subject</FormLabel>
                              <FormControl>
                                  <Input placeholder="e.g., Science" {...field} />
                              </FormControl>
                              <FormMessage />
                              </FormItem>
                          )}
                          />
                          <FormField
                          control={form.control}
                          name="topic"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>Topic</FormLabel>
                              <FormControl>
                                  <Input placeholder="e.g., The Water Cycle" {...field} />
                              </FormControl>
                              <FormMessage />
                              </FormItem>
                          )}
                          />
                          <FormField
                          control={form.control}
                          name="gradeLevel"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>Grade Level</FormLabel>
                              <FormControl>
                                  <Input placeholder="e.g., 4th Grade" {...field} />
                              </FormControl>
                              <FormMessage />
                              </FormItem>
                          )}
                          />
                          <FormField
                          control={form.control}
                          name="localLanguage"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>Language</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                  <SelectTrigger>
                                      <SelectValue placeholder="Select a language" />
                                  </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                  <SelectItem value="English">English</SelectItem>
                                  <SelectItem value="Hindi">Hindi</SelectItem>
                                  <SelectItem value="Marathi">Marathi</SelectItem>
                                  <SelectItem value="Bengali">Bengali</SelectItem>
                                  <SelectItem value="Tamil">Tamil</SelectItem>
                                  </SelectContent>
                              </Select>
                              <FormMessage />
                              </FormItem>
                          )}
                          />
                      </div>
                      <FormField
                          control={form.control}
                          name="learningObjectives"
                          render={({ field }) => (
                          <FormItem>
                              <div className="flex items-center justify-between">
                                <FormLabel>Learning Objectives</FormLabel>
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={handleGenerateObjectives}
                                  disabled={!topicValue || isGeneratingObjectives}
                                >
                                  {isGeneratingObjectives ? <LoadingSpinner className="h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                                  Generate with AI
                                </Button>
                              </div>
                              <FormControl>
                              <Textarea placeholder="e.g., Students will be able to describe the stages of the water cycle." {...field} />
                              </FormControl>
                               {!topicValue && <p className="text-xs text-muted-foreground">Please enter a Topic and Grade Level to generate objectives.</p>}
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                      <FormField
                          control={form.control}
                          name="additionalDetails"
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel>Additional Details (Optional)</FormLabel>
                              <FormControl>
                              <Textarea placeholder="e.g., Focus on local examples of water sources." {...field} />
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                      <Button type="submit" disabled={isLoading}>
                          {isLoading ? <LoadingSpinner className="mr-2 h-4 w-4" /> : null}
                          Generate Plan
                      </Button>
                      </form>
                  </Form>
                  </CardContent>
              </Card>

              <div className="lg:col-span-1 lg:sticky lg:top-8 self-start mt-8 lg:mt-0">
                  {isLoading && !lessonPlan && (
                      <Card>
                        <CardHeader>
                          <div className="flex justify-between items-center">
                              <Skeleton className="h-6 w-1/2" />
                              <Skeleton className="h-8 w-8 rounded-full" />
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-full mt-4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </CardContent>
                      </Card>
                  )}
                  {!isLoading && lessonPlan && (
                      <div ref={lessonPlanRef}>
                        <Card className="w-full bg-secondary/50 max-h-[calc(100vh-8rem)] overflow-y-auto">
                            <CardHeader className="p-4 md:p-6">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="font-headline text-xl">Your Weekly Lesson Plan</CardTitle>
                                    <div className="flex items-center gap-1">
                                    {isEditing ? (
                                        <>
                                            <Button variant="default" size="sm" onClick={handleSaveEdit}>
                                                Save
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button variant="ghost" size="icon" onClick={() => { setIsEditing(true); setEditedLessonPlan(lessonPlan); }} aria-label="Edit Plan" title="Edit Plan">
                                                <Edit className="h-5 w-5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={handleExportToPdf}
                                                disabled={isPdfLoading}
                                                aria-label="Export to PDF"
                                                title="Export to PDF"
                                            >
                                                {isPdfLoading ? <LoadingSpinner className="h-5 w-5"/> : <Download className="h-5 w-5" />}
                                            </Button>

                                            <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
                                                <DialogTrigger asChild>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        disabled={!lessonPlan || classrooms.length === 0} 
                                                        aria-label="Share to classroom" 
                                                        title="Share to classroom"
                                                    >
                                                        <Share2 className="h-5 w-5" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Share Lesson Plan</DialogTitle>
                                                        <DialogDescription>
                                                            Select a classroom to post this lesson plan to their feed.
                                                            {classrooms.length === 0 && <span className="text-destructive block mt-2">You have not joined any classrooms.</span>}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="py-4">
                                                        <Select onValueChange={setSelectedClassroom} defaultValue={selectedClassroom}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a classroom..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {classrooms.map(c => (
                                                                    <SelectItem key={c.id} value={c.id}>
                                                                        Grade {c.grade} - Section {c.section}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>Cancel</Button>
                                                        <Button onClick={handleShare} disabled={!selectedClassroom || isSharing}>
                                                            {isSharing && <LoadingSpinner className="mr-2 h-4 w-4" />}
                                                            Share
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </>
                                    )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 md:p-6 overflow-x-auto">
                                {isEditing ? (
                                    <Textarea 
                                        value={editedLessonPlan}
                                        onChange={(e) => setEditedLessonPlan(e.target.value)}
                                        rows={25}
                                        className="font-mono text-sm"
                                    />
                                ) : (
                                    <div className="prose prose-sm max-w-none dark:prose-invert">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{lessonPlan}</ReactMarkdown>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                      </div>
                  )}
                  {!isLoading && !lessonPlan && (
                      <Card className="flex items-center justify-center h-96 border-dashed bg-secondary/20">
                          <CardContent className="text-center text-muted-foreground p-6">
                              <BookText className="mx-auto h-12 w-12" />
                              <p className="mt-4 font-medium">Your generated lesson plan will appear here.</p>
                              <p className="text-sm">Fill out the form to the left to get started.</p>
                          </CardContent>
                      </Card>
                  )}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}

    
