import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import VoiceBubbleLogo from "@/components/VoiceBubbleLogo";

const Cookie = () => {
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
          <h1 className="text-3xl font-cursive text-foreground">Cookie Policy</h1>
        </div>

        <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">1. What Are Cookies</h2>
            <p>
              Cookies are small text files that are stored on your device when you visit Hara. 
              They help us provide you with a better experience by remembering your preferences 
              and understanding how you use our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">2. How We Use Cookies</h2>
            <p>We use cookies for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Authentication: To keep you logged in and secure your session</li>
              <li>Preferences: To remember your settings and choices</li>
              <li>Analytics: To understand how you use our service and improve it</li>
              <li>Performance: To ensure our service runs smoothly and efficiently</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">3. Types of Cookies We Use</h2>
            <p>
              <strong className="text-foreground">Essential Cookies:</strong> These are necessary for the service to function 
              properly. They enable basic features like authentication and secure access.
            </p>
            <p className="mt-3">
              <strong className="text-foreground">Analytics Cookies:</strong> These help us understand how visitors interact 
              with our service by collecting anonymous information.
            </p>
            <p className="mt-3">
              <strong className="text-foreground">Preference Cookies:</strong> These remember your choices and settings to 
              provide a personalized experience.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">4. Third-Party Cookies</h2>
            <p>
              We may use third-party services that set cookies on your device to help us provide 
              and improve our service. These include analytics providers and authentication services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">5. Managing Cookies</h2>
            <p>
              You can control and manage cookies in your browser settings. However, please note 
              that disabling cookies may affect the functionality of Hara and prevent you from 
              accessing certain features.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">6. Updates to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time. Any changes will be posted on 
              this page with an updated revision date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-3">7. Contact</h2>
            <p>
              For questions about this Cookie Policy, please contact us at{" "}
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

export default Cookie;
