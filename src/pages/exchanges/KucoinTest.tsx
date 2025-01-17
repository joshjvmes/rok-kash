import { KucoinAccountInfo } from "@/components/KucoinAccountInfo";
import { KucoinTransfer } from "@/components/KucoinTransfer";
import { PhantomWallet } from "@/components/PhantomWallet";

export default function KucoinTest() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex justify-end mb-4">
        <PhantomWallet />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KucoinAccountInfo />
        <KucoinTransfer />
      </div>
    </div>
  );
}