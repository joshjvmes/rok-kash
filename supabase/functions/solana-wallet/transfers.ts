import { TOKEN_MINT_TO_CURRENCY } from './constants.ts';
import { getExchangeInstance } from './exchanges.ts';
import { PublicKey, Transaction, SystemProgram } from "npm:@solana/web3.js";
import { TOKEN_PROGRAM_ID, createTransferInstruction, getAssociatedTokenAddress } from "npm:@solana/spl-token";

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
      return await handleWalletToExchangeTransfer(data);
    } else if (data.fromType === 'exchange' && data.toType === 'wallet') {
      return await handleExchangeToWalletTransfer(data);
    }
    throw new Error('Invalid transfer type combination');
  } catch (error) {
    console.error('Transfer error:', error);
    throw error;
  }
}

async function handleWalletToExchangeTransfer(data: {
  fromAddress: string,
  toAddress: string,
  tokenMint: string,
  amount: number
}) {
  console.log('Processing wallet to exchange transfer:', data);
  
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

  return {
    status: 'awaiting_signature',
    message: 'Transaction created successfully. Please sign the transaction.',
    transaction: transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    }).toString('base64'),
    type: 'wallet_to_exchange'
  };
}

async function handleExchangeToWalletTransfer(data: {
  fromAddress: string,
  toAddress: string,
  tokenMint: string,
  amount: number
}) {
  console.log('Processing exchange to wallet transfer:', data);

  const currency = TOKEN_MINT_TO_CURRENCY[data.tokenMint];
  if (!currency) {
    throw new Error(`Unsupported token mint: ${data.tokenMint}`);
  }

  const exchangeInstance = await getExchangeInstance(data.fromAddress);

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