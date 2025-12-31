# Exemplo Prático: Scraping Mercado Livre

## Script JavaScript para Extrair Produtos

Baseado na estrutura HTML do Mercado Livre, use este script no campo **"Script Customizado"** do node HTTP_SCRAPE:

### Versão Completa (Extrai todos os dados)

```javascript
// Extrair produtos usando a classe dos cards
const products = [];
const cards = document.querySelectorAll('.andes-card.poly-card.poly-card--grid-card');

cards.forEach((card, index) => {
  try {
    const product = {
      index: index + 1,
      title: card.querySelector('.poly-component__title, .ui-search-item__title')?.textContent?.trim() || '',
      price: card.querySelector('.andes-money-amount__fraction')?.textContent?.trim() || '',
      originalPrice: card.querySelector('.andes-money-amount__previous-value')?.textContent?.trim() || '',
      discount: card.querySelector('.ui-search-price__second-line__label')?.textContent?.trim() || '',
      link: card.querySelector('a')?.href || '',
      image: card.querySelector('img')?.src || card.querySelector('img')?.getAttribute('data-src') || '',
      rating: card.querySelector('.ui-search-reviews__rating-number')?.textContent?.trim() || '',
      reviews: card.querySelector('.ui-search-reviews__amount')?.textContent?.trim() || '',
      freeShipping: card.textContent?.toLowerCase().includes('frete grátis') || false,
      badge: card.querySelector('.ui-search-item__highlight-label')?.textContent?.trim() || '',
    };
    
    if (product.title) {
      products.push(product);
    }
  } catch (error) {
    console.error(`Erro no produto ${index + 1}:`, error);
  }
});

return {
  totalProducts: products.length,
  products: products,
  timestamp: new Date().toISOString(),
  url: window.location.href
};
```

### Versão Simplificada (Apenas dados essenciais)

```javascript
const products = [];
const cards = document.querySelectorAll('.andes-card.poly-card.poly-card--grid-card');

cards.forEach((card, index) => {
  const title = card.querySelector('.poly-component__title')?.textContent?.trim() || '';
  const price = card.querySelector('.andes-money-amount__fraction')?.textContent?.trim() || '';
  const link = card.querySelector('a')?.href || '';
  const image = card.querySelector('img')?.src || '';
  
  if (title) {
    products.push({ index: index + 1, title, price, link, image });
  }
});

return { totalProducts: products.length, products };
```

### Template Genérico (Substitua a classe)

Se você souber a classe específica dos produtos, use este template:

```javascript
// SUBSTITUA 'SUA_CLASSE_AQUI' pela classe real
const PRODUCT_CLASS = 'SUA_CLASSE_AQUI';
const products = [];
const cards = document.querySelectorAll(PRODUCT_CLASS);

cards.forEach((card, index) => {
  const title = card.querySelector('h2, .title, [class*="title"]')?.textContent?.trim() || '';
  const price = card.querySelector('[class*="price"], [class*="money"]')?.textContent?.trim() || '';
  const link = card.querySelector('a')?.href || '';
  const image = card.querySelector('img')?.src || '';
  
  if (title) {
    products.push({ index: index + 1, title, price, link, image });
  }
});

return { totalProducts: products.length, products };
```

## Como Usar

1. **Configure o Node HTTP_SCRAPE:**
   - URL: `https://www.mercadolivre.com.br/ofertas?price=0.0-100.0`
   - Aguardar por: `networkidle2`
   - Timeout: `60000`
   - **Script Customizado**: Cole um dos scripts acima

2. **Acesse os dados extraídos:**
   - Os produtos estarão em: `{{variables.scrapeResponse.scriptResult.products}}`
   - Total de produtos: `{{variables.scrapeResponse.scriptResult.totalProducts}}`

3. **Processe os dados (opcional):**
   Use um node CODE para filtrar/ordenar:
   
```javascript
const products = variables.scrapeResponse.scriptResult.products;

// Filtrar produtos com frete grátis
const freeShipping = products.filter(p => p.freeShipping);

// Ordenar por preço
const sorted = products.sort((a, b) => {
  const priceA = parseFloat(a.price?.replace(/\./g, '').replace(',', '.') || '0');
  const priceB = parseFloat(b.price?.replace(/\./g, '').replace(',', '.') || '0');
  return priceA - priceB;
});

return {
  total: products.length,
  freeShipping: freeShipping.length,
  cheapest: sorted[0],
  top10: sorted.slice(0, 10)
};
```

## Seletores CSS Comuns do Mercado Livre

- **Cards de produto**: `.andes-card.poly-card.poly-card--grid-card`
- **Título**: `.poly-component__title`, `.ui-search-item__title`
- **Preço**: `.andes-money-amount__fraction`
- **Preço original**: `.andes-money-amount__previous-value`
- **Desconto**: `.ui-search-price__second-line__label`
- **Link**: `a[href*="/produto/"]`
- **Imagem**: `img`
- **Avaliação**: `.ui-search-reviews__rating-number`
- **Avaliações**: `.ui-search-reviews__amount`
- **Badge**: `.ui-search-item__highlight-label`

