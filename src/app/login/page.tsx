'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/loading-spinner';
import { useAuth } from '@/hooks/use-auth';
import { Separator } from '@/components/ui/separator';
import LoginSkeleton from "@/components/skeletons/LoginSkeleton";
import { ThemeSwitcher } from "@/components/theme-switcher";

const loginSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading } = useAuth();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!loading && user) {
      router.replace('/lesson-planner');
    }
  }, [user, loading, router]);

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Service Unavailable',
        description: 'Login service is currently unavailable. Please try again later.',
      });
      setIsLoading(false);
      return;
    }
    
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      router.replace('/lesson-planner');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid credentials. Please try again.',
      });
      setIsLoading(false);
    }
  }

  const handlePasswordReset = async () => {
    const email = form.getValues('email');
    if (!email) {
      toast({
        variant: 'destructive',
        title: 'Email Required',
        description: 'Please enter your email address to reset your password.',
      });
      return;
    }
    
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Service Unavailable',
        description: 'Password reset service is currently unavailable. Please try again later.',
      });
      return;
    }
    
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Password Reset Email Sent',
        description: 'Please check your inbox for further instructions.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send password reset email. Please try again.',
      });
    }
  };

  if (loading || user) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <LoadingSpinner className="h-12 w-12" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <ThemeSwitcher />
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
           <Image 
              src="/assets/Logo_2.png"
              alt="Shiksha AI Logo"
              width={180}
              height={45}
              className="mx-auto mb-4"
              priority
            />
          <CardTitle className="font-headline text-2xl">Sign In</CardTitle>
          <CardDescription>Welcome back! Please sign in.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="e.g., admin@example.com" {...field} />
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
                    <div className="flex justify-between">
                      <FormLabel>Password</FormLabel>
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-xs"
                        onClick={handlePasswordReset}
                      >
                        Forgot Password?
                      </Button>
                    </div>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <LoadingSpinner className="mr-2" /> : null}
                Sign In
              </Button>
            </form>
          </Form>
           <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline text-primary">
              Sign Up
            </Link>
          </div>
          {process.env.NEXT_PUBLIC_DEV_MODE === 'true' && (
            <>
              <Separator className="my-4" />
              <div className="text-center">
                <Link href="/admin" passHref>
                  <Button variant="outline" className="w-full">
                    Admin Console
                  </Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
