import React, { useState } from 'react'
import { AlertCircle, CheckCircle, Copy, Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

export function AuthHelper({ onFillCredentials }: AuthHelperProps) {
  const [showCredentials, setShowCredentials] = useState(false)
  
  const testAccounts = [
    {
      type: 'Buyer Account',
      email: 'dgtupbqp@minimax.com',
      password: '3EfUSVm9l2',
      description: 'For testing product browsing and purchasing'
    },
    {
      type: 'Seller Account', 
      email: 'seller@demo.org',
      password: 'demo123',
      description: 'For testing live sessions and product posting'
    }
  ]
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6"
    >
      <div className="flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-amber-800 mb-2">
            Test Accounts Available
          </h3>
          <p className="text-amber-700 text-sm mb-3">
            Use these test accounts for immediate access, or create your own account with any email address.
          </p>
          
          <div className="flex items-center space-x-2 mb-3">
            <button
              onClick={() => setShowCredentials(!showCredentials)}
              className="flex items-center text-sm font-medium text-amber-700 hover:text-amber-800 transition-colors"
            >
              {showCredentials ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              {showCredentials ? 'Hide' : 'Show'} Test Accounts
            </button>
          </div>
          
          {showCredentials && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              {testAccounts.map((account, index) => (
                <div key={index} className="bg-white rounded-lg p-3 border border-amber-200">
                  <button
                    onClick={() => onFillCredentials(account.email, account.password)}
                    className="flex items-center justify-between w-full mb-2 group"
                  >
                    <h4 className="font-medium text-gray-900 group-hover:text-purple-600 transition-colors">{account.type}</h4>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </button>
                  <p className="text-xs text-gray-600 mb-2">{account.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono text-gray-700">{account.email}</span>
                      <button
                        onClick={() => copyToClipboard(account.email, 'Email')}
                        className="text-amber-600 hover:text-amber-700 transition-colors"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono text-gray-700">{account.password}</span>
                      <button
                        onClick={() => copyToClipboard(account.password, 'Password')}
                        className="text-amber-600 hover:text-amber-700 transition-colors"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
          
          <div className="mt-3 text-xs text-amber-600">
            <strong>Note:</strong> All email domains are now supported. You can sign up with any valid email address.
          </div>
        </div>
      </div>
    </motion.div>
  )
}
