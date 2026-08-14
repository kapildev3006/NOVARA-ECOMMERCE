import { AddressSection } from "@/components/checkout/AddressSection";

export default function AddressesPage() {
  return (
    <div>
      <h2 className="text-2xl font-heading font-bold mb-1">Addresses</h2>
      <p className="text-muted mb-8 text-sm">Manage your saved delivery addresses.</p>
      
      <div className="max-w-3xl">
        <AddressSection isAccountMode={true} />
      </div>
    </div>
  );
}
