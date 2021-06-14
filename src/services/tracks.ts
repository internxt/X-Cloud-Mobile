import { Platform } from 'react-native'
import { deviceStorage } from '../helpers'
import { ICurrentPlan, IUser } from '../helpers/interfaces'
import analytics from '../helpers/lytics'
import * as userService from './user'
import Firebase from '@segment/analytics-react-native-firebase'

export async function trackSetupAnalytics(writenKey: string): Promise<void> {
  return analytics.setup(writenKey, {
    recordScreenViews: true,
    trackAppLifecycleEvents: true,
    using: [Firebase]
  });
}

export async function trackIdentifyPlanName(limit: number, usage: number): Promise<void> {
  const user: IUser = await deviceStorage.getUserStorage()

  if (user) {
    return analytics.identify(user.uuid, {
      platform: 'mobile',
      storage: usage,
      plan: userService.identifyPlanName(limit),
      userId: user.uuid
    });
  }
}

export async function trackIdentifyCurrentPlan(currentPlan: ICurrentPlan): Promise<void> {
  const user: IUser = await deviceStorage.getUserStorage()

  return analytics.identify(user.uuid, {
    userId: user.uuid,
    email: user.email,
    platform: 'mobile',
    storageUsed: currentPlan.usage,
    storageLimit: currentPlan.limit,
    storageUsage: currentPlan.percentage
  });
}

export async function trackScreen(routeName: string): Promise<void> {
  return analytics.screen(routeName);
}

export async function trackUploadFileStart(): Promise<void> {
  const user = await deviceStorage.getUserStorage()

  return analytics.track('file-upload-start', {
    userId: user.uuid,
    email: user.email,
    device: 'mobile'
  });
}

export async function trackUploadFileFinished(): Promise<void> {
  const user: IUser = await deviceStorage.getUserStorage()

  return analytics.track('file-upload-finished', {
    userId: user.uuid,
    email: user.email,
    device: 'mobile'
  });
}

export async function trackErrorFileUpload(): Promise<void> {
  const user: IUser = await deviceStorage.getUserStorage()

  return analytics.track('file-upload-error', {
    userId: user.uuid,
    email: user.email,
    device: 'mobile'
  });
}

export async function trackDownloadFileStart(item: any, email: string): Promise<void> {

  return analytics.track('file-download-start', {
    fileId: item.id,
    fileSize: item.size,
    fileType: item.type,
    email,
    folderId: item.folderId,
    platform: 'mobile'
  });
}

export async function trackDownloadFileFinished(item: any, email: string): Promise<void> {
  return analytics.track('file-download-finished', {
    fileId: item.id,
    fileSize: item.size,
    fileType: item.type,
    email,
    folderId: item.folderId,
    platform: 'mobile'
  });
}

export async function trackErrorDownloadFile(item: any, email: string, err: any): Promise<void> {
  return analytics.track('file-download-error', {
    fileId: item.id,
    fileSize: item.size,
    fileType: item.type,
    email,
    folderId: item.folderId,
    platform: 'mobile',
    msg: err && err.message
  });
}

export async function trackFolderOpened(itemId: number): Promise<void> {
  const user: IUser = await deviceStorage.getUserStorage();

  return analytics.track('folder-opened', {
    userId: user.uuid,
    email: user.email,
    folderId: itemId
  });
}

export async function trackFolderCreated(): Promise<void> {
  const user: IUser = await deviceStorage.getUserStorage()

  return analytics.track('folder-created', {
    userId: user.uuid,
    platform: 'mobile',
    email: user.email
  })
}

export async function trackColorFolderSelect(selectedColor: string): Promise<void> {
  return analytics.track('folder-color-selection', {
    value: selectedColor
  });
}

export async function trackIconFolderSelect(selectedIcon: number): Promise<void> {
  return analytics.track('folder-icon-selection', {
    value: selectedIcon
  });

}

export async function trackRenameFolder(folderId: number): Promise<void> {
  const user: IUser = await deviceStorage.getUserStorage();

  return analytics.track('folder-rename', {
    userId: user.uuid,
    email: user.email,
    platform: 'mobile',
    device: Platform.OS,
    folderId
  });
}

export async function trackRenameFile(fileId: string): Promise<void> {
  const user: IUser = await deviceStorage.getUserStorage()

  return analytics.track('file-rename', {
    userId: user.uuid,
    email: user.email,
    platform: 'mobile',
    device: Platform.OS,
    folderId: fileId
  });
}

export async function trackShareTo(email: string, uri: any): Promise<void> {
  return analytics.track('share-to', {
    email,
    uri: uri.fileUri ? uri.fileUri : uri.toString && uri.toString()
  });
}

export async function trackReferrals(userData: any): Promise<void> {

  return analytics.identify(userData.user.uuid, {
    email: userData.user.email,
    platform: 'mobile',
    referralsCredit: userData.user.credit,
    referralsCount: Math.floor(userData.user.credit / 5),
    createdAt: userData.createdAt
  });
}

export async function trackSignIn(userData: any): Promise<void> {
  return analytics.track('user-signin', {
    email: userData.user.email,
    userId: userData.user.uuid,
    platform: 'mobile'
  });
}

export async function trackUserSignInAttempted(error: any): Promise<void> {
  return analytics.track('user-signin-attempted', {
    status: 'error',
    message: error
  })
}

export async function trackSignOut(): Promise<void> {
  const user: IUser = await deviceStorage.getUserStorage()

  return analytics.track('user-signout', {
    userId: user.uuid,
    email: user.email,
    platform: 'mobile'
  })

}

export function trackSignUp(userData: any, email: string): Promise<[void, void]> {
  return Promise.all([
    analytics.identify(userData.uuid, { email }),
    analytics.track('user-signup', {
      properties: {
        userId: userData.uuid,
        email,
        platform: 'mobile'
      }
    })
  ])
}