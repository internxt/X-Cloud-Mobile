import _ from 'lodash'
import { decryptText, encryptText, encryptTextWithKey, passToHash } from '../../helpers';
import { getHeaders } from '../../helpers/headers';

export function isStrongPassword(pwd: string) {
    return /^(?=.*[a-zA-Z])(?=.*[0-9]).{6,}$/.test(pwd);
}

export function isNullOrEmpty(input: any) {
    return _.isEmpty(input)
}

export function registerService() {

}

interface RegisterParams {
    firstName: string
    lastName: string
    email: string
    password: string
}

export async function getNewBits() {
    return fetch(`${process.env.REACT_NATIVE_API_URL}/api/bits`)
        .then(res => res.json())
        .then(res => res.bits)
        .then(bits => decryptText(bits))
        .catch(() => null)
}

export function IsJsonString(str: string) {
    try {
        return JSON.parse(str);
    } catch (e) {
        return null;
    }
}


export async function doRegister(params: RegisterParams) {
    const hashObj = passToHash({ password: params.password })
    const encPass = encryptText(hashObj.hash);
    const encSalt = encryptText(hashObj.salt);
    const mnemonic = await getNewBits()
    const encMnemonic = encryptTextWithKey(mnemonic, params.password);

    return fetch(`${process.env.REACT_NATIVE_API_URL}/api/register`, {
        method: 'post',
        headers: getHeaders(true, true),
        body: JSON.stringify({
            name: params.firstName,
            lastname: params.lastName,
            email: params.email.toLowerCase(),
            password: encPass,
            mnemonic: encMnemonic,
            salt: encSalt,
            referral: null
        })
    }).then(async res => {
        if (res.status === 200) {
            return res.json()
        } else {
            const body = await res.text()
            const json = IsJsonString(body)

            if (json) {
                throw Error(json.message)
            } else {
                throw Error(body)
            }
        }
    })
}

export async function resendActivationEmail(email: string) {
    return fetch(`${process.env.REACT_NATIVE_API_URL}/api/user/resend/${email.toLowerCase()}`)
        .then(async res => {
            if (res.status !== 200) {
                const body = await res.text()
                const json = IsJsonString(body)

                if (json) {
                    throw Error(json.error ? json.error : json.message)
                } else {
                    throw Error(body)
                }
            }
        })
}