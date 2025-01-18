import { PublicKey, Transaction, SystemProgram } from "npm:@solana/web3.js";
import { TOKEN_PROGRAM_ID, createTransferInstruction, getAssociatedTokenAddress } from "npm:@solana/spl-token";
import { TOKEN_MINT_TO_CURRENCY } from './constants.ts';

export async function handleTransfer(data: {
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

      const currency = TOKEN_MINT_TO_CURRENCY[data.tokenMint];
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