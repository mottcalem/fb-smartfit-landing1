# SmartFit — müşteri tasarım önizlemesi

FootBalance SmartFit için hareketli ürün anlatımı tasarımı. Gerçek sipariş veya ödeme alınmaz.

Bu demo müşteri değerlendirmesi için GitHub Pages üzerinde tutulur. Yayını kapatmak için repository Settings → Pages kaynağını kaldırın.

Ürün görselleri sağlanan marka materyallerinden; hero ve katman atlası AI kampanya görselleştirmeleridir.
# fb-smartfit-landing1

## Bayi formu sunucusu

Bayi formu SMTP kimlik bilgilerini tarayıcıya göndermeden `/api/dealer` üzerinden çalışır. Python 3 ile, yukarıdaki SMTP değerlerini sunucunun ortam değişkenleri olarak tanımlayıp `python3 server.py` komutunu çalıştırın. `PORT` isteğe bağlıdır (varsayılan 8000). Başvurular varsayılan olarak `info@onbrands.com.tr` adresine gönderilir; farklı bir alıcı için `DEALER_TO` ortam değişkenini ayarlayın.

Ubuntu sunucusunda uygulamayı bir servis olarak çalıştırın ve web sunucunuzda `/api/dealer` isteklerini bu servise yönlendirin. İsterseniz sitenin tamamını da aynı Python servisi üzerinden sunabilirsiniz. SMTP bilgilerini herkese açık dosyalarda tutmayın; sunucunun gizli ortam değişkenlerinde saklayın.
