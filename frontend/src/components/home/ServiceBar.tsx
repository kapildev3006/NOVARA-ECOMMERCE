import { Truck, ShieldCheck, RefreshCcw, HeadphonesIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "Orders over $50",
    iconClassName: "text-foreground",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    description: "100% secure checkout",
    iconClassName: "text-[#1E5C4F]", // Trust accent
  },
  {
    icon: RefreshCcw,
    title: "Easy Returns",
    description: "30-day return policy",
    iconClassName: "text-foreground",
  },
  {
    icon: HeadphonesIcon,
    title: "24/7 Support",
    description: "Always here to help",
    iconClassName: "text-foreground",
  },
];

export function ServiceBar() {
  return (
    <section className="bg-white border-y border-black/5 py-10 md:py-12">
      <div className="mx-auto max-w-[1248px] px-4 md:px-8 lg:px-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-10">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
              <div className="shrink-0 p-3 bg-surface rounded-full flex items-center justify-center">
                <feature.icon className={cn("w-6 h-6 stroke-[1.5]", feature.iconClassName)} />
              </div>
              <div className="flex flex-col">
                <h3 className="font-heading font-bold text-foreground mb-1">{feature.title}</h3>
                <p className="text-sm text-muted">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
