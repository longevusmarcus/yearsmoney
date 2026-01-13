import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import VoiceBubbleLogo from "@/components/VoiceBubbleLogo";

const Terms = () => {
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
          <h1 className="text-3xl font-cursive text-foreground">Terms of Service</h1>
        </div>

        <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Hara, you accept and agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">2. Service Description</h2>
            <p>
              Hara is a personal intuition tracking application that helps users document and reflect 
              on their gut feelings, decisions, and outcomes. The service is provided "as is" for 
              personal use.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">3. User Responsibilities</h2>
            <p>You agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate information during registration</li>
              <li>Maintain the confidentiality of your account credentials</li>
              <li>Use the service for lawful purposes only</li>
              <li>Not attempt to gain unauthorized access to the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">4. Privacy and Data</h2>
            <p>
              Your privacy is important to us. Please review our Privacy Policy to understand how 
              we collect, use, and protect your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">5. Service Modifications</h2>
            <p>
              We reserve the right to modify or discontinue the service at any time, with or without 
              notice. We shall not be liable to you or any third party for any modification, suspension, 
              or discontinuation of the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">6. Limitation of Liability</h2>
            <p>
              Hara is a personal development tool and should not be considered as professional medical, 
              psychological, or legal advice. Users should consult qualified professionals for such guidance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">7. Contact</h2>
            <p>
              For questions about these Terms of Service, please contact us at{" "}
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

export default Terms;
