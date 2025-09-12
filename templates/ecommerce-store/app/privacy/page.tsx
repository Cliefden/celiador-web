import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
            
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-8">
                <strong>Last updated:</strong> December 1, 2024
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
                <p className="text-gray-600 mb-4">
                  At ShopNow, we respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Personal Information</h3>
                <p className="text-gray-600 mb-4">
                  We may collect the following personal information from you:
                </p>
                <ul className="text-gray-600 mb-4 pl-6 space-y-2">
                  <li>• Name and contact information (email address, phone number, postal address)</li>
                  <li>• Account credentials (username, password)</li>
                  <li>• Payment information (credit card details, billing address)</li>
                  <li>• Order history and preferences</li>
                  <li>• Communication preferences</li>
                </ul>
                
                <h3 className="text-lg font-medium text-gray-900 mb-3">Automatically Collected Information</h3>
                <ul className="text-gray-600 mb-4 pl-6 space-y-2">
                  <li>• IP address and device information</li>
                  <li>• Browser type and version</li>
                  <li>• Pages visited and time spent on our website</li>
                  <li>• Referring website addresses</li>
                  <li>• Cookies and similar tracking technologies</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
                <p className="text-gray-600 mb-4">
                  We use your personal information for the following purposes:
                </p>
                <ul className="text-gray-600 mb-4 pl-6 space-y-2">
                  <li>• To process and fulfill your orders</li>
                  <li>• To communicate with you about your orders and account</li>
                  <li>• To provide customer support</li>
                  <li>• To improve our website and services</li>
                  <li>• To send you marketing communications (with your consent)</li>
                  <li>• To comply with legal obligations</li>
                  <li>• To detect and prevent fraud</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing</h2>
                <p className="text-gray-600 mb-4">
                  We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:
                </p>
                <ul className="text-gray-600 mb-4 pl-6 space-y-2">
                  <li>• With service providers who help us operate our business</li>
                  <li>• With payment processors to complete transactions</li>
                  <li>• With shipping companies to deliver your orders</li>
                  <li>• When required by law or to protect our rights</li>
                  <li>• In connection with a business transfer or merger</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
                <p className="text-gray-600 mb-4">
                  We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
                </p>
                <ul className="text-gray-600 mb-4 pl-6 space-y-2">
                  <li>• SSL encryption for data transmission</li>
                  <li>• Secure servers and databases</li>
                  <li>• Regular security audits and updates</li>
                  <li>• Limited access to personal information by authorized personnel</li>
                  <li>• Employee training on data protection practices</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cookies and Tracking Technologies</h2>
                <p className="text-gray-600 mb-4">
                  We use cookies and similar technologies to enhance your browsing experience. These technologies help us:
                </p>
                <ul className="text-gray-600 mb-4 pl-6 space-y-2">
                  <li>• Remember your preferences and settings</li>
                  <li>• Keep you logged into your account</li>
                  <li>• Analyze website traffic and usage patterns</li>
                  <li>• Provide personalized content and recommendations</li>
                  <li>• Measure the effectiveness of our marketing campaigns</li>
                </ul>
                <p className="text-gray-600">
                  You can control cookie settings through your browser preferences.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Privacy Rights</h2>
                <p className="text-gray-600 mb-4">
                  Depending on your location, you may have the following rights regarding your personal information:
                </p>
                <ul className="text-gray-600 mb-4 pl-6 space-y-2">
                  <li>• Right to access your personal data</li>
                  <li>• Right to correct inaccurate information</li>
                  <li>• Right to delete your personal data</li>
                  <li>• Right to restrict processing of your data</li>
                  <li>• Right to data portability</li>
                  <li>• Right to object to certain processing activities</li>
                  <li>• Right to withdraw consent</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Retention</h2>
                <p className="text-gray-600 mb-4">
                  We retain your personal information only for as long as necessary to fulfill the purposes for which it was collected, including:
                </p>
                <ul className="text-gray-600 mb-4 pl-6 space-y-2">
                  <li>• Account information: Until you delete your account</li>
                  <li>• Order information: For 7 years for tax and legal purposes</li>
                  <li>• Marketing communications: Until you unsubscribe</li>
                  <li>• Website analytics: Up to 26 months</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Third-Party Links</h2>
                <p className="text-gray-600 mb-4">
                  Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of these external sites. We encourage you to review the privacy policies of any third-party sites you visit.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Children's Privacy</h2>
                <p className="text-gray-600 mb-4">
                  Our services are not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will take steps to delete it promptly.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. International Data Transfers</h2>
                <p className="text-gray-600 mb-4">
                  Your personal information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards to protect your information.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to This Privacy Policy</h2>
                <p className="text-gray-600 mb-4">
                  We may update this privacy policy from time to time. We will notify you of any material changes by posting the new policy on our website and updating the "Last updated" date. Your continued use of our services after such changes constitutes acceptance of the updated policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Us</h2>
                <p className="text-gray-600 mb-4">
                  If you have any questions about this privacy policy or our privacy practices, please contact us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg text-gray-600">
                  <p><strong>Email:</strong> privacy@shopnow.com</p>
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