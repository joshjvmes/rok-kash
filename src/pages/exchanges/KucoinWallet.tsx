import { KucoinAccountInfo } from "@/components/KucoinAccountInfo";
import { KucoinTransfer } from "@/components/KucoinTransfer";

export default function KucoinWallet() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KucoinAccountInfo />
        <KucoinTransfer />
      </div>
    </div>
  );
}