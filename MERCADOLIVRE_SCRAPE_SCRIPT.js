// Script JavaScript para extrair produtos do Mercado Livre
// Use este script no campo "Script Customizado" do node HTTP_SCRAPE

// Substitua 'SUA_CLASSE_AQUI' pela classe real dos cards de produto
// Exemplo: '.andes-card.poly-card.poly-card--grid-card'
const PRODUCT_CARD_CLASS = 'SUA_CLASSE_AQUI'; // ← ALTERE AQUI

// Selecionar todos os cards de produto
const productCards = document.querySelectorAll(PRODUCT_CARD_CLASS);

const products = [];

productCards.forEach((card, index) => {
  try {
    // Extrair informações do produto
    const product = {
      index: index + 1,
      
      // Título - ajuste o seletor conforme necessário
      title: card.querySelector('.ui-search-item__title, .poly-component__title, h2')?.textContent?.trim() || '',
      
      // Preço atual
      price: card.querySelector('.andes-money-amount__fraction, .price-tag-fraction')?.textContent?.trim() || '',
      
      // Preço original (se houver)
      originalPrice: card.querySelector('.ui-search-price__original-value, .andes-money-amount__previous-value')?.textContent?.trim() || '',
      
      // Desconto
      discount: card.querySelector('.ui-search-price__second-line__label')?.textContent?.trim() || '',
      
      // Link do produto
      link: card.querySelector('a')?.href || '',
      
      // Imagem
      image: card.querySelector('img')?.src || card.querySelector('img')?.getAttribute('data-src') || '',
      
      // Avaliação
      rating: card.querySelector('.ui-search-reviews__rating-number')?.textContent?.trim() || '',
      
      // Número de avaliações
      reviews: card.querySelector('.ui-search-reviews__amount')?.textContent?.trim() || '',
      
      // Frete grátis
      freeShipping: card.textContent?.toLowerCase().includes('frete grátis') || false,
      
      // Badge (MAIS VENDIDO, etc)
      badge: card.querySelector('.ui-search-item__highlight-label')?.textContent?.trim() || '',
    };
    
    // Só adiciona se tiver título
    if (product.title) {
      products.push(product);
    }
  } catch (error) {
    console.error(`Erro ao extrair produto ${index + 1}:`, error);
  }
});

// Retornar resultado
return {
  totalProducts: products.length,
  products: products,
  timestamp: new Date().toISOString(),
  url: window.location.href
};

