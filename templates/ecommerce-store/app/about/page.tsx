import Image from 'next/image'
import { ShieldCheckIcon, TruckIcon, HeartIcon, StarIcon } from '@heroicons/react/24/outline'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const stats = [
  { name: 'Happy Customers', value: '50,000+' },
  { name: 'Products Sold', value: '1M+' },
  { name: 'Countries Served', value: '25+' },
  { name: 'Years in Business', value: '10+' },
]

const values = [
  {
    name: 'Quality First',
    description: 'We carefully curate every product to ensure the highest quality standards.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Fast Shipping',
    description: 'Lightning-fast delivery to get your products to you as quickly as possible.',
    icon: TruckIcon,
  },
  {
    name: 'Customer Love',
    description: 'Our customers are at the heart of everything we do.',
    icon: HeartIcon,
  },
  {
    name: 'Top Rated',
    description: 'Consistently rated 5 stars by our satisfied customers.',
    icon: StarIcon,
  },
]

const team = [
  {
    name: 'Sarah Johnson',
    role: 'CEO & Founder',
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
    bio: 'Sarah founded ShopNow with a vision to make online shopping simple and enjoyable for everyone.',
  },
  {
    name: 'Michael Chen',
    role: 'Head of Product',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
    bio: 'Michael leads our product team, ensuring we offer the best selection of quality items.',
  },
  {
    name: 'Emily Rodriguez',
    role: 'Customer Experience',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
    bio: 'Emily is passionate about creating amazing experiences for our customers every day.',
  },
  {
    name: 'David Kim',
    role: 'Head of Technology',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
    bio: 'David ensures our platform is fast, secure, and user-friendly for all our customers.',
  },
]

export default function AboutPage() {
  return (
    <>
      <Navbar />
      
      <main>
        <section className="relative py-24 bg-gradient-to-r from-primary-600 to-primary-800">
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop"
              alt="About us background"
              fill
              className="object-cover opacity-20"
            />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              About ShopNow
            </h1>
            <p className="text-xl text-gray-100 max-w-3xl mx-auto">
              We're on a mission to make online shopping simple, enjoyable, and accessible to everyone. 
              Since 2014, we've been connecting customers with amazing products from around the world.
            </p>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Our Story
                </h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    ShopNow began as a small idea in a garage in Silicon Valley. Our founder, Sarah Johnson, 
                    noticed that online shopping was becoming increasingly complicated and impersonal. She 
                    envisioned a platform where customers could easily discover great products while feeling 
                    confident about their purchases.
                  </p>
                  <p>
                    What started with just a handful of carefully selected products has grown into a 
                    comprehensive marketplace featuring thousands of items from trusted brands and emerging 
                    creators. We've maintained our commitment to quality, customer service, and innovation 
                    throughout our journey.
                  </p>
                  <p>
                    Today, we're proud to serve customers in over 25 countries, but we haven't forgotten 
                    our roots. Every decision we make is guided by our core values and our commitment to 
                    creating the best possible shopping experience.
                  </p>
                </div>
              </div>
              
              <div className="mt-12 lg:mt-0">
                <div className="relative h-96 rounded-lg overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=400&fit=crop"
                    alt="Our team at work"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                By the Numbers
              </h2>
              <p className="text-gray-600">
                Here's how we've grown over the years
              </p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.name} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 font-medium">
                    {stat.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Our Values
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                These principles guide everything we do and help us stay true to our mission
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value) => (
                <div key={value.name} className="text-center">
                  <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-8 w-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {value.name}
                  </h3>
                  <p className="text-gray-600">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Meet Our Team
              </h2>
              <p className="text-gray-600">
                The passionate people behind ShopNow
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member) => (
                <div key={member.name} className="text-center">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {member.name}
                  </h3>
                  <p className="text-primary-600 font-medium mb-3">
                    {member.role}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {member.bio}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-primary-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Start Shopping?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied customers who trust ShopNow for their online shopping needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/products" className="bg-white text-primary-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors">
                Browse Products
              </a>
              <a href="/contact" className="border border-white text-white hover:bg-white hover:text-primary-600 font-medium py-3 px-8 rounded-lg transition-colors">
                Contact Us
              </a>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  )
}