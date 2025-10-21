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
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-green-950 dark:via-green-900 dark:to-emerald-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30 dark:opacity-40">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-green-200 dark:bg-green-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-emerald-200 dark:bg-emerald-700 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-lime-200 dark:bg-lime-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>
      
      {/* Theme Switcher */}
      <ThemeSwitcher />
      
      {/* Main Content */}
      <div className="flex min-h-screen items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white dark:bg-slate-800/50 dark:backdrop-blur-xl dark:border dark:border-slate-700/50 rounded-full shadow-lg dark:shadow-2xl dark:shadow-green-500/20 mb-6 transform hover:scale-105 transition-transform duration-300 overflow-hidden">
              <Image 
                src="/assets/Logo_2.png"
                alt="Shiksha AI Logo"
                width={96}
                height={96}
                className="rounded-full object-cover w-full h-full"
                priority
              />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight dark:drop-shadow-lg">
              Welcome Back
            </h1>
            <p className="text-gray-600 dark:text-slate-300 text-lg">
              Continue your Learning Journey
            </p>
          </div>

          {/* Login Card */}
          <Card className="backdrop-blur-lg bg-white/60 dark:bg-slate-800/40 dark:backdrop-blur-xl border-white/20 dark:border-slate-700/50 shadow-lg dark:shadow-2xl dark:shadow-purple-500/10">
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 dark:text-slate-200">
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type="email" 
                              placeholder="Enter your email" 
                              className="pl-12 h-12 bg-white/50 dark:bg-slate-700/50 dark:backdrop-blur-sm border-gray-200 dark:border-slate-600/50 focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-400 focus:border-transparent dark:text-white dark:placeholder-slate-400 transition-all duration-200" 
                              {...field} 
                            />
                            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                          </div>
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
                        <div className="flex justify-between items-center">
                          <FormLabel className="text-sm font-medium text-gray-700 dark:text-slate-200">
                            Password
                          </FormLabel>
                          <Button
                            type="button"
                            variant="link"
                            className="h-auto p-0 text-xs text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                            onClick={handlePasswordReset}
                          >
                            Forgot Password?
                          </Button>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type="password" 
                              placeholder="Enter your password" 
                              className="pl-12 h-12 bg-white/50 dark:bg-slate-700/50 dark:backdrop-blur-sm border-gray-200 dark:border-slate-600/50 focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-400 focus:border-transparent dark:text-white dark:placeholder-slate-400 transition-all duration-200" 
                              {...field} 
                            />
                            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hover:shadow-lg hover:shadow-green-500/25 dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-600 dark:hover:to-emerald-600 dark:hover:shadow-green-400/25 text-white font-medium rounded-lg shadow-lg transform hover:scale-[1.02] hover:brightness-110 transition-all duration-200 active:scale-[0.98]" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner className="mr-2 h-5 w-5" />
                        Signing In..
                      </>
                    ) : (
                      <>
                        Sign In
                        <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </Button>
                </form>
              </Form>
              
              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
                      New to Shiksha AI?
                    </span>
                  </div>
                </div>
                
                <div className="mt-6 text-center">
                  <Link 
                    href="/signup" 
                    className="inline-flex items-center justify-center w-full h-12 px-4 py-2 border-2 border-green-300 dark:border-green-600 rounded-lg text-sm font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 hover:border-green-400 dark:hover:border-green-500 transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    Create New Account
                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </Link>
                </div>
                
                {process.env.NEXT_PUBLIC_DEV_MODE === 'true' && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                    <Link href="/admin" passHref>
                      <Button 
                        variant="outline" 
                        className="w-full h-10 text-xs bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 hover:border-green-400 dark:hover:border-green-500 transition-all duration-200"
                      >
                        🔧 Admin Console (Dev Mode)
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © 2025 ShikshaAI. Empowering education through AI.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
