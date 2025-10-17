export interface CartType {
  orderFormId: string;
  salesChannel: string;
  loggedIn: boolean;
  isCheckedIn: boolean;
  storeId: null;
  checkedInPickupPointId: null;
  allowManualPrice: boolean;
  canEditData: boolean;
  userProfileId: null;
  userType: null;
  ignoreProfileData: boolean;
  value: number;
  messages: Message[];
  items: CartTypeItem[];
  selectableGifts: SelectableGift[];
  totalizers: any[];
  shippingData: ShippingData;
  clientProfileData: null;
  paymentData: PaymentData;
  marketingData: MarketingData;
  sellers: Seller[];
  clientPreferencesData: ClientPreferencesData;
  commercialConditionData: null;
  storePreferencesData: StorePreferencesData;
  giftRegistryData: null;
  openTextField: null;
  invoiceData: null;
  customData: null;
  itemMetadata: ItemMetadata;
  hooksData: null;
  ratesAndBenefitsData: RatesAndBenefitsData;
  subscriptionData: null;
  merchantContextData: null;
  purchaseAgentsData: null;
  itemsOrdination: null;
}

export interface ClientPreferencesData {
  locale: string;
  optinNewsLetter: null;
}

export interface ItemMetadata {
  items: ItemMetadataItem[];
}

export interface ItemMetadataItem {
  id: string;
  seller: string;
  name: string;
  skuName: string;
  productId: string;
  refId: string;
  ean: string;
  imageUrl: string;
  detailUrl: string;
  assemblyOptions: any[];
}

export interface CartTypeItem {
  uniqueId: string;
  id: string;
  productId: string;
  productRefId: string;
  refId: string;
  ean: string;
  name: string;
  skuName: string;
  modalType: null;
  parentItemIndex: null;
  parentAssemblyBinding: null;
  assemblies: any[];
  priceValidUntil: Date;
  tax: number;
  price: number;
  listPrice: number;
  manualPrice: null;
  manualPriceAppliedBy: null;
  sellingPrice: number;
  rewardValue: number;
  isGift: boolean;
  additionalInfo: AdditionalInfo;
  preSaleDate: null;
  productCategoryIds: string;
  productCategories: { [key: string]: string };
  quantity: number;
  seller: string;
  sellerChain: string[];
  imageUrl: string;
  detailUrl: string;
  components: any[];
  bundleItems: any[];
  attachments: any[];
  attachmentOfferings: any[];
  offerings: Offering[];
  priceTags: any[];
  availability: string;
  measurementUnit: string;
  unitMultiplier: number;
  manufacturerCode: null;
  priceDefinition: PriceDefinition;
  taxCode: string;
}

export interface AdditionalInfo {
  dimension: null;
  brandName: string;
  brandId: string;
  offeringInfo: null;
  offeringType: null;
  offeringTypeId: null;
}

export interface Offering {
  type: string;
  id: string;
  name: string;
  allowGiftMessage: boolean;
  attachmentOfferings: any[];
  price: number;
}

export interface PriceDefinition {
  calculatedSellingPrice: number;
  total: number;
  sellingPrices: SellingPrice[];
  reason: null;
}

export interface SellingPrice {
  value: number;
  quantity: number;
}

export interface MarketingData {
  utmSource: null;
  utmMedium: null;
  utmCampaign: null;
  utmipage: null;
  utmiPart: null;
  utmiCampaign: null;
  coupon: null;
  marketingTags: string[];
}

export interface Message {
  code: string;
  text: string;
  status: string;
  fields: Fields;
}

export interface Fields {
  ean: string;
  itemIndex: string;
  skuName: string;
}

export interface PaymentData {
  updateStatus: string;
  installmentOptions: InstallmentOption[];
  paymentSystems: PaymentSystem[];
  payments: any[];
  giftCards: any[];
  giftCardMessages: any[];
  availableAccounts: any[];
  availableTokens: any[];
  availableAssociations: AvailableAssociations;
}

export interface AvailableAssociations {}

export interface InstallmentOption {
  paymentSystem: string;
  bin: null;
  paymentName: null;
  paymentGroupName: null;
  value: number;
  installments: Installment[];
}

export interface Installment {
  count: number;
  hasInterestRate: boolean;
  interestRate: number;
  value: number;
  total: number;
  sellerMerchantInstallments?: Installment[];
  id?: ID;
}

export enum ID {
  Toymania = "TOYMANIA",
}

export interface PaymentSystem {
  id: number;
  name: string;
  groupName: string;
  validator: Validator;
  stringId: string;
  template: string;
  requiresDocument: boolean;
  displayDocument: boolean;
  isCustom: boolean;
  description: null;
  requiresAuthentication: boolean;
  dueDate: Date;
  availablePayments: null;
}

export interface Validator {
  regex: null | string;
  mask: null | string;
  cardCodeRegex: null | string;
  cardCodeMask: null | string;
  weights: number[] | null;
  useCvv: boolean;
  useExpirationDate: boolean;
  useCardHolderName: boolean;
  useBillingAddress: boolean;
}

export interface RatesAndBenefitsData {
  rateAndBenefitsIdentifiers: any[];
  teaser: any[];
}

export interface SelectableGift {
  id: string;
  availableQuantity: number;
  availableGifts: AvailableGift[];
}

export interface AvailableGift {
  isSelected: boolean;
  uniqueId: string;
  id: string;
  productId: string;
  productRefId: string;
  refId: string;
  ean: string;
  name: string;
  skuName: string;
  modalType: null;
  parentItemIndex: null;
  parentAssemblyBinding: null;
  assemblies: any[];
  priceValidUntil: null;
  tax: number;
  price: number;
  listPrice: null;
  manualPrice: null;
  manualPriceAppliedBy: null;
  sellingPrice: number;
  rewardValue: number;
  isGift: boolean;
  additionalInfo: AdditionalInfo;
  preSaleDate: null;
  productCategoryIds: string;
  productCategories: ProductCategories;
  quantity: number;
  seller: string;
  sellerChain: string[];
  imageUrl: string;
  detailUrl: string;
  components: any[];
  bundleItems: any[];
  attachments: any[];
  attachmentOfferings: any[];
  offerings: any[];
  priceTags: PriceTag[];
  availability: string;
  measurementUnit: string;
  unitMultiplier: number;
  manufacturerCode: null;
  priceDefinition: null;
  taxCode: string;
}

export interface PriceTag {
  name: string;
  value: number;
  rawValue: number;
  isPercentual: boolean;
  identifier: string;
  owner: null;
}

export interface ProductCategories {
  "1009": string;
}

export interface Seller {
  id: string;
  name: string;
  logo: string;
  minimumOrderValue: number;
}

export interface ShippingData {
  address: null;
  logisticsInfo: LogisticsInfo[];
  selectedAddresses: any[];
  availableAddresses: any[];
  pickupPoints: any[];
  contactInformation: any[];
}

export interface LogisticsInfo {
  itemIndex: number;
  selectedSla: null;
  selectedDeliveryChannel: string;
  addressId: null;
  slas: any[];
  shipsTo: string[];
  itemId: string;
  deliveryChannels: DeliveryChannel[];
}

export interface DeliveryChannel {
  id: string;
}

export interface StorePreferencesData {
  countryCode: string;
  saveUserData: boolean;
  timeZone: string;
  currencyCode: string;
  currencyLocale: number;
  currencySymbol: string;
  currencyFormatInfo: CurrencyFormatInfo;
}

export interface CurrencyFormatInfo {
  currencyDecimalDigits: number;
  currencyDecimalSeparator: string;
  currencyGroupSeparator: string;
  currencyGroupSize: number;
  startsWithCurrencySymbol: boolean;
}
