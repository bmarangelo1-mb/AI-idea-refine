import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Skeleton Loading Component
function SkeletonCard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Skeleton */}
      <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-2xl shadow-sm border border-gray-100 p-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded-lg w-3/4 mb-4"></div>
        <div className="h-5 bg-gray-200 rounded-lg w-full mb-2"></div>
        <div className="h-5 bg-gray-200 rounded-lg w-5/6"></div>
      </div>

      {/* Two Column Skeleton */}
      <div className="grid md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded-lg w-24 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        ))}
      </div>

      {/* List Skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded-lg w-32 mb-6"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex items-start gap-3">
                <div className="h-2 w-2 bg-gray-200 rounded-full mt-2"></div>
                <div className="flex-1 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function App() {
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!idea.trim()) {
      setError('Please enter an idea to refine');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/api/refine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idea: idea.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to refine idea');
      }

      // Validate response structure
      const requiredFields = [
        'title',
        'short_description',
        'problem',
        'solution',
        'core_features',
        'mvp_scope',
        'suggested_tech_stack',
        'next_steps',
      ];

      const isValid = requiredFields.every((field) => data[field] !== undefined);

      if (!isValid) {
        throw new Error('Invalid response structure from server');
      }

      setResult(data);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIdea('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-8 sm:mb-12 lg:mb-16 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-3 sm:mb-4 tracking-tight">
            AI Idea Refinery
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
            Transform your rough ideas into structured product plans powered by AI
          </p>
        </header>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Input Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 lg:p-10 mb-6 sm:mb-8 animate-slide-up transition-shadow duration-300 hover:shadow-md">
            <form onSubmit={handleSubmit}>
              <label htmlFor="idea" className="block text-sm font-semibold text-gray-900 mb-3 tracking-wide">
                Your Idea
              </label>
              <textarea
                id="idea"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Describe your product idea in a few sentences..."
                className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-300 mb-6 min-h-[160px] text-gray-900 placeholder-gray-400 leading-relaxed text-[15px] focus:shadow-sm"
                disabled={loading}
              />
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="submit"
                  disabled={loading || !idea.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md disabled:shadow-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2.5">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Refining...
                    </span>
                  ) : (
                    'Refine Idea'
                  )}
                </button>
                
                {result && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-6 py-3.5 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    Start Over
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50/80 border border-red-200 text-red-900 rounded-xl p-4 sm:p-5 mb-6 sm:mb-8 animate-slide-up shadow-sm">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold text-red-900">Error</p>
                  <p className="text-sm mt-1.5 text-red-800 leading-relaxed">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && !result && <SkeletonCard />}

          {/* Results */}
          {result && (
            <div className="space-y-6 sm:space-y-8 animate-fade-in">
              {/* Title & Description */}
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl shadow-sm border border-blue-100/50 p-6 sm:p-8 lg:p-10 animate-slide-up transition-all duration-300">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 tracking-tight leading-tight">{result.title}</h2>
                <p className="text-base sm:text-lg text-gray-700 leading-relaxed">{result.short_description}</p>
              </div>

              {/* Problem & Solution */}
              <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
                <div className="bg-white rounded-xl shadow-sm border-l-4 border-l-red-500 border border-gray-100 p-6 sm:p-7 animate-slide-up transition-all duration-300 hover:shadow-md">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
                    <span className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center text-red-600 font-bold text-sm shadow-sm">!</span>
                    <span>Problem</span>
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-[15px]">{result.problem}</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border-l-4 border-l-green-500 border border-gray-100 p-6 sm:p-7 animate-slide-up transition-all duration-300 hover:shadow-md">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
                    <span className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center text-green-600 font-bold text-sm shadow-sm">✓</span>
                    <span>Solution</span>
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-[15px]">{result.solution}</p>
                </div>
              </div>

              {/* Core Features */}
              <div className="bg-white rounded-xl shadow-sm border-l-4 border-l-blue-500 border border-gray-100 p-6 sm:p-7 animate-slide-up transition-all duration-300 hover:shadow-md">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-5 sm:mb-6 flex items-center gap-3">
                  <span className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-base shadow-sm">⚡</span>
                  <span>Core Features</span>
                </h3>
                <ul className="space-y-3.5">
                  {result.core_features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3.5 text-gray-700 group">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mt-2.5 flex-shrink-0 group-hover:scale-125 transition-transform duration-200"></span>
                      <span className="text-[15px] leading-relaxed flex-1">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* MVP Scope */}
              <div className="bg-white rounded-xl shadow-sm border-l-4 border-l-purple-500 border border-gray-100 p-6 sm:p-7 animate-slide-up transition-all duration-300 hover:shadow-md">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-5 sm:mb-6 flex items-center gap-3">
                  <span className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold text-base shadow-sm">🎯</span>
                  <span>MVP Scope</span>
                </h3>
                <ul className="space-y-3.5">
                  {result.mvp_scope.map((item, index) => (
                    <li key={index} className="flex items-start gap-3.5 text-gray-700 group">
                      <span className="w-2 h-2 bg-purple-600 rounded-full mt-2.5 flex-shrink-0 group-hover:scale-125 transition-transform duration-200"></span>
                      <span className="text-[15px] leading-relaxed flex-1">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tech Stack */}
              <div className="bg-white rounded-xl shadow-sm border-l-4 border-l-orange-500 border border-gray-100 p-6 sm:p-7 animate-slide-up transition-all duration-300 hover:shadow-md">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-5 sm:mb-6 flex items-center gap-3">
                  <span className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-bold text-base shadow-sm">🔧</span>
                  <span>Suggested Tech Stack</span>
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {result.suggested_tech_stack.map((tech, index) => (
                    <span
                      key={index}
                      className="px-3.5 py-2 bg-gradient-to-br from-orange-50 to-amber-50 text-orange-700 rounded-lg text-sm font-medium border border-orange-200/60 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-white rounded-xl shadow-sm border-l-4 border-l-indigo-500 border border-gray-100 p-6 sm:p-7 animate-slide-up transition-all duration-300 hover:shadow-md">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-5 sm:mb-6 flex items-center gap-3">
                  <span className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-base shadow-sm">📋</span>
                  <span>Next Steps</span>
                </h3>
                <ol className="space-y-4">
                  {result.next_steps.map((step, index) => (
                    <li key={index} className="flex items-start gap-4 text-gray-700 group">
                      <span className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-200">
                        {index + 1}
                      </span>
                      <span className="pt-0.5 text-[15px] leading-relaxed flex-1">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 sm:mt-16 lg:mt-20 text-center text-gray-500 text-sm">
          <p className="tracking-wide">Powered by OpenAI • Built with React + Express</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
