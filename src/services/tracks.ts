import { deviceStorage } from '../helpers'
import analytics from '../helpers/lytics'
import * as userService from './user'

export async function trackIdentifyPlanName(limit: number, usage: number) {
  const user = await deviceStorage.getUserStorage()

  if (user) {
    analytics.identify(user.uuid, {
      platform: 'mobile',
      storage: usage,
      plan: userService.identifyPlanName(limit),
      userId: user.uuid
    })
  }
}