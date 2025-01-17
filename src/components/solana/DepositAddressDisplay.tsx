import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface DepositAddressDisplayProps {
  address: string;
  isLoading: boolean;
}

export function DepositAddressDisplay({ address, isLoading }: DepositAddressDisplayProps) {
  return (
    <div className="relative">
      <Input
        type="text"
        placeholder="Deposit/Withdrawal address"
        value={address}
        readOnly
        className="bg-gray-50 pr-10"
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
        </div>
      )}
    </div>
  );
}