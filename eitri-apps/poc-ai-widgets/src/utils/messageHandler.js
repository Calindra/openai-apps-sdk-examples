export const handleToolResult = (toolResult) => {
  if (toolResult.inserted === true) {
    return {
      type: "assistant",
      specialMessage: "addedToCart",
      text: "Produto adicionado ao carrinho com sucesso!",
    };
  }

  if (
    Array.isArray(toolResult) &&
    toolResult.length > 0 &&
    toolResult[0].productName
  ) {
    const simplifiedResult = toolResult.map((product) => ({
      productId: product.productId,
      productName: product.productName,
      price: product.items?.[0]?.sellers?.[0]?.commertialOffer?.ListPrice,
      link: product.link,
    }));
    const messageText = JSON.stringify(simplifiedResult, null, 2);

    return {
      text: messageText,
      type: "assistant",
      toolResponse: true,
      result: toolResult, // Keep original result for rendering
    };
  }

  // Default tool result handling
  return {
    text: JSON.stringify(toolResult, null, 2),
    type: "assistant",
    toolResponse: true,
    result: toolResult,
  };
};

export const handleTextMessage = (message) => {
  let displayText = message;
  const trimmedText = (displayText || "").trim();

  if (
    (trimmedText.startsWith("```") && trimmedText.endsWith("```")) ||
    (trimmedText.startsWith("{") && trimmedText.endsWith("}")) ||
    (trimmedText.startsWith("[") && trimmedText.endsWith("]"))
  ) {
    try {
      let toParse = trimmedText;
      if (trimmedText.startsWith("```")) {
        toParse = trimmedText
          .substring(3, trimmedText.length - 3)
          .replace(/^json/, "")
          .trim();
      }
      JSON.parse(toParse);
      displayText = "A resposta não pode ser exibida.";
    } catch (e) {
      // Not a valid JSON, so we display the original message.
    }
  }

  return {
    text: displayText,
    type: "assistant",
  };
};
