import prettysize from 'prettysize';
import { getHeaders } from '../helpers/headers';

export interface User {
  bucket: string
  createdAt: Date
  credit: number
  email: string
  lastname: string
  mnemonic: string
  name: string
  privateKey: string
  publicKey: string
  registerCompleted: boolean
  revocationKey: string
  rootFolderId: number
  userId: string
  uuid: string
}

export function identifyPlanName(bytes: number): string {
  return bytes === 0 ? 'Free 10GB' : prettysize(bytes)
}

export async function loadUsage(): Promise<number> {
  try {
    const headers = await getHeaders();
    const fetchUsage = await fetch(`${process.env.REACT_NATIVE_API_URL}/api/usage`, {
      method: 'get',
      headers
    });

    if (fetchUsage.status !== 200) {
      throw Error('Cannot load limit');
    }
    const usageJson = await fetchUsage.json();

    return usageJson.total;

  } catch (err) {
    throw Error('Cannot load limit');
  }
}

export async function loadLimit(): Promise<number> {
  try {
    const headers = await getHeaders();
    const fetchLimit = await fetch(`${process.env.REACT_NATIVE_API_URL}/api/limit`, {
      method: 'get',
      headers
    })

    if (fetchLimit.status !== 200) {
      throw Error('Cannot load limit');
    }
    const limitJson = await fetchLimit.json();

    return 108851651149824;

  } catch (err) {
    throw Error('Cannot load limit');
  }

}

export function convertLimitUser(limitStorage: number) {
  if (limitStorage > 0) {
    if (limitStorage < 108851651149824) {
      return prettysize(limitStorage);
    } else if (limitStorage >= 108851651149824) {
      return '\u221E';
    } else {
      return '...';
    }
  }
}
