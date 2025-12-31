# Exemplo: Scraping do Mercado Livre com HTTP_SCRAPE

Este documento mostra como configurar o node HTTP_SCRAPE para fazer scraping da página de ofertas do Mercado Livre.

## URL de Exemplo
```
https://www.mercadolivre.com.br/ofertas?price=0.0-100.0
```

## Configuração Básica

### Opção 1: Extrair HTML Completo

**Configuração do Node HTTP_SCRAPE:**
- **URL**: `https://www.mercadolivre.com.br/ofertas?price=0.0-100.0`
- **Aguardar por**: `networkidle2` (recomendado para páginas dinâmicas)
- **Timeout**: `60000` (60 segundos)
- **Seletor CSS**: (deixar vazio para extrair HTML completo)
- **Tipo de Extração**: `html`
- **Salvar como**: `scrapeResponse`

O resultado estará em `{{variables.scrapeResponse.html}}`

### Opção 2: Extrair Produtos com Script Customizado

**Configuração do Node HTTP_SCRAPE:**
- **URL**: `https://www.mercadolivre.com.br/ofertas?price=0.0-100.0`
- **Aguardar por**: `networkidle2`
- **Timeout**: `60000`
- **Script Customizado**: Use o script abaixo

**Script para Extrair Produtos:**

```javascript
// Extrair produtos da página de ofertas do Mercado Livre
const products = [];

// Selecionar todos os cards de produto usando a classe principal
// Classe identificada: andes-card poly-card poly-card--grid-card
const productCards = document.querySelectorAll('.andes-card.poly-card.poly-card--grid-card');

productCards.forEach((card, index) => {
  try {
    // Título do produto
    const titleElement = card.querySelector('.ui-search-item__title, [data-testid="item-title"], .poly-component__title');
    const title = titleElement?.textContent?.trim() || '';
    
    // Preço atual
    const priceElement = card.querySelector('.andes-money-amount__fraction, .price-tag-fraction, .ui-search-price__second-line__label .andes-money-amount__fraction');
    const price = priceElement?.textContent?.trim() || '';
    
    // Preço original (riscado)
    const originalPriceElement = card.querySelector('.ui-search-price__original-value, .andes-money-amount__previous-value');
    const originalPrice = originalPriceElement?.textContent?.trim() || '';
    
    // Desconto percentual
    const discountElement = card.querySelector('.ui-search-price__second-line__label, .ui-search-discount');
    const discount = discountElement?.textContent?.trim() || '';
    
    // Link do produto
    const linkElement = card.querySelector('a[href*="/produto/"], a.ui-search-link');
    const link = linkElement?.href || '';
    
    // Imagem do produto
    const imageElement = card.querySelector('img');
    const image = imageElement?.src || imageElement?.getAttribute('data-src') || '';
    
    // Avaliação (estrelas)
    const ratingElement = card.querySelector('.ui-search-reviews__rating-number, .andes-visually-hidden');
    const rating = ratingElement?.textContent?.trim() || '';
    
    // Número de avaliações
    const reviewsElement = card.querySelector('.ui-search-reviews__amount');
    const reviews = reviewsElement?.textContent?.trim() || '';
    
    // Frete grátis
    const shippingElement = card.querySelector('.ui-search-item__shipping, .ui-search-item__shipping-label');
    const freeShipping = shippingElement?.textContent?.toLowerCase().includes('grátis') || 
                        shippingElement?.textContent?.toLowerCase().includes('frete grátis') || false;
    
    // Badge "MAIS VENDIDO" ou outras tags
    const badgeElement = card.querySelector('.ui-search-item__highlight-label, .poly-component__badge');
    const badge = badgeElement?.textContent?.trim() || '';
    
    // Cupom disponível
    const couponElement = card.querySelector('.ui-search-item__discount-label');
    const coupon = couponElement?.textContent?.trim() || '';
    
    if (title) {
      products.push({
        index: index + 1,
        title: title,
        price: price,
        originalPrice: originalPrice,
        discount: discount,
        priceSymbol: 'R$',
        link: link,
        image: image,
        rating: rating,
        reviews: reviews,
        freeShipping: freeShipping,
        badge: badge,
        coupon: coupon,
      });
    }
  } catch (error) {
    console.error(`Error extracting product ${index + 1}:`, error);
  }
});

return {
  totalProducts: products.length,
  products: products,
  timestamp: new Date().toISOString(),
  url: window.location.href,
  pageTitle: document.title
};
```

**Versão Simplificada (se você souber a classe exata):**

```javascript
// Versão mais direta usando a classe específica dos cards
const products = [];
const cards = document.querySelectorAll('.andes-card.poly-card.poly-card--grid-card');

cards.forEach((card, index) => {
  const title = card.querySelector('.poly-component__title')?.textContent?.trim() || '';
  const price = card.querySelector('.andes-money-amount__fraction')?.textContent?.trim() || '';
  const link = card.querySelector('a')?.href || '';
  const image = card.querySelector('img')?.src || '';
  
  if (title) {
    products.push({
      index: index + 1,
      title,
      price,
      link,
      image
    });
  }
});

return { totalProducts: products.length, products };
```

**Resultado:** O script retornará um objeto JSON com os produtos extraídos em `{{variables.scrapeResponse.scriptResult}}`

### Opção 3: Extrair HTML de Seletor Específico

**Configuração do Node HTTP_SCRAPE:**
- **URL**: `https://www.mercadolivre.com.br/ofertas?price=0.0-100.0`
- **Aguardar por**: `selector`
- **Seletor CSS**: `.ui-search-results` ou `.ui-search-result`
- **Timeout de Espera**: `30000`
- **Seletor CSS (Extrair)**: `.ui-search-results`
- **Tipo de Extração**: `html`
- **Salvar como**: `scrapeResponse`

## Processando os Dados Extraídos

Após o scraping, você pode usar um node **EDIT_FIELDS** ou **CODE** para processar os dados:

### Exemplo com CODE Node:

```javascript
// Acessar os dados do scraping
const scrapeData = variables.scrapeResponse;

// Se usou script customizado
if (scrapeData.scriptResult) {
  const products = scrapeData.scriptResult.products;
  
  // Filtrar produtos com frete grátis
  const freeShippingProducts = products.filter(p => p.freeShipping);
  
  // Ordenar por preço
  const sortedProducts = products.sort((a, b) => {
    const priceA = parseFloat(a.price.replace(/\./g, '').replace(',', '.'));
    const priceB = parseFloat(b.price.replace(/\./g, '').replace(',', '.'));
    return priceA - priceB;
  });
  
  return {
    total: products.length,
    freeShipping: freeShippingProducts.length,
    cheapest: sortedProducts[0],
    products: sortedProducts.slice(0, 10) // Top 10 mais baratos
  };
}

// Se extraiu HTML completo
if (scrapeData.html) {
  // Processar HTML aqui ou usar em outro node
  return { html: scrapeData.html.substring(0, 1000) + '...' };
}
```

## Configurações Recomendadas

### Headers Customizados (Opcional)

Se necessário, você pode adicionar headers customizados:
- **User-Agent**: Já configurado automaticamente
- **Accept-Language**: `pt-BR,pt;q=0.9` (já configurado)

### Viewport

Para páginas responsivas, configure o viewport:
- **Largura**: `1920` (padrão)
- **Altura**: `1080` (padrão)

### Screenshot (Opcional)

Marque a opção **Screenshot** para capturar uma imagem da página. Útil para debug.

## Exemplo de Workflow Completo

1. **HTTP_SCRAPE** → Fazer scraping da página
2. **CODE** → Processar e filtrar produtos
3. **SEND_MESSAGE** → Enviar resumo via WhatsApp

## Notas Importantes

⚠️ **Respeite os Termos de Uso**: Sempre verifique os termos de uso do site antes de fazer scraping.

⚠️ **Rate Limiting**: Evite fazer muitas requisições em pouco tempo para não sobrecarregar o servidor.

⚠️ **Estrutura HTML**: Sites podem mudar sua estrutura HTML, então os seletores CSS podem precisar ser atualizados.

## Troubleshooting

### Página não carrega completamente
- Aumente o **Timeout** para `90000` ou mais
- Use `waitFor: 'networkidle2'` ou `waitFor: 'selector'` com um seletor específico

### Produtos não são extraídos
- Verifique se os seletores CSS estão corretos usando DevTools do navegador
- Use `screenshot: true` para verificar o que foi carregado
- Tente usar `waitFor: 'selector'` com um seletor de produto específico

### Erro de timeout
- Aumente o **Timeout** geral
- Verifique se a URL está correta
- Tente com `waitFor: 'load'` que é mais rápido mas menos confiável

