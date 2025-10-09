'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, Lightbulb, Globe, Clock, Target, Heart, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-emerald-600/10" />
        <div className="relative max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-12 sm:pt-16 md:pt-20 pb-12 sm:pb-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Image 
                src="/assets/Logo_2.png" 
                alt="Shiksha AI Logo" 
                width={200} 
                height={200}
                className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 xl:w-40 xl:h-40"
                style={{ mixBlendMode: 'multiply' }}
              />
            </div>
            <Badge className="mb-4 bg-green-100 text-green-800 hover:bg-green-200">
              AI-Powered Teaching Assistant
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-headline text-gray-900 mb-4 sm:mb-6">
              Shiksha <span className="text-green-600">AI</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto px-2">
              Empowering educators in low-resource environments with intelligent tools for lesson planning, content creation, and personalized learning.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                  Get Started
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-green-600 text-green-600 hover:bg-green-600 hover:border-green-700">
                  Sign Up Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
              Powerful Features for Modern Education
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Streamline your teaching workflow with AI-powered tools designed for educators.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="p-4 sm:p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-lg sm:text-xl">Lesson Planning</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Create comprehensive lesson plans instantly with AI assistance tailored to your curriculum.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="p-4 sm:p-6">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-emerald-600" />
                </div>
                <CardTitle className="text-lg sm:text-xl">Differentiated Learning</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Generate personalized worksheets and materials for diverse learning needs and abilities.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="p-4 sm:p-6">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                  <Lightbulb className="w-6 h-6 text-teal-600" />
                </div>
                <CardTitle className="text-lg sm:text-xl">Visual Aids</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Create engaging visual content and interactive materials to enhance student understanding.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="p-4 sm:p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-lg sm:text-xl">Local Content</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Access culturally relevant content and adapt materials to local contexts and languages.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="p-4 sm:p-6">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-emerald-600" />
                </div>
                <CardTitle className="text-lg sm:text-xl">Time Efficiency</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Automate repetitive tasks and focus more time on what matters most - your students.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="p-4 sm:p-6">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-teal-600" />
                </div>
                <CardTitle className="text-lg sm:text-xl">Knowledge Base</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Build and maintain a comprehensive repository of educational resources and materials.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Goals & Values Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-2">
              Our Mission & Values
            </h2>
            <p className="text-base sm:text-lg opacity-90 max-w-2xl mx-auto px-4">
              Bridging the digital divide and empowering educators worldwide with accessible AI technology.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center px-4 hover:transform hover:scale-105 transition-transform duration-200">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Target className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Accessibility</h3>
              <p className="opacity-90 text-sm sm:text-base">
                Making advanced AI tools accessible to educators in low-resource environments, regardless of technical expertise or connectivity.
              </p>
            </div>
            
            <div className="text-center px-4 hover:transform hover:scale-105 transition-transform duration-200">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Heart className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Empowerment</h3>
              <p className="opacity-90 text-sm sm:text-base">
                Empowering teachers to focus on what they do best - inspiring and educating students - by automating routine tasks.
              </p>
            </div>
            
            <div className="text-center px-4 hover:transform hover:scale-105 transition-transform duration-200">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Globe className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Global Impact</h3>
              <p className="opacity-90 text-sm sm:text-base">
                Creating a positive impact on education worldwide by supporting teachers in developing regions with innovative solutions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-green-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
              Transforming Education
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              See how Shiksha AI is making a difference in classrooms around the world.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            <div className="text-center px-2">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">80%</div>
              <div className="text-gray-600 text-sm sm:text-base">Time Saved on Planning</div>
            </div>
            <div className="text-center px-2">
              <div className="text-2xl sm:text-3xl font-bold text-emerald-600 mb-2">95%</div>
              <div className="text-gray-600 text-sm sm:text-base">Teacher Satisfaction</div>
            </div>
            <div className="text-center px-2">
              <div className="text-2xl sm:text-3xl font-bold text-teal-600 mb-2">60%</div>
              <div className="text-gray-600 text-sm sm:text-base">Improved Student Engagement</div>
            </div>
            <div className="text-center px-2">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">100+</div>
              <div className="text-gray-600 text-sm sm:text-base">Schools Supported</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-4xl mx-auto text-center px-3 sm:px-4 md:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
            Ready to Transform Your Teaching?
          </h2>
          <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 px-4">
            Join thousands of educators who are already using Shiksha AI to create better learning experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-green-600 text-green-600 hover:bg-green-600 hover:border-green-700">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Shiksha AI</h3>
            <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base px-4">
              Empowering educators with AI-powered teaching tools for a better tomorrow.
            </p>
            <div className="flex justify-center space-x-4 sm:space-x-6">
              <Link href="/login" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
                Login
              </Link>
              <Link href="/signup" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}