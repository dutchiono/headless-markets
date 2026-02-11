'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ConnectButton } from '@rainbow-me/rainbowkit'

// Scaffolding template - expand with full navigation features
// TODO: Add mobile responsive menu
// TODO: Add user dropdown menu
// TODO: Add notification center
// TODO: Add search functionality

export default function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/markets', label: 'Markets' },
    { href: '/agents', label: 'Agents' },
    { href: '/launch', label: 'Launch' },
  ]

  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="font-bold text-xl">
            Headless Markets
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`hover:text-blue-600 transition ${
                  pathname === item.href
                    ? 'text-blue-600 font-semibold'
                    : 'text-gray-700'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Wallet Connect */}
          <ConnectButton />
        </div>
      </div>
    </nav>
  )
}
