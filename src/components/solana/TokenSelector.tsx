import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface Token {
  symbol: string;
  mint: string;
  logoURI?: string;
}

const AVAILABLE_TOKENS: Token[] = [
  {
    symbol: 'SOL',
    mint: 'So11111111111111111111111111111111111111112',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
  },
  {
    symbol: 'USDC',
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png'
  },
  {
    symbol: 'USDT',
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png'
  }
];

interface TokenSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  isLoading?: boolean;
}

export function TokenSelector({ value, onValueChange, isLoading }: TokenSelectorProps) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-2 block">Select Token</label>
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={isLoading}
      >
        <SelectTrigger className="bg-trading-gray-light border-trading-gray-light">
          <SelectValue placeholder="Select a token" />
        </SelectTrigger>
        <SelectContent className="bg-[#F1F0FB] border-0">
          {AVAILABLE_TOKENS.map((token) => (
            <SelectItem 
              key={token.mint} 
              value={token.mint}
              className="hover:bg-[#E5DEFF] focus:bg-[#E5DEFF]"
            >
              <div className="flex items-center gap-2">
                {token.logoURI && (
                  <img
                    src={token.logoURI}
                    alt={token.symbol}
                    className="w-4 h-4 rounded-full"
                  />
                )}
                {token.symbol}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export { AVAILABLE_TOKENS };