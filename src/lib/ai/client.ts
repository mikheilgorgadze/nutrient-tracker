import Anthropic from '@anthropic-ai/sdk';
import Constants from 'expo-constants';
import { ApiKeyMissingError } from './errors';

let _client: Anthropic | null = null;

export function getApiKey(): string | null {
  return (Constants.expoConfig?.extra?.ANTHROPIC_API_KEY as string | undefined) ?? null;
}

export function getClient(): Anthropic {
  if (_client) return _client;
  const key = getApiKey();
  if (!key) throw new ApiKeyMissingError();
  _client = new Anthropic({ apiKey: key });
  return _client;
}
