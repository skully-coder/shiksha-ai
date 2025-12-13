'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, updateDoc, arrayUnion, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RevealPasswordInput } from '@/components/ui/reveal-password-input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { useAuth } from '@/hooks/use-auth';
import { Users, Lightbulb } from 'lucide-react';

const signupSchema = z.object({
  role: z.enum(['teacher', 'student']),
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  class: z.coerce.string().optional(),
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
  const { setProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

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

    if (!auth || !db) {
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
        const teachersRef = collection(db, 'teachers');
        const existingTeacherQuery = query(
          teachersRef,
          where('class', '==', values.class),
          where('section', '==', values.section?.toUpperCase())
        );

        const existingSnapshot = await getDocs(existingTeacherQuery);

        if (!existingSnapshot.empty) {
          const existingTeacher = existingSnapshot.docs[0].data();
          toast({
            variant: 'destructive',
            title: 'Class Already Assigned',
            description: `Already a teacher is assigned to class ${values.class}-${values.section}. Please choose a different class-section.`,
          });
          setIsLoading(false);
          return;
        }
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

      // Manually set profile to avoid race condition
      setProfile(userData);

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
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Column - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex flex-col relative bg-sage dark:bg-green-950 p-10 text-forest dark:text-green-100 overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-30 mix-blend-soft-light"></div>
        {/* Decorative Circles */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-green-300/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-emerald-300/30 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex items-center gap-2 mb-auto">
          <Image
            src="/assets/Logo_2.png"
            alt="Shiksha AI"
            width={40}
            height={40}
            className="w-10 h-10 rounded-full"
          />
          <span className="text-xl font-bold font-headline tracking-tight">Shiksha AI</span>
        </div>

        <div className="relative z-10 my-auto max-w-md mx-auto">
          <Lightbulb className="w-12 h-12 mb-6 opacity-50" />
          <h2 className="text-3xl font-headline font-semibold mb-6 leading-tight">
            Join a community of educators transforming classrooms with AI.
          </h2>
          <ul className="space-y-4 opacity-80">
            <li className="flex items-center gap-3">
              <span className="flex h-2 w-2 rounded-full bg-forest dark:bg-green-200" />
              Automated Lesson Planning
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-2 w-2 rounded-full bg-forest dark:bg-green-200" />
              Content Generation
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-2 w-2 rounded-full bg-forest dark:bg-green-200" />
              Progress Tracking
            </li>
          </ul>
        </div>

        <div className="relative z-10 mt-auto flex items-center justify-between opacity-70 text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>Join thousands of teachers</span>
          </div>
          <span>© 2025 Shiksha AI</span>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="relative flex flex-col items-center justify-center p-6 sm:p-10 bg-background overflow-y-auto">
        <div className="absolute top-6 right-6">
          <ThemeSwitcher />
        </div>

        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl text-foreground">Create an account</h1>
            <p className="text-muted-foreground">Enter your information below to create your account</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        <FormItem className="flex items-center space-x-2 space-y-0 cursor-pointer">
                          <FormControl>
                            <RadioGroupItem value="teacher" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">Teacher</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0 cursor-pointer">
                          <FormControl>
                            <RadioGroupItem value="student" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">Student</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {(selectedRole === 'student' || selectedRole === 'teacher') && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="class"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class</FormLabel>
                        <FormControl>
                          <Input placeholder="10" {...field} />
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
                          <Input placeholder="A" {...field} />
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
                        <FormItem className="col-span-2">
                          <FormLabel>Roll No.</FormLabel>
                          <FormControl>
                            <Input placeholder="25" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="name@example.com" {...field} />
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
                      <RevealPasswordInput placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <LoadingSpinner className="mr-2 h-4 w-4" /> : null}
                Create Account
              </Button>
            </form>
          </Form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
