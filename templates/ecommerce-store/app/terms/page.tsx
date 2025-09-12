import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function TermsPage() {
  return (
    <>
      <Navbar />
      
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
            
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-8">
                <strong>Last updated:</strong> December 1, 2024
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
                <p className="text-gray-600 mb-4">
                  By accessing and using ShopNow ("we," "our," or "us"), you accept and agree to be bound by the terms and provision of this agreement. These Terms of Service govern your use of our website and services.
                </p>
                <p className="text-gray-600">
                  If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Use License</h2>
                <p className="text-gray-600 mb-4">
                  Permission is granted to temporarily download one copy of the materials on ShopNow for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul className="text-gray-600 mb-4 pl-6 space-y-2">
                  <li>• modify or copy the materials</li>
                  <li>• use the materials for any commercial purpose or for any public display</li>
                  <li>• attempt to reverse engineer any software contained on the website</li>
                  <li>• remove any copyright or other proprietary notations from the materials</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Account Registration</h2>
                <p className="text-gray-600 mb-4">
                  To access certain features of our service, you may be required to create an account. You agree to:
                </p>
                <ul className="text-gray-600 mb-4 pl-6 space-y-2">
                  <li>• Provide accurate, current, and complete information</li>
                  <li>• Maintain and update your information</li>
                  <li>• Keep your password secure and confidential</li>
                  <li>• Accept responsibility for all activities under your account</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Orders and Payments</h2>
                <p className="text-gray-600 mb-4">
                  When you place an order through our service:
                </p>
                <ul className="text-gray-600 mb-4 pl-6 space-y-2">
                  <li>• All orders are subject to acceptance and availability</li>
                  <li>• We reserve the right to refuse or cancel any order</li>
                  <li>• Payment must be received before order processing</li>
                  <li>• Prices are subject to change without notice</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Shipping and Delivery</h2>
                <p className="text-gray-600 mb-4">
                  We will make reasonable efforts to deliver your order within the estimated timeframe. However, delivery times are estimates and we are not liable for any delays caused by shipping carriers or circumstances beyond our control.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Returns and Refunds</h2>
                <p className="text-gray-600 mb-4">
                  We offer a 30-day return policy for most items. Items must be in original condition with tags attached. Certain items may not be eligible for return due to hygiene or safety reasons.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibent text-gray-900 mb-4">7. Privacy Policy</h2>
                <p className="text-gray-600 mb-4">
                  Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service, to understand our practices.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Prohibited Uses</h2>
                <p className="text-gray-600 mb-4">
                  You may not use our service:
                </p>
                <ul className="text-gray-600 mb-4 pl-6 space-y-2">
                  <li>• For any unlawful purpose or to solicit others to perform unlawful acts</li>
                  <li>• To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                  <li>• To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                  <li>• To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                  <li>• To submit false or misleading information</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Disclaimer</h2>
                <p className="text-gray-600 mb-4">
                  The information on this website is provided on an "as is" basis. To the fullest extent permitted by law, we exclude all representations, warranties, and conditions relating to our website and the use of this website.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Limitation of Liability</h2>
                <p className="text-gray-600 mb-4">
                  In no event shall ShopNow or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on ShopNow's website.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Governing Law</h2>
                <p className="text-gray-600 mb-4">
                  These terms and conditions are governed by and construed in accordance with the laws of the United States and you irrevocably submit to the exclusive jurisdiction of the courts in that state or location.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to Terms</h2>
                <p className="text-gray-600 mb-4">
                  We reserve the right to modify these terms at any time. We will notify users of any material changes. Your continued use of the service after such modifications constitutes acceptance of the updated terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Information</h2>
                <p className="text-gray-600 mb-4">
                  If you have any questions about these Terms of Service, please contact us at:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg text-gray-600">
                  <p><strong>Email:</strong> legal@shopnow.com</p>
                  <p><strong>Address:</strong> 123 Commerce Street, New York, NY 10001</p>
                  <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  )
}