import React, { useEffect, useState } from 'react'
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity
} from 'react-native'
import { useDispatch } from 'react-redux'
import Colors from '../../../common/Colors'
import Fonts from '../../../common/Fonts'
import ListStyles from '../../../common/Styles/ListStyles'
import ImageStyles from '../../../common/Styles/ImageStyles'
import { RFValue } from 'react-native-responsive-fontsize'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen'
import { AppBottomSheetTouchableWrapper } from '../../AppBottomSheetTouchableWrapper'
import { fetchSwanAuthenticationUrl, redeemSwanCodeForToken } from '../../../store/actions/SwanIntegration'
import useSwanIntegrationState from '../../../utils/hooks/state-selectors/accounts/UseSwanIntegrationState'
import openLink from '../../../utils/OpenLink'
import SwanAccountCreationStatus from '../../../common/data/enums/SwanAccountCreationStatus'
import { ListItem } from 'react-native-elements'
import BottomInfoBox from '../../BottomInfoBox'

const swanAccountCount = 0

type Props = {
  swanDeepLinkContent: string | null;
  onClickSetting: ()=>any;
  onPress: () => any;
}

const BottomSheetSwanInfo: React.FC<Props> = ( { swanDeepLinkContent, onClickSetting, onPress }: Props ) => {
  const dispatch = useDispatch()
  const { swanAccountCreationStatus, hasFetchSwanAuthenticationUrlInitiated, hasFetchSwanAuthenticationUrlSucceeded, swanAccountDetails, swanAuthenticationUrl, hasRedeemSwanCodeForTokenInitiated  } = useSwanIntegrationState()
  const [ hasButtonBeenPressed, setHasButtonBeenPressed ] = useState<boolean | false>()
  let swanMessage = 'Register with Swan Bitcoin and start stacking sats regularly. You also get an initial $10 cash back when you complete the process. BTC can be purchased on Swan Bitcoin using different payment methods as available in your country\n\nBy proceeding you understand that you will be taken to the Swan Bitcoin platform to complete registration.'
  let swanTitle = 'Stack Sats\n with Swan'
  let accountName = ''
  let accountDescription = ''
  function handleProceedButtonPress() {
    if ( swanAccountCreationStatus == SwanAccountCreationStatus.BUY_MENU_CLICKED ) {
      if( !hasFetchSwanAuthenticationUrlInitiated ) {
        setHasButtonBeenPressed( true )
        dispatch( fetchSwanAuthenticationUrl( {
        } ) )
      }
    }
  }

  useEffect( ()=>{
    if( ( swanAccountCreationStatus == SwanAccountCreationStatus.BUY_MENU_CLICKED ) && hasFetchSwanAuthenticationUrlSucceeded && swanAuthenticationUrl ) {
      openLink( swanAuthenticationUrl )
    }
  }, [ hasFetchSwanAuthenticationUrlSucceeded, swanAuthenticationUrl, hasRedeemSwanCodeForTokenInitiated ] )

  if( !hasRedeemSwanCodeForTokenInitiated && swanAccountCreationStatus == SwanAccountCreationStatus.AUTHENTICATION_IN_PROGRESS ) {
    dispatch( redeemSwanCodeForToken( swanDeepLinkContent ) )
  }

  const renderFooter = () => {
    switch ( swanAccountCreationStatus ) {
        case SwanAccountCreationStatus.ERROR:
          return (
            <Image
              source={require( '../../../assets/images/icons/errorImage.png' )
              }
              style={styles.errorImage}
            />
          )
        case SwanAccountCreationStatus.ADD_NEW_ACCOUNT_INITIATED:
        case SwanAccountCreationStatus.AUTHENTICATION_IN_PROGRESS:
          return (
            <Image
              source={require( '../../../assets/images/loader.gif' )
              }
              style={styles.communicatingImage}
            />
          )
          break

        case SwanAccountCreationStatus.WALLET_LINKED_SUCCESSFULLY:
          return renderSuccessButton()
        case SwanAccountCreationStatus.ACCOUNT_CREATED:
          return renderSuccessButton()
        default:
          return renderProceedButton()
    }
  }

  const renderMessage = () => {
    switch ( swanAccountCreationStatus ) {
        case SwanAccountCreationStatus.ERROR:
          swanMessage = 'We had a problem communicating with Swan.\n\n'
          swanTitle = 'Something went wrong'
          break
        case SwanAccountCreationStatus.ADD_NEW_ACCOUNT_INITIATED:
        case SwanAccountCreationStatus.AUTHENTICATION_IN_PROGRESS:
          swanTitle = 'Hexa Wallet is communicating with Swan...'
          swanMessage = 'Hexa Wallet is creating a Swan account to store your bitcoin purchased from Swan. This account will be linked to your Swan withdrawal wallet'
          break
        case SwanAccountCreationStatus.WALLET_LINKED_SUCCESSFULLY:
          swanMessage = 'Sats in your Swan withdrawal wallet will be transfered to Hexa Wallet.\nSwan will transfer once 0.02 BTC accumulate in your Swan withdrawal wallet\n'
          swanTitle = 'Successfully linked Hexa Wallet to your Swan Account'
          accountName = 'Swan Bitcoin'
          accountDescription = 'Stack sats with Swan'
          break
        case SwanAccountCreationStatus.ACCOUNT_CREATED:
          swanMessage = 'Swan will transfer once 0.02 BTC accumulate in your Swan withdrawal wallet\n'
          swanTitle = 'Hexa Wallet and your Swan Account are linked'
          // TODO: uncomment once able to access current-swan acc
          // accountName = currentSwanSubAccount.defaultTitle
          // accountDescription = currentSwanSubAccount.defaultDescription
          break
        default:
          swanMessage = 'Register with Swan Bitcoin and start stacking sats regularly. You also get an initial $10 cash back when you complete the process. BTC can be purchased on Swan Bitcoin using different payment methods as available in your country\n\n\nBy proceeding you understand that you will be taken to the Swan Bitcoin platform to complete registration'
          swanTitle = 'Stack Sats\nwith Swan'
    }
    return (
      <>
        {/* <TouchableOpacity
          activeOpacity={1}
          onPress={onPress}
          style={{
            width: wp( 7 ), height: wp( 7 ), borderRadius: wp( 7/2 ),
            alignSelf: 'flex-end',
            backgroundColor: Colors.lightBlue, alignItems: 'center', justifyContent: 'center',
            marginTop: wp( 3 ), marginRight: wp( 3 )
          }}
        >
          <FontAwesome name="close" color={Colors.white} size={19} style={{
            // marginTop: hp( 0.5 )
          }} />
        </TouchableOpacity> */}
        <View style={styles.successModalHeaderView}>

          <Text style={styles.modalTitleText}>{swanTitle}</Text>

          <Text style={{
            ...styles.modalInfoText,

          }}>{swanMessage}</Text>
          <BottomInfoBox
            backgroundColor={Colors.white}
            title={'Note'}
            infoText={
              'Please register with Swan Bitcoin to use this account'
            }
          />
          {( swanAccountCreationStatus == SwanAccountCreationStatus.WALLET_LINKED_SUCCESSFULLY
          ||
          swanAccountCreationStatus == SwanAccountCreationStatus.ACCOUNT_CREATED ) ? renderAccount() : null}

        </View>
      </>
    )
  }

  const renderAccount = () => {
    return (
      <View style={{
        flexDirection: 'row',
        marginBottom: wp( 5 ),
      }}>
        <Image
          source={require( '../../../assets/images/icons/swan.png' )}
          style={styles.avatarImage}
          resizeMode="contain"
        />

        <ListItem.Content style={{
          flex: 1,
        }}>
          <ListItem.Subtitle
            style={ListStyles.infoHeaderSubtitleText}
            numberOfLines={1}
          >
            {accountDescription}
          </ListItem.Subtitle>

          <ListItem.Title
            style={styles.destinationTitleText}
            numberOfLines={1}
          >
            {accountName}
          </ListItem.Title>
        </ListItem.Content>
      </View>
    )
  }
  const renderProceedButton = () => {
    return ( <View style={{
      flexDirection: 'row', marginTop: 'auto', alignItems: 'flex-start'
    }} >
      <AppBottomSheetTouchableWrapper
        disabled={hasButtonBeenPressed? true : false}
        onPress={handleProceedButtonPress}
        style={{
          ...styles.successModalButtonView
        }}
      >
        <Text style={styles.proceedButtonText}>{'Buy Bitcoin'}</Text>
      </AppBottomSheetTouchableWrapper>
      <AppBottomSheetTouchableWrapper
        onPress={() => {onPress()}}
        style={{
          height: wp( '15%' ),
          width: wp( '36%' ),
          justifyContent: 'center',
          alignItems: 'center',
          paddingLeft: wp( '8%' ),
        }}
      >
        <Text
          style={{
            fontFamily: Fonts.FiraSansMedium,
            color: Colors.blue
          }}
        >
          {'Not Now'}
        </Text>
      </AppBottomSheetTouchableWrapper>
      {/* <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignContent: 'center'
      }}>
        <Text style={{
          marginLeft: wp( '13.5%' ),
        }}>
      Powered by
        </Text>
        <Image
          source={require( '../../../assets/images/icons/swan_logo_large.png' )}
          style={{
            marginLeft: 5,
            width: 62,
            height: 27,
          }}
        />

      </View> */}
    </View> )
  }
  const renderSuccessButton = () => {
    return ( <View style={{
      marginTop: 'auto',
      flexDirection: 'row',
      marginBottom: hp( 4 )
    }} >
      <AppBottomSheetTouchableWrapper
        onPress={onClickSetting}
        style={{
          ...styles.successModalButtonView
        }}
      >
        <Text style={styles.proceedButtonText}>{'Done'}</Text>
      </AppBottomSheetTouchableWrapper>
      {/* <Image
        source={require( '../../../assets/images/icons/success.png' )
        }
        style={styles.successImage}
      /> */}
    </View> )
  }

  return ( <View style={{
    ...styles.modalContentContainer
  }}>
    {renderMessage()}
    {renderFooter()}
  </View>
  )
}

const styles = StyleSheet.create( {
  modalContentContainer: {
    backgroundColor: Colors.backgroundColor,
  },
  avatarImage: {
    ...ImageStyles.circledAvatarContainer,
    ...ImageStyles.thumbnailImageLarge,
    borderRadius: wp( 14 )/2,
    marginRight: 14,
  },
  destinationTitleText: {
    fontFamily: Fonts.FiraSansRegular,
    fontSize: RFValue( 20 ),
    color: Colors.black,
  },
  successModalHeaderView: {
    marginRight: wp( '7%' ),
    // marginLeft: wp( '5%' ),
    marginTop: wp( '5%' ),
    // flex: 1.7
  },
  modalTitleText: {
    marginBottom: wp( '4%' ),
    color: Colors.blue,
    fontSize: RFValue( 18 ),
    fontFamily: Fonts.FiraSansRegular,
    marginLeft: wp( '6%' )
  },
  modalInfoText: {
    marginLeft: wp( '6%' ),
    color: Colors.textColorGrey,
    fontSize: RFValue( 12 ),
    fontFamily: Fonts.FiraSansRegular,
    textAlign: 'justify',
    // marginTop: wp( 1 ),
    marginBottom: wp( 4 ),
    marginRight: wp( 5 ),
    lineHeight: 18,
    letterSpacing: 0.6
  },
  successModalButtonView: {
    minHeight: 50,
    minWidth: 144,
    paddingHorizontal: wp( 4 ),
    paddingVertical: wp( 3 ),
    height: wp( '15%' ),
    width: wp( '36%' ),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 11,
    elevation: 10,
    shadowColor: Colors.shadowBlue,
    shadowOpacity: 1,
    shadowOffset: {
      width: 15, height: 15
    },
    marginTop: 'auto',
    backgroundColor: Colors.blue,
    alignSelf: 'flex-start',
    marginLeft: wp( '6%' ),
    marginBottom: hp( 3 )
  },
  proceedButtonText: {
    color: Colors.white,
    fontSize: RFValue( 13 ),
    fontFamily: Fonts.FiraSansMedium
  },
  errorImage: {
    width: wp( '31%' ),
    height: wp( '38%' ),
    marginLeft: 'auto',
    resizeMode: 'stretch',
    marginBottom: hp( '-3%' ),
  },
  successImage: {
    width: wp( '25%' ),
    height: hp( '18%' ),
    marginLeft: 'auto',
    resizeMode: 'stretch',
    marginBottom: hp( '-4%' ),
  },
  communicatingImage: {
    width: wp( '31%' ),
    height: wp( '38%' ),
    marginLeft: 'auto',
    resizeMode: 'stretch',
    marginBottom: hp( '-3%' ),
  },
} )
export default BottomSheetSwanInfo
