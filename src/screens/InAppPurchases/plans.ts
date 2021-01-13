interface IAPObject {
  name: string
  id: string
}

export const StoreInfo = {
  development: {
    android: [
      {
        id: 'drive_20GB',
        name: 'Drive 20GB Test',
        plans: [
          {
            id: '',
            sku: 'sub_1tb',
            name: 'Monthly',
            price: 0.89,
            interval: 1
          },
          {
            id: '',
            sku: 'sub_1tb',
            name: 'Semiannually',
            price: 0.95,
            interval: 6
          },
          {
            id: '',
            sku: 'sub_1tb',
            name: 'Year',
            price: 0.99,
            interval: 12
          }
        ],
        metadata: [
          {
            sizeBytes: 21474836480,
            simpleName: '20GB'
          }

        ]

      },
      {
        id: 'drive_200GB',
        name: 'Drive 200GB Test',
        plans: [
          {
            id: '',
            sku: 'sub_100gb',
            name: 'Monthly',
            price: 4.49,
            interval: 1
          },
          {
            id: '',
            sku: 'sub_100gb',
            name: 'Semiannually',
            price: 23.94,
            interval: 6
          },
          {
            id: '',
            sku: 'sub_100gb',
            name: 'Year',
            price: 41.88,
            interval: 12
          }
        ],
        metadata: [
          {
            sizeBytes: 214748364800,
            simpleName: '200GB'
          }

        ]

      },
      {
        id: 'drive_2TB',
        name: 'Drive 2TB Test',
        plans: [
          {
            id: '',
            sku: 'sub_1tb',
            name: 'Monthly',
            price: 9.99,
            interval: 1
          },
          {
            id: '',
            sku: 'sub_1tb',
            name: 'Semiannually',
            price: 56.94,
            interval: 6
          },
          {
            id: '',
            sku: 'sub_1tb',
            name: 'Year',
            price: 107.88,
            interval: 12
          }
        ],
        metadata: [
          {
            sizeBytes: 2199023255552,
            simpleName: '200TB'
          }

        ]

      }
    ],
    ios: []
  },
  production: {
    android: [
      {
        id: 'drive_20GB',
        name: 'Drive 20GB',
        plans: [
          {
            id: 'sub_1tb',
            sku: 'sub_1tb',
            name: 'Monthly',
            price: 0.89,
            interval: 1
          },
          {
            id: 'sub_1tb',
            sku: 'sub_1tb',
            name: 'Semiannually',
            price: 0.95,
            interval: 6
          },
          {
            id: 'sub_1tb',
            sku: 'sub_1tb',
            name: 'Year',
            price: 0.99,
            interval: 12
          }
        ],
        metadata: [
          {
            sizeBytes: 21474836480,
            simpleName: '20GB'
          }

        ]

      },
      {
        id: 'drive_200GB',
        name: 'Drive 200GB',
        plans: [
          {
            id: 'sub_100gb',
            sku: 'sub_100gb',
            name: 'Monthly',
            price: 4.49,
            interval: 1
          },
          {
            id: 'sub_100gb',
            sku: 'sub_100gb',
            name: 'Semiannually',
            price: 23.94,
            interval: 6
          },
          {
            id: 'sub_100gb',
            sku: 'sub_100gb',
            name: 'Year',
            price: 41.88,
            interval: 12
          }
        ],
        metadata: [
          {
            sizeBytes: 214748364800,
            simpleName: '200GB'
          }

        ]

      },
      {
        id: 'drive_2TB',
        name: 'Drive 2TB',
        plans: [
          {
            id: 'sub_1tb',
            sku: 'sub_1tb',
            name: 'Monthly',
            price: 9.99,
            interval: 1
          },
          {
            id: 'sub_1tb',
            sku: 'sub_1tb',
            name: 'Semiannually',
            price: 56.94,
            interval: 6
          },
          {
            id: 'sub_1tb',
            sku: 'sub_1tb',
            name: 'Year',
            price: 107.88,
            interval: 12
          }
        ],
        metadata: [
          {
            sizeBytes: 2199023255552,
            simpleName: '200TB'
          }

        ]

      }
    ],
    ios: []
  },
  test: {
    android: null,
    ios: null
  }
}

const productsStripe = [
  {
    'id': 'prod_Frb0EaIua4Dpdt',
    'name': 'Drive 20GB',
    'metadata': {
      'size_bytes': '21474836480',
      'simple_name': '20GB',
      'price_eur': '0.89',
      'member_tier': 'premium'
    }
  },
  {
    'id': 'prod_EUaOAFtvLBFJmC',
    'name': 'Drive 200GB',
    'metadata': {
      'size_bytes': '214748364800',
      'simple_name': '200GB',
      'price_eur': '3.49',
      'member_tier': 'premium'
    }
  }, {
    'id': 'prod_EUaUAiDCK1Etz1',
    'name': 'Drive 2TB',
    'metadata': {
      'size_bytes': '2199023255552',
      'simple_name': '2TB',
      'price_eur': '8.99',
      'member_tier': 'premium'
    }
  }]

const plansStripe = [
  {
    'id': 'plan_Frb0qIcAlz2lDm',
    'price': 99,
    'name': 'Monthly',
    'interval': 'month',
    'interval_count': 1
  },
  {
    'id': 'plan_Frb1M2yzs2WQn9',
    'price': 570,
    'name': 'Semiannually',
    'interval': 'month',
    'interval_count': 6
  },
  {
    'id': 'plan_Frb29JIJYJ4e8G',
    'price': 1068,
    'name': 'Annually',
    'interval': 'year',
    'interval_count': 1
  }]

export default StoreInfo