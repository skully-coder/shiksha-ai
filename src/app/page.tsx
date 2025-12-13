'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, Lightbulb, Globe, Clock, Target, Heart, Zap, Sparkles } from 'lucide-react';
import { ThemeSwitcher } from '@/components/theme-switcher';

export default function Home() {
  return (
    <div className="min-h-screen bg-sage/30 dark:bg-green-950 font-body">
      <div className="absolute inset-0 bg-noise opacity-40 mix-blend-soft-light pointer-events-none fixed" />
      <ThemeSwitcher />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left Column: Text */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
              <Badge className="w-fit bg-forest/10 text-forest dark:bg-green-400/10 dark:text-green-300 hover:bg-forest/20 transition-colors px-4 py-1.5 text-sm font-medium border-forest/20">
                <Sparkles className="w-4 h-4 mr-2" />
                AI-Powered Teaching Assistant
              </Badge>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-headline text-forest dark:text-white leading-[1.1] tracking-tight">
                Shiksha <span className="text-green-600 dark:text-green-400">AI</span>
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground dark:text-gray-300 max-w-xl leading-relaxed">
                Empowering educators in low-resource environments with intelligent tools for lesson planning, content creation, and personalized learning.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link href="/login" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:min-w-[160px] h-12 text-base shadow-lg shadow-green-900/10 bg-forest hover:bg-forest/90 text-white transition-all hover:translate-y-[-2px]">
                    Get Started
                  </Button>
                </Link>
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:min-w-[160px] h-12 text-base border-forest/20 text-forest hover:bg-forest/5 dark:border-green-400/30 dark:text-green-300 transition-all hover:bg-transparent hover:border-forest/40">
                    Sign Up Free
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column: Visual */}
            <div className="relative mx-auto w-full max-w-[500px] lg:max-w-none animate-in fade-in slide-in-from-right-5 duration-1000 delay-200">
              {/* Abstract decorative blobs */}
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-gradient-to-br from-green-300 to-emerald-400 rounded-full blur-3xl opacity-20 dark:opacity-10 animate-pulse" />
              <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-gradient-to-tr from-teal-300 to-blue-400 rounded-full blur-3xl opacity-20 dark:opacity-10 animate-pulse delay-1000" />

              {/* Glass Card Mockup */}
              <div className="relative bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl p-6 shadow-2xl skew-y-1 hover:skew-y-0 transition-transform duration-700 ease-out">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-forest text-white flex items-center justify-center font-bold">JD</div>
                    <div>
                      <div className="h-4 w-32 bg-forest/10 rounded mb-1.5" />
                      <div className="h-3 w-20 bg-forest/5 rounded" />
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-white/50">Online</Badge>
                </div>

                <div className="space-y-4">
                  <div className="h-24 w-full bg-white/50 dark:bg-white/5 rounded-xl border border-white/20 p-4">
                    <div className="h-4 w-3/4 bg-forest/10 rounded mb-3" />
                    <div className="h-3 w-1/2 bg-forest/5 rounded" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-20 bg-green-100/50 dark:bg-green-900/20 rounded-xl border border-white/20" />
                    <div className="h-20 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-xl border border-white/20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 relative z-10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold font-headline text-forest dark:text-white">
              Powerful Features for Modern Education
            </h2>
            <p className="text-lg text-muted-foreground dark:text-gray-300">
              Streamline your teaching workflow with AI-powered tools designed, built, and optimized for educators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card variant="glass" className="hover:translate-y-[-5px] transition-transform duration-300 group">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="font-headline text-xl">Lesson Planning</CardTitle>
                <CardDescription>Create comprehensive lesson plans instantly with AI assistance tailored to your curriculum.</CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 2 */}
            <Card variant="glass" className="hover:translate-y-[-5px] transition-transform duration-300 group">
              <CardHeader>
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <CardTitle className="font-headline text-xl">Differentiated Learning</CardTitle>
                <CardDescription>Generate personalized worksheets and materials for diverse learning needs and abilities.</CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3 */}
            <Card variant="glass" className="hover:translate-y-[-5px] transition-transform duration-300 group">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Lightbulb className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                </div>
                <CardTitle className="font-headline text-xl">Visual Aids</CardTitle>
                <CardDescription>Create engaging visual content and interactive materials to enhance student understanding.</CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 4 */}
            <Card variant="glass" className="hover:translate-y-[-5px] transition-transform duration-300 group">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Globe className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="font-headline text-xl">Local Content</CardTitle>
                <CardDescription>Access culturally relevant content and adapt materials to local contexts and languages.</CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 5 */}
            <Card variant="glass" className="hover:translate-y-[-5px] transition-transform duration-300 group">
              <CardHeader>
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Clock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <CardTitle className="font-headline text-xl">Time Efficiency</CardTitle>
                <CardDescription>Automate repetitive tasks and focus more time on what matters most - your students.</CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 6 */}
            <Card variant="glass" className="hover:translate-y-[-5px] transition-transform duration-300 group">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                </div>
                <CardTitle className="font-headline text-xl">Knowledge Base</CardTitle>
                <CardDescription>Build and maintain a comprehensive repository of educational resources and materials.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-forest text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none" />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-headline mb-6">Our Mission</h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto font-light">
              Bridging the digital divide and empowering educators worldwide with accessible AI technology.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Target className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-headline font-semibold">Accessibility</h3>
              <p className="opacity-80">Making advanced AI accessible to everyone, everywhere.</p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Heart className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-headline font-semibold">Empowerment</h3>
              <p className="opacity-80">Giving teachers superpowers to inspire their students.</p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Globe className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-headline font-semibold">Global Impact</h3>
              <p className="opacity-80">Transforming education on a global scale.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sage/50 dark:bg-black py-12 border-t border-forest/5 dark:border-white/10 relative z-10">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h3 className="text-2xl font-bold font-headline text-forest dark:text-white mb-2">Shiksha AI</h3>
          <p className="text-muted-foreground mb-6">Empowering educators with AI-powered teaching tools for a better tomorrow.</p>
          <div className="flex justify-center gap-6">
            <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4">Login</Link>
            <Link href="/signup" className="text-sm font-medium hover:underline underline-offset-4">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}