import { Truck, ShieldCheck, RefreshCw } from "lucide-react";

export function DeliveryInfo() {
  return (
    <div className="mt-8 pt-8 border-t border-black/5 flex flex-col gap-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0 text-primary">
          <Truck className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground mb-1">Fast Delivery</h4>
          <p className="text-sm text-muted">Get your order delivered securely to your doorstep.</p>
        </div>
      </div>
      
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0 text-primary">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground mb-1">Secure Payments</h4>
          <p className="text-sm text-muted">All transactions are secured with industry standard encryption.</p>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0 text-primary">
          <RefreshCw className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground mb-1">Easy Returns</h4>
          <p className="text-sm text-muted">Hassle-free return policy within 14 days of purchase.</p>
        </div>
      </div>
    </div>
  );
}
