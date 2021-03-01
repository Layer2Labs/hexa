import { RecipientDescribing } from '../../common/data/models/interfaces/RecipientDescribing'
import { Satoshis } from '../../common/data/typealiases/UnitAliases'
import { SOURCE_ACCOUNT_SELECTED_FOR_SENDING, ADD_RECIPIENT_FOR_SENDING, RECIPIENT_SELECTED_FOR_AMOUNT_SETTING, SEND_MAX_FEE_CALCULATED, SEND_STAGE1_EXECUTED, EXECUTE_SEND_STAGE1, FEE_INTEL_MISSING, SEND_STAGE2_EXECUTED, EXECUTE_SEND_STAGE2, EXECUTE_SEND_STAGE3, SEND_STAGE3_EXECUTED, EXECUTE_ALTERNATE_SEND_STAGE2, ALTERNATE_SEND_STAGE2_EXECUTED, AMOUNT_FOR_RECIPIENT_UPDATED, RECIPIENT_REMOVED_FROM_SENDING, CALCULATE_CUSTOM_FEE, CUSTOM_FEE_CALCULATED } from '../actions/sending'
import AccountShell from '../../common/data/models/AccountShell'
import TransactionPriority from '../../common/data/enums/TransactionPriority'
import TransactionFeeSnapshot from '../../common/data/models/TransactionFeeSnapshot'
import {  InputUTXOs, TransactionPrerequisite, TransactionPrerequisiteElements } from '../../bitcoin/utilities/Interface'

type RecipientID = string;

export type AmountDesignations = Record<RecipientID, Satoshis>;
export type TransactionFeeInfo = Record<TransactionPriority, TransactionFeeSnapshot>;

export type SendingState = {
  sourceAccountShell: AccountShell | null;

  selectedRecipients: RecipientDescribing[];

  recipientSelectedForSettingAmount: RecipientDescribing | null;

  sendST1: {
    inProgress: boolean;
    hasFailed: boolean;
    failedErrorMessage: string | null;
    isSuccessful: boolean,

    // data elements carried over to the next send stage(2)
    carryOver: { txPrerequisites: TransactionPrerequisite } | null;
  };

  customPriorityST1: {
    inProgress: boolean;
    hasFailed: boolean;
    failedErrorMessage: string | null;
    isSuccessful: boolean,

    // data elements carried over to the next send stage(2)
    carryOver: { customTxPrerequisites: TransactionPrerequisiteElements } | null;
  },

  sendST2: {
    inProgress: boolean;
    hasFailed: boolean;
    failedErrorMessage: string | null;
    isSuccessful: boolean,

    // available for the transactions from a non-2FA account
    txid: string | null,

    // data elements carried over to the next send stage(3)
    carryOver: {
      txHex: string;
      childIndexArray: Array<{
        childIndex: number;
        inputIdentifier: {
          txId: string;
          vout: number;
        };
      }>;
      inputs: InputUTXOs[],
      derivativeAccountDetails?: { type: string; number: number },
    };
  };

  sendST3: {
    inProgress: boolean;
    hasFailed: boolean;
    failedErrorMessage: string | null;
    isSuccessful: boolean,
    txid: string | null,
  }

  sendMaxFee: Satoshis;
  feeIntelMissing: boolean,
  transactionFeeInfo: TransactionFeeInfo;
};

const INITIAL_STATE: SendingState = {
  sourceAccountShell: null,
  selectedRecipients: [],
  recipientSelectedForSettingAmount: null,

  sendST1: {
    inProgress: false,
    hasFailed: false,
    failedErrorMessage: null,
    isSuccessful: false,
    carryOver: null
  },
  customPriorityST1: {
    inProgress: false,
    hasFailed: false,
    failedErrorMessage: null,
    isSuccessful: false,
    carryOver: null
  },
  sendST2: {
    inProgress: false,
    hasFailed: false,
    failedErrorMessage: null,
    isSuccessful: false,
    txid: null,
    carryOver: null,
  },
  sendST3: {
    inProgress: false,
    hasFailed: false,
    failedErrorMessage: null,
    isSuccessful: false,
    txid: null,
  },

  sendMaxFee: 0,
  feeIntelMissing: false,
  /*
  the UI needs to keep track of fees to display on screen
  Three level of fees priority with time estimate for each
  fees: {}, // 3 levels of fees and priority
  */
  transactionFeeInfo: {
    [ TransactionPriority.LOW ]: {
      amount: 0,
      estimatedBlocksBeforeConfirmation: 50,
    },
    [ TransactionPriority.MEDIUM ]: {
      amount: 0,
      estimatedBlocksBeforeConfirmation: 20,
    },
    [ TransactionPriority.HIGH ]: {
      amount: 0,
      estimatedBlocksBeforeConfirmation: 4,
    },
    [ TransactionPriority.CUSTOM ]: {
      amount: 0,
      estimatedBlocksBeforeConfirmation: 0,
    },
  },
}


const sendingReducer = ( state: SendingState = INITIAL_STATE, action ): SendingState => {
  let recipient: RecipientDescribing

  switch ( action.type ) {
      case SOURCE_ACCOUNT_SELECTED_FOR_SENDING:
        return {
          ...state,
          sourceAccountShell: action.payload,
        }

      case ADD_RECIPIENT_FOR_SENDING:
        recipient = action.payload

        return {
          ...state,
          selectedRecipients: state
            .selectedRecipients
            .filter( r => r.id != recipient.id )
            .concat( recipient )
        }

      case RECIPIENT_REMOVED_FROM_SENDING:
        recipient = action.payload

        return {
          ...state,
          selectedRecipients: state
            .selectedRecipients
            .filter( r => r.id != recipient.id )
        }

      case RECIPIENT_SELECTED_FOR_AMOUNT_SETTING:
        return {
          ...state,
          recipientSelectedForSettingAmount: action.payload,
        }

      case AMOUNT_FOR_RECIPIENT_UPDATED: {
        recipient = action.payload.recipient
        recipient.amount = action.payload.amount

        return {
          ...state,
          selectedRecipients: state
            .selectedRecipients
            .filter( r => r.id != recipient.id )
            .concat( recipient )
        }
      }

      case EXECUTE_SEND_STAGE1:
        return {
          ...state,
          sendST1:{
            inProgress: true,
            hasFailed: false,
            isSuccessful: false,
            failedErrorMessage: null,
            carryOver: null
          },
          feeIntelMissing: false,
          transactionFeeInfo: INITIAL_STATE.transactionFeeInfo,
        }

      case SEND_STAGE1_EXECUTED:
        const transactionFeeInfo: TransactionFeeInfo = state.transactionFeeInfo
        let txPrerequisites: TransactionPrerequisite
        if( action.payload.successful ){
          const carryOver = action.payload.carryOver
          txPrerequisites = carryOver.txPrerequisites
          Object.keys( txPrerequisites ).forEach( ( priority ) =>{
            transactionFeeInfo[ priority.toUpperCase() ].amount = txPrerequisites[ priority ].fee
            transactionFeeInfo[ priority.toUpperCase() ].estimatedBlocksBeforeConfirmation = txPrerequisites[ priority ].estimatedBlocks
          } )
        }
        return {
          ...state,
          sendST1: {
            inProgress: false,
            hasFailed: !action.payload.successful,
            failedErrorMessage: !action.payload.successful? action.payload.err : null,
            isSuccessful: action.payload.successful,
            carryOver: {
              txPrerequisites
            }
          },
          transactionFeeInfo
        }

      case CALCULATE_CUSTOM_FEE:
        return {
          ...state,
          customPriorityST1:{
            inProgress: true,
            hasFailed: false,
            isSuccessful: false,
            failedErrorMessage: null,
            carryOver: null
          },
        }

      case CUSTOM_FEE_CALCULATED:
        const txFeeInfo: TransactionFeeInfo = {
          ...state.transactionFeeInfo
        }
        let customTxPrerequisites: TransactionPrerequisiteElements
        if( action.payload.successful ){
          const carryOver = action.payload.carryOver
          customTxPrerequisites = carryOver.customTxPrerequisites
          if( customTxPrerequisites ){
            transactionFeeInfo[ TransactionPriority.CUSTOM ].amount = customTxPrerequisites.fee
            transactionFeeInfo[ TransactionPriority.CUSTOM ].estimatedBlocksBeforeConfirmation = customTxPrerequisites.estimatedBlocks
          }
        }
        return {
          ...state,
          customPriorityST1: {
            inProgress: false,
            hasFailed: !action.payload.successful,
            failedErrorMessage: !action.payload.successful? action.payload.err : null,
            isSuccessful: action.payload.successful,
            carryOver: {
              customTxPrerequisites
            }
          },
          transactionFeeInfo: txFeeInfo
        }

      case FEE_INTEL_MISSING:
        return {
          ...state,
          feeIntelMissing: action.payload.intelMissing
        }


      case EXECUTE_SEND_STAGE2:
        return {
          ...state,
          sendST2:{
            inProgress: true,
            hasFailed: false,
            failedErrorMessage: null,
            isSuccessful: false,
            txid: null,
            carryOver: null
          },
        }

      case SEND_STAGE2_EXECUTED:
        if( !action.payload.successful ){
          return {
            ...state,
            sendST2: {
              inProgress: false,
              hasFailed: true,
              failedErrorMessage: action.payload.err,
              isSuccessful: false,
              txid: null,
              carryOver: null,
            },
          }
        }

        if( action.payload.txid ){
          // non-2FA send
          return {
            ...state,
            sendST2: {
              inProgress: false,
              hasFailed: false,
              failedErrorMessage: null,
              isSuccessful: true,
              txid: action.payload.txid,
              carryOver: null,
            },
          }
        }

        const carryOver = action.payload.carryOver
        const{ txHex, childIndexArray, inputs, derivativeAccountDetails } = carryOver
        return {
          ...state,
          sendST2: {
            inProgress: false,
            hasFailed: false,
            failedErrorMessage: null,
            isSuccessful: true,
            txid: null,
            carryOver: {
              txHex, childIndexArray, inputs, derivativeAccountDetails,
            }
          },
        }

      case EXECUTE_SEND_STAGE3:
        return {
          ...state,
          sendST3:{
            inProgress: true,
            hasFailed: false,
            failedErrorMessage: null,
            isSuccessful: false,
            txid: null,
          },
        }

      case SEND_STAGE3_EXECUTED:
        return {
          ...state,
          sendST3: {
            inProgress: false,
            hasFailed: !action.payload.successful,
            failedErrorMessage: !action.payload.successful? action.payload.err: null,
            isSuccessful: action.payload.successful,
            txid: action.payload.successful? action.payload.txid: null,
          },
        }

      case EXECUTE_ALTERNATE_SEND_STAGE2:
        return {
          ...state,
          sendST2:{
            inProgress: true,
            hasFailed: false,
            failedErrorMessage: null,
            isSuccessful: false,
            txid: null,
            carryOver: null
          },
        }

      case ALTERNATE_SEND_STAGE2_EXECUTED:
        return {
          ...state,
          sendST3: {
            inProgress: false,
            hasFailed: !action.payload.successful,
            failedErrorMessage: !action.payload.successful? action.payload.err: null,
            isSuccessful: action.payload.successful,
            txid: action.payload.successful? action.payload.txid: null,
          },
        }


      case SEND_MAX_FEE_CALCULATED:
        return {
          ...state,
          sendMaxFee: action.payload,
        }

      default:
        return state
  }
}

export default sendingReducer
