/*!
 * FootBalance LP Tracking Kit v1.0
 * Meta Pixel + Google (GA4 & Google Ads) + Microsoft Clarity
 * Satın alma (Purchase) bu sayfada ÖLÇÜLMEZ: Shopify'daki Meta ve Google uygulamaları ölçer.
 * Bu dosyanın görevi: üst huni olaylarını göndermek ve reklam tıklama kimliğini Shopify ödemesine taşımak.
 */
(function (w) {
  'use strict';

  var CFG = w.FB_LP || {};
  var SHOP = 'https://shop.footbalance.com.tr';
  var CURRENCY = 'TRY';
  var STORE_KEY = 'fb_lp_params';
  // Reklamdan gelen ve ödemeye kadar taşınacak parametreler
  var PASS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
    'utm_adset', 'utm_ad', 'fbclid', 'gclid', 'gbraid', 'wbraid'];

  function log() { if (CFG.debug && w.console) console.log.apply(console, ['[FBLP]'].concat([].slice.call(arguments))); }

  // 1) Gelen parametreleri yakala, sayfa içinde gezinirken kaybolmasın diye sakla
  function captureParams() {
    var saved = {};
    try { saved = JSON.parse(w.sessionStorage.getItem(STORE_KEY) || '{}') || {}; } catch (e) {}
    var q = new URLSearchParams(w.location.search), got = false;
    PASS.forEach(function (k) { var v = q.get(k); if (v) { saved[k] = v; got = true; } });
    if (got) { try { w.sessionStorage.setItem(STORE_KEY, JSON.stringify(saved)); } catch (e) {} }
    return saved;
  }
  var PARAMS = captureParams();

  function eventId(name) { return name + '.' + Date.now() + '.' + Math.random().toString(36).slice(2, 8); }

  function fbq() { if (typeof w.fbq === 'function') w.fbq.apply(null, arguments); }
  function gtag() { if (typeof w.gtag === 'function') w.gtag.apply(null, arguments); }

  // items: [{ variantId, name, model, size, price, qty }]
  function toMeta(items) {
    return {
      content_ids: items.map(function (i) { return String(i.variantId || i.model); }),
      contents: items.map(function (i) { return { id: String(i.variantId || i.model), quantity: i.qty || 1, item_price: i.price }; }),
      content_type: items.every(function (i) { return i.variantId; }) ? 'product' : 'product_group',
      content_name: items.map(function (i) { return i.name; }).join(', '),
      value: sum(items),
      currency: CURRENCY,
      lp_variant: CFG.variant
    };
  }
  function toGa(items) {
    return {
      currency: CURRENCY,
      value: sum(items),
      lp_variant: CFG.variant,
      items: items.map(function (i) {
        return { item_id: String(i.variantId || i.model), item_name: i.name, item_brand: 'FootBalance',
          item_variant: i.size || '', price: i.price, quantity: i.qty || 1 };
      })
    };
  }
  function sum(items) { return items.reduce(function (t, i) { return t + (i.price || 0) * (i.qty || 1); }, 0); }

  function checkoutUrl(items) {
    var path = items.map(function (i) { return i.variantId + ':' + (i.qty || 1); }).join(',');
    var q = new URLSearchParams();
    q.set('storefront', 'true');
    q.set('attributes[lp]', CFG.variant || 'unknown');
    PASS.forEach(function (k) { if (PARAMS[k]) q.set(k, PARAMS[k]); });
    return SHOP + '/cart/' + path + '?' + q.toString();
  }

  var FBLP = {
    params: PARAMS,

    // Ürün/model görüntülendi (sayfa açılışında ve model kartı seçildiğinde)
    viewItem: function (items) {
      items = [].concat(items);
      fbq('track', 'ViewContent', toMeta(items), { eventID: eventId('vc') });
      gtag('event', 'view_item', toGa(items));
      log('view_item', items);
    },

    addToCart: function (item) {
      var items = [item];
      fbq('track', 'AddToCart', toMeta(items), { eventID: eventId('atc') });
      gtag('event', 'add_to_cart', toGa(items));
      log('add_to_cart', items);
    },

    // Sepetteki Shopify bağlantısı yeni sekmede açılır.
    beginCheckout: function (items) {
      fbq('track', 'InitiateCheckout', toMeta(items), { eventID: eventId('ic') });
      gtag('event', 'begin_checkout', toGa(items));
      if (w.clarity) w.clarity('event', 'checkout_click');
      log('begin_checkout', items);
    },

    // Yardımcı adımlar (model bulucu tamamlandı, SSS açıldı vb.)
    step: function (name, data) {
      fbq('trackCustom', 'LP_' + name, Object.assign({ lp_variant: CFG.variant }, data || {}));
      gtag('event', 'lp_' + name, Object.assign({ lp_variant: CFG.variant }, data || {}));
      if (w.clarity) w.clarity('event', name);
      log('step', name, data);
    },

    checkoutUrl: checkoutUrl
  };

  w.FBLP = FBLP;
  log('hazır', CFG.variant, PARAMS);
})(window);
