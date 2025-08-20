'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Eye, 
  Code as CodeIcon, 
  ExternalLink,
  Sparkles,
  Globe,
  Smartphone,
  Palette
} from 'lucide-react';

interface DemoWebsiteProps {
  onTryDemo: (demoType: string) => void;
}

const demos = [
  {
    id: 'landing',
    title: 'Modern Landing Page',
    description: 'A beautiful, responsive landing page with hero section, features, and call-to-action',
    features: ['Hero Section', 'Feature Grid', 'Testimonials', 'Contact Form'],
    preview: '/demos/landing-preview.png',
    tags: ['Landing Page', 'Responsive', 'Modern']
  },
  {
    id: 'portfolio',
    title: 'Portfolio Website',
    description: 'Professional portfolio showcasing work, skills, and experience',
    features: ['About Section', 'Project Gallery', 'Skills Display', 'Contact Info'],
    preview: '/demos/portfolio-preview.png',
    tags: ['Portfolio', 'Professional', 'Showcase']
  },
  {
    id: 'ecommerce',
    title: 'E-commerce Store',
    description: 'Complete online store with product listings, cart, and checkout',
    features: ['Product Grid', 'Shopping Cart', 'Checkout Flow', 'User Dashboard'],
    preview: '/demos/ecommerce-preview.png',
    tags: ['E-commerce', 'Shopping', 'Products']
  },
  {
    id: 'blog',
    title: 'Personal Blog',
    description: 'Clean and elegant blog with article management and reader engagement',
    features: ['Article Layout', 'Category System', 'Search Function', 'Comments'],
    preview: '/demos/blog-preview.png',
    tags: ['Blog', 'Content', 'Reading']
  }
];

export default function DemoWebsite({ onTryDemo }: DemoWebsiteProps) {
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Try Our Demos</h3>
        <p className="text-gray-600 max-w-2xl mx-auto">
          See what's possible with Open Lovable. Click on any demo below to generate a complete website instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {demos.map((demo) => (
          <div
            key={demo.id}
            className={`border-2 rounded-xl p-6 transition-all duration-200 cursor-pointer ${
              selectedDemo === demo.id
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
            onClick={() => setSelectedDemo(demo.id)}
          >
            {/* Demo Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{demo.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{demo.description}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
            </div>

            {/* Features */}
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Features:</h5>
              <div className="flex flex-wrap gap-2">
                {demo.features.map((feature, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                  >
                    <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {demo.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onTryDemo(demo.id);
                }}
              >
                <CodeIcon className="w-4 h-4 mr-2" />
                Generate
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                className="px-3"
                onClick={(e) => {
                  e.stopPropagation();
                  // Preview functionality would go here
                }}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Demo Info */}
      {selectedDemo && (
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
          <div className="flex items-center space-x-3 mb-4">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <h4 className="text-lg font-semibold text-gray-900">
              Ready to generate: {demos.find(d => d.id === selectedDemo)?.title}
            </h4>
          </div>
          
          <p className="text-gray-700 mb-4">
            This will create a complete, production-ready website with all the features listed above. 
            The AI will generate clean, modern code using React and Tailwind CSS.
          </p>
          
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => onTryDemo(selectedDemo)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <CodeIcon className="w-4 h-4 mr-2" />
              Generate Now
            </Button>
            
            <Button variant="outline" onClick={() => setSelectedDemo(null)}>
              Choose Different Demo
            </Button>
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
          <Smartphone className="w-4 h-4" />
          <span>All demos are fully responsive</span>
          <span>•</span>
          <Palette className="w-4 h-4" />
          <span>Customizable colors and themes</span>
          <span>•</span>
          <CodeIcon className="w-4 h-4" />
          <span>Clean, production-ready code</span>
        </div>
      </div>
    </div>
  );
}

// Helper component for the checkmark icon
function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}