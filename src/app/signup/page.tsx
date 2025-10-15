
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
import { set } from 'date-fns';

const signupSchema = z.object({
    role: z.enum(['teacher', 'student']),
    name: z.string().min(2, 'Name must be at least 2 characters.'),
    email: z.string().email('Invalid email address.'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    school: z.string().min(2, 'School name must be at least 2 characters.'),
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

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: 'teacher',
      name: '',
      email: '',
      password: '',
      school: '',
      class: '',
      section: '',
      rollNumber: '',
    },
  });

  const selectedRole = form.watch('role');

  async function onSubmit(values: SignupFormValues) {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Prepare user data for Firestore
      const userData: any = {
          uid: user.uid,
          email: values.email,
          name: values.name,
          role: values.role,
          school: values.school,
      };
      
      const collectionName = values.role === 'teacher' ? 'teachers' : 'students';
      
      if (values.role === 'student') {
          const school = values.school!.trim().toUpperCase();
          const grade = values.class!;
          const section = values.section!.toUpperCase();
          const classroomId = `${grade}-${section}`.toUpperCase();
          userData.school = values.school.trim().toUpperCase();;
          userData.class = grade;
          userData.section = section;
          userData.rollNumber = values.rollNumber;
          userData.classroomId = classroomId;

          // Add student to classroom
          const classroomRef = doc(db, 'schools', school, 'classrooms', classroomId);
          await setDoc(classroomRef, {
              grade: grade,
              section: section,
              studentIds: arrayUnion(user.uid)
          }, { merge: true });
      } else if (values.role === 'teacher') {
          const school = values.school!.trim().toUpperCase();
          const grade = values.class!.trim();
          const section = values.section!.trim().toUpperCase();
          const classroomId = `${grade}-${section}`.toUpperCase();
          // Persist teacher's classroom membership
          userData.school = values.school.trim().toUpperCase();;
          userData.class = grade;
          userData.section = section;
          userData.classroomIds = arrayUnion(classroomId);
          // Upsert school if new
          const schoolRef = doc(db, 'schools', school);
          await setDoc(schoolRef, { merge: true });
          // Upsert classroom and add teacher
          const classroomRef = doc(db, 'schools', school, 'classrooms', classroomId);
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

              <FormField
                control={form.control}
                name="school"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., MIT" {...field} />
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
