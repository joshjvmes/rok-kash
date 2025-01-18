import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "npm:@solana/web3.js"
import { TOKEN_PROGRAM_ID, createTransferInstruction, getAssociatedTokenAddress } from "npm:@solana/spl-token"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com'
const connection = new Connection(SOLANA_RPC_URL, 'confirmed')

// Common token definitions
const TRACKED_TOKENS = [
  {
    symbol: 'USDC',
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6
  },
  {
    symbol: 'USDT',
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6
  }
]

async function getSolBalance(walletAddress: string): Promise<number> {
  console.log('Fetching SOL balance for:', walletAddress)
  try {
    const publicKey = new PublicKey(walletAddress)
    const balance = await connection.getBalance(publicKey)
    const solBalance = balance / LAMPORTS_PER_SOL
    console.log('SOL balance:', solBalance)
    return solBalance
  } catch (error) {
    console.error('Error getting SOL balance:', error)
    throw error
  }
}

async function getTokenBalance(tokenMint: string, walletAddress: string) {
  console.log(`Fetching balance for token ${tokenMint} and wallet ${walletAddress}`)
  try {
    const walletPubkey = new PublicKey(walletAddress)
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      walletPubkey,
      {
        programId: TOKEN_PROGRAM_ID,
      }
    )

    const tokenAccount = tokenAccounts.value.find(
      (account) => account.account.data.parsed.info.mint === tokenMint
    )

    if (tokenAccount) {
      const parsedInfo = tokenAccount.account.data.parsed.info
      return {
        mint: tokenMint,
        balance: parsedInfo.tokenAmount.amount,
        decimals: parsedInfo.tokenAmount.decimals
      }
    }

    return {
      mint: tokenMint,
      balance: '0',
      decimals: 6
    }
  } catch (error) {
    console.error('Error fetching token balance:', error)
    throw error
  }
}

async function handleTransfer(data: {
  fromType: 'wallet' | 'exchange',
  toType: 'exchange' | 'wallet',
  fromAddress: string,
  toAddress: string,
  tokenMint: string,
  amount: number
}) {
  console.log('Processing transfer request:', data);

  try {
    if (data.fromType === 'wallet' && data.toType === 'exchange') {
      // Handle wallet to exchange transfer
      const tokenMintPubkey = new PublicKey(data.tokenMint);
      const fromWallet = new PublicKey(data.fromAddress);
      const toExchangeAddress = new PublicKey(data.toAddress);

      // Get the associated token accounts
      const fromTokenAccount = await getAssociatedTokenAddress(
        tokenMintPubkey,
        fromWallet
      );
      const toTokenAccount = await getAssociatedTokenAddress(
        tokenMintPubkey,
        toExchangeAddress
      );

      // Create transfer instruction
      const transferInstruction = createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        fromWallet,
        BigInt(data.amount),
        [],
        TOKEN_PROGRAM_ID
      );

      // Create transaction
      const transaction = new Transaction().add(transferInstruction);
      
      // Get the latest blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromWallet;

      // Return the serialized transaction for signing
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      });

      return {
        status: 'awaiting_signature',
        message: 'Transaction created successfully. Please sign the transaction.',
        transaction: serializedTransaction.toString('base64'),
        type: 'wallet_to_exchange'
      };

    } else if (data.fromType === 'exchange' && data.toType === 'wallet') {
      // For exchange to wallet transfers, we'll initiate the withdrawal through the exchange's API
      const exchangeConfig = {
        binance: {
          apiKey: Deno.env.get('BINANCE_API_KEY'),
          secret: Deno.env.get('BINANCE_SECRET')
        },
        kucoin: {
          apiKey: Deno.env.get('KUCOIN_API_KEY'),
          secret: Deno.env.get('KUCOIN_SECRET'),
          password: Deno.env.get('KUCOIN_PASSPHRASE')
        },
        // Add other exchanges as needed
      };

      // Get the exchange credentials
      const exchange = data.fromAddress.toLowerCase();
      const config = exchangeConfig[exchange];

      if (!config) {
        throw new Error(`Unsupported exchange: ${exchange}`);
      }

      // Initialize CCXT exchange instance
      const ccxt = await import('npm:ccxt');
      const exchangeInstance = new ccxt[exchange]({
        apiKey: config.apiKey,
        secret: config.secret,
        password: config.password,
        enableRateLimit: true
      });

      // Convert token mint to exchange currency code
      const currencyMap = {
        'So11111111111111111111111111111111111111112': 'SOL',
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
        // Add other token mappings as needed
      };

      const currency = currencyMap[data.tokenMint];
      if (!currency) {
        throw new Error(`Unsupported token mint: ${data.tokenMint}`);
      }

      // Initiate withdrawal
      const withdrawal = await exchangeInstance.withdraw(
        currency,
        data.amount,
        data.toAddress,
        {
          network: 'SOL'
        }
      );

      return {
        status: 'processing',
        message: 'Exchange withdrawal initiated successfully',
        transactionId: withdrawal.id,
        type: 'exchange_to_wallet'
      };
    }

    throw new Error('Invalid transfer type combination');

  } catch (error) {
    console.error('Transfer error:', error);
    throw new Error(`Failed to process transfer: ${error.message}`);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, walletAddress, tokenMint, fromType, toType, fromAddress, toAddress, amount } = await req.json();
    console.log('Processing request:', { action, walletAddress, tokenMint });

    let result;
    switch (action) {
      case 'getSOLBalance':
        result = await getSolBalance(walletAddress);
        break;

      case 'getTokenBalance':
        result = await getTokenBalance(tokenMint, walletAddress);
        break;

      case 'getAllBalances':
        const solBalance = await getSolBalance(walletAddress);
        const tokenBalances = await Promise.all(
          TRACKED_TOKENS.map(async (token) => {
            const balance = await getTokenBalance(token.address, walletAddress);
            return {
              symbol: token.symbol,
              ...balance
            };
          })
        );
        result = {
          sol: solBalance,
          tokens: tokenBalances
        };
        break;

      case 'transfer':
        result = await handleTransfer({
          fromType,
          toType,
          fromAddress,
          toAddress,
          tokenMint,
          amount
        });
        break;

      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});