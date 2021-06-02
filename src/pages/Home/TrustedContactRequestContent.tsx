import React from 'react'
import TrustedContactRequest from '../Contacts/TrustedContactRequest'
import BottomSheet from '@gorhom/bottom-sheet'

export interface Props {
  bottomSheetRef: React.RefObject<BottomSheet>;
  trustedContactRequest: any;
  onPressAccept: ( key: any ) => void;
  onPressReject: ( key: any ) => void;
  onPhoneNumberChange: ( key: any ) => void;
}

const TrustedContactRequestContent: React.FC<Props> = ( {
  bottomSheetRef,
  trustedContactRequest,
  onPressAccept,
  onPressReject,
  onPhoneNumberChange,
}: Props ) => {
  if ( !trustedContactRequest ) return
  const { walletName, isKeeper, isQR, hintType, hint } = trustedContactRequest

  return (
    <TrustedContactRequest
      isQR={isQR}
      inputType={
        hintType === 'num' ? 'phone' : hintType === 'eml' ? 'email' : null
      }
      isGuardian={isKeeper}
      isRecovery={false}
      hint={hint}
      bottomSheetRef={bottomSheetRef}
      trustedContactName={walletName}
      onPressAccept={onPressAccept}
      onPressReject={onPressReject}
      onPhoneNumberChange={( text ) => {
        onPhoneNumberChange( text )
      }}
    />
  )
}

export default TrustedContactRequestContent
