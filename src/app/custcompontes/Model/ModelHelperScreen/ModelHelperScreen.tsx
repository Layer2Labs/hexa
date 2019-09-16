import React, { Component } from 'react';
import {
    Modal,
    TouchableHighlight, View, StyleSheet, Image,
    Dimensions
} from 'react-native';

//TODO: Custome Object
import {
    images
} from "HexaWallet/src/app/constants/Constants";

interface Props {
    data: [];
    pop: Function;
    closeModal: Function;
    click_Next: Function;
}

export default class ModelHelperScreen extends Component<Props, any> {
    constructor ( props: any ) {
        super( props )
        this.state = ( {
            data: [],
            helperImage: "helper1",
            index: 0
        } );
    }


    componentWillReceiveProps = ( receProps: any ) => {
        let data = receProps.data[ 0 ];
        console.log( { data } );
        if ( data != undefined ) {
            data = data;
            console.log( { newdata: data } );
            this.setState( {
                data: data.images,
                helperImage: data.images[ 0 ],
                index: 0
            } )
        }
    }


    click_ChangeImage = () => {
        let { data, index } = this.state;
        console.log( { len: data.length, index } );
        if ( data.length > index + 1 ) {
            this.setState( {
                helperImage: data[ index + 1 ],
                index: index + 1
            } )
        } else {
            this.props.closeModal();
        }
    }

    render() {
        let data = this.props.data.length != 0 ? this.props.data : [];
        //values
        let { helperImage } = this.state;
        return (
            <Modal
                animationType={ 'fade' }
                visible={ data.length != 0 ? data[ 0 ].modalVisible : false }
                onRequestClose={ () =>
                    this.props.closeModal()
                }
                presentationStyle="fullScreen"
            >
                <View style={ [
                    styles.modalBackground,
                    { backgroundColor: 'rgba(0,0,0,0.7)' }
                ] }>
                    <TouchableHighlight onPress={ () => this.click_ChangeImage() }>
                        <Image
                            source={ images.helperScreen[ helperImage ] }
                            resizeMode="stretch"
                            style={ { width: Dimensions.get( 'screen' ).width, height: Dimensions.get( 'screen' ).height } }
                        />

                    </TouchableHighlight>
                </View>
            </Modal>
        );
    }
}

const styles = StyleSheet.create( {
    modalBackground: {
        flex: 1
    }
} );