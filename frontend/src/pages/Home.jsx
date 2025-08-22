import React from 'react'
import Logo from "../assets/logo.png"
import Land from "../assets/landing.jpeg"
import { Link as LinkIcon, Palette, LineChart, Users, Twitter, Instagram, Facebook } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="w-full border-b bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={Logo} alt="Lync logo" className="w-12 h-12 object-contain" />
            <span className="text-xl font-semibold">Lync</span>
          </div>

          <ul className="hidden md:flex gap-6 items-center">
            <li><a href="#" className="hover:text-blue-600">Features</a></li>
            <li><a href="#" className="hover:text-blue-600">Pricing</a></li>
            <li><a href="#" className="hover:text-blue-600">Examples</a></li>
            <li><a href="#" className="hover:text-blue-600">Resources</a></li>
            <li>
              <Link to="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                Sign Up
              </Link>
            </li>
            <li>
              <Link to="/login" className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-200 transition">
                Log In
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="w-full flex justify-center bg-gray-50">
        <div className="mx-auto max-w-6xl px-6 py-10 w-full">
          <div className="relative w-full h-[340px] md:h-[420px]">
            <img
              src={Land}
              alt="Landing"
              className="w-full h-full object-cover rounded-xl"
            />
            <div className="absolute inset-0 bg-black/40 rounded-xl" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-6">
              <h1 className="text-3xl md:text-5xl font-bold mb-4">
                Connect with your audience using a single link
              </h1>
              <p className="max-w-2xl mb-6 text-sm md:text-base">
                Create a personalized landing page that houses all your important links, so your followers can easily find and engage with your content.
              </p>
              <Link to="/signup" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Lync */}
      <section className="w-full flex justify-center">
        <div className="mx-auto max-w-6xl px-6 py-12 w-full">
          <div className="mb-8">
            <h2 className="font-bold text-2xl">Why Lync?</h2>
            <p className="text-gray-600">
              Lync offers a comprehensive solution for creators to manage their online presence effectively.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border rounded-xl p-4 hover:shadow-sm transition">
              <LinkIcon aria-hidden className="w-6 h-6" />
              <div className="mt-3">
                <h3 className="font-semibold text-lg">All your links in one place</h3>
                <p className="text-sm text-blue-500">
                  Share all your important links with a single, easy-to-remember URL.
                </p>
              </div>
            </div>

            <div className="border rounded-xl p-4 hover:shadow-sm transition">
              <Palette aria-hidden className="w-6 h-6" />
              <div className="mt-3">
                <h3 className="font-semibold text-lg">Customize your page</h3>
                <p className="text-sm text-blue-500">
                  Personalize your page with themes, backgrounds, and your own branding.
                </p>
              </div>
            </div>

            <div className="border rounded-xl p-4 hover:shadow-sm transition">
              <LineChart aria-hidden className="w-6 h-6" />
              <div className="mt-3">
                <h3 className="font-semibold text-lg">Track your performance</h3>
                <p className="text-sm text-blue-500">
                  Gain insights into audience engagement with clear analytics.
                </p>
              </div>
            </div>

            <div className="border rounded-xl p-4 hover:shadow-sm transition">
              <Users aria-hidden className="w-6 h-6" />
              <div className="mt-3">
                <h3 className="font-semibold text-lg">Connect with your audience</h3>
                <p className="text-sm text-blue-500">
                  Build stronger relationships by providing a central hub for your content.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto w-full border-t bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <ul className="flex items-center gap-6">
            <li><a className="text-gray-600 hover:text-blue-600" href="#">Terms of Service</a></li>
            <li><a className="text-gray-600 hover:text-blue-600" href="#">Privacy Policy</a></li>
            <li><a className="text-gray-600 hover:text-blue-600" href="#">Contact Us</a></li>
          </ul>

          <div className="flex items-center gap-5">
            <a href="#" aria-label="Twitter" className="text-gray-600 hover:text-blue-600">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" aria-label="Instagram" className="text-gray-600 hover:text-blue-600">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" aria-label="Facebook" className="text-gray-600 hover:text-blue-600">
              <Facebook className="w-5 h-5" />
            </a>
          </div>

          <div className="text-gray-500 text-sm">
            © {currentYear} Lync. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
