import { sha256 } from '../lib/crypto';
import { EnvironmentConfig } from '../index';

export function GetBasicAuth(config: EnvironmentConfig) {
  const hash = sha256(Buffer.from(config.bridgePass)).toString('hex');

  return 'Basic ' + Buffer.from(`${config.bridgeUser}:${hash}`).toString('base64');
}
