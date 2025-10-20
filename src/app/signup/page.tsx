
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ThemeSwitcher } from '@/components/theme-switcher';

const signupSchema = z.object({
    role: z.enum(['teacher', 'student']),
    name: z.string().min(2, 'Name must be at least 2 characters.'),
    email: z.string().email('Invalid email address.'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    class: z.string().optional(),
    section: z.string().optional(),
    rollNumber: z.string().optional(),
  }).superRefine((data, ctx) => {
    const needsClassSection = data.role === 'student' || data.role === 'teacher';
    if (needsClassSection) {
      if (!data.class) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Class is required.', path: ['class'] });
      }
      if (!data.section) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Section is required.', path: ['section'] });
      }
    }
    if (data.role === 'student') {
      if (!data.rollNumber) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Roll number is required.', path: ['rollNumber'] });
      }
    }
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Check if services are available
  if (!auth || !db) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Service Unavailable</CardTitle>
            <CardDescription>
              Registration service is currently unavailable. Please try again later.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: 'teacher',
      name: '',
      email: '',
      password: '',
      class: '',
      section: '',
      rollNumber: '',
    },
  });

  const selectedRole = form.watch('role');

  async function onSubmit(values: SignupFormValues) {
    setIsLoading(true);
    
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Service Unavailable',
        description: 'Registration service is currently unavailable. Please try again later.',
      });
      setIsLoading(false);
      return;
    }
    
    if (!db) {
      toast({
        variant: 'destructive',
        title: 'Service Unavailable',
        description: 'Registration service is currently unavailable. Please try again later.',
      });
      setIsLoading(false);
      return;
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Prepare user data for Firestore
      const userData: any = {
          uid: user.uid,
          email: values.email,
          name: values.name,
          role: values.role,
      };
      
      const collectionName = values.role === 'teacher' ? 'teachers' : 'students';
      
      if (values.role === 'student') {
          const grade = values.class!;
          const section = values.section!.toUpperCase();
          const classroomId = `${grade}-${section}`.toUpperCase();
          userData.class = grade;
          userData.section = section;
          userData.rollNumber = values.rollNumber;
          userData.classroomId = classroomId;

          // Add student to classroom
          const classroomRef = doc(db, 'classrooms', classroomId);
          await setDoc(classroomRef, {
              grade: grade,
              section: section,
              studentIds: arrayUnion(user.uid)
          }, { merge: true });
      } else if (values.role === 'teacher') {
          const grade = values.class!;
          const section = values.section!.toUpperCase();
          const classroomId = `${grade}-${section}`.toUpperCase();
          // Persist teacher's classroom membership
          userData.class = grade;
          userData.section = section;
          userData.classroomIds = arrayUnion(classroomId);

          // Upsert classroom and add teacher
          const classroomRef = doc(db, 'classrooms', classroomId);
          await setDoc(classroomRef, {
              grade: grade,
              section: section,
              teacherIds: arrayUnion(user.uid)
          }, { merge: true });
      }

      // Save user data to Firestore
      await setDoc(doc(db, collectionName, user.uid), userData, { merge: true });

      toast({
        title: 'Account Created',
        description: 'You have successfully signed up!',
      });
      router.replace('/lesson-planner');
    } catch (error: any) {
      let description = 'An unexpected error occurred. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        description = 'This email address is already in use.';
      } else if (error.code === 'auth/weak-password') {
        description = 'Password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/invalid-email') {
        description = 'Invalid email address format.';
      } else if (error.code === 'auth/network-request-failed') {
        description = 'Network error. Please check your internet connection.';
      } else if (error.code === 'permission-denied') {
        description = 'Permission denied. Please check Firestore rules.';
      } else if (error.message) {
        description = `Error: ${error.message}`;
      }
      
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <ThemeSwitcher />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl">Create an Account</CardTitle>
          <CardDescription>Join Shiksha AI to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>I am a...</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="teacher" />
                          </FormControl>
                          <FormLabel className="font-normal">Teacher</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="student" />
                          </FormControl>
                          <FormLabel className="font-normal">Student</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {(selectedRole === 'student' || selectedRole === 'teacher') && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="class"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 10" {...field} />
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
                            <Input placeholder="e.g., A" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {selectedRole === 'student' && (
                      <FormField
                        control={form.control}
                        name="rollNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Roll No.</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 25" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </>
              )}
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="e.g., teacher@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <LoadingSpinner className="mr-2" /> : null}
                Sign Up
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline text-primary">
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
