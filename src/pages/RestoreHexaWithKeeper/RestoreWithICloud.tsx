import React, { Component } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  ScrollView,
  Platform,
  ImageBackground,
  Alert,
  RefreshControl,
  Modal,
  Keyboard,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen'
import Colors from '../../common/Colors'
import Fonts from '../../common/Fonts'
import { RFValue } from 'react-native-responsive-fontsize'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import { withNavigationFocus } from 'react-navigation'
import { connect } from 'react-redux'
import {
  walletCheckIn,
} from '../../store/actions/trustedContacts'
import idx from 'idx'
import { timeFormatter } from '../../common/CommonFunctions/timeFormatter'
import moment from 'moment'
import BottomSheet from 'reanimated-bottom-sheet'
import ModalHeader from '../../components/ModalHeader'
import RestoreFromICloud from './RestoreFromICloud'
import DeviceInfo from 'react-native-device-info'
import RestoreSuccess from './RestoreSuccess'
import ICloudBackupNotFound from './ICloudBackupNotFound'
import AntDesign from 'react-native-vector-icons/AntDesign'
import { requestTimedout } from '../../store/utils/utilities'
import RestoreWallet from './RestoreWallet'
import { REGULAR_ACCOUNT } from '../../common/constants/wallet-service-types'
import RegularAccount from '../../bitcoin/services/accounts/RegularAccount'
import { isEmpty } from '../../common/CommonFunctions'
import CloudBackup from '../../common/CommonFunctions/CloudBackup'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import SSS from '../../bitcoin/utilities/sss/SSS'
import { decrypt, decrypt1 } from '../../common/encryption'
import LoaderModal from '../../components/LoaderModal'
import TransparentHeaderModal from '../../components/TransparentHeaderModal'
import Loader from '../../components/loader'
import {
  checkMSharesHealth,
  recoverWalletUsingIcloud,
  downloadMShare,
  recoverWallet,
  updateCloudMShare,
  downloadBackupData,
  putKeeperInfo,
  setupHealth
} from '../../store/actions/health'
import axios from 'axios'
import { initializeHealthSetup, initNewBHRFlow } from '../../store/actions/health'
import ErrorModalContents from '../../components/ErrorModalContents'
import { BackupStreamData, KeeperInfoInterface, MetaShare, PrimaryStreamData, SecondaryStreamData, Wallet } from '../../bitcoin/utilities/Interface'
import { AppBottomSheetTouchableWrapper } from '../../components/AppBottomSheetTouchableWrapper'
import config from '../../bitcoin/HexaConfig'
import { textWithoutEncoding, email } from 'react-native-communications'
import TrustedContactsService from '../../bitcoin/services/TrustedContactsService'
import { requestShare } from '../../store/actions/sss'
import ContactListForRestore from './ContactListForRestore'
import SendViaLink from '../../components/SendViaLink'
import LevelHealth from '../../bitcoin/utilities/LevelHealth/LevelHealth'
import ShareOtpWithTrustedContact from '../ManageBackup/ShareOtpWithTrustedContact'
import { getCloudDataRecovery, clearCloudCache, setCloudBackupStatus } from '../../store/actions/cloud'
import CloudBackupStatus from '../../common/data/enums/CloudBackupStatus'
import { setVersion } from '../../store/actions/versionHistory'
import QuestionList from '../../common/QuestionList'
import SecurityQuestion from './SecurityQuestion'
import { initializeRecovery } from '../../store/actions/setupAndAuth'
import ModalContainer from '../../components/home/ModalContainer'

import semver from 'semver'
import S3Service from '../../bitcoin/services/sss/S3Service'
import BHROperations from '../../bitcoin/utilities/BHROperations'


const LOADER_MESSAGE_TIME = 2000
let messageIndex = 0
const loaderMessages = [
  {
    heading: 'Bootstrapping Accounts',
    text: 'Hexa has a multi-account model which lets you better manage your bitcoin (sats)',
    subText: '',
  },
  {
    heading: 'Filling Test Account with test sats',
    text:
      'Preloaded Test Account is the best place to start your Bitcoin journey',
    subText: '',
  },
  {
    heading: 'Generating Recovery Keys',
    text: 'Recovery Keys help you restore your Hexa wallet in case your phone is lost',
    subText: '',
  },
  {
    heading: 'Manage Backup',
    text:
      'You can backup your wallet at 3 different levels of security\nAutomated cloud backup | Double backup | Multi-key backup',
    subText: '',
  },
  {
    heading: 'Level 1 - Automated Cloud Backup',
    text: 'Allow Hexa to automatically backup your wallet to your cloud storage and we’ll ensure you easily recover your wallet in case your phone gets lost',
    subText: '',
  },
  {
    heading: 'Level 2 - Double Backup',
    text: 'Starting to hodl sats and bitcoin? Ensure that you backup your wallet atleast to Level 2 backup called Double Backup',
    subText: '',
  },
  {
    heading: 'Level 3 - Multi-key Backup',
    text: 'For hardcore Bitcoiners who understand Bitcoin, stack large amounts of sats or bitcoin and care for utmost security of their wallet',
    subText: '',
  }
]
interface RestoreWithICloudStateTypes {
  selectedIds: any[];
  listData: any[];
  walletsArray: any[];
  cloudBackup: boolean;
  hideShow: boolean;
  selectedBackup: any;
  metaShares: any[];
  showLoader: boolean;
  refreshControlLoader: boolean;
  selectedContact: any;
  linkToRequest: string;
  contactList: any[];
  isOtpType: boolean;
  otp: string;
  renderTimer: boolean;
  isLinkCreated: boolean;
  loaderMessage: { heading: string; text: string; subText?: string; };
  walletName: string;
  question: string;
  answer: string;
  restoreModal: boolean;
  securityQuestionModal: boolean;
  errorModal: boolean;
  sendViaLinkModal: boolean;
  loaderModal: boolean;
  shareOTPModal: boolean;
  restoreWallet: boolean;
  contactListModal: boolean;
  backupModal: boolean;
  restoreSuccess: boolean;
  currentLevel: number;
}

interface RestoreWithICloudPropsTypes {
  navigation: any;
  regularAccount: RegularAccount;
  s3Service: S3Service;
  cloudBackupStatus: any;
  database: any;
  security: any;
  recoverWalletUsingIcloud: any;
  accounts: any;
  walletImageChecked: any;
  SERVICES: any;
  checkMSharesHealth: any;
  calculateExchangeRate: any;
  initializeHealthSetup: any;
  downloadMShare: any;
  DECENTRALIZED_BACKUP: any;
  recoverWallet: any;
  updateCloudMShare: any;
  walletRecoveryFailed: boolean;
  requestShare: any;
  downloadMetaShare: Boolean;
  errorReceiving: Boolean;
  getCloudDataRecovery: any;
  cloudData: any;
  clearCloudCache: any;
  initNewBHRFlow: any;
  walletCheckIn: any;
  setVersion: any;
  initializeRecovery: any;
  setCloudBackupStatus: any;
  downloadBackupData: any;
  downloadedBackupData: {
    primaryData?: PrimaryStreamData;
    backupData?: BackupStreamData;
    secondaryData?: SecondaryStreamData;
  }[];
  putKeeperInfo: any;
  keeperInfo: KeeperInfoInterface[];
  setupHealth: any;
  wallet: Wallet;
}

class RestoreWithICloud extends Component<
  RestoreWithICloudPropsTypes,
  RestoreWithICloudStateTypes
> {
  RestoreFromICloud: any;
  ContactListForRestore: any;
  RestoreSuccess: any;
  BackupNotFound: any;
  RestoreWallet: any;
  loaderBottomSheet: any;
  ErrorBottomSheet: any;
  SendViaLinkBottomSheet: any;
  shareOtpWithTrustedContactBottomSheet: any;
  SecurityQuestionBottomSheet: any;

  constructor( props ) {
    super( props )
    this.RestoreFromICloud = React.createRef()
    this.ContactListForRestore = React.createRef()
    this.RestoreSuccess = React.createRef()
    this.BackupNotFound = React.createRef()
    this.RestoreWallet = React.createRef()
    this.loaderBottomSheet = React.createRef()
    this.ErrorBottomSheet = React.createRef()
    this.SecurityQuestionBottomSheet = React.createRef()
    this.SendViaLinkBottomSheet = React.createRef()
    this.shareOtpWithTrustedContactBottomSheet = React.createRef()

    this.state = {
      selectedIds: [],
      listData: [],
      walletsArray: [],
      cloudBackup: false,
      hideShow: false,
      selectedBackup: {
        data: '',
        dateTime: '',
        walletId: '',
        walletName: '',
        levelStatus: '',
        seed: '',
        shares: '',
        keeperData: '',
      },
      metaShares: [],
      showLoader: false,
      refreshControlLoader: false,
      selectedContact: {
      },
      linkToRequest: '',
      contactList: [],
      isOtpType: false,
      otp: '',
      renderTimer: false,
      isLinkCreated: false,
      walletName: '',
      loaderMessage: {
        heading: 'Creating your wallet', text: 'This may take some time while Hexa is using the Recovery Keys to recreate your wallet'
      },
      question: '',
      answer: '',
      restoreModal: false,
      securityQuestionModal: false,
      errorModal: false,
      sendViaLinkModal: false,
      loaderModal: false,
      shareOTPModal: false,
      restoreWallet: false,
      contactListModal: false,
      restoreSuccess: false,
      currentLevel: 0,
      backupModal: false
    }
  }

  componentDidMount = () => {
    this.cloudData()
  };

  cloudData = () => {
    //console.log("INSIDE cloudData componentDidMount");
    this.setState( {
      showLoader: true
    } )
    this.props.getCloudDataRecovery()
  };

  componentDidUpdate = async ( prevProps, prevState ) => {
    const {
      walletImageChecked,
      SERVICES,
      checkMSharesHealth,
      walletRecoveryFailed,
      cloudData,
      walletCheckIn,
      initNewBHRFlow,
      setVersion,
      cloudBackupStatus
    } = this.props
    if ( prevProps.cloudData !== cloudData && cloudData ) {
      this.getData( cloudData )
    }

    if ( prevProps.cloudBackupStatus !== cloudBackupStatus && cloudBackupStatus === CloudBackupStatus.FAILED ) {
      this.setState( ( state ) => ( {
        showLoader: false,
      } ) )
      this.props.setCloudBackupStatus( CloudBackupStatus.PENDING )
      // ( this.BackupNotFound as any ).current.snapTo( 1 )
      this.setState( {
        backupModal: true
      } )
    }
    console.log( 'SERVICES', SERVICES )
    console.log( 'walletImageChecked', walletImageChecked )
    if ( SERVICES && prevProps.walletImageChecked !== walletImageChecked ) {
      await AsyncStorage.setItem( 'walletExists', 'true' )
      await AsyncStorage.setItem( 'walletRecovered', 'true' )
      setVersion( 'Restored' )
      initNewBHRFlow( true )
      // checkMSharesHealth()
      walletCheckIn()
      // if ( this.loaderBottomSheet as any )
      //   ( this.loaderBottomSheet as any ).current.snapTo( 0 )
      this.setState( {
        loaderModal: false
      } )
      this.props.navigation.navigate( 'HomeNav' )
    }

    if( prevProps.wallet != this.props.wallet ){
      await AsyncStorage.setItem( 'walletExists', 'true' )
      await AsyncStorage.setItem( 'walletRecovered', 'true' )
      setVersion( 'Restored' )
      initNewBHRFlow( true )
      this.setState( {
        loaderModal: false
      } )
      this.props.navigation.navigate( 'HomeNav' )
    }

    if ( JSON.stringify( prevProps.downloadedBackupData ) != JSON.stringify( this.props.downloadedBackupData ) ) {
      if ( this.props.downloadedBackupData.length ) {
        this.updateList()
      }
    }

    if ( prevProps.walletRecoveryFailed !== walletRecoveryFailed ) {
      // if ( this.loaderBottomSheet as any )
      //   ( this.loaderBottomSheet as any ).current.snapTo( 0 )
      this.setState( {
        loaderModal: false
      } )
    }

    if ( prevProps.errorReceiving !== this.props.errorReceiving && this.props.errorReceiving === true ) {
      this.setState( {
        showLoader: false
      } )
      // ( this.BackupNotFound as any ).current.snapTo( 1 )
      this.setState( {
        backupModal: true
      } )
      // if ( this.loaderBottomSheet as any )
      //   ( this.loaderBottomSheet as any ).current.snapTo( 0 )
      this.setState( {
        loaderModal: false
      } )
    }

    if (
      !this.state.isLinkCreated &&
      this.state.contactList.length &&
      this.props.database.DECENTRALIZED_BACKUP.RECOVERY_SHARES[ 0 ] &&
      this.props.database.DECENTRALIZED_BACKUP.RECOVERY_SHARES[ 0 ].META_SHARE
    ) {
      this.setState( {
        isLinkCreated: true
      } )
      this.onCreatLink()
    }

    if ( prevProps.downloadedBackupData.length == 0 && prevProps.downloadedBackupData != this.props.downloadedBackupData && this.props.downloadedBackupData.length == 1 ) {
      console.log( 'dsfsd', this.props.keeperInfo )
      if ( this.props.keeperInfo.length == 0 ) {
        console.log( 'dsfsd', this.props.keeperInfo )
        this.setKeeperInfoList( 0, this.props.downloadedBackupData[ 0 ].backupData.keeperInfo )
      }
    }

    if ( prevProps.s3Service != this.props.s3Service && this.props.s3Service.levelhealth ) {
      console.log( 'this.state.currentLevel', this.state.currentLevel )
      this.props.setupHealth( this.state.currentLevel )
    }
  };

  componentWillUnmount = () => {
    console.log( 'Inside componentWillUnmount' )
    this.props.clearCloudCache()
  }

  updateList = () => {
    const { listData, selectedBackup } = this.state
    const { downloadedBackupData } = this.props
    let updatedListData = []
    const shares: {
      primaryData?: PrimaryStreamData;
      backupData?: BackupStreamData;
      secondaryData?: SecondaryStreamData;
    }[] = []
    updatedListData = [ ...listData ]
    for ( let i = 0; i < updatedListData.length; i++ ) {
      if ( downloadedBackupData.find( value => value.backupData.primaryMnemonicShard.shareId == updatedListData[ i ].shareId ) ) {
        updatedListData[ i ].status = 'received'
        shares.push( downloadedBackupData.find( value => value.backupData.primaryMnemonicShard.shareId == updatedListData[ i ].shareId ) )
      }
    }
    this.setState( {
      listData: updatedListData, showLoader: false
    }, () => {
      console.log(
        'listData inside setState',
        this.state.listData,
        this.state.showLoader
      )
    } )
    if ( shares.length === 2 || shares.length === 3 ) {
      this.checkForRecoverWallet( shares, selectedBackup )
    }
  };

  checkForRecoverWallet = ( shares, selectedBackup ) => {
    const key = BHROperations.strechKey( this.state.answer )
    const decryptedCloudDataJson = decrypt( selectedBackup.data, key )
    if ( ( shares.length >= 2 && selectedBackup.levelStatus === 2 ) || ( shares.length >= 3 && selectedBackup.levelStatus === 3 ) ) {
      this.showLoaderModal()
      this.recoverWallet(
        selectedBackup.levelStatus,
        decryptedCloudDataJson,
        shares
      )
    }
  };

  recoverWallet = ( level, image, shares ) => {
    setTimeout( () => {
      this.props.recoverWallet( {
        level, answer: this.state.answer, selectedBackup: this.state.selectedBackup, image, shares
      } )
    }, 2 )
  };

  getData = ( result ) => {
    console.log( 'FILE DATA', result )
    if ( result ) {
      let arr = []
      const newArray = []
      try {
        arr = JSON.parse( result )
      } catch ( error ) {
        //console.log('ERROR', error);
      }
      if ( arr && arr.length ) {
        for ( let i = 0; i < arr.length; i++ ) {
          newArray.push( arr[ i ] )
        }
      }
      console.log( 'ARR', newArray )
      this.setState( ( state ) => ( {
        selectedBackup: newArray[ 0 ],
        walletsArray: newArray,
        showLoader: false,
      } ) )
      // ( this.RestoreFromICloud as any ).current.snapTo( 1 )
      this.setState( {
        restoreModal: true
      } )
    } else {
      this.setState( ( state ) => ( {
        showLoader: false,
      } ) )
      // ( this.BackupNotFound as any ).current.snapTo( 1 )
      // this.setState({
      //   backupModal: true
      // })
      this.props.navigation.navigate( 'ScanRecoveryKey', {
        scannedData: ( scannedData ) => {
          if ( semver.lte( JSON.parse( scannedData ).version, '1.4.6' ) ) {
            this.props.navigation.navigate( 'RestoreSelectedContactsList' )
          } else {
            this.handleScannedData( scannedData )
          }
        }
      } )
      // ( this.BackupNotFound as any ).current.snapTo( 1 )
    }
  };

  getQuestion = ( questionId ) => {
    return QuestionList.filter( item => {
      if ( item.id === questionId ) return item.question
    } )
  }

  restoreWallet = () => {
    const { selectedBackup } = this.state
    console.log( 'selectedBackup', selectedBackup )
    this.setState( {
      walletName: selectedBackup.walletName
    } )
    this.getSecurityQuestion( selectedBackup.questionId, selectedBackup.question )

  };

  getSecurityQuestion = ( questionId, question1 ) => {
    if ( questionId > 0 ) {
      const question = this.getQuestion( questionId )
      console.log( 'Question', question )
      this.setState( {
        question: question[ 0 ].question
      } )
    } else if ( questionId === 0 ) {
      this.setState( {
        question: question1
      } )
    }
    // ( this.SecurityQuestionBottomSheet as any ).current.snapTo( 1 )
    this.setState( {
      securityQuestionModal: true
    } )
  }

  setSecurityQuestionAndName = async () => {
    const { answer, question, walletName, } = this.state
    console.log( 'answer, question, walletName', answer, question, walletName )
    if ( answer && question && walletName ) {
      const security = {
        question,
        answer,
      }
      this.props.initializeRecovery( walletName, security )
    }

  }

  decryptCloudJson = () => {
    console.log( 'decryptCloudJson Statred' )
    const { recoverWalletUsingIcloud, accounts } = this.props
    const { answer, selectedBackup }: {answer: string, selectedBackup:any} = this.state
    try {
      const key = BHROperations.strechKey( answer )
      const decryptedCloudDataJson = decrypt( selectedBackup.data, key )
      console.log( 'decryptedCloudDataJson', decryptedCloudDataJson )
      if ( decryptedCloudDataJson ) this.setSecurityQuestionAndName()
      const KeeperData: KeeperInfoInterface[] = JSON.parse( selectedBackup.keeperData )
      console.log( 'decryptCloudJson KeeperData', KeeperData )
      console.log( 'decryptCloudJson selectedBackup.levelStatus', selectedBackup.levelStatus )
      if ( this.props.keeperInfo.length == 0 ) {
        console.log( 'decryptCloudJson IF this.props.keeperInfo', this.props.keeperInfo )
        this.setKeeperInfoList( selectedBackup.levelStatus, KeeperData, selectedBackup.dateTime )
      }
      if (
        decryptedCloudDataJson &&
        selectedBackup.shares &&
        selectedBackup.keeperData
      ) {
        this.setState( {
          cloudBackup: true
        } )
        const backupData: BackupStreamData = {
        }
        const secondaryData: SecondaryStreamData = {
        }
        const downloadedBackupDataTmp: {
          primaryData?: PrimaryStreamData;
          backupData?: BackupStreamData;
          secondaryData?: SecondaryStreamData;
        } = {
          backupData, secondaryData
        }
        downloadedBackupDataTmp.backupData.primaryMnemonicShard = JSON.parse( selectedBackup.shares )
        downloadedBackupDataTmp.backupData.keeperInfo = KeeperData
        downloadedBackupDataTmp.secondaryData.secondaryMnemonicShard = selectedBackup.secondaryShare
        downloadedBackupDataTmp.secondaryData.bhXpub = selectedBackup.bhXpub

        this.props.downloadBackupData( {
          backupData: downloadedBackupDataTmp
        } )
        // this.props.updateCloudMShare( JSON.parse( selectedBackup.shares ), 0 );
        // if(selectedBackup.type == "device"){
        // ( this.RestoreFromICloud as any ).current.snapTo( 0 )
        this.setState( {
          restoreModal: false
        } )
        this.setState( {
          securityQuestionModal: false
        } )
      } else if ( decryptedCloudDataJson && !selectedBackup.shares ) {
        this.showLoaderModal()
        recoverWalletUsingIcloud( decryptedCloudDataJson, answer, selectedBackup )
      } else {
        // ( this.ErrorBottomSheet as any ).current.snapTo( 1 )
        this.setState( {
          errorModal: true
        } )
      }
    }
    catch ( error ) {
      console.log( 'ERROR', error )
    }
  }

  setKeeperInfoList = ( levelStatus, KeeperInfo: KeeperInfoInterface[], time? ) => {
    console.log( 'setKeeperInfoList levelStatus', levelStatus )
    const listDataArray = []
    let KeeperData: KeeperInfoInterface[] = [ ...KeeperInfo ]
    const tempCL = Math.max.apply( Math, KeeperData.map( function ( value ) { return value.currentLevel } ) )
    if ( levelStatus === 2 ) KeeperData = KeeperData.filter( word => word.scheme == '2of3' )
    if ( levelStatus === 3 ) KeeperData = KeeperData.filter( word => word.scheme == '3of5' )
    if ( levelStatus == 0 ) {
      levelStatus = tempCL
      if ( tempCL === 2 ) KeeperData = KeeperData.filter( word => word.scheme == '2of3' )
      if ( tempCL === 3 ) KeeperData = KeeperData.filter( word => word.scheme == '3of5' )
    }
    console.log( 'levelStatus', levelStatus )
    this.setState( {
      currentLevel: levelStatus
    } )
    let obj
    const list = []
    //console.log("KEEPERDATA slice", KeeperData)
    for ( let i = 0; i < KeeperData.length; i++ ) {
      obj = {
        type: KeeperData[ i ].type,
        title: KeeperData[ i ].data && Object.keys( KeeperData[ i ].data ).length && KeeperData[ i ].data.name ? KeeperData[ i ].data.name : KeeperData[ i ].name,
        info: '',
        time: time ? timeFormatter(
          moment( new Date() ),
          moment( time ).valueOf()
        ) : '',
        status: 'waiting',
        image: null,
        shareId: KeeperData[ i ].shareId,
        data: KeeperData[ i ].data,
      }
      console.log( 'KeeperData[i].type', KeeperData[ i ] )
      if ( KeeperData[ i ].type == 'contact' ) {
        list.push( KeeperData[ i ] )
      }
      listDataArray.push( obj )
    }
    console.log( 'list', list )
    this.setState( {
      contactList: list,
      listData: listDataArray
    } )
    this.props.putKeeperInfo( KeeperInfo )
  }

  handleScannedData = async ( scannedData ) => {
    console.log( 'scannedData', scannedData )
    const { downloadedBackupData } = this.props
    this.props.downloadBackupData( {
      scannedData: scannedData
    } )
  };

  onCreatLink = () => {
    const { database, requestShare } = this.props
    const { RECOVERY_SHARES } = database.DECENTRALIZED_BACKUP
    if ( this.state.contactList.length && this.state.contactList.length == 1 ) {
      if (
        ( RECOVERY_SHARES[ 1 ] && !RECOVERY_SHARES[ 1 ].REQUEST_DETAILS ) ||
        !RECOVERY_SHARES[ 1 ]
      ) {
        requestShare( 1 )
      }
    } else if (
      this.state.contactList.length &&
      this.state.contactList.length == 2
    ) {
      if (
        ( RECOVERY_SHARES[ 1 ] && !RECOVERY_SHARES[ 1 ].REQUEST_DETAILS ) ||
        !RECOVERY_SHARES[ 1 ]
      ) {
        requestShare( 1 )
      }
      if (
        ( RECOVERY_SHARES[ 2 ] && !RECOVERY_SHARES[ 2 ].REQUEST_DETAILS ) ||
        !RECOVERY_SHARES[ 2 ]
      ) {
        requestShare( 2 )
      }
    }
  };

  createLink = ( selectedContact, index ) => {
    const { database } = this.props
    const requester = this.state.walletName //database.WALLET_SETUP.walletName
    console.log( 'index', index )
    const { REQUEST_DETAILS } = database.DECENTRALIZED_BACKUP.RECOVERY_SHARES[
      index == 0 ? 1 : 2
    ]
    console.log(
      'database.DECENTRALIZED_BACKUP.RECOVERY_SHARES',
      database.DECENTRALIZED_BACKUP.RECOVERY_SHARES
    )
    const appVersion = DeviceInfo.getVersion()
    if (
      selectedContact.data.phoneNumbers &&
      selectedContact.data.phoneNumbers.length
    ) {
      console.log( 'selectedContact.data', selectedContact.data )
      let number = selectedContact.data.phoneNumbers.length
        ? selectedContact.data.phoneNumbers[ 0 ].number
        : ''
      number = number.slice( number.length - 10 ) // last 10 digits only
      const numHintType = 'num'
      const numHint = number[ 0 ] + number.slice( number.length - 2 )
      const numberEncKey = TrustedContactsService.encryptPub(
        // using TCs encryption mech
        REQUEST_DETAILS.KEY,
        number
      ).encryptedPub
      const numberDL =
        `https://hexawallet.io/${config.APP_STAGE}/rk` +
        `/${requester}` +
        `/${numberEncKey}` +
        `/${numHintType}` +
        `/${numHint}` +
        `/v${appVersion}`
      this.setState( {
        linkToRequest: numberDL
      } )
    } else if (
      selectedContact.data.emails &&
      selectedContact.data.emails.length
    ) {
      const email = selectedContact.data.emails.length
        ? selectedContact.data.emails[ 0 ].email
        : ''
      const Email = email.replace( '.com', '' )
      const emailHintType = 'eml'
      const emailHint = email[ 0 ] + Email.slice( Email.length - 2 )
      const emailEncPubKey = TrustedContactsService.encryptPub(
        REQUEST_DETAILS.KEY,
        email
      ).encryptedPub
      const emailDL =
        `https://hexawallet.io/${config.APP_STAGE}/rk` +
        `/${requester}` +
        `/${emailEncPubKey}` +
        `/${emailHintType}` +
        `/${emailHint}` +
        `/v${appVersion}`
      this.setState( {
        linkToRequest: emailDL
      } )
    } else {
      const otp = LevelHealth.generateOTP( parseInt( config.SSS_OTP_LENGTH, 10 ) )
      const otpHintType = 'otp'
      const otpHint = 'xxx'
      const otpEncPubKey = TrustedContactsService.encryptPub(
        REQUEST_DETAILS.KEY,
        otp
      ).encryptedPub
      const otpDL =
        `https://hexawallet.io/${config.APP_STAGE}/rk` +
        `/${requester}` +
        `/${otpEncPubKey}` +
        `/${otpHintType}` +
        `/${otpHint}` +
        `/v${appVersion}`
      this.setState( {
        linkToRequest: otpDL, isOtpType: true, otp: otp
      } )
    }
  };

  downloadSecret = () => {
    this.setState( {
      refreshControlLoader: true
    } )
    const { database } = this.props
    const { RECOVERY_SHARES } = database.DECENTRALIZED_BACKUP
    if ( RECOVERY_SHARES ) {
      for ( let shareIndex = 0; shareIndex < Object.keys( RECOVERY_SHARES ).length; shareIndex++ ) {
        if (
          RECOVERY_SHARES[ shareIndex ] &&
          !RECOVERY_SHARES[ shareIndex ].META_SHARE && RECOVERY_SHARES[ shareIndex ].REQUEST_DETAILS && RECOVERY_SHARES[ shareIndex ].REQUEST_DETAILS.KEY
        ) {
          const { KEY } = RECOVERY_SHARES[ shareIndex ].REQUEST_DETAILS
          console.log( {
            KEY,
          } )
          // Removed this method
          // this.props.downloadMShare( {
          //   encryptedKey: KEY,
          //   downloadType: 'recovery',
          //   replaceIndex: shareIndex,
          // } )
        }
      }
      this.setState( {
        refreshControlLoader: false
      } )
    }
  };

  onRefresh = () => {
    console.log( 'gggg' )
    this.downloadSecret()
  };

  setLoaderMessages = () => {
    setTimeout( () => {
      const newMessage = this.getNextMessage()
      this.setState( {
        loaderMessage: newMessage
      } )
      setTimeout( () => {
        const newMessage = this.getNextMessage()
        this.setState( {
          loaderMessage: newMessage
        } )
        setTimeout( () => {
          const newMessage = this.getNextMessage()
          this.setState( {
            loaderMessage: newMessage
          } )
          setTimeout( () => {
            const newMessage = this.getNextMessage()
            this.setState( {
              loaderMessage: newMessage
            } )
            setTimeout( () => {
              const newMessage = this.getNextMessage()
              this.setState( {
                loaderMessage: newMessage
              } )
              setTimeout( () => {
                const newMessage = this.getNextMessage()
                this.setState( {
                  loaderMessage: newMessage
                } )
              }, LOADER_MESSAGE_TIME )
            }, LOADER_MESSAGE_TIME )
          }, LOADER_MESSAGE_TIME )
        }, LOADER_MESSAGE_TIME )
      }, LOADER_MESSAGE_TIME )
    }, LOADER_MESSAGE_TIME )
  }

  showLoaderModal = () => {
    // this.loaderBottomSheet.current.snapTo( 1 )
    this.setState( {
      loaderModal: true
    } )
    this.setLoaderMessages()
  }
  getNextMessage = () => {
    if ( messageIndex == ( loaderMessages.length ) ) messageIndex = 0
    return loaderMessages[ messageIndex++ ]
  }

  renderContent = () => {
    const { selectedBackup, hideShow } = this.state
    const { navigation } = this.props
    return (
      <RestoreFromICloud
        title={`Restore from ${Platform.OS == 'ios'  ? 'iCloud' : 'GDrive'}`}
        subText={
          'Clicking on Restore would source your Recovery Key from iCloud'
        }
        cardInfo={'Restoring Wallet from'}
        cardTitle={selectedBackup.walletName}
        levelStatus={
          `${selectedBackup.levelStatus
            ? `${Platform.OS == 'ios'  ? 'iCloud' : 'GDrive'} backup at Level ${selectedBackup.levelStatus}`
            : ''}`
        }
        proceedButtonText={'Restore'}
        backButtonText={'Back'}
        modalRef={this.RestoreFromICloud}
        onPressProceed={() => {
          //(this.RestoreFromICloud as any).current.snapTo(0);
          this.setState( {
            restoreModal: false
          } )
          this.restoreWallet()
        }}
        onPressBack={() => {
          this.props.clearCloudCache()
          // ( this.RestoreFromICloud as any ).current.snapTo( 0 )
          this.setState( {
            restoreModal: false
          } )
          navigation.navigate( 'WalletInitialization' )

        }}
        hideShow={this.state.hideShow}
        walletsArray={this.state.walletsArray}
        onPressSelectValue={( value )=>{
          this.setState( {
            hideShow: false
          } )
          this.setState( {
            selectedBackup: value
          } )
        }}
        onPressCard={() => {
          console.log( 'ajfjkh asd', hideShow )
          this.setState( {
            hideShow: !hideShow
          } )
        }}
      />
    )
  }

  render() {
    const {
      hideShow,
      cloudBackup,
      walletsArray,
      selectedBackup,
      showLoader,
      refreshControlLoader,
      selectedContact,
      linkToRequest,
      listData,
      contactList,
      renderTimer,
      otp,
      isOtpType,
      restoreModal,
      securityQuestionModal,
      errorModal,
      sendViaLinkModal,
      loaderModal,
      shareOTPModal,
      restoreWallet,
      contactListModal,
      backupModal
    } = this.state
    const { navigation, database } = this.props
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.backgroundColor1,
          position: 'relative',
        }}
      >
        <SafeAreaView style={{
          flex: 0
        }} />
        <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />
        <View style={styles.modalHeaderTitleView}>
          <View style={{
            flex: 1, flexDirection: 'row'
          }}>
            <TouchableOpacity
              onPress={() => {
                this.props.clearCloudCache()
                navigation.navigate( 'WalletInitialization' )
              }}
              style={styles.headerBackArrowView}
            >
              <FontAwesome
                name="long-arrow-left"
                color={Colors.blue}
                size={17}
              />
            </TouchableOpacity>
            <View style={{
              justifyContent: 'center', width: wp( '80%' )
            }}>
              <Text numberOfLines={2} style={styles.modalHeaderTitleText}>
                {'Recover using keys'}
              </Text>
              <Text numberOfLines={2} style={styles.modalHeaderInfoText}>
                The status of your Recovery Key request is visible below
              </Text>
            </View>
          </View>
        </View>
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshControlLoader}
              onRefresh={() => this.onRefresh()}
            />
          }
          style={{
            flex: 1,
            marginBottom: hp( '2%' ),
          }}
        >
          {cloudBackup &&
            listData.map( ( item, index ) => {
              return (
                <View
                  key={index}
                  style={{
                    ...styles.cardsView,
                    borderBottomWidth: index == 2 ? 0 : 4,
                  }}
                >
                  {item.type == 'contact' && item.image ? (
                    <View style={styles.keeperImageView} >
                      <Image
                        source={item.image}
                        style={styles.keeperImage}
                      />
                    </View>
                  ) : (
                    <ImageBackground
                      source={require( '../../assets/images/icons/Ellipse.png' )}
                      style={{
                        ...styles.cardsImageView, marginRight: 10
                      }}
                    >
                      <Image
                        source={
                          item.type == 'contact'
                            ? require( '../../assets/images/icons/icon_contact.png' )
                            : item.type == 'device'
                              ? require( '../../assets/images/icons/icon_secondarydevice.png' )
                              : require( '../../assets/images/icons/icon_contact.png' )
                        }
                        style={styles.cardImage}
                      />
                    </ImageBackground>
                  )}
                  <View>
                    <Text
                      style={{
                        ...styles.cardsInfoText,
                        fontSize: RFValue( 18 ),
                      }}
                    >
                      {item.title}
                    </Text>
                    <Text style={styles.cardsInfoText}>{item.info}</Text>
                    <Text style={styles.cardsInfoText}>
                      Last backup {item.time}
                    </Text>
                  </View>
                  {item.status == 'received' ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginLeft: 'auto',
                      }}
                    >
                      <View
                        style={{
                          ...styles.statusTextView,
                          backgroundColor: Colors.lightGreen,
                        }}
                      >
                        <Text style={styles.statusText}>Key Received</Text>
                      </View>
                      <View
                        style={{
                          backgroundColor: Colors.lightGreen,
                          width: wp( '5%' ),
                          height: wp( '5%' ),
                          borderRadius: wp( '5%' ) / 2,
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginLeft: 5,
                        }}
                      >
                        <AntDesign
                          name={'check'}
                          size={RFValue( 10 )}
                          color={Colors.darkGreen}
                        />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.statusTextView}>
                      <Text style={styles.statusText}>Waiting for Key</Text>
                    </View>
                  )}
                </View>
              )
            } )}
        </ScrollView>
        <View
          style={{
            flexDirection: 'row',
            marginLeft: 25,
            marginRight: 25,
            marginTop: 'auto',
            marginBottom: hp( '1%' ),
            alignItems: 'center',
          }}
        >
          <Text style={styles.modalHeaderInfoText}>
            Use Send Request to share a link with a contact. If the person you wish to backup your Recovery Key with, is with you in person, use Scan Key. Or they could also send you a screenshot of the QR for you to scan
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: Colors.blue,
            height: 60,
            borderRadius: 10,
            marginLeft: 25,
            marginRight: 25,
            marginTop: 'auto',
            marginBottom: hp( '4%' ),
            justifyContent: 'space-evenly',
            alignItems: 'center',
            shadowColor: Colors.shadowBlue,
            shadowOpacity: 1,
            shadowOffset: {
              width: 15, height: 15
            },
          }}
        >
          <TouchableOpacity
            onPress={() => {
              // alert("test");
              // ( this.ContactListForRestore as any ).current.snapTo( 1 )
              this.setState( {
                contactListModal: true
              } )
              // this.onCreatLink();
            }}
            style={styles.buttonInnerView}
            disabled={contactList.length ? false : true}
          >
            <Image
              source={require( '../../assets/images/icons/openlink.png' )}
              style={styles.buttonImage}
            />
            <Text style={styles.buttonText}>Send Request</Text>
          </TouchableOpacity>
          <View
            style={{
              width: 1, height: 30, backgroundColor: Colors.white
            }}
          />
          <TouchableOpacity
            style={styles.buttonInnerView}
            onPress={() => {
              navigation.navigate( 'ScanRecoveryKey', {
                scannedData: ( scannedData ) =>
                  this.handleScannedData( scannedData ),
              } )
            }}
          >
            <Image
              source={require( '../../assets/images/icons/qr-code.png' )}
              style={styles.buttonImage}
            />
            <Text style={styles.buttonText}>Scan Key</Text>
          </TouchableOpacity>
        </View>
        {showLoader ? <Loader isLoading={true} /> : null}

        <ModalContainer visible={restoreModal} closeBottomSheet={() => {
          this.setState( {
            restoreModal: false
          } )
        }} >
          {this.renderContent()}
        </ModalContainer>
        <ModalContainer visible={contactListModal} closeBottomSheet={() => { }} >
          <ContactListForRestore
            title={'Select Contact'}
            subText={
              'Select contact to send a Wallet Restore request link'
            }
            contactList={contactList}
            modalRef={this.ContactListForRestore}
            onPressCard={( contact, index ) => {
              this.setState( {
                selectedContact: contact,
                contactListModal: false
              }, () => {
                this.setState( {
                  sendViaLinkModal: true
                } )
              } )
              // ( this.ContactListForRestore as any ).current.snapTo( 0 )
              // ( this.SendViaLinkBottomSheet as any ).current.snapTo( 1 )

              this.createLink( contact, index )
            }}
          />
        </ModalContainer>
        <ModalContainer visible={this.state.restoreSuccess} closeBottomSheet={() => { this.setState( {
          restoreSuccess: false
        } )}} >
          <RestoreSuccess
            modalRef={this.RestoreSuccess}
            onPressProceed={() => {
              this.setState( {
                restoreSuccess: false
              } )
              this.props.navigation.navigate( 'HomeNav' )
            }}
            onPressBack={() => {
              this.setState( {
                restoreSuccess: false
              } )
              this.props.navigation.navigate( 'HomeNav' )
            }}
          />
        </ModalContainer>
        <ModalContainer visible={backupModal} closeBottomSheet={() => { }} >
          <ICloudBackupNotFound
            modalRef={this.BackupNotFound}
            onPressProceed={() => {
              // ( this.BackupNotFound as any ).current.snapTo( 0 )
              // navigation.replace( 'WalletNameRecovery' )
              this.setState( {
                backupModal: false
              } )
            }}
            onPressBack={() => {
              // ( this.BackupNotFound as any ).current.snapTo( 0 )
              this.setState( {
                backupModal: false
              } )
            }}
          />
        </ModalContainer>
        <ModalContainer visible={restoreWallet} closeBottomSheet={() => { }} >
          <RestoreWallet
            modalRef={this.RestoreWallet}
            onPressProceed={() => {
              // ( this.RestoreWallet as any ).current.snapTo( 0 )
              this.setState( {
                restoreWallet: false
              } )
            }}
            onPressBack={() => {
              // ( this.RestoreWallet as any ).current.snapTo( 0 )
              this.setState( {
                restoreWallet: false
              } )
            }}
          />
        </ModalContainer>
        <ModalContainer visible={loaderModal} closeBottomSheet={() => { }} >
          <LoaderModal headerText={this.state.loaderMessage.heading} messageText={this.state.loaderMessage.text} />
        </ModalContainer>
        {/* <BottomSheet
          enabledGestureInteraction={false}
          enabledInnerScrolling={true}
          ref={this.loaderBottomSheet}
          snapPoints={[
            -50,
            Platform.OS == 'ios' && DeviceInfo.hasNotch()
              ? hp( '100%' )
              : hp( '100%' ),
          ]}
          renderContent={() => (
          )}
          renderHeader={() => (
            <View
              style={{
                marginTop: 'auto',
                flex: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                height: hp( '75%' ),
                zIndex: 9999,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            />
          )}
        /> */}
        <ModalContainer visible={securityQuestionModal} closeBottomSheet={() => { this.setState( {
          securityQuestionModal: false
        } ) }} >
          <SecurityQuestion
            question={this.state.question}
            // onFocus={() => {
            //   if ( Platform.OS == 'ios' ){
            //     if( this.SecurityQuestionBottomSheet as any )
            //       ( this.SecurityQuestionBottomSheet as any ).current.snapTo( 2 )}
            // }}
            // onBlur={() => {
            //   if ( Platform.OS == 'ios' ){
            //     if( this.SecurityQuestionBottomSheet as any )
            //       ( this.SecurityQuestionBottomSheet as any ).current.snapTo( 1 )}
            // }}
            onPressConfirm={( answer ) => {
              Keyboard.dismiss()
              // if( this.SecurityQuestionBottomSheet as any )
              //   ( this.SecurityQuestionBottomSheet as any ).current.snapTo( 0 )
              this.setState( {
                securityQuestionModal: false
              } )
              this.setState( ( state ) => ( {
                answer: answer
              } ) )
              this.decryptCloudJson()
            }}
          />
          {/* )
         }
          renderHeader={()=>( <ModalHeader
            onPressHeader={() => {
              ( this.SecurityQuestionBottomSheet as any ).current.snapTo( 0 )
            }}
          /> )}
        /> */}
        </ModalContainer>
        <ModalContainer visible={errorModal} closeBottomSheet={() => { }}>
          <ErrorModalContents
            modalRef={this.ErrorBottomSheet}
            title={'Error receiving Recovery Key'}
            info={
              'There was an error while receiving your Recovery Key, please try again'
            }
            proceedButtonText={'Try again'}
            onPressProceed={() => {
              // ( this.ErrorBottomSheet as any ).current.snapTo( 0 )
              this.setState( {
                errorModal: false
              } )
            }}
            isBottomImage={true}
            bottomImage={require( '../../assets/images/icons/errorImage.png' )}
          />
        </ModalContainer>
        <ModalContainer visible={sendViaLinkModal} closeBottomSheet={() => { }} >
          {selectedContact.data && <SendViaLink
            headerText={'Send Request'}
            subHeaderText={'Send a recovery request link'}
            contactText={'Requesting for recovery:'}
            contact={selectedContact.data ? selectedContact.data : null}
            contactEmail={''}//database.WALLET_SETUP.walletName
            infoText={`Click here to accept Keeper request for ${this.state.walletName
            } Hexa wallet- link will expire in ${config.TC_REQUEST_EXPIRY / ( 60000 * 60 )
            } hours`}
            link={linkToRequest}
            onPressBack={() => {
              // if ( this.SendViaLinkBottomSheet )
              //   ( this.SendViaLinkBottomSheet as any ).current.snapTo( 0 )
              this.setState( {
                sendViaLinkModal: false
              } )
            }}

            onPressDone={() => {
              if ( isOtpType ) {
                this.setState( {
                  renderTimer: true,
                  sendViaLinkModal: false

                }, () => {
                  this.setState( {
                    shareOTPModal: true
                  } )
                } )
                // ( this.shareOtpWithTrustedContactBottomSheet as any ).current.snapTo( 1 )
                // this.setState( {
                //   shareOTPModal: false
                // } )
              } else {
                this.setState( {
                  sendViaLinkModal: false
                } )
              }
              // ( this.SendViaLinkBottomSheet as any ).current.snapTo( 0 )

            }}
          />}
        </ModalContainer>
        <ModalContainer visible={shareOTPModal} closeBottomSheet={() => { }} >
          <ShareOtpWithTrustedContact
            renderTimer={renderTimer}
            onPressOk={() => {
              this.setState( {
                renderTimer: false,
                shareOTPModal: false
              } )
              // ( this.shareOtpWithTrustedContactBottomSheet as any ).current.snapTo(
              //   0
              // )
            }}
            onPressBack={() => {
              this.setState( {
                renderTimer: false,
                shareOTPModal: false
              } )
              // ( this.shareOtpWithTrustedContactBottomSheet as any ).current.snapTo(
              //   0
              // )
            }}
            OTP={otp}
          />
        </ModalContainer>
      </View>
    )
  }
}

const mapStateToProps = ( state ) => {
  return {
    accounts: state.accounts || [],
    s3Service: idx( state, ( _ ) => _.health.service ),
    regularAccount: idx( state, ( _ ) => _.accounts[ REGULAR_ACCOUNT ].service ),
    cloudBackupStatus:
      idx( state, ( _ ) => _.cloud.cloudBackupStatus ) || CloudBackupStatus.PENDING,
    database: idx( state, ( _ ) => _.storage.database ) || {
    },
    security: idx( state, ( _ ) => _.storage.wallet.security ),
    overallHealth: idx( state, ( _ ) => _.health.overallHealth ),
    trustedContacts: idx( state, ( _ ) => _.trustedContacts.service ),
    walletImageChecked: idx( state, ( _ ) => _.health.walletImageChecked ),
    SERVICES: idx( state, ( _ ) => _.storage.database.SERVICES ),
    walletRecoveryFailed: idx( state, ( _ ) => _.health.walletRecoveryFailed ),
    DECENTRALIZED_BACKUP:
      idx( state, ( _ ) => _.storage.database.DECENTRALIZED_BACKUP ) || {
      },
    errorReceiving:
      idx( state, ( _ ) => _.health.errorReceiving ) || {
      },
    downloadMetaShare: idx( state, ( _ ) => _.health.loading.downloadMetaShare ),
    cloudData: idx( state, ( _ ) => _.cloud.cloudData ),
    downloadedBackupData: idx( state, ( _ ) => _.health.downloadedBackupData ),
    keeperInfo: idx( state, ( _ ) => _.health.keeperInfo ),
    wallet: idx( state, ( _ ) => _.storage.wallet ),
  }
}

export default withNavigationFocus(
  connect( mapStateToProps, {
    recoverWalletUsingIcloud,
    checkMSharesHealth,
    initializeHealthSetup,
    downloadMShare,
    recoverWallet,
    updateCloudMShare,
    requestShare,
    getCloudDataRecovery,
    clearCloudCache,
    initNewBHRFlow,
    walletCheckIn,
    setVersion,
    initializeRecovery,
    setCloudBackupStatus,
    downloadBackupData,
    putKeeperInfo,
    setupHealth
  } )( RestoreWithICloud )
)

const styles = StyleSheet.create( {
  modalHeaderTitleView: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingRight: 5,
    paddingBottom: 5,
    paddingTop: 10,
    marginLeft: 20,
    marginRight: 20,
  },
  modalHeaderTitleText: {
    color: Colors.blue,
    fontSize: RFValue( 18 ),
    fontFamily: Fonts.FiraSansMedium,
  },
  modalHeaderInfoText: {
    color: Colors.textColorGrey,
    fontSize: RFValue( 11 ),
    fontFamily: Fonts.FiraSansRegular,
    marginTop: hp( '0.7%' ),
    marginBottom: hp( '0.7%' ),
  },
  headerBackArrowView: {
    height: 30,
    width: 30,
    justifyContent: 'center',
  },
  buttonInnerView: {
    flexDirection: 'row',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    width: wp( '30%' ),
  },
  buttonImage: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    tintColor: Colors.white,
  },
  buttonText: {
    color: Colors.white,
    fontSize: RFValue( 12 ),
    fontFamily: Fonts.FiraSansRegular,
    marginLeft: 10,
  },
  cardsInfoText: {
    fontSize: RFValue( 10 ),
    fontFamily: Fonts.FiraSansRegular,
    color: Colors.textColorGrey,
  },
  cardsView: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: Colors.backgroundColor,
  },
  cardsImageView: {
    width: wp( '20%' ),
    height: wp( '20%' ),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImage: {
    width: wp( '7%' ),
    height: wp( '7%' ),
    resizeMode: 'contain',
    marginBottom: wp( '1%' ),
  },
  statusTextView: {
    // padding: 5,
    height: wp( '5%' ),
    backgroundColor: Colors.backgroundColor,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginLeft: 'auto',
    paddingLeft: 10,
    paddingRight: 10,
  },
  statusText: {
    fontSize: RFValue( 9 ),
    fontFamily: Fonts.FiraSansRegular,
    color: Colors.textColorGrey,
  },
  keeperImage: {
    width: wp( '15%' ),
    height: wp( '15%' ),
    borderRadius: wp( '15%' ) / 2,
  },
  keeperImageView: {
    borderRadius: wp( '15%' ) / 2,
    borderColor: Colors.white,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.8,
    shadowColor: Colors.textColorGrey,
    shadowRadius: 5,
    elevation: 10,
    marginRight: 15,
    marginLeft: 5,
  }
} )
