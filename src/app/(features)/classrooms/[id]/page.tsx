
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, collection, query, addDoc, serverTimestamp, orderBy, onSnapshot, deleteDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/loading-spinner';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Users, ArrowRight, BookOpenCheck, Trash2, Sheet, Paperclip, X, File as FileIcon, FileImage } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
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
} from "@/components/ui/alert-dialog";
import { useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

const postSchema = z.object({
  message: z.string().optional(),
});

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  content?: string;
  createdAt: any; // Firestore timestamp
  type?: 'message' | 'lessonPlan' | 'worksheet' | 'pdf' | 'image';
  lessonPlanId?: string;
  worksheetId?: string;
  topic?: string;
  subject?: string;
  gradeLevel?: string;
  fileName?: string;
  fileUrl?: string;
}

// Minimal profile types for members list
interface Member {
    uid: string;
    name: string;
    rollNumber?: string;
}

export default function ClassroomDetailPage() {
  const params = useParams();
  const classroomId = params.id as string;

  const { user, profile, loading: authLoading } = useAuth();
  const [classroom, setClassroom] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [teachers, setTeachers] = useState<Member[]>([]);
  const [students, setStudents] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const { toast } = useToast();
  const feedRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm({
    resolver: zodResolver(postSchema),
    defaultValues: { message: '' },
  });

  const fetchClassroomData = useCallback(async () => {
    if (!db || !user || !classroomId) return;
    setLoading(true);
    try {
      const classroomRef = doc(db, 'schools', profile?.school!.id, 'classrooms', classroomId);
      const classroomSnap = await getDoc(classroomRef);

      if (!classroomSnap.exists()) {
        toast({ variant: 'destructive', title: 'Error', description: 'Classroom not found.' });
        setClassroom(null);
      } else {
        setClassroom(classroomSnap.data());
        // Fetch members here, after classroom is confirmed to exist
        fetchMembers(classroomSnap.data());
      }
    } catch (error: any) {
      console.error("Error fetching classroom data:", error);
      let description = 'Could not load classroom data.';
      if (error.code === 'permission-denied') {
          description = "You don't have permission to view this classroom. This is often fixed by updating Firestore security rules in your Firebase Console.";
      }
      toast({ variant: 'destructive', title: 'Data Loading Error', description, duration: 9000 });
    } finally {
      setLoading(false);
    }
  }, [classroomId, toast, user]);

  useEffect(() => {
      if(!authLoading && user){
          fetchClassroomData();
      }
  }, [authLoading, user, fetchClassroomData]);
  
  // Fetch members now receives classroom data directly
  const fetchMembers = async (classroomData: any) => {
    if (!db || !classroomData) return;
    setMembersLoading(true);
    
    try {
        const teacherPromises = (classroomData.teacherIds || []).map((id: string) => getDoc(doc(db, 'teachers', id)));
        const studentPromises = (classroomData.studentIds || []).map((id: string) => getDoc(doc(db, 'students', id)));

        const [teacherDocs, studentDocs] = await Promise.all([
            Promise.all(teacherPromises),
            Promise.all(studentPromises)
        ]);

        setTeachers(teacherDocs.filter(d => d.exists()).map(d => ({uid: d.id, ...d.data()} as Member)));
        setStudents(studentDocs.filter(d => d.exists()).map(d => ({uid: d.id, ...d.data()} as Member)));
        
    } catch (error) {
         console.error("Error fetching members:", error);
         toast({ variant: 'destructive', title: 'Error', description: 'Could not load classroom members list.' });
    } finally {
        setMembersLoading(false);
    }
  };


  useEffect(() => {
    if(!db || !classroomId) return;
    const postsQuery = query(collection(db, 'schools', profile?.school!.id, 'classrooms', classroomId, 'posts'), orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(postsQuery, (querySnapshot) => {
      const postsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      setPosts(postsData);
    }, (error) => {
        console.error("Error fetching posts:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load classroom posts in real-time.' });
    });

    return () => unsubscribe();
  }, [classroomId, toast]);

  useEffect(() => {
    if (feedRef.current) {
        feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [posts]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (profile?.role !== 'teacher') {
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: 'Only teachers can upload files.',
      });
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please select a PDF or an image file.',
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Please upload a file smaller than 10MB.',
        });
        return;
      }
      
      setSelectedFile(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const handlePostMessage = async (values: { message?: string }) => {
    if (!user || !profile || profile.role !== 'teacher' || !db || !classroomId) return;
    if (!values.message && !selectedFile) return;

    setIsUploading(true);

    try {
      if (selectedFile) {
        if (!storage) throw new Error("Firebase Storage is not configured.");
        const file = selectedFile;
        const fileRef = storageRef(storage, `classrooms/${classroomId}/files/${Date.now()}_${file.name}`);
        
        await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(fileRef);
        
        const postType = file.type.startsWith('image/') ? 'image' : 'pdf';

        await addDoc(collection(db, 'schools', profile.school!.id, 'classrooms', classroomId, 'posts'), {
          authorId: user.uid,
          authorName: profile.name,
          content: values.message || '',
          createdAt: serverTimestamp(),
          type: postType,
          fileName: file.name,
          fileUrl: downloadURL,
        });
      } else {
        await addDoc(collection(db, 'schools', profile.school!.id, 'classrooms', classroomId, 'posts'), {
          authorId: user.uid,
          authorName: profile.name,
          content: values.message,
          createdAt: serverTimestamp(),
          type: 'message',
        });
      }
      form.reset();
      setSelectedFile(null);
    } catch (error) {
      console.error("Error posting message:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not post your update.' });
    } finally {
      setIsUploading(false);
    }
  };


  const handleDeletePost = async (postId: string) => {
    if (!db || !user || !classroomId) return;

    try {
      const postRef = doc(db,'schools', profile?.school!.id, 'classrooms', classroomId, 'posts', postId);
      await deleteDoc(postRef);
      toast({
        title: 'Success',
        description: 'The post has been deleted.',
      });
    } catch (error: any) {
      console.error("Error deleting post:", error);
      let description = 'Could not delete the post. Please try again.';
      if (error.code === 'permission-denied') {
        description = "You don't have permission to delete this post. Please check your Firestore security rules to allow teachers to delete their own posts.";
      }
      toast({
        variant: 'destructive',
        title: 'Deletion Error',
        description,
        duration: 9000,
      });
    }
  };
  
  if (authLoading || loading) {
    return <div className="flex items-center justify-center h-full"><LoadingSpinner className="h-12 w-12" /></div>;
  }
  
  if (!classroom) {
     return <div className="flex items-center justify-center h-full"><p>Classroom not found.</p></div>;
  }

  const messageValue = form.watch('message');

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b md:hidden">
        <h1 className="font-headline text-xl font-bold text-primary truncate">Grade {classroom.grade} - Section {classroom.section}</h1>
         <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowMembers(!showMembers)} className="shrink-0">
                <Users className="mr-2 h-4 w-4"/>
                <span>{showMembers ? 'Hide' : 'Members'}</span>
            </Button>
            <SidebarTrigger />
        </div>
      </header>
      <div className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="h-full max-w-7xl mx-auto flex gap-8">
            <div className="flex-1 min-w-0">
                <Card className="flex flex-col h-full">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                            <CardTitle className="font-headline text-2xl">Classroom Feed</CardTitle>
                            <CardDescription>Updates and messages from your teachers.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setShowMembers(!showMembers)} className="shrink-0 hidden md:flex">
                                <Users className="mr-2 h-4 w-4"/>
                                {showMembers ? 'Hide Members' : 'View Members'}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto pr-4" ref={feedRef}>
                    <div className="space-y-6">
                        {posts.map(post => (
                        <div key={post.id} className="group relative flex items-start gap-4">
                            <Avatar>
                                <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold">{post.authorName}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {post.createdAt ? new Date(post.createdAt?.toDate()).toLocaleString() : 'sending...'}
                                    </p>
                                </div>
                                {post.type === 'lessonPlan' ? (
                                    <Card className="mt-2 bg-background">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <BookOpenCheck className="h-6 w-6 text-primary shrink-0" />
                                                    <div>
                                                        <p className="font-semibold text-sm">{post.topic}</p>
                                                        <p className="text-xs text-muted-foreground">A new lesson plan was shared.</p>
                                                    </div>
                                                </div>
                                                <Link href={`/lesson-plans/${post.lessonPlanId}`} passHref>
                                                    <Button size="sm" variant="outline">
                                                        View
                                                        <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : post.type === 'worksheet' ? (
                                    <Card className="mt-2 bg-background">
                                      <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3">
                                            <Sheet className="h-6 w-6 text-primary shrink-0" />
                                            <div>
                                              <p className="font-semibold text-sm">Worksheet Shared</p>
                                              <p className="text-xs text-muted-foreground">For Grade {post.gradeLevel}</p>
                                            </div>
                                          </div>
                                          <Link href={`/worksheets/${post.worksheetId}`} passHref>
                                            <Button size="sm" variant="outline">
                                              View
                                              <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                          </Link>
                                        </div>
                                      </CardContent>
                                    </Card>
                                ) : post.type === 'pdf' ? (
                                    <Card className="mt-2 bg-background">
                                      <CardContent className="p-4">
                                        {post.content && <p className="text-sm text-foreground mb-3 whitespace-pre-wrap">{post.content}</p>}
                                        <div className="flex items-center justify-between p-3 border rounded-md">
                                          <div className="flex items-center gap-3 overflow-hidden">
                                            <FileIcon className="h-6 w-6 text-primary shrink-0" />
                                            <div>
                                              <p className="font-semibold text-sm truncate" title={post.fileName}>{post.fileName}</p>
                                              <p className="text-xs text-muted-foreground">PDF Document</p>
                                            </div>
                                          </div>
                                          <a href={post.fileUrl} target="_blank" rel="noopener noreferrer">
                                            <Button size="sm" variant="outline">
                                              View
                                              <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                          </a>
                                        </div>
                                      </CardContent>
                                    </Card>
                                ) : post.type === 'image' ? (
                                    <Card className="mt-2 bg-background">
                                      <CardContent className="p-4">
                                        {post.content && <p className="text-sm text-foreground mb-3 whitespace-pre-wrap">{post.content}</p>}
                                        {post.fileUrl && (
                                           <a href={post.fileUrl} target="_blank" rel="noopener noreferrer" className="block">
                                            <Image 
                                                src={post.fileUrl} 
                                                alt={post.fileName || 'Uploaded image'}
                                                width={400} 
                                                height={300} 
                                                className="rounded-md object-cover w-full max-h-80"
                                            />
                                           </a>
                                        )}
                                      </CardContent>
                                    </Card>
                                ) : (
                                    <p className="text-sm text-foreground whitespace-pre-wrap">{post.content}</p>
                                )}
                            </div>
                            {profile?.role === 'teacher' && user?.uid === post.authorId && (
                                <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete the post.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    className="bg-destructive hover:bg-destructive/90"
                                                    onClick={() => handleDeletePost(post.id)}
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            )}
                        </div>
                        ))}
                        {posts.length === 0 && (
                            <div className="text-center py-10 text-muted-foreground">No posts in this classroom yet.</div>
                        )}
                    </div>
                    </CardContent>
                    {profile?.role === 'teacher' && (
                    <CardFooter className="pt-4 border-t">
                        <form onSubmit={form.handleSubmit(handlePostMessage)} className="w-full flex flex-col gap-2">
                           <div className="flex items-start gap-2">
                                <Textarea
                                {...form.register('message')}
                                placeholder="Type a message or upload a file..."
                                className="flex-1"
                                rows={1}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        form.handleSubmit(handlePostMessage)();
                                    }
                                }}
                                />
                                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="application/pdf,image/*" />
                                <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                                    <Paperclip className="h-4 w-4" />
                                    <span className="sr-only">Attach file</span>
                                </Button>
                                <Button type="submit" size="icon" disabled={isUploading || (!messageValue && !selectedFile)}>
                                    {isUploading ? <LoadingSpinner /> : <Send className="h-4 w-4" />}
                                </Button>
                           </div>
                            {selectedFile && (
                                <div className="flex items-center justify-between p-2 pl-3 bg-muted rounded-md text-sm">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        {selectedFile.type.startsWith('image/') ? <FileImage className="h-4 w-4 text-muted-foreground" /> : <FileIcon className="h-4 w-4 text-muted-foreground" />}
                                        <span className="truncate">{selectedFile.name}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedFile(null)} disabled={isUploading}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </form>
                    </CardFooter>
                    )}
                </Card>
            </div>

            <div className={cn(
                "transition-all duration-300 ease-in-out",
                showMembers ? "w-80" : "w-0"
            )}>
                 {showMembers && (
                    <Card className="h-full w-80 shrink-0">
                        <CardHeader>
                            <CardTitle>Members</CardTitle>
                            {!membersLoading && <CardDescription>{teachers.length} Teacher(s), {students.length} Student(s)</CardDescription>}
                        </CardHeader>
                        <CardContent className="overflow-y-auto" style={{maxHeight: "calc(100vh - 200px)"}}>
                             {membersLoading ? (
                                <div className="space-y-4 p-4">
                                    <Skeleton className="h-8 w-full" />
                                    <div className="space-y-3 pt-2">
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-6 w-6 rounded-full" />
                                            <Skeleton className="h-4 w-3/4" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-6 w-6 rounded-full" />
                                            <Skeleton className="h-4 w-1/2" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-8 w-full mt-4" />
                                    <div className="space-y-3 pt-2">
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-6 w-6 rounded-full" />
                                            <Skeleton className="h-4 w-3/4" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-6 w-6 rounded-full" />
                                            <Skeleton className="h-4 w-4/5" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-6 w-6 rounded-full" />
                                            <Skeleton className="h-4 w-1/2" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <Accordion type="single" collapsible defaultValue="teachers" className="w-full">
                                    <AccordionItem value="teachers">
                                        <AccordionTrigger>Teachers</AccordionTrigger>
                                        <AccordionContent>
                                            <ul className="space-y-3 pt-2">
                                            {teachers.length > 0 ? teachers.map(teacher => (
                                                <li key={teacher.uid} className="flex items-center gap-2 text-sm">
                                                    <Avatar className="h-6 w-6 text-xs"><AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback></Avatar>
                                                    {teacher.name}
                                                </li>
                                            )) : <li className="text-sm text-muted-foreground">No teachers found.</li>}
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="students">
                                        <AccordionTrigger>Students</AccordionTrigger>
                                        <AccordionContent>
                                            <ul className="space-y-3 pt-2">
                                            {students.length > 0 ? students.sort((a, b) => (parseInt(a.rollNumber || '0') - parseInt(b.rollNumber || '0'))).map(student => (
                                                <li key={student.uid} className="flex items-center gap-2 text-sm">
                                                    <Avatar className="h-6 w-6 text-xs"><AvatarFallback>{student.name.charAt(0)}</AvatarFallback></Avatar>
                                                    <span className="flex-1 truncate">{student.name}</span>
                                                    <span className="text-muted-foreground">#{student.rollNumber}</span>
                                                </li>
                                            )) : <li className="text-sm text-muted-foreground">No students found.</li>}
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
