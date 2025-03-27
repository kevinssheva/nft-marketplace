import { pinata } from '@/utils/config';

export class IPFSService {
  async getSignedUrl() {
    try {
      const response = await fetch('/api/url');
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Failed to get signed URL', error);
      throw error;
    }
  }

  async uploadFile(file: File): Promise<string> {
    try {
      const signedUrl = await this.getSignedUrl();
      const upload = await pinata.upload.public.file(file).url(signedUrl);

      if (upload && upload.cid) {
        return `ipfs://${upload.cid}`;
      }

      throw new Error('Failed to upload file');
    } catch (error) {
      console.error('Failed to upload file', error);
      throw error;
    }
  }

  async uploadMetadata(metadata: NFTMetadataType): Promise<string> {
    try {
      const signedUrl = await this.getSignedUrl();
      const upload = await pinata.upload.public.json(metadata).url(signedUrl);

      if (upload && upload.cid) {
        return `ipfs://${upload.cid}`;
      }

      throw new Error('Failed to upload metadata');
    } catch (error) {
      console.error('Failed to upload metadata', error);
      throw error;
    }
  }

  getGatewayUrl(ipfsUri: string) {
    if (!ipfsUri) return '';

    const gatewayUrl =
      pinata.config?.pinataGateway || 'https://gateway.pinata.cloud/ipfs/';

    if (ipfsUri.startsWith('ipfs://')) {
      return `${gatewayUrl}/ipfs/${ipfsUri.replace('ipfs://', '')}`;
    }

    return gatewayUrl + '/ipfs/' + ipfsUri;
  }
}
