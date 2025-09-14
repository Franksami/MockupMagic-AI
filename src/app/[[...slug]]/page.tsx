import { AuthTest } from "@/components/auth-test";
import Link from "next/link";
import { Wand2, ArrowRight } from "lucide-react";

interface PageProps {
  params: Promise<{
    slug?: string[];
  }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DynamicPage({ params, searchParams }: PageProps) {
  // Handle different route patterns
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const slug = resolvedParams.slug || [];
  
  // Log the route being accessed for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('Route accessed:', {
      slug,
      searchParams: resolvedSearchParams,
      fullPath: '/' + slug.join('/'),
    });
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            MockupMagic AI
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Transform your designs into professional mockups using AI. 
            Perfect for Whop sellers and digital creators looking to showcase their products.
          </p>
          {/* Debug info for development */}
          {process.env.NODE_ENV === 'development' && slug.length > 0 && (
            <div className="mt-4 text-sm text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <strong>Debug Info:</strong> Accessed via path: /{slug.join('/')}
            </div>
          )}
        </header>

        {/* Authentication Test Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            🔐 Authentication Status
          </h2>
          <AuthTest />
        </div>

        {/* Main Call-to-Action */}
        <div className="text-center mb-16">
          <Link
            href="/studio"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold text-lg rounded-xl hover:opacity-90 transition-all transform hover:scale-105 shadow-2xl"
            data-testid="start-creating-button"
          >
            <Wand2 className="w-6 h-6" />
            Start Creating Mockups
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-gray-300 mt-4 text-sm">
            Access the full AI-powered mockup generation studio
          </p>
        </div>

        <main className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-8 mb-12">
            <h2 className="text-3xl font-bold text-center mb-8 text-white">
              Get Started in 3 Simple Steps
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/80 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-2xl">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Upload Your Design</h3>
                <p className="text-gray-300">
                  Upload your product image, logo, or design that you want to mockup
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/80 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-2xl">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Choose Template</h3>
                <p className="text-gray-300">
                  Select from our AI-powered templates or describe your perfect mockup
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/80 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-2xl">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Generate & Download</h3>
                <p className="text-gray-300">
                  Get your professional mockup in seconds, ready for your Whop store
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-yellow-500/20 backdrop-blur-md border border-yellow-500/50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-yellow-300 mb-2">
                ✅ Whop Integration Complete!
              </h3>
              <p className="text-yellow-200">
                Authentication and user management is now working. 
                Full mockup generation features coming soon!
              </p>
            </div>

            <div className="bg-gray-500/20 backdrop-blur-md border border-gray-500/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-300 mb-4">
                Development Progress:
              </h3>
              <div className="text-left max-w-md mx-auto space-y-2">
                <div className="flex items-center">
                  <span className="w-4 h-4 bg-green-400 rounded-full mr-3"></span>
                  <span className="text-gray-300">Project Setup Complete</span>
                </div>
                <div className="flex items-center">
                  <span className="w-4 h-4 bg-green-400 rounded-full mr-3"></span>
                  <span className="text-gray-300">Database Schema Created</span>
                </div>
                <div className="flex items-center">
                  <span className="w-4 h-4 bg-green-400 rounded-full mr-3"></span>
                  <span className="text-gray-300">Whop Integration Complete</span>
                </div>
                <div className="flex items-center">
                  <span className="w-4 h-4 bg-green-400 rounded-full mr-3"></span>
                  <span className="text-gray-300">UI Components Complete</span>
                </div>
                <div className="flex items-center">
                  <span className="w-4 h-4 bg-yellow-400 rounded-full mr-3"></span>
                  <span className="text-gray-300">AI Integration (In Progress)</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
