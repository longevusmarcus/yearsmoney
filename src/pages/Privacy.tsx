import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import VoiceBubbleLogo from "@/components/VoiceBubbleLogo";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link 
          to="/auth" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <VoiceBubbleLogo size="sm" />
          <h1 className="text-3xl font-cursive text-foreground">Privacy Policy</h1>
        </div>

        <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">1. Information We Collect</h2>
            <p>We collect information that you provide directly to us, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account information (nickname, email address)</li>
              <li>Gut feeling check-ins and related notes</li>
              <li>Voice recordings and transcriptions (if you use voice features)</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Generate personalized insights and patterns</li>
              <li>Communicate with you about the service</li>
              <li>Protect against fraudulent or unauthorized activity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">3. Data Storage and Security</h2>
            <p>
              Your data is stored securely using industry-standard encryption. We implement appropriate 
              technical and organizational measures to protect your personal information against unauthorized 
              access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">4. Data Sharing</h2>
            <p>
              We do not sell your personal information. We may share your information only in the 
              following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>With your explicit consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and safety</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">6. Voice Data</h2>
            <p>
              Voice recordings are processed to provide transcription and analysis services. We use 
              third-party AI services for transcription, and recordings are not permanently stored 
              after processing unless required for service functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">7. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes 
              by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">8. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our data practices, please contact 
              us at{" "}
              <a href="mailto:privacy@rocketminds.co" className="text-primary hover:underline">
                privacy@rocketminds.co
              </a>
            </p>
          </section>

          <p className="text-sm text-muted-foreground/70 pt-6 border-t border-border">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
