import {
  Text,
  View,
  Page,
  Image,
} from "eitri-luminus";
import { useEffect } from "react";
import { Product } from "@/types/Product";
import { useOpenAI, useToolCall } from "@/hooks";

interface SearchProductsResponse {
  products: Product[];
}

export default function Home(props) {
  const {
    data,
    loading,
    execute: searchProducts,
  } = useToolCall<SearchProductsResponse>("searchProducts", {
    query: "Camisas",
  });

  const products = data?.products || [];

  useEffect(() => {
    const loadProducts = async () => {
      await searchProducts();
    };

    loadProducts();
  }, []);

  return (
    <Page
      className="w-full bg-white flex flex-col"
      statusBarTextColor="white"
    >
      <View
        className="w-full max-w-6xl mx-auto flex flex-col p-2"
        style={{ height: 520 }}
      >
        {/* Carousel lateral */}
        <View className="flex-1 overflow-x-auto">
          <View className="flex flex-row gap-3">
            {loading ? (
              // Skeleton loading
              <>
                {[1, 2, 3, 4, 5].map((item) => (
                  <View
                    key={item}
                    className="flex-shrink-0 w-40 rounded-2xl overflow-hidden shadow-md bg-gray-50"
                    style={{ display: "flex", flexDirection: "column" }}
                  >
                    <View className="relative aspect-[3/4] bg-gray-200 animate-pulse" />
                    <View
                      className="p-3"
                      style={{ display: "flex", flexDirection: "column", gap: 8 }}
                    >
                      <View className="h-4 bg-gray-200 rounded animate-pulse w-full" />
                      <View className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                      <View className="h-5 bg-gray-200 rounded animate-pulse w-1/2 mt-1" />
                    </View>
                  </View>
                ))}
              </>
            ) : (
              // Produtos carregados
              products.map((product, index) => (
                <View
                  key={product.productId}
                  className="flex-shrink-0 w-40 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer bg-gray-50"
                  style={{ display: "flex", flexDirection: "column" }}
                >
                  <View className="relative aspect-[3/4]">
                    <Image
                      src={product.items[0].images[0].imageUrl}
                      alt={product.productName}
                      className="w-full h-full object-cover"
                    />
                  </View>
                  <View
                    className="p-3"
                    style={{ display: "flex", flexDirection: "column" }}
                  >
                    <Text className="text-gray-900 font-semibold text-sm mb-1 line-clamp-2">
                      {product.productName}
                    </Text>
                    <Text className="text-primary font-bold text-base">
                      {product.items[0].sellers[0].commertialOffer.Price.toLocaleString(
                        "pt-BR",
                        {
                          style: "currency",
                          currency: "BRL",
                        }
                      )}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        <Text className="text-black text-xs mt-4 text-center">
          v{window.__eitriAppConf.version}x
        </Text>
      </View>
    </Page>
  );
}
