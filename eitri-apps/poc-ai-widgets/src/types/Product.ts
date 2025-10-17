export interface SearchProductResponse {
  products: Product[];
  recordsFiltered: number;
  correction: Correction;
  fuzzy: string;
  operator: string;
  translated: boolean;
  pagination: Pagination;
  options: Options;
}

export interface Correction {
  misspelled: boolean;
}

export interface Options {
  sorts: any[];
  counts: any[];
  deliveryPromisesEnabled: boolean;
}

export interface Pagination {
  count: number;
  current: Current;
  before: any[];
  after: Current[];
  perPage: number;
  next: Current;
  previous: First;
  first: First;
  last: First;
}

export interface Current {
  index: number;
  proxyUrl: string;
}

export interface First {
  index: number;
}

export interface Product {
  cacheId: string;
  productId: string;
  description: string;
  productName: string;
  productReference: string;
  linkText: string;
  brand: Brand;
  brandId: number;
  link: string;
  categories: Category[];
  categoryId: string;
  categoriesIds: CategoriesID[];
  priceRange: PriceRange;
  specificationGroups: SpecificationGroup[];
  skuSpecifications: any[];
  productClusters: ProductCluster[];
  clusterHighlights: any[];
  properties: Property[];
  items: Item[];
  releaseDate: number;
  metaTagDescription: string;
  origin: Origin;
  productTitle: string;
}

export enum Brand {
  Hasbro = "hasbro",
}

export enum Category {
  Brinquedos = "/Brinquedos/",
  BrinquedosLançadores = "/Brinquedos/Lançadores/",
  BrinquedosLançadoresBeyblade = "/Brinquedos/Lançadores/Beyblade/",
  BrinquedosLançadoresLançadorDeBrinquedo = "/Brinquedos/Lançadores/Lançador de Brinquedo/",
  BrinquedosLançadoresPião = "/Brinquedos/Lançadores/Pião/",
}

export enum CategoriesID {
  The1001 = "/1001/",
  The10013029 = "/1001/3029/",
  The100130293211 = "/1001/3029/3211/",
  The100130293269 = "/1001/3029/3269/",
  The100130293329 = "/1001/3029/3329/",
}

export interface Item {
  sellers: Seller[];
  images: Image[];
  itemId: string;
  name: string;
  nameComplete: string;
  complementName: string;
  referenceId: ReferenceID[];
  measurementUnit: MeasurementUnit;
  unitMultiplier: number;
  variations: any[];
  ean: string;
  modalType: string;
  videos: any[];
  attachments: any[];
  isKit: boolean;
  attributes: any[];
}

export interface Image {
  imageId: string;
  cacheId: string;
  imageTag: string;
  imageLabel: string;
  imageText: string;
  imageUrl: string;
}

export enum MeasurementUnit {
  Un = "un",
}

export interface ReferenceID {
  Key: Key;
  Value: string;
}

export enum Key {
  RefID = "RefId",
}

export interface Seller {
  sellerId: string;
  sellerName: SellerName;
  addToCartLink: string;
  sellerDefault: boolean;
  commertialOffer: CommertialOffer;
}

export interface CommertialOffer {
  DeliverySlaSamplesPerRegion: DeliverySlaSamplesPerRegion;
  DeliverySlaSamples: any[];
  AvailableQuantity: number;
  discountHighlights: any[];
  Installments: Installment[];
  Price: number;
  ListPrice: number;
  spotPrice: number;
  taxPercentage: number;
  PriceWithoutDiscount: number;
  Tax: number;
  GiftSkuIds: any[];
  BuyTogether: any[];
  ItemMetadataAttachment: any[];
  RewardValue: number;
  PriceValidUntil: Date;
  GetInfoErrorMessage: null;
  CacheVersionUsedToCallCheckout: string;
  teasers: any[];
}

export interface DeliverySlaSamplesPerRegion {}

export interface Installment {
  Value: number;
  InterestRate: number;
  TotalValuePlusInterestRate: number;
  NumberOfInstallments: number;
  PaymentSystemName: PaymentSystemName;
  PaymentSystemGroupName: PaymentSystemGroupName;
  Name: string;
}

export enum PaymentSystemGroupName {
  CreditCardPaymentGroup = "creditCardPaymentGroup",
  GiftCardPaymentGroup = "giftCardPaymentGroup",
  InstantPaymentPaymentGroup = "instantPaymentPaymentGroup",
  MercadoPagoWalletPaymentGroup = "MercadoPagoWalletPaymentGroup",
  PagaleveTransparentePaymentGroup = "Pagaleve TransparentePaymentGroup",
  PicPayPaymentGroup = "picPayPaymentGroup",
}

export enum PaymentSystemName {
  AmericanExpress = "American Express",
  Diners = "Diners",
  Elo = "Elo",
  Hipercard = "Hipercard",
  Mastercard = "Mastercard",
  MercadoPagoWallet = "MercadoPagoWallet",
  PagaleveTransparente = "Pagaleve Transparente",
  PicPay = "PicPay",
  Pix = "Pix",
  Vale = "Vale",
  Visa = "Visa",
}

export enum SellerName {
  Toymania = "Toymania",
}

export enum Origin {
  IntelligentSearch = "intelligent-search",
}

export interface PriceRange {
  sellingPrice: Price;
  listPrice: Price;
}

export interface Price {
  highPrice: number;
  lowPrice: number | null;
}

export interface ProductCluster {
  id: string;
  name: string;
}

export interface Property {
  name: PropertyName;
  originalName: PropertyName;
  values: string[];
}

export enum PropertyName {
  Atenção = "Atenção",
  CorPredominante = "Cor Predominante",
  CódigoDoProduto = "Código do Produto",
  CódigoInmetro = "Código Inmetro",
  EMail = "E-mail",
  EstiloDeBrincar = "Estilo de Brincar",
  Fabricação = "Fabricação",
  FaixaEtária = "Faixa Etária",
  Fornecedor = "Fornecedor",
  IdadeRecomendada = "Idade Recomendada",
  ItensInclusos = "Itens Inclusos",
  Material = "Material",
  Mecanismo = "Mecanismo",
  Observações = "Observações",
  ReferênciaFabricante = "Referência Fabricante",
  Regulamentações = "Regulamentações",
  SellerID = "sellerId",
  Sexo = "Sexo",
}

export interface SpecificationGroup {
  originalName: SpecificationGroupName;
  name: SpecificationGroupName;
  specifications: Property[];
}

export enum SpecificationGroupName {
  AllSpecifications = "allSpecifications",
  Características = "Características",
  CódigoDoProduto = "Código do Produto",
  EspecificaçõesIdadeESexo = "Especificações Idade e Sexo",
  GrupoRegulamentações = "Grupo_Regulamentações",
  InformaçõesEAssistência = "Informações e Assistência",
  ItensInclusos = "Itens Inclusos",
  Observações = "Observações",
}

export interface OptimizeProductResponse {
  productId: string;
  productName: string;
  imageUrl: string;
  price: number;
}
