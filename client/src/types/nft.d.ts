type NFTDataType = {
  id: string;
  name: string;
  description: string;
  image: string;
  price?: string;
  creator: {
    address: string;
    name: string | null;
  };
  isListed?: boolean;
  isOwned?: boolean;
};

type NFTMetadataType = {
  name: string;
  description: string;
  image: string;
};
