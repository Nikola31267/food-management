import { ArrowRight } from "lucide-react";
import { ShinyButton } from "./ui/shiny-button";

const CallToAction = () => {
  return (
    <section className="py-24 bg-purple-500 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold mb-6">
          Ready to Get Started?
        </h2>
        <p className="text-xl mb-10 text-purple-100">
          Start monitoring your data traffic today with our 14-day free trial.
          No credit card required.
        </p>
        <ShinyButton
          href="/sign-in"
          className="group px-10 py-5 bg-white text-purple-600 rounded-lg transition-all shadow-2xl hover:shadow-3xl flex items-center space-x-3 text-lg font-bold mx-auto"
        >
          <span>Start Free Trial</span>
          <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </ShinyButton>
      </div>
    </section>
  );
};

export default CallToAction;
