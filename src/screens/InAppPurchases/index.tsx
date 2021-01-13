import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableHighlight, Platform, View, Alert, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { connect } from 'react-redux';
import { Reducers } from '../../redux/reducers/reducers';
import iapUtils, * as RNIap from 'react-native-iap';
import { deviceStorage, normalize } from '../../helpers';
import { getHeaders } from '../../helpers/headers';
import prettysize from 'prettysize';
import analytics, { getLyticsUuid } from '../../helpers/lytics';
import { getIcon } from '../../helpers/getIcon';
import { LinearGradient } from 'expo-linear-gradient';
import ProgressBar from '../../components/ProgressBar';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import PlansCard from './PlansCard';
import { StoreInfo } from './plans';
import _ from 'lodash'

interface InAppPurchasesProps extends Reducers {
  navigation?: any,
  dispatch?: any,
  chosen?: boolean
}

interface IPlan {
  id: string
  sku: string
  interval: number
  name: string
  price: number
}
interface IMetadata {
  sizeBytes: number
  simpleName: string
}
interface IProduct {
  id: string
  name: string
  plans: IPlan[]
  metadata: IMetadata[]
}

function InAppPurchases(props: InAppPurchasesProps): JSX.Element {
  const [product, setProduct] = useState([]);
  const [usageValues, setUsageValues] = useState({ usage: 0, limit: 0 })
  const [productChosen, setProductChosen] = useState<IProduct>();
  const [isSubscripted, setIsSubscripted] = useState(false)
  let purchaseUpdateSub: any;
  let purchaseErrorSub: any;

  const environment = StoreInfo[process.env.NODE_ENV];
  const loadProducts : IProduct[] = environment[Platform.OS];

  const loadLimit = async () => {
    const xToken = await deviceStorage.getItem('xToken') || undefined

    return fetch(`${process.env.REACT_NATIVE_API_URL}/api/limit`, {
      method: 'get',
      headers: getHeaders(xToken)
    }).then(res => {
      if (res.status !== 200) { throw Error('Cannot load limit') }
      return res
    }).then(res => res.json()).then(res => res.maxSpaceBytes)
  }

  const loadUsage = async () => {
    const xToken = await deviceStorage.getItem('xToken') || undefined

    return fetch(`${process.env.REACT_NATIVE_API_URL}/api/usage`, {
      method: 'get',
      headers: getHeaders(xToken)
    }).then(res => {
      if (res.status !== 200) { throw Error('Cannot load usage') }
      return res
    }).then(res => res.json()).then(res => res.total)
  }

  const identifyPlanName = (bytes: number): string => {
    return bytes === 0 ? 'Free 2GB' : prettysize(bytes)
  }

  const loadValues = async () => {
    const limit = await loadLimit()
    const usage = await loadUsage()

    const uuid = await getLyticsUuid()

    analytics.identify(uuid, {
      platform: 'mobile',
      storage: usage,
      plan: identifyPlanName(limit),
      userId: uuid
    }).catch(() => { })

    return { usage, limit }
  }

  const getSkus = () => _.flatten(loadProducts.map(product => product.plans.map(plan => plan.sku)));

  const getSubscriptions = async () => {
    const skus = getSkus()
    const subscriptions = await RNIap.getSubscriptions(skus);

    setProduct(subscriptions)
    return product
  }

  const requestSubscription = async (sku: any) => {
    try {
      await getSubscriptions()
      await RNIap.requestSubscription(sku);
    } catch (err) {
      alert(err.toLocaleString());
    }
  };

  const getUserName = async () => {
    const xUser = await deviceStorage.getItem('xUser')
    const xUserJson = JSON.parse(xUser || '{}')

    return xUserJson.name
  }

  const getUserLastName = async () => {
    const xUser = await deviceStorage.getItem('xUser')
    const xUserJson = JSON.parse(xUser || '{}')

    return xUserJson.lastname
  }

  const getPurchaseHistory = () => {
    const purchaseHistory = RNIap.getPurchaseHistory().then((res) => { return res})

    return purchaseHistory
  }

  useEffect(() => {
  }, [productChosen])

  useEffect(() => {
    const e = getPurchaseHistory().then((res=>{
      console.log('tiene comprado', res)
    }))

    loadValues().then(values => {
      setUsageValues(values)
    })
    try {
      RNIap.initConnection().then((res) => { getSubscriptions() })
      if (Platform.OS === 'android') {
        RNIap.flushFailedPurchasesCachedAsPendingAndroid().then((cache) => {

        }).catch((err) => {
          console.log('err', err)
        })
      }
    } catch (err) {
      console.log('error in cdm', err)
    }

    purchaseUpdateSub = RNIap.purchaseUpdatedListener(
      async (
        purchase: RNIap.InAppPurchase | RNIap.SubscriptionPurchase | RNIap.ProductPurchase
      ) => {
        const receipt = purchase.transactionReceipt;

        console.log('RECIBO SUBSCRIPCION', receipt)
        if (receipt) {
          setIsSubscripted(true)
          const receiptPayLoad = {
            receipt: purchase,
            name: await getUserName(),
            lastname: await getUserLastName()
          };

          console.log('RECEPT PAYLOAD', receiptPayLoad)

          try {
            const sendResult = '' //FETCH TO SERVER TO PASS THE RESULT

            if (sendResult) {
              await iapUtils.finishTransaction(purchase, false);

            }
          } catch (e) {
            throw new Error(e)
          }
        }
        purchaseErrorSub = RNIap.purchaseErrorListener(
          (error: RNIap.PurchaseError) => {
            Alert.alert('Subscription error');
          }
        )
      }
    )
    return () => {
      if (purchaseUpdateSub) {
        purchaseUpdateSub.remove();
      }
      if (purchaseErrorSub) {
        purchaseErrorSub.remove();
      }

    }

  }, [])

  return (
    <View style={styles.container}>
      <View style={styles.navigatorContainer}>
        <View style={styles.backButton}>
          <TouchableWithoutFeedback
            onPress={() => {
              props.navigation.replace('FileExplorer')
            }}
          >
            <Image style={styles.backIcon} source={getIcon('back')} />
          </TouchableWithoutFeedback>
        </View>

        <Text style={styles.backText}>Storage</Text>
      </View>
      <View style={styles.progressContainer}>
        <View style={styles.firstRow}>
          <Text style={styles.progressTitle}>Storage Space</Text>

          <View style={styles.usedSapceContainer}>
            <Text style={styles.usedSpace}>Used </Text>
            <Text style={[styles.usedSpace, styles.bold]}>{prettysize(usageValues.usage)} </Text>
            <Text style={styles.usedSpace}>of </Text>
            <Text style={[styles.usedSpace, styles.bold]}>{prettysize(usageValues.limit)}</Text>
          </View>
        </View>

        <ProgressBar
          styleBar={{}}
          styleProgress={{ height: 8 }}
          totalValue={usageValues.limit}
          usedValue={usageValues.usage}
        />

        <View style={styles.secondRow}>
          <View style={styles.legend}>
            <LinearGradient
              colors={['#00b1ff', '#096dff']}
              start={[0, 0.18]}
              end={[0.18, 1]}

              style={styles.circle} />
            <Text style={styles.secondRowText}>Used space</Text>
          </View>

          <View style={styles.legend}>
            <View style={styles.circle}></View>
            <Text style={styles.secondRowText}>Unused space</Text>
          </View>
        </View>
      </View>
      <View style={styles.cardsContainer}>
        {

          !productChosen ?
            <View>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Storage plans</Text>
              </View>
              {
                loadProducts.map(productObject => (
                  <TouchableWithoutFeedback
                    key={productObject.id}
                    onPress={async () => {
                      setProductChosen(productObject)
                    }}>
                    <PlansCard size={productObject.metadata[0].simpleName} price={productObject.plans[0].price} />

                  </TouchableWithoutFeedback>
                ))
              }
            </View>
            :
            <View>

              <View>
                <View style={styles.titleContainer}>
                  <TouchableOpacity
                    onPress={() => {
                      setProductChosen(undefined)
                    }}
                  >
                    <Image style={styles.paymentBackIcon} source={getIcon('back')} />
                  </TouchableOpacity>

                  <Text style={styles.title}>Payment length</Text>

                  <Text style={styles.titlePlan}>{productChosen.name}</Text>
                </View>
                {
                  productChosen && productChosen.plans.map(plan => <TouchableWithoutFeedback
                    key={plan.price}
                    onPress={() => {
                      requestSubscription(plan.sku)
                    }}
                  >
                    <PlansCard chosen={true} price={plan.price} plan={productChosen.name} name={plan.name} interval={plan.interval}/>
                  </TouchableWithoutFeedback>)
                }
              </View>

            </View>
        }
        <View>
          <Text style={styles.footer}> {isSubscripted && productChosen ? `You are subscripted to the ${productChosen.name}` : 'You are subscribed to the 2GB plan'}</Text>
        </View>
      </View>
    </View>

  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'flex-start',
    height: '100%',
    backgroundColor: 'white'
  },
  navigatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderColor: '#f2f2f2'
  },
  backButton: {
    flex: 0.1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  backIcon: {
    height: 14,
    width: 9
  },
  backText: {
    flex: 0.8,
    textAlign: 'center',
    fontFamily: 'CerebriSans-Medium',
    fontSize: 16,
    color: 'black'
  },
  cardsContainer: {
    paddingTop: 20,
    marginLeft: 20,
    flexGrow: 1
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  title: {
    fontFamily: 'CerebriSans-Bold',
    fontSize: 18,
    height: 32,
    letterSpacing: 0,
    color: 'black',
    marginRight: 10
  },
  progressContainer: {
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderColor: '#f2f2f2',
    paddingBottom: 45,
    paddingTop: 30
  },
  firstRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  progressTitle: {
    flex: 0.5,
    fontFamily: 'CerebriSans-Bold',
    fontSize: 18,
    color: 'black',
    paddingLeft: 20
  },
  usedSapceContainer: {
    flexDirection: 'row',
    flex: 0.5,
    justifyContent: 'flex-end',
    paddingRight: 20
  },
  usedSpace: {
    fontFamily: 'CerebriSans-Regular',
    color: 'black',
    fontSize: 13
  },
  bold: {
    fontFamily: 'CerebriSans-Bold'
  },
  secondRow: {
    flexDirection: 'row',
    marginLeft: 20
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 30
  },
  circle: {
    width: 16,
    height: 16,
    borderRadius: 100,
    marginRight: 6,
    backgroundColor: '#ededed'
  },
  secondRowText: {
    fontSize: 13,
    fontFamily: 'CerebriSans-Regular',
    color: '#7e848c'
  },
  titlePlan: {
    fontFamily: 'CerebriSans-Medium',
    fontSize: 18,
    height: 32,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderColor: '#eaeced'
  },
  paymentBackIcon: {
    width: 8,
    height: 13,
    marginRight: 10
  },
  footer: {
    fontFamily: 'CerebriSans-Regular',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.1,
    marginLeft: 20,
    marginTop: 20,
    color: '#7e848c'
  }
});

const mapStateToProps = (state: any) => {
  return { ...state };
};

export default connect(mapStateToProps)(InAppPurchases)
