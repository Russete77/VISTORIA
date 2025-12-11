'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Building2, ArrowRight } from 'lucide-react'
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 text-neutral-600 hover:text-neutral-900 focus:outline-none"
        aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-[280px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200">
            <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-neutral-900">VistorIA Pro</span>
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-neutral-600 hover:text-neutral-900"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 p-4 space-y-1">
            <Link
              href="#features"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-3 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Recursos
            </Link>
            <Link
              href="#pricing"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-3 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Preços
            </Link>
            <Link
              href="/termos"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-3 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Termos
            </Link>
            <Link
              href="/privacidade"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-3 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Privacidade
            </Link>
          </nav>

          {/* Auth Actions */}
          <div className="p-4 border-t border-neutral-200 space-y-3">
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="outline" className="w-full" onClick={() => setIsOpen(false)}>
                  Entrar
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button className="w-full" onClick={() => setIsOpen(false)}>
                  Começar Grátis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center justify-between">
                <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Dashboard
                  </Button>
                </Link>
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
          </div>
        </div>
      </div>
    </>
  )
}
