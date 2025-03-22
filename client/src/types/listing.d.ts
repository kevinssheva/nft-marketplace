type ListingData = {
  id: string;
  name: string;
  image: string;
  price: string;
  creator: {
    address: string;
    name: string | null;
  };
  isListed?: boolean;
  isOwned?: boolean;
};
