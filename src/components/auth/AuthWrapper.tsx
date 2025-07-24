import React, { useState } from 'react'
import { LoginForm } from './LoginForm'
import { SignUpForm } from './SignUpForm'
import { AuthHelper } from './AuthHelper'
import { ShoppingBag, Zap, Users, Star } from 'lucide-react'

export function AuthWrapper() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [prefillEmail, setPrefillEmail] = useState('')
  const [prefillPassword, setPrefillPassword] = useState('')

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login')
    setPrefillEmail('') // Clear prefill when toggling mode
    setPrefillPassword('')
  }

  const handleFillCredentials = (email: string, password: string) => {
    setPrefillEmail(email)
    setPrefillPassword(password)
    setMode('login') // Switch to login form if not already
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left side - Branding */}
        <div className="lg:w-1/2 flex items-center justify-center p-8">
          <div className="text-white text-center lg:text-left max-w-lg">
            <div className="flex items-center justify-center lg:justify-start mb-8">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                <ShoppingBag className="h-8 w-8 text-white" />
              </div>
              <span className="ml-3 text-2xl font-bold">LiveMarket</span>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              Live Shopping.
              <br />
              <span className="text-yellow-300">Real Connections.</span>
            </h1>
            
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Join live shopping sessions where sellers showcase products in real-time 
              and buyers discover amazing deals through interactive conversations.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm mb-3 inline-block">
                  <Zap className="h-6 w-6 text-yellow-300" />
                </div>
                <h3 className="font-semibold mb-1">Real-Time</h3>
                <p className="text-sm text-white/80">Live chat & instant updates</p>
              </div>
              
              <div className="text-center">
                <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm mb-3 inline-block">
                  <Users className="h-6 w-6 text-yellow-300" />
                </div>
                <h3 className="font-semibold mb-1">Community</h3>
                <p className="text-sm text-white/80">Connect with sellers directly</p>
              </div>
              
              <div className="text-center">
                <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm mb-3 inline-block">
                  <Star className="h-6 w-6 text-yellow-300" />
                </div>
                <h3 className="font-semibold mb-1">Discover</h3>
                <p className="text-sm text-white/80">Find unique products</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side - Auth Forms */}
        <div className="lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <AuthHelper onFillCredentials={handleFillCredentials} />
            {mode === 'login' ? (
              <LoginForm onToggleMode={toggleMode} prefillEmail={prefillEmail} prefillPassword={prefillPassword} />
            ) : (
              <SignUpForm onToggleMode={toggleMode} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
