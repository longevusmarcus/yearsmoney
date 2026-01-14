import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link 
          to="/about" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <h1 className="text-3xl font-cursive text-foreground mb-8">Terms of Service</h1>

        <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Years, you accept and agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">2. Service Description</h2>
            <p>
              Years is a personal finance visualization tool that helps users understand their wealth 
              in terms of time. The service calculates your Life Buffer—how long you could sustain 
              your lifestyle without income—and converts purchases into hours of life.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">3. User Responsibilities</h2>
            <p>You agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate financial information for calculations</li>
              <li>Maintain the confidentiality of your account credentials</li>
              <li>Use the service for personal, non-commercial purposes</li>
              <li>Not attempt to gain unauthorized access to the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">4. Financial Disclaimer</h2>
            <p>
              Years provides educational insights and calculations only. We are not financial advisors. 
              The information provided should not be considered as professional financial, investment, 
              or tax advice. Please consult qualified professionals for financial guidance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">5. Privacy and Data</h2>
            <p>
              Your privacy is important to us. Financial data you enter is stored locally on your device. 
              Please review our Privacy Policy to understand how we collect and protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">6. Service Modifications</h2>
            <p>
              We reserve the right to modify or discontinue the service at any time. We shall not be 
              liable for any modification, suspension, or discontinuation of the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">7. Contact</h2>
            <p>
              For questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:hello@years.money" className="text-primary hover:underline">
                hello@years.money
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
