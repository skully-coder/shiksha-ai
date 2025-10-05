import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  FileText, 
  MessageCircle, 
  PenTool, 
  Calendar, 
  Globe,
  Users,
  Zap,
  ArrowRight,
  Star,
  CheckCircle
} from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: <Globe className="h-8 w-8 text-teal-600" />,
      title: "Local Content Generation",
      description: "Generate hyper-local, culturally relevant content in your local language with AI-powered analogies and farmer's tales."
    },
    {
      icon: <FileText className="h-8 w-8 text-teal-600" />,
      title: "Differentiated Worksheets",
      description: "Upload textbook photos and instantly generate multiple worksheet versions tailored to different grade levels."
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-teal-600" />,
      title: "AI Knowledge Base",
      description: "Get instant, simple explanations for complex student questions with easy-to-understand analogies."
    },
    {
      icon: <PenTool className="h-8 w-8 text-teal-600" />,
      title: "Visual Aid Generation",
      description: "Generate simple line drawings and charts that can be easily replicated on blackboards."
    },
    {
      icon: <Calendar className="h-8 w-8 text-teal-600" />,
      title: "AI Lesson Planner",
      description: "Create structured weekly lesson plans that save valuable time and improve teaching efficiency."
    },
    {
      icon: <Users className="h-8 w-8 text-teal-600" />,
      title: "Multi-Language Support",
      description: "Interact with AI in your preferred local language for better accessibility and understanding."
    }
  ];

  const stats = [
    { number: "143+", label: "Commits" },
    { number: "6", label: "Core Features" },
    { number: "100%", label: "Open Source" },
    { number: "2025", label: "Hacktoberfest" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Shiksha AI</span>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-teal-100 text-teal-800">
              Hacktoberfest 2025
            </Badge>
            <Link href="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-200">
            AI-Powered Teaching Assistant
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Empowering Educators in 
            <span className="text-blue-600"> Low-Resource</span> Environments
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Shiksha AI is an intelligent teaching assistant that automates daily tasks like lesson planning 
            and creates custom materials, accessible via a simple, intuitive interface.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Start Teaching Smarter
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="https://github.com/skully-coder/shiksha-ai" target="_blank">
              <Button size="lg" variant="outline">
                <Star className="mr-2 h-5 w-5" />
                Star on GitHub
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="text-3xl font-bold text-blue-600">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Educators
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built with Google's Gemini AI and modern web technologies to provide 
              comprehensive teaching assistance.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="mb-4">{feature.icon}</div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section className="py-20 bg-white/50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                Solving Real Educational Challenges
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Time Constraints</h4>
                    <p className="text-gray-600">Automate lesson planning and material creation</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Resource Scarcity</h4>
                    <p className="text-gray-600">Generate unlimited educational content on-demand</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Linguistic Diversity</h4>
                    <p className="text-gray-600">Multi-language support for local contexts</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Differentiated Learning</h4>
                    <p className="text-gray-600">Personalized content for different grade levels</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-teal-600 rounded-2xl p-8 text-white">
              <Zap className="h-12 w-12 mb-6" />
              <h4 className="text-2xl font-bold mb-4">Measurable Impact</h4>
              <ul className="space-y-3">
                <li>• Boost teacher efficiency by 60%</li>
                <li>• Improve educational quality</li>
                <li>• Enable personalized learning</li>
                <li>• Bridge the digital divide</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-6">
            Built with Modern Technology
          </h3>
          <p className="text-xl text-gray-600 mb-12">
            Powered by cutting-edge AI and web technologies for reliability and scalability.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: "Next.js", desc: "React Framework" },
              { name: "Gemini AI", desc: "Google AI Models" },
              { name: "Firebase", desc: "Backend Services" },
              { name: "Tailwind CSS", desc: "Modern Styling" }
            ].map((tech, index) => (
              <div key={index} className="text-center">
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h4 className="font-semibold text-gray-900">{tech.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{tech.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-teal-600 text-white">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h3 className="text-4xl font-bold mb-6">
            Ready to Transform Your Teaching?
          </h3>
          <p className="text-xl mb-8 opacity-90">
            Join educators worldwide who are already using AI to enhance their teaching experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="https://github.com/skully-coder/shiksha-ai" target="_blank">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                Contribute on GitHub
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <BookOpen className="h-6 w-6" />
                <span className="text-xl font-bold">Shiksha AI</span>
              </div>
              <p className="text-gray-400">
                Empowering educators with AI-powered teaching assistance.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2">
                <Link href="/login" className="block text-gray-400 hover:text-white">Login</Link>
                <Link href="/signup" className="block text-gray-400 hover:text-white">Sign Up</Link>
                <Link href="https://github.com/skully-coder/shiksha-ai" className="block text-gray-400 hover:text-white">GitHub</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Open Source</h4>
              <p className="text-gray-400 text-sm">
                This project is open source and welcomes contributions during Hacktoberfest 2025.
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Shiksha AI. Built with ❤️ for educators worldwide.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}