const BIST_STOCKS=[["A1CAP","A1 Capital Yatitim Menkul Degerler"],["A1YEN","A1 Yenilenebilir Enerji Uretim"],["AAGYO","Agaoglu Avrasya Gayrimenkul YO"],["ACSEL","Aciselsan Acipayam Seluloz"],["ADEL","Adel Kalemcilik"],["ADESE","Adese GYO"],["ADGYO","Adra Gayrimenkul YO"],["AEFES","Anadolu Efes Biracilik ve Malt"],["AFYON","Afyon Cimento"],["AGESA","AgeSA Hayat ve Emeklilik"],["AGHOL","AG Anadolu Grubu Holding"],["AGROT","Agrotech Yuksek Teknoloji ve Yatirim"],["AGYO","Atakule Gayrimenkul YO"],["AHGAZ","Ahlatci Dogal Gaz Dagitim Enerji ve .."],["AHSGY","Ahes Gayrimenkul YO"],["AKBNK","Akbank"],["AKCNS","Akcansa Cimento"],["AKENR","Akenerji Elektrik Uretim"],["AKFGY","Akfen Gayrimenkul YO"],["AKFIS","Akfen insaat Turizm ve"],["AKFYE","AKFEN YENILENEBILIR ENERJI"],["AKGRT","Aksigorta"],["AKHAN","Akhan Un Fabrikasi Ve Tarim Urunleri.."],["AKMGY","Akmerkez Gayrimenkul YO"],["AKSA","Aksa Akrilik Kimya"],["AKSEN","Aksa Enerji Uretim"],["AKSGY","Akis Gayrimenkul YO"],["AKSUE","Aksu Enerji ve"],["AKYHO","Akdeniz Yatirim Holding"],["ALARK","Alarko Holding"],["ALBRK","Albaraka Turk Katilim Bankasi"],["ALCAR","Alarko Carrier"],["ALCTL","Alcatel Lucent Teletas Telekomunikas.."],["ALFAS","ALFA SOLAR ENERJI"],["ALGYO","Alarko Gayrimenkul YO"],["ALKA","Alkim Kagit"],["ALKIM","Alkim Alkali Kimya"],["ALKLC","Altinkilic Gida ve Sut"],["ALTIN","DARPHANE ALTIN SERTIFIKASI"],["ALTNY","Altinay Savunma Teknolojileri"],["ALVES","Alves Kablo"],["ANELE","Anel Elektrik Proje Taahhut ve"],["ANGEN","Anatolia Tani ve Biyoteknoloji Urunl.."],["ANHYT","Anadolu Hayat Emeklilik"],["ANSGR","Anadolu Anonim Turk Sigorta Sirketi"],["ARASE","Dogu Aras Enerji Yatirimlari"],["ARCLK","Arcelik"],["ARDYZ","ARD Grup Bilisim Teknolojileri"],["ARENA","Arena Bilgisayar"],["ARFYE","ARF Bio Yenilenebilir Enerji Uretim"],["ARMGD","Armada Gida"],["ARSAN","Arsan Holding"],["ARTMS","Artemis Hali"],["ARZUM","Arzum Elektrikli Ev Aletleri"],["ASELS","Aselsan Elektronik"],["ASGYO","ASCE GAYRIMENKUL YO"],["ASTOR","Astor Enerji"],["ASUZU","Anadolu Isuzu Otomotiv"],["ATAGY","Ata Gayrimenkul YO"],["ATAKP","Atakey Patates Gida"],["ATATP","ATP Yazilim ve Teknoloji"],["ATATR","Ata Turizm Isletmecilik Tasimacilik .."],["ATEKS","Akin Tekstil"],["ATLAS","Atlas Menkul Kiymetler YO"],["ATSYH","Atlantis Yatirim Holding"],["AVGYO","Avrasya Gayrimenkul YO"],["AVHOL","Avrupa Yatirim Holding"],["AVOD","A.V.O.D. KURUTULMUS GIDA VE TARIM UR.."],["AVPGY","Avrupakent Gayrimenkul YO SA"],["AVTUR","Avrasya Petrol ve Turistik Tesisler .."],["AYCES","Altin Yunus Cesme Turistik Tesisler"],["AYDEM","Aydem Yenilenebilir Enerji"],["AYEN","Ayen Enerji"],["AYES","Ayes Celik Hasir ve Cit"],["AYGAZ","Aygaz"],["AZTEK","Aztek Teknoloji Urunleri"],["BAGFS","Bagfas Bandirma Gubre Fabrikalari"],["BAHKM","Bahadir Kimya"],["BAKAB","Bak Ambalaj"],["BALAT","Balatacilar Balatacilik"],["BALSU","Balsu Gida"],["BANVT","Banvit Bandirma Vitaminli Yem"],["BARMA","Barem Ambalaj"],["BASCM","Bastas Baskent Cimento"],["BASGZ","Baskent Dogalgaz Dagitim Gayrimenkul.."],["BAYRK","BAYRAK EBT TABAN"],["BEGYO","Bati Ege Gayrimenkul YO"],["BERA","Bera Holding"],["BESLR","Besler Gida Ve Kimya"],["BESTE","Best Brands Grup Enerji Yatirim"],["BEYAZ","Beyaz Filo Oto Kiralama"],["BFREN","Bosch Fren Sistemleri"],["BIENY","Bien Yapi Urunleri Turizm Ve"],["BIGCH","Buyuk Sefler Gida Turizm Tekstil Dan.."],["BIGEN","Birlesim Grup Enerji Yatirimlari"],["BIGTK","Big Medya Teknoloji"],["BIMAS","BIM Birlesik Magazalar"],["BINBN","Bin Ulasim Ve Akilli Sehir Teknoloji.."],["BINHO","1000 Yatirimlar Holding"],["BIOEN","BIotrend Cevre ve EnerjI Yatirimlari"],["BIZIM","Bizim Toptan SatiG Magazalari"],["BJKAS","Besiktas Futbol Yatirimlari"],["BLCYT","Bilici Yatirim"],["BLUME","Blume Metal Kimya"],["BMSCH","BMS Celik Hasir"],["BMSTL","BMS Birlesik Metal"],["BNTAS","Bantas Bandirma Ambalaj"],["BOBET","Bogazici Beton"],["BORLS","Borlease Otomotiv"],["BORSK","Bor Seker"],["BOSSA","Bossa Isletmeleri"],["BRISA","Brisa Bridgestone Sabanci Lastik"],["BRKO","Birko Birlesik Koyunlulular Mensucat.."],["BRKSN","Berkosan Yalitim ve Tecrit Maddeleri.."],["BRKVY","Birikim Varlik Yonetim"],["BRLSM","Birlesim Muhendislik Isitma Sogutma .."],["BRMEN","Birlik Mensucat Isletmesi"],["BRSAN","BORUSAN BIRLESIK BORU FABRIKALARI"],["BRYAT","Borusan Yatirim ve Pazarlama"],["BSOKE","Batisoke Soke Cimento"],["BTCIM","Baticim Bati Anadolu Cimento"],["BUCIM","Bursa Cimento Fabrikasi"],["BULGS","Bulls GSYO"],["BURCE","Burcelik Bursa Celik Doekum"],["BURVA","Burcelik Vana"],["BVSAN","BULBULOGLU VINC"],["BYDNR","Baydoner Restoranlari"],["CANTE","CAN2 TERMIK"],["CASA","Casa Emtia Petrol Kimyevi ve Turevleri"],["CATES","Cates Elektrik Uretim"],["CCOLA","Coca-Cola Icecek"],["CELHA","Celik Halat ve Tel"],["CEMAS","Cemas Dokum"],["CEMTS","Cemtas Celik Makina"],["CEMZY","CEM ZEYTIN"],["CEOEM","CEO Event Medya"],["CGCAM","Cagdas Cam"],["CIMSA","Cimsa Cimento"],["CLEBI","Celebi Hava Servisi"],["CMBTN","Cimbeton Hazir Beton ve Prefabrik Ya.."],["CMENT","Cimentas Izmir Cimento Fabrikasi Turk"],["CONSE","Consus Enerji Isletmeciligi ve Hizme.."],["COSMO","Cosmos Yatirim Holding"],["CRDFA","Creditwest Faktoring"],["CRFSA","CarrefourSA Carrefour Sabanci Merkezi"],["CUSAN","Cuhadaroglu Metal ve Pazarlama"],["CVKMD","CVK MADEN ISLETMELERI A.S"],["CWENE","CW ENERJI MUHENDISLIK"],["DAGI","Dagi Giyim"],["DAPGM","DAP GAYRIMENKUL GELISTIRME"],["DARDL","Dardanel Onentas Gida San"],["DCTTR","DCT Trading Dis"],["DENGE","Denge Yatirim Holding"],["DERHL","Derluks Yatirim Holding"],["DERIM","Derimod Konfeksiyon Ayakkabi Deri"],["DESA","Desa Deri"],["DESPC","Despec Bilgisayar Pazarlama ve"],["DEVA","Deva Holding"],["DGATE","Datagate Bilgisayar Malzemeleri"],["DGGYO","Dogus Gayrimenkul YO"],["DGNMO","Doganlar Mobilya Grubu Imalat"],["DIRIT","Diriteks Dirilis Tekstil"],["DITAS","Ditas Dogan Yedek Parca Imalat ve Te.."],["DMLKT","Emlak Konut Gayrimenkul YO A.S. 0 % .."],["DMRGD","DMR Unlu Mamuller Uretim Gida Toptan.."],["DMSAS","Demisas Dokum Emaye Mamulleri"],["DNISI","Dinamik Isi Makina Yalitim Malzemeleri"],["DOAS","Dogus Otomotiv Servis ve"],["DOCO","DO & CO Aktiengesellschaft"],["DOFER","Dofer Yapi Maizemeleri"],["DOFRB","DOF Robotik"],["DOGUB","Dogusan Boru ve"],["DOHOL","Dogan Sirketler Grubu Holding"],["DOKTA","Doktas Dokumculuk"],["DSTKF","Destek Finans Faktoring"],["DUNYH","Dunya Holding"],["DURDO","Duran Dogan Basim ve Ambalaj"],["DURKN","Durukan Sekerleme"],["DYOBY","Dyo Boya Fabrikalari"],["DZGYO","Deniz Gayrimenkul YO"],["EBEBK","EBEBEK MAGAZACILIK"],["ECILC","EIS Eczacibasi Ilac, Sinai ve Finans.."],["ECOGR","Ecogreen Enerji Holding"],["ECZYT","Eczacibasi Yatirim Holding Ortakligi"],["EDATA","E-Data Teknoloji Pazarlama"],["EDIP","Edip GYO"],["EFOR","Efor Yatirim"],["EGEEN","Ege Endustri ve"],["EGEGY","Egeyapi Avrupa Gayrimenkul YO"],["EGEPO","Nasmed Ozel Saglik Hizmetleri"],["EGGUB","Ege Gubre"],["EGPRO","Ege Profil"],["EGSER","Ege Seramik"],["EKGYO","Emlak Konut Gayrimenkul YO"],["EKIZ","Ekiz Kimya"],["EKOS","Ekos Teknoloji ve Elektrik"],["EKSUN","Eksun Gida Tarim"],["ELITE","Elite Naturel Organik Gida"],["EMKEL","Emek Elektrik Endustrisi"],["EMNIS","Eminis Ambalaj"],["EMPAE","Empa Elektronik"],["ENDAE","Enda Enerji Holding"],["ENERY","Enerya Enerji"],["ENJSA","Enerjisa Enerji"],["ENKAI","Enka Insaat ve"],["ENPRA","Enpara Bank"],["ENSRI","Ensari Sinai Yatirimlar"],["ENTRA","IC Enterra Yenilenebilir Enerji"],["EPLAS","Egeplast Ege Plastik"],["ERBOS","Erbosan Erciyas Boru ve"],["ERCB","Erciyas Celik Boru"],["EREGL","Eregli Demir Ve Celik Fabrikalari"],["ERSU","Ersu Meyve ve Gida"],["ESCAR","Escar Filo Kiralama Hizmetleri"],["ESCOM","Escort Teknoloji Yatirim"],["ESEN","Esenboga Elektrik Uretim"],["ETILR","Etiler Gida ve Ticari Yatirimlar"],["ETYAT","Euro Trend YO"],["EUHOL","Euro Yatirim Holding"],["EUKYO","Euro Kapital YO"],["EUPWR","Europower Enerji ve Otomasyon Teknol.."],["EUREN","Europen Endustri Insaat"],["EUYO","Euro Menkul Kiymet YO"],["EYGYO","EYG Gayrimenkul YO"],["FADE","Fade Gida Yatirim"],["FENER","Fenerbahce Futbol"],["FLAP","Flap Kongre Toplanti Hizmetleri Otom.."],["FMIZP","Federal-Mogul Izmit Piston ve Pim Ur.."],["FONET","Fonet Bilgi Teknolojileri"],["FORMT","FORMET METAL VE CAM"],["FORTE","FORTE BILGI ILETISIM TEKNOLOJILERI V.."],["FRIGO","Frigo-Pak Gida Maddeleri"],["FRMPL","Formul Plastik Ve Metal"],["FROTO","Ford Otomotiv"],["FZLGY","FUZUL GAYRIMENKUL YO"],["GARAN","Turkiye Garanti Bankasi"],["GARFA","Garanti Faktoring"],["GATEG","Gate Group Teknoloji Medya Ve Siber .."],["GEDIK","Gedik Yat"],["GEDZA","Gediz Ambalaj"],["GENIL","Gen Ilac ve Saglik Urunleri"],["GENKM","Gentas Kimya Pazarlama"],["GENTS","Gentas Dekoratif Yuzeyler"],["GEREL","Gersan Elektrik"],["GESAN","GIRISIM ELEKTRIK TAAHHUT VE"],["GIPTA","Gipta Ofis Kirtasiye ve Promosyon Ur.."],["GLBMD","Global Menkul Degerler"],["GLCVY","GELECEK VARLIK YONETIMI A.S"],["GLRMK","Gulermak Agir Insaat Ve Taahhut"],["GLRYH","Guler Yatirim Holding"],["GLYHO","Global Yatirim Holding"],["GMSTR","Istanbul Silver B Tipi Gumus Borsa Y.."],["GMTAS","Gimat Magazacilik Insaat"],["GOKNR","GOKNUR GIDA MADDELERI ENERJI IMALAT .."],["GOLTS","Goltas Goller Bolgesi Cimento"],["GOODY","Goodyear Lastikleri"],["GOZDE","Gozde GSYO"],["GRNYO","Garanti YO"],["GRSEL","Gur-Sel Turizm Tasimacilik Ve Servis"],["GRTHO","Grainturk Holding"],["GSDDE","GSD Denizcilik Gayrimenkul Insaat"],["GSDHO","GSD Holding"],["GSRAY","Galatasaray Sportif Sinai Veticari Y.."],["GUBRF","Gubre Fabrikalari"],["GUNDG","Gundogdu Gida Sut Urunleri Ve Dis"],["GWIND","GALATA WIND ENERJI"],["GZNMI","Gezinomi Seyahat Turizm"],["HALKB","Turkiye Halk Bankasi"],["HATEK","Hateks Hatay Tekstil Isletmeleri"],["HATSN","Hat-San Gemi Insaa Bakim Onarim Deni.."],["HDFGS","Hedef GSYO"],["HEDEF","Hedef Holding"],["HEKTS","Hekt"],["HKTM","HIDROPAR HAREKET KONTROL TEKNOLOJILE.."],["HLGYO","Halk Gayrimenkul YO"],["HOROZ","Horoz Lojistik Kargo Hizmetleri Ve"],["HRKET","Hareket Proje Tasimaciligi ve Yuk Mu.."],["HTTBT","Hitit Bilgisayar Hizmetleri"],["HUBVC","Hub GSYO"],["HUNER","Hun Yenilenebilir Enerji Uretim"],["HURGZ","Hurriyet Gazetecilik ve Matbaacilik"],["ICBCT","ICBC Turkey Bank"],["ICUGS","ICU GSYO"],["IDGYO","Idealist Gayrimenkul YO"],["IEYHO","Isiklar Enerji ve Yapi Holding"],["IHAAS","Ihlas Haber Ajansi SA"],["IHEVA","Ihlas Ev Aletleri Imalat"],["IHGZT","Ihlas Gazetecilik"],["IHLAS","Ihlas Holding"],["IHLGM","Ihlas Gayrimenkul Proje Gelistirme ve"],["IHYAY","Ihlas Yayin Holding"],["IMASM","IMAS Makina"],["INDES","Indeks Bilgisayar Sistemleri Muhendi.."],["INFO","INFO Yat. A.S"],["INGRM","Ingram Micro Bilisim Sistemleri"],["INTEK","Innosa Teknoloji"],["INTEM","Intema Insaat ve Tesisat Malzemeleri.."],["INVEO","Inveo Yatirim Holding"],["INVES","Investco Holding"],["ISBIR","Isbir Holding"],["ISBTR","Turkiye Is Bankasi Anonim Sirketi"],["ISCTR","Turkiye Is Bankasi Anonim Sirketi"],["ISDMR","Iskenderun Demir ve Celik"],["ISFIN","Is Finansal Kiralama"],["ISGSY","Is GSYO"],["ISGYO","Is Gayrimenkul YO"],["ISKPL","Isik Plastik VE Dis Pazarlama"],["ISKUR","Turkiye Is Bankasi"],["ISMEN","Is Yat"],["ISSEN","Isbir Sentetik Dokuma"],["ISYAT","Is YO"],["IZENR","Izdemir Enerji Elektrik Uretim"],["IZFAS","Izmir Firca"],["IZINV","Iz Yatirim Holding"],["IZMDC","Izmir Demir Celik"],["JANTS","Jantsa Jant"],["KAPLM","Kaplamin Ambalaj"],["KAREL","Karel Elektronik SA"],["KARSN","Karsan Otomotiv ve"],["KARTN","Kartonsan Karton"],["KATMR","Katmerciler Arac Ustu Ekipman"],["KAYSE","Kayseri Seker Fabrikasi"],["KBORU","Kuzey Boru"],["KCAER","Kocaer Celik"],["KCHOL","Koc Holding"],["KENT","Kent Gida Maddeleri ve"],["KERVN","Kervansaray Yatirim Holding"],["KFEIN","Kafein Yazilim Hizmetleri"],["KGYO","KORAY GAYRIMENKUL YO"],["KIMMR","Ersan Alisveris Hizmetleri ve Gida"],["KLGYO","Kiler Gayrimenkul YO"],["KLKIM","Kalekim Kimyevi Maddeler"],["KLMSN","Klimasan Klima"],["KLNMA","Turkiye Kalkinma ve Yatirim Bankasi"],["KLRHO","KILER Holding"],["KLSER","Kaleseramik Canakkale Kalebodur Sera.."],["KLSYN","Koleksiyon Mobilya"],["KLYPV","Kalyon Gunes Teknolojileri Uretim"],["KMPUR","Kimteks Poliuretan"],["KNFRT","Konfrut Tarim"],["KOCMT","Koc Metalurji"],["KONKA","Konya Kagit"],["KONTR","Kontrolmatik Teknoloji Enerji ve Muh.."],["KONYA","Konya Cimento"],["KOPOL","KOZA POLYESTER"],["KORDS","Kordsa Teknik Tekstil"],["KOTON","Koton Magazacilik Tekstil"],["KRDMA","Kardemir Karabiik Demir celik"],["KRDMB","Kardemir Karabiik Demir celik"],["KRDMD","Kardemir Karabiik Demir celik"],["KRGYO","Korfez Gayrimenkul YO"],["KRONT","Kron Teknoloji"],["KRPLS","Koroplast Temizlik Ambalaj Urunleri .."],["KRSTL","Kristal Kola ve Mesrubat"],["KRTEK","Karsu Tekstil ve"],["KRVGD","Kervan Gida"],["KSTUR","Kustur Kusadasi Turizm Endustrisi"],["KTLEV","KATILIMEVIM TASARRUF FINANSMAN"],["KTSKR","Kutahya Seker Fabrikasi"],["KUTPO","Kutahya Porselen"],["KUVVA","Kuvva Gida Yatirimlari"],["KUYAS","Kuyas Yatirim"],["KZBGY","KIZILBUK GAYRIMENKUL YO"],["KZGYO","Kuzugrup Gayrimenkul YO"],["LIDER","LDR Turizm"],["LIDFA","Lider Faktoring"],["LILAK","Lila Kagit"],["LINK","Link Bilgisayar Sistemleri Yazilimi .."],["LKMNH","Lokman Hekim Engurusag Saglik, Turiz.."],["LMKDC","Limak Dogu Anadolu Cimento"],["LOGO","Logo Yazilim"],["LRSHO","Loras Holding"],["LUKSK","Luks Kadife"],["LXGYO","Luxera Gayrimenkul YO"],["LYDHO","Lydia Holding"],["LYDYE","Lydia Yesil Enerji kaynaklari"],["MAALT","Marmaris Altinyunus Turistik Tesisle.."],["MACKO","Mackolik Internet Hizmetleri"],["MAGEN","MARGUN ENERJI URETIM"],["MAKIM","MAKIM MAKINA TEKNOLOJILERI SANAYIVE"],["MAKTK","Makina Takim Endustrisi"],["MANAS","Manas Enerji Yonetimi"],["MARBL","Tureks Turunc Madencilik Ic ve Dis"],["MARKA","Marka Yatirim Holding"],["MARMR","Marmara Holding"],["MARTI","Marti Otel Isletmeleri"],["MAVI","Mavi Giyim"],["MCARD","Metropal Kurumsal Hizmetler"],["MEDTR","Meditera Tibbi Malzeme"],["MEGAP","Mega Polietilen Kopuk"],["MEGMT","Mega Metal"],["MEKAG","Meka Global Makine Imalat"],["MEPET","Mepet Metro Petrol ve Tesisleri"],["MERCN","MERCAN KIMYA"],["MERIT","Merit Turizm Yatirim ve Isletmeleri"],["MERKO","Merko Gida"],["METRO","Metro Ticari ve Mali Yatirimlar Hold.."],["MEYSU","Meysu Gida"],["MGROS","Migros"],["MHRGY","MHR Gayrimenkul YO"],["MIATK","MIA Teknoloji"],["MMCAS","MMCari Yatirimlar A.S"],["MNDRS","Menderes Tekstil"],["MNDTR","Mondi Turkey Oluklu Mukavva Kagit ve.."],["MOBTL","Mobitel Iletisim Nizmetleri A.S"],["MOGAN","Mogan Enerji Yatirim Holding"],["MOPAS","Mopas Marketcilik Gida"],["MPARK","MLP Saglik Hizmetleri"],["MRGYO","Marti Gayrimenkul YO"],["MRSHL","Marshall Boya ve Vernik"],["MSGYO","Mistral Gayrimenkul YO"],["MTRKS","Matriks Finansal Teknolojiler"],["MTRYO","Metro YO"],["MZHLD","Mazhar Zorlu Holding"],["NATEN","Naturel Yenilenebilir Enerji"],["NETAS","Netas Telekomunikasyon"],["NETCD","Netcad Yazilim"],["NIBAS","Nigbas Nigde Betonarte"],["NTGAZ","Naturelgaz"],["NTHOL","Net Holding"],["NUGYO","Nurol Gayrimenkul YO"],["NUHCM","Nuh Cimento"],["OBAMS","Oba Makarnacilik"],["OBASE","Obase Bilgisayar ve Danismanlik Hizm.."],["ODAS","ODAS Elektrik Uretim"],["ODINE","Odine Solutions Teknoloji"],["OFSYM","Ofis Yem Gida"],["ONCSM","ONCOSEM ONKOLOJIK SISTEMLER"],["ONRYT","Onur Yuksek Teknoloji"],["OPT25","OSMANLI P BIST TEM 25 END HY BYF"],["OPTGY","Osmanli Pf. Kar Payi Od. BIST GYO En.."],["ORCAY","ORCAY ORTAKOY CAY"],["ORGE","Orge Enerji Elektrik Taahhut"],["ORMA","Orma Orman Mahsulleri Integre"],["OSMEN","Osmanli Yat"],["OSTIM","Ostim Endustriyel Yatirimlar ve Isle.."],["OTKAR","Otokar Otomotiv ve Savunma"],["OTTO","OTTO HOLDING A.S"],["OYAKC","OYAK Cimento Fabrikalari"],["OYAYO","Oyak YO"],["OYLUM","Oylum Sinai Yatirimlar"],["OYYAT","Oyak Yat"],["OZATD","OZATA DENIZCILIK"],["OZGYO","Ozderici Gayrimenkul YO"],["OZKGY","Ozak Gayrimenkul YO"],["OZRDN","Ozerden Ambalaj"],["OZSUB","Ozsu Balik Uretim"],["OZYSR","Ozyasar Tel ve Galvanizleme"],["PAGYO","Panora Gayrimenkul YO"],["PAHOL","PASIFIK HOLDING A.S"],["PAMEL","Pamel Yenilenebilir Elektrik Uretim"],["PAPIL","PAPILON SAVUNMA TEKNOLOJI VE A.S"],["PARSN","Parsan Makina Parcalari"],["PASEU","Pasifik Eurasia Lojistik dis"],["PATEK","Pasifik Teknoloji"],["PCILT","PC Iletisim ve Medya Hizmetleri"],["PEKGY","Peker Gayrimenkul YO"],["PENGD","Penguen Gida"],["PENTA","Penta Teknoloji Urunleri Dagitim"],["PETKM","Petkim Petrokimya Holding"],["PETUN","Pinar Entegre Et ve Un"],["PGSUS","Pegasus Hava Tasimaciligi"],["PINSU","Pinar Su ve Icecek"],["PKART","Plastikkart Akilli Kart Iletisim Sis.."],["PKENT","Petrokent Turizm"],["PLTUR","PLATFORM TURIZM TASIMACILIK GIDA INS.."],["PNLSN","Panelsan Cati Cephe Sistemleri"],["PNSUT","Pinar Sut Mamulleri"],["POLHO","Polisan Holding"],["POLTK","Politeknik Metal"],["PRDGS","PARDUS GSYO"],["PRKAB","Turk Prysmian Kablo ve Sistemleri"],["PRKME","Park Elektrik Uretim Madencilik"],["PRZMA","Prizma Pres Matbaacilik Yayincilik"],["PSDTC","Pergamon Status Dis"],["PSGYO","Pasifik Gayrimenkul YO"],["QNBFK","QNB Finansal Kiralama"],["QNBTR","QNB Bank"],["QTEMZ","DJIST - Dow Jones Istanbul 20"],["QUAGR","Qua Granite Hayal Yapi ve Urunleri"],["RALYH","Ral Yatirim Holding"],["RAYSG","Ray Sigorta"],["REEDR","Reeder Teknoloji"],["RGYAS","Ronesans GYO"],["RNPOL","Rainbow Polikarbonat"],["RODRG","Rodrigo Tekstil"],["RTALB","RTA Laboratuvarlari Biyolojik Urunle.."],["RUBNS","Rubenis Tekstil"],["RUZYE","Ruzy Madencilik Ve Enerji Yatirimlari"],["RYGYO","Reysas Gayrimenkul YO"],["RYSAS","Reysas Tasimacilik ve Lojistik"],["SAFKR","Safkar Ege Cooling Air Conditioning .."],["SAHOL","Haci Omer Sabanci Holding"],["SAMAT","Saray Matbaacilik Kagitcilik Kirtasi.."],["SANEL","San-El Muhendislik Elektrik Taahhut"],["SANFM","SANIFOAM ENDUSTRI VE TUKETIM URUNLERI"],["SANKO","Sanko Pazarlama Ithalat Ihracat"],["SARKY","Sarkuysan Elektrolitik Bakir"],["SASA","Sasa Polyester"],["SAYAS","Say Yenilenebilir Enerji Ekipmanlari"],["SDTTR","SDT Uzay ve Savunma Teknolojileri"],["SEGMN","Segmen Kardesler Gida Uretim ve Amba.."],["SEGYO","SEKER GAYRIMENKUL YO"],["SEKFK","Seker Finansal Kiralama"],["SEKUR","Sekuro Plastik Ambalaj"],["SELEC","Selcuk Ecza Deposu"],["SELVA","SELVA GIDA"],["SERNT","Seranit Granit Seramik"],["SEYKM","Seyitler Kimya"],["SILVR","Silverline Endustri ve"],["SISE","Turkiye Sise ve Cam Fabrikalari"],["SKBNK","Sekerbank"],["SKTAS","Soktas Tekstil"],["SKYLP","Skyalp Finansal Teknolojiler ve Dani.."],["SKYMD","Seker Yat"],["SMART","Smartiks Yazilim"],["SMRTG","Smart Gunes Enerjisi Teknolojileri A.."],["SMRVA","Sumer Varlik Yonetim"],["SNGYO","Sinpas Gayrimenkul YO"],["SNICA","Sanica Isi"],["SNPAM","Sonmez Pamuklu"],["SODSN","Sodas Sodyum"],["SOKE","Soke Degirmencilik"],["SOKM","Sok Marketler"],["SONME","Soenmez Filament Sentetik Iplik ve E.."],["SRVGY","Servet Gayrimenkul YO"],["SUMAS","Sumas Suni Tahta ve Mobilya"],["SUNTK","Sun Tekstil"],["SURGY","Sur Tatil Evleri Gayrimenkul YO"],["SUWEN","Suwen Tekstil San. Paz"],["SVGYO","Savur Gayrimenkul YO A.S"],["TABGD","TAB Gida"],["TARKM","Tarkim Bitki Koruma"],["TATEN","Tatlipinar Enerji Uretim"],["TATGD","Tat Gida"],["TAVHL","TAV Havalimanlari Holding"],["TBORG","Turk Tuborg Bira ve Malt"],["TCELL","Turkcell Iletisim Hizmetleri"],["TCKRC","Kirac Galvaniz Telekominikasyon Meta.."],["TDGYO","Trend Gayrimenkul YO"],["TEHOL","Tera Yatirim Teknoloji Holding"],["TEKTU","Tek-Art Insaat Turizm ve Yatirimlar"],["TERA","Tera Yat"],["TEZOL","Europap Tezol Paper Industry and Tra.."],["TGSAS","TGS Dis"],["THYAO","Turk Hava Yollari"],["TKFEN","Tekfen Holding"],["TKNSA","Teknosa Ic ve Dis"],["TLMAN","Trabzon Liman Isletmeciligi"],["TMPOL","Temapol Polimer Plastik Ve Insaat A..S"],["TMSN","Tumosan Motor Ve Traktor"],["TNZTP","TAPDI OKSIJEN OZEL SAGLIK VE EGITIM .."],["TOASO","Tofas Turk Otomobil Fabrikasi"],["TRALT","Turk Altin Isletmeleri"],["TRCAS","Turcas Holding"],["TRENJ","TR Dogal Enerji Kaynaklari Arastirma.."],["TRGYO","Torunlar Gayrimenkul YO"],["TRHOL","Tera Financial Investments Holding"],["TRILC","Turk Ilac ve Serum"],["TRMET","TR Anadolu Metal Madencilik Isletmel.."],["TSGYO","TSKB Gayrimenkul YO"],["TSKB","Turkiye Sinai Kalkinma Bankasi"],["TSPOR","Trabzonspor Sportif Yatirim ve Futbo.."],["TTKOM","Turk Telekomunikasyon"],["TTRAK","Turk Traktor ve Ziraat Makineleri"],["TUCLK","Tugcelik Aluminyum ve Metal Mamulleri"],["TUKAS","Tukas Gida"],["TUPRS","Turkiye Petrol Rafinerileri"],["TUREX","TUREKS TURIZM TASIMACILIK"],["TURGG","TURKER PROJE GAYRIMENKUL VE YATIRIM .."],["TURSG","Turkiye Sigorta"],["UCAYM","Ucay Muhendislik Enerji ve Iklimlend.."],["UFUK","Ufuk Yatirim Yonetim Ve Gayrimenkul"],["ULAS","Ulaslar Turizm Energi Tarim Gida ve .."],["ULKER","Ulker Biskuvi"],["ULUFA","Ulusal Faktoring"],["ULUSE","Ulusoy Elektrik Imalat Taahhut ve"],["ULUUN","Ulusoy Un"],["UNLU","Unlu Yatirim Holding"],["USAK","Usak Seramik"],["USDTR","Finans Asset Management American Dol.."],["VAKBN","Turkiye Vakiflar Bankasi Turk Anonim.."],["VAKFA","Vakif Faktoring"],["VAKFN","Vakif Finansal Kiralama"],["VAKKO","Vakko Tekstil ve Hazir Giyim Isletme.."],["VANGD","Vanet Gida Ic ve Dis"],["VBTYZ","VBT Yazilim"],["VERTU","Verusaturk GSYO"],["VERUS","Verusa Holding"],["VESBE","Vestel Beyaz Esya"],["VESTL","Vestel Elektronik"],["VKFYO","Vakif Menkul Kiymet YO"],["VKGYO","Vakif Gayrimenkul YO"],["VKING","Viking Kagit ve Seluloz"],["VRGYO","Vera Konsept Gayrimenkul YO"],["VSNMD","Visne Madencilik Uretim"],["YAPRK","Yaprak Sut ve Besi Ciftikleri"],["YATAS","Yatas Yatak ve Yorgan"],["YAYLA","Yayla Enerji Uretim Turizm ve Insaat"],["YBTAS","Yibitas Yozgat Isci Birligi Insaat M.."],["YEOTK","YEO Teknoloji Enerji ve Endustri"],["YESIL","Yesil Yatirim Holding"],["YGGYO","Yeni Gimat Gayrimenkul YO"],["YIGIT","Yigit Aku Malzemeleri Nakliyat Turiz.."],["YKBNK","Yapi ve Kredi Bankasi"],["YKSLN","Yukselen Celik"],["YONGA","Yonga Mobilya"],["YUNSA","Yunsa Yunlu"],["YYAPI","Yesil Yapi Endustrisi"],["YYLGD","Yayla Agro Gida ve Nakliyat"],["ZEDUR","Zedur Enerji ElekTrik Uretim"],["ZERGY","Zeray Gayrimenkul YO"],["ZGOLD","Ziraat Portfolio Gold Participation .."],["ZGYO","Z Gayrimenkul YO"],["ZOREN","Zorlu Enerji Elektrik Uretim"],["ZRGYO","Ziraat Gayrimenkul YO"]],{
  useState,useEffect,useMemo,useCallback,useRef
}
=React,{
  ComposedChart,Line,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,ReferenceLine,Area
}
=Recharts,EMAILJS_SERVICE_ID="service_c4ytizq",EMAILJS_TEMPLATE_ID="template_v35f6eq",EMAILJS_PUBLIC_KEY="78D7vQHmRuhtjqUtF",BIST_SECTORS={
  Bankalar:["AKBNK","GARAN","ISCTR","YKBNK","HALKB","VAKBN","ALBRK","SKBNK","QNBFB","ICBCT","TSKB"],Sigorta:["AKGRT","ANHYT","ANSGR","AGESA","TURSG","RAYSG"],Holding:["SAHOL","KCHOL","DOHOL","AGHOL","ALARK","GLYHO","NTHOL","TKFEN","ENKAI","SISE","BERA","IEYHO"],Sanayi:["EREGL","KRDMD","KRDMA","KRDMB","ISDMR","BURCE","BMSCH","KCAER","SARKY","JANTS"],Enerji:["AKSEN","AKENR","ZOREN","ODAS","AYEN","CWENE","ENJSA","AKFYE","AYDEM","ENERY","AKSUE","BIOEN","SMRTG","GWIND"],"G\u0131da/Perakende":["BIMAS","MGROS","SOKM","ULKER","KENT","TUKAS","PNSUT","TATGD","AEFES","CCOLA","KRVGD","KERVT","TBORG"],Otomotiv:["TOASO","FROTO","OTKAR","ASUZU","KARSN","TTRAK","DOAS","BRSAN","JANTS","PARSN"],Havayolu:["THYAO","PGSUS","TAVHL","CLEBI","DOCO"],Teknoloji:["ASELS","LOGO","KAREL","ARDYZ","FONET","KFEIN","KONTR","ALCTL","DGATE","INDES","NETAS","SDTTR","PAPIL"],\u0130leti\u015Fim:["TCELL","TTKOM"],"\u0130n\u015Faat/GYO":["EKGYO","DAPGM","TRGYO","ISGYO","SNGYO","HLGYO","KLGYO"],Madencilik:["KOZAL","KOZAA","IPEKE","CVKMD","PRKME"]
},LS_KEY="feybot_v12",LS_PREVSIGS="feybot_sigs",LS_FAVS="feybot_favs",LS_SIGHIST="feybot_sighist",LS_ALERTS="feybot_alerts",LS_EMAIL="feybot_email",LS_FAVGRP="feybot_favgroups",LS_JOURNAL="feybot_journal",LS_POSREASON="feybot_posreasons",LS_SECTORHIST="feybot_sectorhist",LS_AICACHE="feybot_aiscan",STOCKS=BIST_STOCKS.map(([t,i])=>({
  symbol:t,name:i
})),STOCKS_MAP=Object.fromEntries(BIST_STOCKS),PROXIES=[t=>`https://api.allorigins.win/raw?url=${encodeURIComponent(t)}`,t=>`https://corsproxy.io/?url=${encodeURIComponent(t)}`,t=>`https://corsproxy.io/?${t}`,t=>`https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(t)}`,t=>`https://api.cors.lol/?url=${encodeURIComponent(t)}`,t=>`https://cors.eu.org/${t}`,t=>`https://yacdn.org/serve/${t}`];
async function fetchOne(t,i,a){
  const e=new AbortController,r=setTimeout(()=>e.abort(),a);
  try{
    const d=await fetch(t(i),{
      signal:e.signal
    });
    if(clearTimeout(r),!d.ok)throw new Error("http "+d.status);
    const n=await d.json();
    if(!n)throw new Error("empty");
    return n
  }
  catch(d){
    throw clearTimeout(r),d
  }
}
async function fetchJSON(t,i=5e3){
  const a=PROXIES.map(e=>fetchOne(e,t,i));
  a.push((async()=>{
    const e=new AbortController,r=setTimeout(()=>e.abort(),i);
    try{
      const d=await fetch(t,{
        signal:e.signal
      });
      if(clearTimeout(r),!d.ok)throw new Error("http "+d.status);
      return await d.json()
    }
    catch(d){
      throw clearTimeout(r),d
    }
  })());
  try{
    return await Promise.any(a)
  }
  catch{
    return null
  }
}
const USE_ISY_FALLBACK=!0;
async function fetchBorsaMCPDaily(t){
  try{
    const ctrl=new AbortController(),tid=setTimeout(()=>ctrl.abort(),11e3);
    const res=await fetch("https://borsamcp.fastmcp.app/mcp",{
      method:"POST",signal:ctrl.signal,headers:{
        "Content-Type":"application/json","Accept":"application/json, text/event-stream"
      },body:JSON.stringify({
        jsonrpc:"2.0",id:1,method:"tools/call",params:{
          name:"get_historical_data",arguments:{
            symbol:t,market:"bist",period:"2y"
          }
        }
      })
    });
    clearTimeout(tid);
    if(!res.ok)return null;
    const txt=await res.text(),line=txt.split("\n").find(l=>l.startsWith("data:"));
    if(!line)return null;
    const obj=JSON.parse(line.slice(5));
    if(obj.error||!obj.result?.content?.[0]?.text)return null;
    const raw=JSON.parse(obj.result.content[0].text),arr=Array.isArray(raw)?raw:(raw.data||[]);
    if(!Array.isArray(arr)||arr.length<10)return null;
    const rows=arr.map(c=>{
      const dt=new Date(c.date);
      return{
        ts:dt.getTime(),date:`${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}`,open:+c.open,high:+c.high,low:+c.low,close:+c.close,volume:c.volume||0
      }
    }).filter(c=>c.close>0&&isFinite(c.close)).sort((a,b)=>a.ts-b.ts);
    return rows.length>10?{
      rows:rows,meta:{
        source:"borsamcp"
      }
    }:null
  }catch(e){
    return null
  }
}
async function fetchIsyatirimDaily(t){
  if(!USE_ISY_FALLBACK)return null;
  const i=c=>`${String(c.getDate()).padStart(2,"0")}-${String(c.getMonth()+1).padStart(2,"0")}-${c.getFullYear()}`,a=new Date,e=new Date(a);
  e.setMonth(e.getMonth()-6);
  const r=`https://www.isyatirim.com.tr/_layouts/15/Isyatirim.Website/Common/Data.aspx/HisseTekil?hisse=${t}&startdate=${i(e)}&enddate=${i(a)}`,d=await fetchJSON(r,6e3);
  if(!d?.value?.length)return null;
  const n=d.value.map(c=>{
    const b=(c.HGDG_TARIH||"").split(/[-\s:]/);
    return{
      ts:b.length>=3?new Date(+b[2],+b[1]-1,+b[0]).getTime():0,date:(c.HGDG_TARIH||"").substring(0,5),close:+(+c.HGDG_KAPANIS).toFixed(2),open:+(+c.HGDG_AOF).toFixed(2),high:+(+c.HGDG_MAX).toFixed(2),low:+(+c.HGDG_MIN).toFixed(2),volume:c.HGDG_HACIM??0
    }
  }).filter(c=>c.close>0).sort((c,b)=>c.ts-b.ts);
  return n.length>10?{
    rows:n,meta:{
      source:"isyatirim"
    }
  }
  :null
}
async function fetchYahooChart(t,i="15m",a="5d"){
  const gunluk=!i.endsWith("m")&&!i.endsWith("h");
  if(gunluk){
    const mcp=await fetchBorsaMCPDaily(t);
    if(mcp)return mcp;
  }
  let e=`https://query1.finance.yahoo.com/v8/finance/chart/${t}.IS?interval=${i}&range=${a}&includePrePost=false`,r=await fetchJSON(e,5e3);
  r?.chart?.result?.[0]?.timestamp?.length||(e=`https://query1.finance.yahoo.com/v8/finance/chart/${t}.IS?interval=1d&range=3mo&includePrePost=false`,r=await fetchJSON(e,5e3));
  const d=r?.chart?.result?.[0];
  if(!d?.timestamp?.length)return await fetchIsyatirimDaily(t);
  const n=d.indicators.quote[0],c=d.meta?.gmtoffset??10800,b=i.endsWith("m")||i.endsWith("h"),y=[];
  return d.timestamp.forEach((u,E)=>{
    if(n.close[E]==null)return;
    const B=new Date((u+c)*1e3),z=b?`${String(B.getUTCDate()).padStart(2,"0")}/${String(B.getUTCMonth()+1).padStart(2,"0")} ${String(B.getUTCHours()).padStart(2,"0")}:${String(B.getUTCMinutes()).padStart(2,"0")}`:`${String(B.getUTCDate()).padStart(2,"0")}/${String(B.getUTCMonth()+1).padStart(2,"0")}`;
    y.push({
      ts:u*1e3,date:z,close:+(+n.close[E]).toFixed(2),open:+(+(n.open[E]??n.close[E])).toFixed(2),high:+(+(n.high[E]??n.close[E])).toFixed(2),low:+(+(n.low[E]??n.close[E])).toFixed(2),volume:n.volume[E]??0
    })
  }),y.length?{
    rows:y,meta:d.meta
  }
  :null
}
async function _binanceDirect(t,i=6e3){
  const a=new AbortController,e=setTimeout(()=>a.abort(),i);
  try{
    const r=await fetch(t,{
      signal:a.signal
    });
    if(clearTimeout(e),!r.ok)throw new Error("http "+r.status);
    return await r.json()
  }
  catch(r){
    throw clearTimeout(e),r
  }
}
async function fetchTopCryptos(){
  try{
    const t=await _binanceDirect("https://api.binance.com/api/v3/ticker/24hr",6e3);
    if(Array.isArray(t)&&t.length>0)return t.filter(i=>i.symbol.endsWith("USDT")&&parseFloat(i.quoteVolume)>1e6).sort((i,a)=>parseFloat(a.quoteVolume)-parseFloat(i.quoteVolume)).slice(0,50).map(i=>({
      symbol:i.symbol.replace("USDT",""),pair:i.symbol,price:parseFloat(i.lastPrice),rate:parseFloat(i.priceChangePercent),volume:parseFloat(i.quoteVolume),source:"binance"
    }))
  }
  catch{
  }
  try{
    const t=await fetchJSON("https://api.binance.com/api/v3/ticker/24hr",7e3);
    if(Array.isArray(t)&&t.length>0)return t.filter(i=>i.symbol.endsWith("USDT")&&parseFloat(i.quoteVolume)>1e6).sort((i,a)=>parseFloat(a.quoteVolume)-parseFloat(i.quoteVolume)).slice(0,50).map(i=>({
      symbol:i.symbol.replace("USDT",""),pair:i.symbol,price:parseFloat(i.lastPrice),rate:parseFloat(i.priceChangePercent),volume:parseFloat(i.quoteVolume),source:"binance-proxy"
    }))
  }
  catch{
  }
  try{
    const t=await _binanceDirect("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h",8e3);
    if(Array.isArray(t)&&t.length>0)return t.map(i=>({
      symbol:(i.symbol||"").toUpperCase(),pair:(i.symbol||"").toUpperCase()+"USDT",price:i.current_price,rate:i.price_change_percentage_24h??0,volume:i.total_volume??0,coingeckoId:i.id,source:"coingecko"
    }))
  }
  catch{
  }
  return[]
}
async function fetchCryptoKlines(t,i="15m",a=200,e=null){
  const r=`https://api.binance.com/api/v3/klines?symbol=${t}&interval=${i}&limit=${a}`,d=n=>!Array.isArray(n)||n.length===0?null:n.map(c=>{
    const b=new Date(c[0]);
    return{
      ts:c[0],date:`${String(b.getUTCDate()).padStart(2,"0")}/${String(b.getUTCMonth()+1).padStart(2,"0")} ${String(b.getUTCHours()).padStart(2,"0")}:${String(b.getUTCMinutes()).padStart(2,"0")}`,open:+parseFloat(c[1]).toFixed(4),high:+parseFloat(c[2]).toFixed(4),low:+parseFloat(c[3]).toFixed(4),close:+parseFloat(c[4]).toFixed(4),volume:parseFloat(c[5])
    }
  });
  try{
    const n=await _binanceDirect(r,6e3),c=d(n);
    if(c)return c
  }
  catch{
  }
  try{
    const n=await fetchJSON(r,7e3),c=d(n);
    if(c)return c
  }
  catch{
  }
  if(e)try{
    const n=await _binanceDirect(`https://api.coingecko.com/api/v3/coins/${e}/ohlc?vs_currency=usd&days=${i==="1d"?365:i==="1h"?7:1}`,8e3);
    if(Array.isArray(n)&&n.length>0)return n.map(c=>{
      const b=new Date(c[0]);
      return{
        ts:c[0],date:`${String(b.getUTCDate()).padStart(2,"0")}/${String(b.getUTCMonth()+1).padStart(2,"0")} ${String(b.getUTCHours()).padStart(2,"0")}:${String(b.getUTCMinutes()).padStart(2,"0")}`,open:+(+c[1]).toFixed(4),high:+(+c[2]).toFixed(4),low:+(+c[3]).toFixed(4),close:+(+c[4]).toFixed(4),volume:0
      }
    })
  }
  catch{
  }
  return null
}
const histCache={
},histTS={
},liveCache={
},liveTS={
};
(()=>{
  try{
    const t=JSON.parse(localStorage.getItem(LS_KEY)||"{}"),i=Date.now();
    Object.entries(t).forEach(([a,e])=>{
      e.hist?.length>20&&i-(e.hts??0)<12*36e5&&(histCache[a]=e.hist,histTS[a]=e.hts),e.live?.length>10&&i-(e.lts??0)<24*36e5&&(liveCache[a]=e.live,liveTS[a]=e.lts)
    })
  }
  catch{
  }
})();
function saveCache(t){
  try{
    const i=JSON.parse(localStorage.getItem(LS_KEY)||"{}");
    i[t]={
      hist:(histCache[t]||[]).slice(-260),hts:histTS[t]||0,live:(liveCache[t]||[]).slice(-200),lts:liveTS[t]||0
    };
    const a=Object.keys(i);
    if(a.length>80){
      const e=a.sort((r,d)=>Math.min(i[r].hts||0,i[r].lts||0)-Math.min(i[d].hts||0,i[d].lts||0))[0];
      delete i[e]
    }
    localStorage.setItem(LS_KEY,JSON.stringify(i))
  }
  catch{
  }
}
const calcEMA=(t,i)=>{
  const a=2/(i+1),e=[];
  let r=null,d=0,n=0;
  return t.forEach(c=>{
    if(c==null){
      e.push(null);
      return
    }
    r===null?(d+=c,n++,n===i?(r=d/i,e.push(+r.toFixed(4))):e.push(null)):(r=c*a+r*(1-a),e.push(+r.toFixed(4)))
  }),e
},calcSMA=(t,i)=>t.map((a,e)=>{
  const r=t.slice(Math.max(0,e-i+1),e+1).filter(d=>d!=null);
  return r.length===i?+(r.reduce((d,n)=>d+n,0)/i).toFixed(4):null
});
function calcRSI(t,i=14){
  const a=new Array(t.length).fill(null);
  if(t.length<i+1)return a;
  let e=0,r=0;
  for(let d=1;
  d<=i;
  d++){
    const n=t[d]-t[d-1];
    n>0?e+=n:r-=n
  }
  e/=i,r/=i,a[i]=r===0?100:+(100-100/(1+e/r)).toFixed(2);
  for(let d=i+1;
  d<t.length;
  d++){
    const n=t[d]-t[d-1];
    e=(e*(i-1)+(n>0?n:0))/i,r=(r*(i-1)+(n<0?-n:0))/i,a[d]=r===0?100:+(100-100/(1+e/r)).toFixed(2)
  }
  return a
}
function calcMACD(t){
  const i=calcEMA(t,12),a=calcEMA(t,26),e=t.map((y,u)=>i[u]!=null&&a[u]!=null?+(i[u]-a[u]).toFixed(4):null),r=calcEMA(e.map(y=>y??0),9),d=e.map((y,u)=>y!=null&&r[u]!=null?+(y-r[u]).toFixed(4):null),n=d.map((y,u)=>y!=null&&d[u-1]!=null?+(y-d[u-1]).toFixed(4):null),c=e.map((y,u)=>u>0&&e[u-1]!=null&&r[u-1]!=null&&y!=null&&r[u]!=null&&e[u-1]<=r[u-1]&&y>r[u]),b=e.map((y,u)=>u>0&&e[u-1]!=null&&r[u-1]!=null&&y!=null&&r[u]!=null&&e[u-1]>=r[u-1]&&y<r[u]);
  return{
    line:e,sig:r,hist:d,slope:n,bullX:c,bearX:b
  }
}
function calcBB(t,i=20){
  return t.map((a,e)=>{
    const r=t.slice(Math.max(0,e-i+1),e+1).filter(c=>c!=null);
    if(r.length<i)return{
      u:null,m:null,l:null
    };
    const d=r.reduce((c,b)=>c+b,0)/i,n=Math.sqrt(r.reduce((c,b)=>c+(b-d)**2,0)/i);
    return{
      u:+(d+2*n).toFixed(4),m:+d.toFixed(4),l:+(d-2*n).toFixed(4)
    }
  })
}
function calcATR(t,i=14){
  return t.map((a,e)=>e<i?null:+(t.slice(e-i+1,e+1).map((r,d,n)=>{
    if(d===0)return r.high-r.low;
    const c=n[d-1];
    return Math.max(r.high-r.low,Math.abs(r.high-c.close),Math.abs(r.low-c.close))
  }).reduce((r,d)=>r+d,0)/i).toFixed(4))
}
function calcOBV(t){
  let i=0;
  return t.map((a,e)=>{
    if(e===0)return 0;
    const r=t[e-1];
    return a.close>r.close?i+=a.volume:a.close<r.close&&(i-=a.volume),i
  })
}
function calcStochRSI(t,i=14){
  const a=calcRSI(t,i);
  return a.map((e,r)=>{
    if(e==null)return null;
    const d=a.slice(Math.max(0,r-i+1),r+1).filter(b=>b!=null);
    if(d.length<i)return null;
    const n=Math.min(...d),c=Math.max(...d);
    return c===n?50:+((e-n)/(c-n)*100).toFixed(2)
  })
}
function calcMFI(t,i=14){
  const a=new Array(t.length).fill(null);
  if(t.length<i+1)return a;
  for(let e=i;
  e<t.length;
  e++){
    let r=0,d=0;
    for(let n=e-i+1;
    n<=e;
    n++){
      const c=(t[n].high+t[n].low+t[n].close)/3,b=(t[n-1].high+t[n-1].low+t[n-1].close)/3,y=c*(t[n].volume||0);
      c>b?r+=y:c<b&&(d+=y)
    }
    a[e]=d===0?100:+(100-100/(1+r/d)).toFixed(2)
  }
  return a
}
function calcTSI(t,i=25,a=13){
  const e=t.length,r=t.map((z,O)=>O===0?0:z-t[O-1]),d=r.map(z=>Math.abs(z)),n=(z,O)=>{
    const M=new Array(z.length).fill(null),N=2/(O+1);
    let K=null;
    return z.forEach((L,W)=>{
      if(W<O){
        W===O-1&&(K=z.slice(0,O).reduce((P,V)=>P+V,0)/O,M[W]=K);
        return
      }
      K=L*N+K*(1-N),M[W]=K
    }),M
  },c=n(r,i),b=n(c.map(z=>z??0),a),y=n(d,i),u=n(y.map(z=>z??0),a),E=b.map((z,O)=>z!=null&&u[O]!=null&&u[O]!==0?+(100*z/u[O]).toFixed(2):null),B=n(E.map(z=>z??0),a);
  return{
    tsi:E,sig:B
  }
}
function calcAO(t){
  const i=t.map(d=>(d.high+d.low)/2),a=(d,n)=>d.map((c,b)=>{
    const y=d.slice(Math.max(0,b-n+1),b+1);
    return y.length===n?y.reduce((u,E)=>u+E,0)/n:null
  }),e=a(i,5),r=a(i,34);
  return e.map((d,n)=>d!=null&&r[n]!=null?+(d-r[n]).toFixed(4):null)
}
function calcVortex(t,i=14){
  const a=t.length,e=new Array(a).fill(0),r=new Array(a).fill(0),d=new Array(a).fill(0);
  for(let y=1;
  y<a;
  y++){
    const u=t[y].high,E=t[y].low,B=t[y-1].close,z=t[y-1].high,O=t[y-1].low;
    e[y]=Math.max(u-E,Math.abs(u-B),Math.abs(E-B)),r[y]=Math.abs(u-O),d[y]=Math.abs(E-z)
  }
  const n=(y,u,E)=>{
    let B=0;
    for(let z=Math.max(1,u-E+1);
    z<=u;
    z++)B+=y[z];
    return B
  },c=new Array(a).fill(null),b=new Array(a).fill(null);
  for(let y=i;
  y<a;
  y++){
    const u=n(e,y,i);
    u>0&&(c[y]=+(n(r,y,i)/u).toFixed(3),b[y]=+(n(d,y,i)/u).toFixed(3))
  }
  return{
    viP:c,viN:b
  }
}
function calcKeltner(t,i,a=20,e=1.5){
  const r=calcEMA(t,a),d=calcATR(i,a);
  return r.map((n,c)=>n!=null&&d[c]!=null?{
    u:+(n+d[c]*e).toFixed(4),m:n,l:+(n-d[c]*e).toFixed(4)
  }
  :{
    u:null,m:null,l:null
  })
}
function calcFib(t,i=60){
  if(!t||t.length<i)return null;
  const a=t.slice(-i);
  let e=-1/0,r=1/0,d=0,n=0;
  a.forEach((y,u)=>{
    y.high>e&&(e=y.high,d=u),y.low<r&&(r=y.low,n=u)
  });
  const c=d>n,b=e-r;
  return b<=0?null:c?{
    dir:"UP",l236:e-b*.236,l382:e-b*.382,l500:e-b*.5,l618:e-b*.618,l786:e-b*.786,hi:e,lo:r
  }
  :{
    dir:"DOWN",l236:r+b*.236,l382:r+b*.382,l500:r+b*.5,l618:r+b*.618,l786:r+b*.786,hi:e,lo:r
  }
}
function calcHA(t){
  const i=[];
  for(let a=0;
  a<t.length;
  a++){
    const e=t[a],r=+((e.open+e.high+e.low+e.close)/4).toFixed(4),d=a===0?e.open:+((i[a-1].haOpen+i[a-1].haClose)/2).toFixed(4),n=Math.max(e.high,d,r),c=Math.min(e.low,d,r);
    i.push({
      haOpen:d,haHigh:n,haLow:c,haClose:r
    })
  }
  return i
}
function calcORB(t){
  const i=new Array(t.length).fill(null);
  if(!t.length)return i;
  const a=t.length>1?Math.abs(t[1].ts-t[0].ts)/6e4:15,e=a<=6?6:a<=16?2:1;
  let r=null,d=-1/0,n=1/0,c=0;
  for(let b=0;
  b<t.length;
  b++){
    const y=new Date(t[b].ts||0),u=`${y.getUTCFullYear()}-${y.getUTCMonth()}-${y.getUTCDate()}`;
    u!==r&&(r=u,d=-1/0,n=1/0,c=0),c<e?(d=Math.max(d,t[b].high),n=Math.min(n,t[b].low),c++,i[b]={
      orbHi:null,orbLo:null,formed:!1
    }):i[b]={
      orbHi:+d.toFixed(4),orbLo:+n.toFixed(4),formed:!0
    }
  }
  return i
}
function calcVolAvg(t,i=20){
  return t.map((a,e)=>{
    const r=t.slice(Math.max(0,e-i+1),e+1).map(d=>d.volume);
    return r.reduce((d,n)=>d+n,0)/r.length
  })
}
function calcADX(t,i=14){
  const a=t.length,e=new Array(a).fill(0),r=new Array(a).fill(0),d=new Array(a).fill(0);
  for(let M=1;
  M<a;
  M++){
    const N=t[M].high,K=t[M].low,L=t[M-1].high,W=t[M-1].low,P=t[M-1].close;
    e[M]=Math.max(N-K,Math.abs(N-P),Math.abs(K-P));
    const V=N-L,q=W-K;
    r[M]=V>q&&V>0?V:0,d[M]=q>V&&q>0?q:0
  }
  const n=M=>{
    const N=new Array(a).fill(null);
    if(a<i+1)return N;
    let K=0;
    for(let L=1;
    L<=i;
    L++)K+=M[L];
    N[i]=K;
    for(let L=i+1;
    L<a;
    L++)N[L]=N[L-1]-N[L-1]/i+M[L];
    return N
  },c=n(e),b=n(r),y=n(d),u=c.map((M,N)=>M?+(b[N]/M*100).toFixed(2):null),E=c.map((M,N)=>M?+(y[N]/M*100).toFixed(2):null),B=u.map((M,N)=>M!=null&&E[N]!=null&&M+E[N]>0?+(Math.abs(M-E[N])/(M+E[N])*100).toFixed(2):null),z=new Array(a).fill(null);
  let O=-1;
  for(let M=0;
  M<a;
  M++)if(B[M]!=null){
    O=M;
    break
  }
  if(O>=0&&O+i<=a){
    let M=0,N=0;
    for(let K=O;
    K<O+i&&K<a;
    K++)B[K]!=null&&(M+=B[K],N++);
    if(N>0){
      z[O+i-1]=+(M/N).toFixed(2);
      for(let K=O+i;
      K<a;
      K++)B[K]!=null&&z[K-1]!=null&&(z[K]=+((z[K-1]*(i-1)+B[K])/i).toFixed(2))
    }
  }
  return{
    adx:z,pdi:u,ndi:E
  }
}
function calcSupertrend(t,i=10,a=3){
  const e=t.length,r=calcATR(t,i),d=new Array(e).fill(null),n=new Array(e).fill(null);
  for(let c=i;
  c<e;
  c++){
    const b=(t[c].high+t[c].low)/2,y=r[c];
    if(y==null)continue;
    const u=b+a*y,E=b-a*y;
    if(d[c-1]==null){
      d[c]=E,n[c]=1;
      continue
    }
    const B=d[c-1],z=n[c-1];
    let O,M;
    z===1?(O=Math.max(E,B),M=t[c].close<O?-1:1,M===-1&&(O=u)):(O=Math.min(u,B),M=t[c].close>O?1:-1,M===1&&(O=E)),d[c]=+O.toFixed(2),n[c]=M
  }
  return{
    st:d,dir:n
  }
}
function calcVWAP(t){
  const i=new Array(t.length).fill(null);
  let a=null,e=0,r=0;
  for(let d=0;
  d<t.length;
  d++){
    const n=new Date(t[d].ts||0),c=`${n.getUTCFullYear()}-${n.getUTCMonth()}-${n.getUTCDate()}`;
    c!==a&&(a=c,e=0,r=0);
    const b=(t[d].high+t[d].low+t[d].close)/3,y=t[d].volume||0;
    e+=b*y,r+=y,i[d]=r>0?+(e/r).toFixed(2):null
  }
  return i
}
function enrichData(t){
  if(!t?.length)return[];
  const i=t.filter(I=>I&&typeof I.close=="number"&&I.close>0);
  if(!i.length)return[];
  const a=i.map(I=>I.close),e=calcRSI(a),r=calcRSI(a,7),d=calcMACD(a),n=calcEMA(a,9),c=calcEMA(a,21),b=calcSMA(a,20),y=calcSMA(a,50),u=calcSMA(a,200),E=calcBB(a),B=calcATR(i),z=calcOBV(i),O=calcStochRSI(a),M=calcVolAvg(i),N=calcADX(i),K=calcSupertrend(i,10,3),L=calcSupertrend(i,7,1.5),W=calcVWAP(i),P=calcHA(i),V=calcORB(i),q=calcKeltner(a,i,20,1.5),ge=calcMFI(i,14),Y=calcTSI(a,25,13),ie=calcAO(i),$=calcVortex(i,14),Ve=Y.tsi.map((I,f)=>f>0&&I!=null&&Y.tsi[f-1]!=null&&Y.sig[f]!=null&&Y.sig[f-1]!=null&&Y.tsi[f-1]<=Y.sig[f-1]&&I>Y.sig[f]),he=Y.tsi.map((I,f)=>f>0&&I!=null&&Y.tsi[f-1]!=null&&Y.sig[f]!=null&&Y.sig[f-1]!=null&&Y.tsi[f-1]>=Y.sig[f-1]&&I<Y.sig[f]),Ke=ie.map((I,f)=>f>0&&I!=null&&ie[f-1]!=null&&ie[f-1]<=0&&I>0),we=ie.map((I,f)=>f>0&&I!=null&&ie[f-1]!=null&&ie[f-1]>=0&&I<0),Ie=$.viP.map((I,f)=>f>0&&I!=null&&$.viP[f-1]!=null&&$.viN[f]!=null&&$.viN[f-1]!=null&&$.viP[f-1]<=$.viN[f-1]&&I>$.viN[f]),H=$.viP.map((I,f)=>f>0&&I!=null&&$.viP[f-1]!=null&&$.viN[f]!=null&&$.viN[f-1]!=null&&$.viP[f-1]>=$.viN[f-1]&&I<$.viN[f]),ve=y.map((I,f)=>f>0&&I!=null&&y[f-1]!=null&&u[f]!=null&&u[f-1]!=null&&y[f-1]<=u[f-1]&&I>u[f]),Q=y.map((I,f)=>f>0&&I!=null&&y[f-1]!=null&&u[f]!=null&&u[f-1]!=null&&y[f-1]>=u[f-1]&&I<u[f]),ne=E.map((I,f)=>I.u!=null&&q[f].u!=null&&I.u<q[f].u&&I.l>q[f].l),Je=ne.map((I,f)=>f>0&&ne[f-1]===!0&&I===!1),se=calcEMA(e.map(I=>I??0),9),dt=e.map((I,f)=>I!=null&&e[f-1]!=null&&e[f-1]<30&&I>=30),tt=e.map((I,f)=>I!=null&&e[f-1]!=null&&e[f-1]>70&&I<=70),ct=e.map((I,f)=>I!=null&&e[f-1]!=null&&e[f-1]<50&&I>=50),it=e.map((I,f)=>I!=null&&e[f-1]!=null&&e[f-1]>50&&I<=50),pt=n.map((I,f)=>f>0&&I!=null&&n[f-1]!=null&&c[f]!=null&&c[f-1]!=null&&n[f-1]<=c[f-1]&&I>c[f]),mt=n.map((I,f)=>f>0&&I!=null&&n[f-1]!=null&&c[f]!=null&&c[f-1]!=null&&n[f-1]>=c[f-1]&&I<c[f]),ce=K.dir.map((I,f)=>f>0&&I===1&&K.dir[f-1]===-1),Ge=K.dir.map((I,f)=>f>0&&I===-1&&K.dir[f-1]===1);
  return i.map((I,f)=>({
    ...I,rsi:e[f],rsi7:r[f],rsiSignal:se[f],rsiExitOS:dt[f],rsiExitOB:tt[f],rsi50Up:ct[f],rsi50Dn:it[f],macdLine:d.line[f],macdSig:d.sig[f],macdHist:d.hist[f],macdSlope:d.slope[f],macdBullX:d.bullX[f],macdBearX:d.bearX[f],ema9:n[f],ema21:c[f],emaBullX:pt[f],emaBearX:mt[f],ma20:b[f],ma50:y[f],ma200:u[f],bbU:E[f].u,bbM:E[f].m,bbL:E[f].l,atr:B[f],obv:z[f],stochRsi:O[f],volAvg:M[f],adx:N.adx[f],pdi:N.pdi[f],ndi:N.ndi[f],supertrend:K.st[f],stDir:K.dir[f],stFlipUp:ce[f],stFlipDn:Ge[f],stFastDir:L.dir[f],stConsensus:K.dir[f]!=null&&L.dir[f]!=null&&K.dir[f]===L.dir[f],vwap:W[f],haOpen:P[f]?.haOpen,haHigh:P[f]?.haHigh,haLow:P[f]?.haLow,haClose:P[f]?.haClose,orbHi:V[f]?.orbHi,orbLo:V[f]?.orbLo,orbFormed:V[f]?.formed,kelU:q[f].u,kelL:q[f].l,goldenCross:ve[f],deathCross:Q[f],squeezeOn:ne[f],squeezeOff:Je[f],mfi:ge[f],tsi:Y.tsi[f],tsiSig:Y.sig[f],ao:ie[f],viP:$.viP[f],viN:$.viN[f],tsiBullX:Ve[f],tsiBearX:he[f],aoZeroUp:Ke[f],aoZeroDn:we[f],vtxBullX:Ie[f],vtxBearX:H[f]
  }))
}
function classifyDoji(t){
  if(!t)return null;
  const i=t.high-t.low;
  if(i===0)return null;
  const a=Math.abs(t.close-t.open),e=t.high-Math.max(t.close,t.open),r=Math.min(t.close,t.open)-t.low;
  return a/i>=.1?null:r>i*.6&&e<i*.15?"DRAGONFLY":e>i*.6&&r<i*.15?"GRAVESTONE":e>i*.3&&r>i*.3?"LONG_LEGGED":"STANDARD"
}
function weeklyDoji(t){
  if(!t||t.length<5)return null;
  const i=t.slice(-5),a={
    open:i[0].open,close:i[i.length-1].close,high:Math.max(...i.map(e=>e.high)),low:Math.min(...i.map(e=>e.low))
  };
  return classifyDoji(a)
}
function getHigherTrend(t){
  if(!t||t.length<50)return null;
  const i=t.map(c=>c.close),a=calcSMA(i,50),e=calcSMA(i,20),r=i[i.length-1],d=a[a.length-1],n=e[e.length-1];
  return d==null?null:r>d&&(n==null||n>d)?"YUKARI":r<d&&(n==null||n<d)?"ASAGI":"YAN"
}
function getSignals(t,i=null,a=null){
  if(t.length<20)return null;
  const e=t[t.length-1],r=t[t.length-2],d=t[t.length-3];
  if(!e||!r)return null;
  const n=(g,F,G,U)=>({
    dir:g,strength:Math.min(100,Math.max(0,Math.round(F))),value:G,label:U
  }),c=e.ma200!=null&&e.close>e.ma200,b=i==="YUKARI"?"YUKARI":i==="ASAGI"?"ASAGI":e.ma200==null?"N\xD6TR":c?"YUKARI":"ASAGI",y=e.ma200==null?"?":c?"YUKARI":"ASAGI",u=e.atr??0,E=e.adx??0,B=E>25,z=E<18,O=t.slice(-10).map(g=>g.close),M=O.filter((g,F)=>F>0&&g>O[F-1]).length,N=t.slice(-20).map(g=>g.close),K=N.filter((g,F)=>F>0&&g>N[F-1]).length,L=Math.round(K/19*100),W=L>60?"YUKARI":L<40?"ASAGI":"YAN",P=M>=7?"YUKARI":M<=3?"ASAGI":"YAN",V=(()=>{
    const g=e.rsi;
    if(g==null)return null;
    const F=r?.rsi;
    if(e.rsiExitOS)return n("AL",98,g.toFixed(1),"A\u015F\u0131r\u0131 Sat\u0131mdan \xC7\u0131k\u0131\u015F \u2726\u2726");
    if(e.rsiExitOB)return n("SAT",98,g.toFixed(1),"A\u015F\u0131r\u0131 Al\u0131mdan \xC7\u0131k\u0131\u015F \u2726\u2726");
    if(d){
      const G=e.close<d.close&&r.close<d.close,U=g>(d.rsi??g),Te=e.close>d.close&&r.close>d.close,De=g<(d.rsi??g);
      if(G&&U&&g<50)return n("AL",88,g.toFixed(1),"Bo\u011Fa Diverjans\u0131 \u{1F4D0}");
      if(Te&&De&&g>50)return n("SAT",88,g.toFixed(1),"Ay\u0131 Diverjans\u0131 \u{1F4D0}")
    }
    return e.rsi50Up?n("AL",b==="YUKARI"?80:65,g.toFixed(1),b==="YUKARI"?"50 Ge\xE7i\u015Fi (Trend Y\xF6n\xFCnde) \u2191":"50 \xDCst\xFCne Ge\xE7ti \u2191"):e.rsi50Dn?n("SAT",b==="ASAGI"?80:65,g.toFixed(1),b==="ASAGI"?"50 Ge\xE7i\u015Fi (Trend Y\xF6n\xFCnde) \u2193":"50 Alt\u0131na Ge\xE7ti \u2193"):b==="YUKARI"&&g>=40&&g<=60&&F!=null&&g>F?n("AL",72,g.toFixed(1),"Trend \u0130\xE7i Geri \xC7ekilme AL \u2197"):b==="ASAGI"&&g>=40&&g<=60&&F!=null&&g<F?n("SAT",72,g.toFixed(1),"Trend \u0130\xE7i Ralide SAT \u2198"):g<20?n("AL",95,g.toFixed(1),"Ekstrem A\u015F\u0131r\u0131 Sat\u0131m \u{1F525}"):g<30?n("AL",80,g.toFixed(1),"A\u015F\u0131r\u0131 Sat\u0131m \u{1F525}"):g>80?n("SAT",95,g.toFixed(1),"Ekstrem A\u015F\u0131r\u0131 Al\u0131m \u26A0\uFE0F"):g>70?n("SAT",80,g.toFixed(1),"A\u015F\u0131r\u0131 Al\u0131m \u26A0\uFE0F"):F!=null&&g>F&&g>50?n("AL",Math.round((g-50)/20*30),g.toFixed(1),"RSI Y\xFCkseliyor \u2197"):F!=null&&g<F&&g<50?n("SAT",Math.round((50-g)/20*30),g.toFixed(1),"RSI D\xFC\u015F\xFCyor \u2198"):g>50?n("AL",Math.round((g-50)/20*20),g.toFixed(1),"Y\xFCkseli\u015F B\xF6lgesi"):n("SAT",Math.round((50-g)/20*20),g.toFixed(1),"D\xFC\u015F\xFC\u015F B\xF6lgesi")
  })(),q=(()=>{
    if(e.macdLine==null)return null;
    const g=r?.macdHist,F=d?.macdHist;
    if(e.macdBullX){
      const Ue=e.macdLine<0?95:82,Le=e.macdLine<0?"Bo\u011Fa Kesi\u015Fimi (S\u0131f\u0131r Alt\u0131) \u2726\u2726":"Bo\u011Fa Kesi\u015Fimi \u2726";
      return n("AL",Ue,e.macdLine.toFixed(3),Le)
    }
    if(e.macdBearX){
      const Ue=e.macdLine>0?95:82,Le=e.macdLine>0?"Ay\u0131 Kesi\u015Fimi (S\u0131f\u0131r \xDCst\xFC) \u2726\u2726":"Ay\u0131 Kesi\u015Fimi \u2726";
      return n("SAT",Ue,e.macdLine.toFixed(3),Le)
    }
    const G=g!=null&&F!=null&&e.macdHist!=null&&e.macdHist<0&&e.macdHist>g&&g>(F??g),U=g!=null&&F!=null&&e.macdHist!=null&&e.macdHist>0&&e.macdHist<g&&g<(F??g);
    if(G)return n("AL",75,e.macdLine.toFixed(3),"Histogram \u0130vmeleniyor \u2197\u2197");
    if(U)return n("SAT",75,e.macdLine.toFixed(3),"Histogram K\u0131r\u0131l\u0131yor \u2198\u2198");
    const Te=g!=null&&e.macdHist!=null&&e.macdHist<0&&e.macdHist>g,De=g!=null&&e.macdHist!=null&&e.macdHist>0&&e.macdHist<g;
    if(Te)return n("AL",62,e.macdLine.toFixed(3),"Histogram D\xF6n\xFCyor \u2197");
    if(De)return n("SAT",62,e.macdLine.toFixed(3),"Histogram Zay\u0131fl\u0131yor \u2198");
    const Ne=e.macdLine>e.macdSig,le=e.macdLine>0;
    return Ne&&le?n("AL",50,e.macdLine.toFixed(3),"G\xFC\xE7l\xFC B\xF6lge (+/+)"):Ne&&!le?n("AL",36,e.macdLine.toFixed(3),"Toparlan\u0131yor (-/+)"):!Ne&&!le?n("SAT",50,e.macdLine.toFixed(3),"Zay\u0131f B\xF6lge (-/-)"):n("SAT",36,e.macdLine.toFixed(3),"Zay\u0131fl\u0131yor (+/-)")
  })(),ge=(()=>{
    if(e.ma20==null)return null;
    const g=e.close>e.ma20,F=e.ma50!=null&&e.ma20>e.ma50,G=e.ma200!=null&&e.close>e.ma200;
    if(r?.ma200!=null&&e.ma200!=null){
      if(r.close<=r.ma200&&e.close>e.ma200)return n("AL",92,e.ma20.toFixed(2),"MA200 K\u0131r\u0131ld\u0131 \u2014 Trend D\xF6n\xFC\u015F\xFC \u2726\u2726");
      if(r.close>=r.ma200&&e.close<e.ma200)return n("SAT",92,e.ma20.toFixed(2),"MA200 K\u0131r\u0131ld\u0131 A\u015Fa\u011F\u0131 \u2726\u2726")
    }
    if(G&&F&&g)return n("AL",88,e.ma20.toFixed(2),"Bo\u011Fa D\xFCzeni: Fiyat>MA20>MA50>MA200");
    if(!G&&!F&&!g)return n("SAT",85,e.ma20.toFixed(2),"Ay\u0131 D\xFCzeni: Fiyat<MA20<MA50<MA200");
    const U=e.close>e.ma20&&r.close<=r.ma20,Te=e.close<e.ma20&&r.close>=r.ma20;
    return U?n("AL",78,e.ma20.toFixed(2),"MA20 Deste\u011Fi Tuttu \u2191"):Te?n("SAT",78,e.ma20.toFixed(2),"MA20 Direnci K\u0131ramad\u0131 \u2193"):g&&F?n("AL",70,e.ma20.toFixed(2),"Y\xFCkseli\u015F Trendi"):!g&&!F?n("SAT",70,e.ma20.toFixed(2),"D\xFC\u015F\xFC\u015F Trendi \u2B07"):g?n("AL",40,e.ma20.toFixed(2),"MA20 \xDCst\xFCnde"):n("SAT",38,e.ma20.toFixed(2),"MA20 Alt\u0131nda")
  })(),Y=(()=>{
    if(e.bbU==null)return null;
    const g=e.bbU-e.bbL;
    if(g===0)return null;
    const F=(e.close-e.bbL)/g,G=r?.bbU!=null?r.bbU-r.bbL:null,U=G!=null&&g>G*1.08;
    return G!=null&&g<G*.95&&g/e.close<.03?n("N\xD6TR",30,F.toFixed(2),"Bant S\u0131k\u0131\u015Fmas\u0131 \u2014 B\xFCy\xFCk Hareket Yak\u0131n \u26A1"):F<.04?n("AL",94,F.toFixed(2),"Alt Band\u0131n Alt\u0131nda \u{1F525}\u{1F525}"):F<.1?n("AL",85,F.toFixed(2),"Alt Banda De\u011Fdi \u{1F525}"):F>.96?n("SAT",94,F.toFixed(2),"\xDCst Band\u0131n \xDCst\xFCnde \u26A0\uFE0F\u26A0\uFE0F"):F>.9?n("SAT",85,F.toFixed(2),"\xDCst Banda De\u011Fdi \u26A0\uFE0F"):U&&F>.6?n("AL",55,F.toFixed(2),"\xDCst Yar\u0131 + Bant Geni\u015Fliyor"):U&&F<.4?n("SAT",55,F.toFixed(2),"Alt Yar\u0131 + Bant Geni\u015Fliyor"):F<.3?n("AL",28,F.toFixed(2),"Alt B\xF6lge"):F>.7?n("SAT",28,F.toFixed(2),"\xDCst B\xF6lge"):n("N\xD6TR",0,F.toFixed(2),"Orta B\xF6lge")
  })(),ie=(()=>{
    const g=e.stochRsi;
    if(g==null)return null;
    const F=r?.stochRsi,G=d?.stochRsi;
    return G!=null&&F!=null&&G<20&&F<20&&g>F?n("AL",90,g.toFixed(1),"Stoch G\xFC\xE7l\xFC D\xF6n\xFC\u015F \u2197\u2197"):G!=null&&F!=null&&G>80&&F>80&&g<F?n("SAT",90,g.toFixed(1),"Stoch G\xFC\xE7l\xFC D\xF6n\xFC\u015F \u2198\u2198"):F!=null&&F<20&&g>F?n("AL",80,g.toFixed(1),"Stoch D\xF6n\xFC\u015F\xFC \u2197"):F!=null&&F>80&&g<F?n("SAT",80,g.toFixed(1),"Stoch D\xF6n\xFC\u015F\xFC \u2198"):g<20?n("AL",72,g.toFixed(1),"Stoch A\u015F\u0131r\u0131 Sat\u0131m"):g>80?n("SAT",72,g.toFixed(1),"Stoch A\u015F\u0131r\u0131 Al\u0131m"):g<35&&F!=null&&g>F&&b==="YUKARI"?n("AL",48,g.toFixed(1),"Stoch Trend Geri \xC7ekilmeden D\xF6n\xFCyor"):g>65&&F!=null&&g<F&&b==="ASAGI"?n("SAT",48,g.toFixed(1),"Stoch Trend Ralisinden D\xF6n\xFCyor"):n("N\xD6TR",0,g.toFixed(1),"N\xF6tr")
  })(),$=(()=>{
    if(!e.volAvg||e.volume===0)return null;
    const g=e.volume/e.volAvg,F=r?.obv!=null&&e.obv!=null&&e.obv>r.obv,G=r?.obv!=null&&e.obv!=null&&e.obv<r.obv,U=e.close>r.close;
    return g>3&&U?n("AL",95,g.toFixed(1)+"x","Dev Hacim Y\xFCkseli\u015F \u{1F680}\u{1F680}"):g>3&&!U?n("SAT",95,g.toFixed(1)+"x","Dev Hacim D\xFC\u015F\xFC\u015F \u{1F4A5}\u{1F4A5}"):g>2&&U?n("AL",82,g.toFixed(1)+"x","G\xFC\xE7l\xFC Al\u0131\u015F Hacmi \u{1F680}"):g>2&&!U?n("SAT",82,g.toFixed(1)+"x","G\xFC\xE7l\xFC Sat\u0131\u015F Hacmi \u{1F4A5}"):g>1.5&&U&&F?n("AL",68,g.toFixed(1)+"x","Hacim + OBV Al\u0131\u015F \u2713"):g>1.5&&!U&&G?n("SAT",68,g.toFixed(1)+"x","Hacim + OBV Sat\u0131\u015F \u2713"):g>1.5&&U?n("AL",52,g.toFixed(1)+"x","Hacim Onayl\u0131 Al\u0131\u015F"):g>1.5&&!U?n("SAT",52,g.toFixed(1)+"x","Hacim Onayl\u0131 Sat\u0131\u015F"):F?n("AL",25,g.toFixed(1)+"x","OBV Y\xFCkseliyor"):G?n("SAT",25,g.toFixed(1)+"x","OBV D\xFC\u015F\xFCyor"):n("N\xD6TR",0,g.toFixed(1)+"x","Normal Hacim")
  })(),Ve=(()=>{
    if(e.adx==null)return null;
    const g=e.pdi,F=e.ndi;
    return E>25&&g>F?n("AL",78,E.toFixed(1),`G\xFC\xE7l\xFC Y\xFCkseli\u015F (+DI ${g.toFixed(0)})`):E>25&&g<F?n("SAT",78,E.toFixed(1),`G\xFC\xE7l\xFC D\xFC\u015F\xFC\u015F (-DI ${F.toFixed(0)})`):E>18&&g>F?n("AL",50,E.toFixed(1),"Y\xFCkseli\u015F trendi"):E>18&&g<F?n("SAT",50,E.toFixed(1),"D\xFC\u015F\xFC\u015F trendi"):n("N\xD6TR",20,E.toFixed(1),"Yatay piyasa")
  })(),he=(()=>{
    if(e.supertrend==null||e.stDir==null)return null;
    const g=e.stConsensus;
    return e.stFlipUp&&g?n("AL",95,e.supertrend.toFixed(2),"\xC7ift Supertrend Yukar\u0131 D\xF6nd\xFC \u2726\u2726"):e.stFlipDn&&g?n("SAT",95,e.supertrend.toFixed(2),"\xC7ift Supertrend A\u015Fa\u011F\u0131 D\xF6nd\xFC \u2726\u2726"):e.stFlipUp?n("AL",82,e.supertrend.toFixed(2),"Supertrend Yukar\u0131 D\xF6nd\xFC \u2726"):e.stFlipDn?n("SAT",82,e.supertrend.toFixed(2),"Supertrend A\u015Fa\u011F\u0131 D\xF6nd\xFC \u2726"):e.stDir===1&&g?n("AL",72,e.supertrend.toFixed(2),"\xC7ift Supertrend Yukar\u0131 (onayl\u0131)"):e.stDir===-1&&g?n("SAT",72,e.supertrend.toFixed(2),"\xC7ift Supertrend A\u015Fa\u011F\u0131 (onayl\u0131)"):e.stDir===1?n("AL",50,e.supertrend.toFixed(2),"Supertrend Yukar\u0131 (zay\u0131f \u2014 h\u0131zl\u0131 ST farkl\u0131)"):n("SAT",50,e.supertrend.toFixed(2),"Supertrend A\u015Fa\u011F\u0131 (zay\u0131f \u2014 h\u0131zl\u0131 ST farkl\u0131)")
  })(),Ke=r.close<r.open&&e.close>e.open&&e.close>r.open&&e.open<r.close,we=r.close>r.open&&e.close<e.open&&e.close<r.open&&e.open>r.close,Ie=Math.abs(e.close-e.open),H=e.high-e.low,ve=e.high-Math.max(e.close,e.open),Q=Math.min(e.close,e.open)-e.low,ne=H>0&&Q>Ie*2&&ve<Ie*.5,Je=H>0&&ve>Ie*2&&Q<Ie*.5,se=t.slice(-5),dt=se.length===5&&se[4].high>se[3].high&&se[3].high>se[2].high,tt=se.length===5&&se[4].low<se[3].low&&se[3].low<se[2].low,ct=t.length>=3&&t[t.length-1].close>t[t.length-1].open&&t[t.length-2].close>t[t.length-2].open&&t[t.length-3].close>t[t.length-3].open&&e.volAvg&&e.volume>e.volAvg*1.4,it=t.length>=3&&t[t.length-1].close<t[t.length-1].open&&t[t.length-2].close<t[t.length-2].open&&t[t.length-3].close<t[t.length-3].open&&e.volAvg&&e.volume>e.volAvg*1.4,pt=e.rsi!=null&&r?.rsi!=null&&r.rsi<35&&e.rsi>r.rsi+3&&e.emaBullX,mt=e.rsi!=null&&r?.rsi!=null&&r.rsi>70&&e.rsi<r.rsi-3&&e.emaBearX,ce=classifyDoji(e),Ge=a&&a.length?classifyDoji(a[a.length-1]):null,I=a&&a.length>=2?classifyDoji(a[a.length-2]):null,f=weeklyDoji(a),_=t[t.length-3],pe=t[t.length-2],Z=e,gt=_&&pe&&Math.abs(pe.close-pe.open)<Math.max(.001,(_.high-_.low)*.35),nt=gt&&_.close<_.open&&Z.close>Z.open&&Z.close>(_.open+_.close)/2,at=gt&&_.close>_.open&&Z.close<Z.open&&Z.close<(_.open+_.close)/2,xt=_&&pe&&Z.close>Z.open&&pe.close>pe.open&&_.close>_.open&&Z.close>pe.close&&pe.close>_.close,Ft=_&&pe&&Z.close<Z.open&&pe.close<pe.open&&_.close<_.open&&Z.close<pe.close&&pe.close<_.close,Ye=calcFib(a||t,60),je=(()=>{
    if(!Ye)return null;
    const g=e.close*.012,F=(G,U)=>Math.abs(G-U)<g;
    if(Ye.dir==="UP"&&b!=="ASAGI"){
      if(F(e.close,Ye.l618))return{
        lvl:"%61.8",action:"AL",strong:!0
      };
      if(F(e.close,Ye.l500))return{
        lvl:"%50",action:"AL",strong:!0
      };
      if(F(e.close,Ye.l382))return{
        lvl:"%38.2",action:"AL",strong:!1
      }
    }
    return null
  })(),kt=(()=>{
    if(e.goldenCross)return n("AL",98,"GOLDEN \u2726","Golden Cross \u2014 MA50 yukar\u0131 kesti MA200 \u2726\u2726\u2726 (uzun vade bo\u011Fa)");
    if(e.deathCross)return n("SAT",98,"DEATH \u2726","Death Cross \u2014 MA50 a\u015Fa\u011F\u0131 kesti MA200 \u2726\u2726\u2726 (uzun vade ay\u0131)");
    const g=e.orbFormed&&r?.orbHi!=null&&r.close<=r.orbHi&&e.close>e.orbHi&&e.volAvg&&e.volume>e.volAvg*1.2,F=e.orbFormed&&r?.orbLo!=null&&r.close>=r.orbLo&&e.close<e.orbLo&&e.volAvg&&e.volume>e.volAvg*1.2;
    if(g)return n("AL",91,"ORB \u2191","A\xE7\u0131l\u0131\u015F aral\u0131\u011F\u0131 yukar\u0131 k\u0131r\u0131ld\u0131 \u2014 g\xFCn-i\xE7i momentum (hacim onayl\u0131) \u2726");
    if(F)return n("SAT",91,"ORB \u2193","A\xE7\u0131l\u0131\u015F aral\u0131\u011F\u0131 a\u015Fa\u011F\u0131 k\u0131r\u0131ld\u0131 \u2014 g\xFCn-i\xE7i d\xFC\u015F\xFC\u015F (hacim onayl\u0131) \u2726");
    if(nt)return n("AL",93,"MORNING \u2605","Sabah Y\u0131ld\u0131z\u0131 \u2014 3-bar dip d\xF6n\xFC\u015F paterni (klasik en g\xFCvenilir)");
    if(at)return n("SAT",93,"EVENING \u2605","Ak\u015Fam Y\u0131ld\u0131z\u0131 \u2014 3-bar tepe d\xF6n\xFC\u015F paterni");
    if(xt&&b!=="ASAGI")return n("AL",90,"3 ASKER","\xDC\xE7 Beyaz Asker \u2014 g\xFC\xE7l\xFC trend onay\u0131 (3 ard\u0131\u015F\u0131k ye\u015Fil)");
    if(Ft&&b!=="YUKARI")return n("SAT",90,"3 KARGA","\xDC\xE7 Kara Karga \u2014 g\xFC\xE7l\xFC d\xFC\u015F\xFC\u015F onay\u0131 (3 ard\u0131\u015F\u0131k k\u0131rm\u0131z\u0131)");
    if(e.squeezeOff&&e.macdHist!=null&&e.macdHist>0)return n("AL",90,"SQUEEZE\u2191","Volatilite S\u0131k\u0131\u015Fmas\u0131 K\u0131r\u0131ld\u0131 (yukar\u0131) \u2014 patlama ba\u015Flang\u0131c\u0131");
    if(e.squeezeOff&&e.macdHist!=null&&e.macdHist<0)return n("SAT",90,"SQUEEZE\u2193","Volatilite S\u0131k\u0131\u015Fmas\u0131 K\u0131r\u0131ld\u0131 (a\u015Fa\u011F\u0131) \u2014 d\xFC\u015F\xFC\u015F ba\u015Flang\u0131c\u0131");
    if(e.squeezeOn)return n("N\xD6TR",30,"SQUEEZE","Bant s\u0131k\u0131\u015Fm\u0131\u015F \u2014 patlama yak\u0131n, y\xF6n belirsiz \u26A1");
    if(je&&je.action==="AL")return n("AL",je.strong?88:75,"FIB "+je.lvl,`Fibonacci ${je.lvl} deste\u011Fi \u2014 geri \xE7ekilme tamamland\u0131`);
    if(Ge==="DRAGONFLY"&&b==="ASAGI")return n("AL",98,"DAILY \u{1F409}","G\xFCnl\xFCk Dragonfly Doji \u2014 Dipte G\xFC\xE7l\xFC D\xF6n\xFC\u015F \u2726\u2726\u2726");
    if(Ge==="GRAVESTONE"&&b==="YUKARI")return n("SAT",98,"DAILY \u26B0\uFE0F","G\xFCnl\xFCk Gravestone Doji \u2014 Tepede G\xFC\xE7l\xFC D\xF6n\xFC\u015F \u2726\u2726\u2726");
    if(f==="DRAGONFLY"&&b==="ASAGI")return n("AL",95,"WEEKLY \u{1F409}","Haftal\u0131k Dragonfly \u2014 B\xFCy\xFCk Dip D\xF6n\xFC\u015F\xFC \u2726\u2726");
    if(f==="GRAVESTONE"&&b==="YUKARI")return n("SAT",95,"WEEKLY \u26B0\uFE0F","Haftal\u0131k Gravestone \u2014 B\xFCy\xFCk Tepe D\xF6n\xFC\u015F\xFC \u2726\u2726");
    if(Ge&&b==="ASAGI"&&e.rsi!=null&&e.rsi<35)return n("AL",88,"DOJI+RSI","G\xFCnl\xFCk Doji + RSI<35 \u2014 D\xF6n\xFC\u015F \u{1F3AF}");
    if(Ge&&b==="YUKARI"&&e.rsi!=null&&e.rsi>65)return n("SAT",88,"DOJI+RSI","G\xFCnl\xFCk Doji + RSI>65 \u2014 D\xF6n\xFC\u015F \u{1F3AF}");
    if(I&&b==="ASAGI"&&e.close>a[a.length-1].close*1.005)return n("AL",86,"POST-DOJI","G\xFCnl\xFCk Doji Sonras\u0131 Ye\u015Fil Mum \u2014 Onay \u2713");
    if(pt)return n("AL",96,"DIP FLIP","D\u0130PTEN D\xD6N\xDC\u015E + EMA9\u2191 + Hacim \u2726\u2726\u2726");
    if(mt)return n("SAT",96,"TOP REV","TEPEDEN D\xD6N\xDC\u015E + EMA9\u2193 + Hacim \u2726\u2726\u2726");
    if(ce==="DRAGONFLY"&&e.rsi!=null&&e.rsi<35)return n("AL",82,"INTRA \u{1F409}","Intraday Dragonfly + RSI Dip");
    if(ce==="GRAVESTONE"&&e.rsi!=null&&e.rsi>65)return n("SAT",82,"INTRA \u26B0\uFE0F","Intraday Gravestone + RSI Tepe");
    if(ct&&b==="YUKARI")return n("AL",92,"BURST\u2191","3 Ye\u015Fil Mum + Hacim Patlamas\u0131 \u{1F680}\u{1F680}");
    if(it&&b==="ASAGI")return n("SAT",92,"BURST\u2193","3 K\u0131rm\u0131z\u0131 Mum + Hacim \u{1F4A5}\u{1F4A5}");
    if(e.emaBullX)return n("AL",86,"EMA9>21","EMA9 \u2191 Ge\xE7ti \u2014 Momentum D\xF6n\xFC\u015F\xFC \u2726");
    if(e.emaBearX)return n("SAT",86,"EMA9<21","EMA9 \u2193 Ge\xE7ti \u2014 Momentum Bozuldu \u2726");
    if(Ke&&e.rsi!=null&&e.rsi<60)return n("AL",82,"BULL ENG","Yutan Bo\u011Fa Mumu \u{1F7E2}");
    if(we&&e.rsi!=null&&e.rsi>40)return n("SAT",82,"BEAR ENG","Yutan Ay\u0131 Mumu \u{1F534}");
    if(ne&&(b==="ASAGI"||e.bbL&&e.close<e.bbL*1.05))return n("AL",80,"HAMMER","\xC7eki\xE7 \u2014 Dip Reddi \u{1F528}");
    if(Je&&(b==="YUKARI"||e.bbU&&e.close>e.bbU*.95))return n("SAT",80,"STAR","Y\u0131ld\u0131z \u2014 Tepe Reddi \u2B50");
    if(dt)return n("AL",60,"HH","Higher High Yap\u0131s\u0131 \u2197");
    if(tt)return n("SAT",60,"LL","Lower Low Yap\u0131s\u0131 \u2198");
    if(e.ema9!=null&&e.ema21!=null){
      const G=e.ema9>e.ema21;
      if(G&&e.close>e.ema9)return n("AL",45,"EMA\u2191","EMA9>21 + Fiyat \xFCstte");
      if(!G&&e.close<e.ema9)return n("SAT",45,"EMA\u2193","EMA9<21 + Fiyat altta")
    }
    return n("N\xD6TR",0,"\u2014","Belirgin pattern yok")
  })(),ht=(()=>{
    const g=[],F=[];
    e.mfi!=null&&(e.mfi<20?(g.push("AL"),F.push("MFI<20 a\u015F\u0131r\u0131 sat\u0131m")):e.mfi>80?(g.push("SAT"),F.push("MFI>80 a\u015F\u0131r\u0131 al\u0131m")):r?.mfi!=null&&(e.mfi>r.mfi&&e.mfi>50?g.push("AL"):e.mfi<r.mfi&&e.mfi<50&&g.push("SAT"))),e.tsiBullX?(g.push("AL"),F.push("TSI \u2191 kesi\u015Fim")):e.tsiBearX?(g.push("SAT"),F.push("TSI \u2193 kesi\u015Fim")):e.tsi!=null&&e.tsiSig!=null&&(e.tsi>e.tsiSig&&e.tsi>0?g.push("AL"):e.tsi<e.tsiSig&&e.tsi<0&&g.push("SAT")),e.aoZeroUp?(g.push("AL"),F.push("AO s\u0131f\u0131r \xFCst\xFCne \u2726")):e.aoZeroDn?(g.push("SAT"),F.push("AO s\u0131f\u0131r alt\u0131na \u2726")):e.ao!=null&&r?.ao!=null&&(e.ao>r.ao&&e.ao>0?g.push("AL"):e.ao<r.ao&&e.ao<0&&g.push("SAT")),e.vtxBullX?(g.push("AL"),F.push("Vortex VI+ \u2726 (trend d\xF6n\xFC\u015F erken)")):e.vtxBearX?(g.push("SAT"),F.push("Vortex VI-")):e.viP!=null&&e.viN!=null&&(e.viP>e.viN?g.push("AL"):e.viP<e.viN&&g.push("SAT"));
    const G=g.filter(Ue=>Ue==="AL").length,U=g.filter(Ue=>Ue==="SAT").length,Te=G+U;
    if(Te===0)return n("N\xD6TR",0,"\u2014","Momentum yok");
    const De=G>U?"AL":"SAT",Ne=F.length?F.slice(0,2).join(" \xB7 "):`${G}AL/${U}SAT`,le=Math.max(G,U)/Te;
    return le===1&&Te>=3?n(De,92,`${G}-${U}`,"Tam Momentum Konsens\xFCs\xFC \u2726\u2726 \xB7 "+Ne):le>=.75?n(De,75,`${G}-${U}`,"G\xFC\xE7l\xFC momentum \xB7 "+Ne):le>=.6?n(De,55,`${G}-${U}`,Ne):n("N\xD6TR",20,`${G}-${U}`,"Momentum b\xF6l\xFCnm\xFC\u015F")
  })(),ft=b==="YUKARI"?{
    MA:.14,MACD:.12,RSI:.12,BB:.06,SRSI:.06,VOL:.07,ADX:.09,STR:.11,PA:.11,MOM:.12
  }
  :b==="ASAGI"?{
    MA:.14,MACD:.1,RSI:.14,BB:.07,SRSI:.06,VOL:.05,ADX:.09,STR:.11,PA:.12,MOM:.12
  }
  :{
    MA:.12,MACD:.12,RSI:.14,BB:.07,SRSI:.06,VOL:.07,ADX:.09,STR:.1,PA:.11,MOM:.12
  },Me={
    MA:ge,MACD:q,RSI:V,BB:Y,SRSI:ie,VOL:$,ADX:Ve,STR:he,PA:kt,MOM:ht
  };
  let $e=0,Pe=0;
  Object.entries(Me).forEach(([g,F])=>{
    F&&(F.dir==="AL"&&($e+=F.strength*(ft[g]??.1)),F.dir==="SAT"&&(Pe+=F.strength*(ft[g]??.1)))
  }),P==="YUKARI"&&Pe>$e&&(Pe*=.72),P==="ASAGI"&&$e>Pe&&($e*=.72),z&&($e*=.78,Pe*=.78);
  let be=null;
  if(b==="ASAGI"){
    const g={
      rsiDip:e.rsi!=null&&e.rsi<32&&r?.rsi!=null&&e.rsi>r.rsi,macdTurning:e.macdHist!=null&&r?.macdHist!=null&&e.macdHist<0&&e.macdHist>r.macdHist,bbBottom:e.bbL!=null&&e.close<=e.bbL*1.015,highVolume:e.volAvg!=null&&e.volume>e.volAvg*2,stochDip:e.stochRsi!=null&&e.stochRsi<20,obvTurning:r?.obv!=null&&d?.obv!=null&&r.obv<d.obv&&(e.obv??0)>r.obv,stFlip:e.stFlipUp===!0
    },F=Object.values(g).filter(Boolean).length;
    F>=4&&(be={
      score:F,checks:g,label:F>=6?"\u{1F48E} M\xDCKEMMEL D\u0130P":F>=5?"\u{1F48E} G\xDC\xC7L\xDC D\u0130P D\xD6N\xDC\u015E\xDC":"\u26A1 D\u0130P D\xD6N\xDC\u015E ADAYI",color:F>=5?"#fb923c":"#fbbf24"
    })
  }
  const me=$e-Pe;
  let w,J,X;
  const Ce=[];
  if(b==="YUKARI"?(me>14?(w="AL",J=Math.round(Math.min(95,48+me*1.3))):me<-16?(w="SAT",J=Math.round(Math.min(95,48+Math.abs(me)*1.3))):(w="N\xD6TR",J=Math.round(Math.abs(me)*2),Math.abs(me)<14&&Ce.push("\u0130ndikat\xF6rler karars\u0131z (net puan d\xFC\u015F\xFCk)"),z&&Ce.push(`ADX ${E.toFixed(0)} (<18, yatay piyasa)`)),w==="AL"&&B&&y==="YUKARI"?X="\u{1F4C8} G\xFC\xE7l\xFC y\xFCkseli\u015F \u2014 devam ediyor":w==="AL"&&y==="ASAGI"?X="\u{1F4C8} Y\xFCkseli\u015F i\xE7i geri \xE7ekilme \u2014 al\u0131m f\u0131rsat\u0131":w==="AL"?X="\u2197 Y\xFCkseli\u015F trendi \u2014 momentum toplan\u0131yor":w==="SAT"?X="\u{1F4C8} Trend yukar\u0131 ama k\u0131sa vadeli d\xFCzeltme geliyor":B?X="\u{1F4C8} Y\xFCkseli\u015F trendi \u2014 net giri\u015F i\xE7in bekle":X="\u2197 Hafif y\xFCkseli\u015F \u2014 net sinyal yok"):be?(w="AL",J=Math.round(40+be.score*9),X=be.score>=6?"\u{1F3AF} M\xFCkemmel dip \u2014 d\xF6n\xFC\u015F \u015Fartlar\u0131 tam":be.score>=5?"\u{1F3AF} G\xFC\xE7l\xFC dip d\xF6n\xFC\u015F\xFC \u2014 s\u0131k\u0131 stop ile gir":"\u{1F3AF} Dip d\xF6n\xFC\u015F aday\u0131 \u2014 k\xFC\xE7\xFCk pozisyon test et"):(me>22?(w="AL",J=Math.round(Math.min(62,38+me))):me<-14?(w="SAT",J=Math.round(Math.min(82,40+Math.abs(me)*1.4))):(w="N\xD6TR",J=0,Ce.push("MA200 alt\u0131nda ama dip \u015Fartlar\u0131 (\u22654/7) tutmuyor"),z&&Ce.push(`ADX ${E.toFixed(0)} (yatay)`),Math.abs(me)<14&&Ce.push("Net AL/SAT e\u011Filimi yok")),w==="SAT"&&B&&y==="ASAGI"?X="\u2B07 D\xFC\u015F\xFC\u015F h\u0131zlan\u0131yor \u2014 pozisyondan \xE7\u0131k":w==="SAT"&&y==="YUKARI"?X="\u2198 K\u0131sa vadeli toparlanma sonu \u2014 sat\u0131\u015F yakla\u015F\u0131yor":w==="SAT"?X="\u2198 D\xFC\u015F\xFC\u015F trendi s\xFCr\xFCyor \u2014 temkinli":w==="AL"?X="\u{1F3AF} D\xFC\u015F\xFC\u015F trendinde d\xF6n\xFC\u015F denemesi \u2014 riskli ama f\u0131rsat olabilir":B&&y==="ASAGI"?X="\u2B07 D\xFC\u015F\xFC\u015F trendi s\xFCr\xFCyor \u2014 yeni giri\u015F i\xE7in dip aramak gerek":B&&y==="YUKARI"?X="\u2197 D\xFC\u015F\xFC\u015Fte k\u0131sa vadeli toparlanma \u2014 kal\u0131c\u0131l\u0131\u011F\u0131 \u015F\xFCpheli":z?X="\u2194 Yatay seyir \u2014 y\xF6n belirsiz, beklemede":X="\u2198 D\xFC\u015F\xFC\u015F e\u011Filimi \u2014 toparlanma \u015Fartlar\u0131 hen\xFCz tutmuyor"),w==="N\xD6TR"){
    if(e.bbU&&e.bbL){
      const g=(e.close-e.bbL)/(e.bbU-e.bbL);
      g>.4&&g<.6&&Ce.push("Fiyat Bollinger orta band\u0131nda")
    }
    Math.abs(e.rsi-50)<8&&Ce.push(`RSI ${e.rsi?.toFixed(0)} (~50, karars\u0131z)`)
  }
  w==="AL"&&e.stDir===-1&&(J=Math.round(J*.78)),w==="SAT"&&e.stDir===1&&(J=Math.round(J*.78));
  let Ee="";
  i==="ASAGI"&&w==="AL"?(J=Math.round(J*.65),Ee="\u26A0 G\xFCnl\xFCk trend A\u015EA\u011EI",J<50&&(w="N\xD6TR")):i==="YUKARI"&&w==="SAT"?(J=Math.round(J*.65),Ee="\u26A0 G\xFCnl\xFCk trend YUKARI",J<50&&(w="N\xD6TR")):(i==="YUKARI"&&w==="AL"||i==="ASAGI"&&w==="SAT")&&(J=Math.min(98,Math.round(J*1.1)),Ee="\u2713 G\xFCnl\xFCk trend AYNI Y\xD6N");
  let ee;
  const Ae=Me.PA?.strength??0,te=Me.PA?.label??"",oe=Me.BB?.label??"",vt=Me.MA?.label??"",He=Me.SRSI?.strength??0;
  te.includes("A\xE7\u0131l\u0131\u015F aral\u0131\u011F\u0131")?ee={
    dur:"1-3 G\xDCN",t1:1.5,t2:2.5,stopMin:.02,stopMax:.05,why:"ORB k\u0131r\u0131l\u0131m\u0131 \u2014 g\xFCn-i\xE7i momentum, s\u0131k\u0131 stop"
  }
  :te.includes("Golden Cross")||te.includes("Death Cross")?ee={
    dur:"1-3 AY",t1:5,t2:9,stopMin:.06,stopMax:.15,why:"Golden/Death Cross \u2014 uzun vadeli trend d\xF6n\xFC\u015F\xFC"
  }
  :te.includes("S\u0131k\u0131\u015Fmas\u0131 K\u0131r\u0131ld\u0131")?ee={
    dur:"1-3 HAFTA",t1:3,t2:5,stopMin:.04,stopMax:.1,why:"Volatilite patlamas\u0131 \u2014 keskin hareket bekleniyor"
  }
  :te.includes("Fibonacci")?ee={
    dur:"1-2 HAFTA",t1:2.5,t2:4,stopMin:.035,stopMax:.08,why:"Fib deste\u011Fi \u2014 trend y\xF6n\xFCnde devam"
  }
  :te.includes("Haftal\u0131k")&&(te.includes("Dragonfly")||te.includes("Gravestone"))?ee={
    dur:"3-6 HAFTA",t1:4,t2:7,stopMin:.05,stopMax:.13,why:"Haftal\u0131k Doji \u2014 b\xFCy\xFCk trend d\xF6n\xFC\u015F\xFC"
  }
  :te.includes("G\xFCnl\xFCk Dragonfly")||te.includes("G\xFCnl\xFCk Gravestone")?ee={
    dur:"2-3 HAFTA",t1:3,t2:5.5,stopMin:.04,stopMax:.11,why:"G\xFCnl\xFCk Doji \u2014 g\xFC\xE7l\xFC d\xF6n\xFC\u015F, uzun tut"
  }
  :te.includes("Doji Sonras\u0131")||te.includes("DOJI+RSI")?ee={
    dur:"1-2 HAFTA",t1:2.5,t2:4,stopMin:.035,stopMax:.09,why:"Doji onayl\u0131 d\xF6n\xFC\u015F"
  }
  :Ae>=92&&(te.includes("D\u0130PTEN D\xD6N\xDC\u015E")||te.includes("TEPEDEN D\xD6N\xDC\u015E")||te.includes("Hacim Patlamas\u0131"))?ee={
    dur:"1-3 G\xDCN",t1:1.5,t2:2.8,stopMin:.025,stopMax:.06,why:"H\u0131zl\u0131 momentum d\xF6n\xFC\u015F\xFC"
  }
  :vt.includes("MA200 K\u0131r\u0131ld\u0131")||be&&be.score>=5?ee={
    dur:"2-4 HAFTA",t1:3,t2:5.5,stopMin:.05,stopMax:.12,why:"B\xFCy\xFCk trend d\xF6n\xFC\u015F\xFC \u2014 uzun vade tut"
  }
  :b==="YUKARI"&&E>25&&w==="AL"?ee={
    dur:"1-2 HAFTA",t1:2.5,t2:4,stopMin:.04,stopMax:.1,why:"G\xFC\xE7l\xFC trend \u2014 momentum s\xFCr"
  }
  :(oe.includes("Alt Banda")||oe.includes("\xDCst Banda")||oe.includes("Band\u0131n"))&&He>=80?ee={
    dur:"3-7 G\xDCN",t1:1.5,t2:2.5,stopMin:.03,stopMax:.07,why:"A\u015F\u0131r\u0131 bant \u2014 ortalamaya d\xF6n\xFC\u015F"
  }
  :Ae>=80&&(te.includes("Yutan")||te.includes("\xC7eki\xE7")||te.includes("Y\u0131ld\u0131z")||te.includes("EMA9"))?ee={
    dur:"2-5 G\xDCN",t1:2,t2:3.2,stopMin:.025,stopMax:.07,why:"Mum patterni reaksiyonu"
  }
  :be&&be.score>=4?ee={
    dur:"1-2 HAFTA",t1:2.2,t2:3.5,stopMin:.035,stopMax:.09,why:"Dip avc\u0131 \u2014 k\xFC\xE7\xFCk pozisyon, s\u0131k\u0131 stop"
  }
  :ee={
    dur:"1 HAFTA",t1:2,t2:3.5,stopMin:.03,stopMax:.08,why:"Standart swing"
  };
  const Et=u>0?u/e.close:.04,Re=Math.min(ee.stopMax,Math.max(ee.stopMin,Et*1)),yt=+(e.close*(1-Re)).toFixed(e.close<1?4:2),Be=+(e.close*(1+Re*ee.t1)).toFixed(e.close<1?4:2),Ot=+(e.close*(1+Re*ee.t2)).toFixed(e.close<1?4:2);
  let re="\u015E\u0130MD\u0130",Oe="\u015Eu anki fiyattan giri\u015F uygun";
  if(w==="AL"){
    const g=e.rsi!=null&&e.rsi>65||e.bbU&&e.close>e.bbU*.97,F=t.slice(-3).every(G=>G?.close>G?.open);
    g?(re="GER\u0130 \xC7EK\u0130LME BEKLE",Oe=`RSI ${e.rsi?.toFixed(0)} a\u015F\u0131r\u0131 al\u0131mda \u2014 1-2 mum geri \xE7ekilince gir`):F&&(re="TEPK\u0130 BEKLE",Oe="3 ard\u0131\u015F\u0131k ye\u015Fil mum \u2014 k\u0131sa molada giri\u015F daha iyi")
  }
  else if(w==="SAT"){
    const g=e.rsi!=null&&e.rsi<35||e.bbL&&e.close<e.bbL*1.03,F=t.slice(-3).every(G=>G?.close<G?.open);
    g?(re="TEPK\u0130 BEKLE",Oe=`RSI ${e.rsi?.toFixed(0)} a\u015F\u0131r\u0131 sat\u0131mda \u2014 k\u0131sa toparlanma sonras\u0131 SAT`):F&&(re="TOPARLANMA BEKLE",Oe="3 ard\u0131\u015F\u0131k k\u0131rm\u0131z\u0131 mum \u2014 tepki y\xFCkseli\u015Fi sonras\u0131 SAT")
  }
  const ot=u>0?{
    seviye1:{
      tetik:+(e.close*1.03).toFixed(2),stop:+(e.close*(1+.03-Re*.7)).toFixed(2),aciklama:"+%3'e ula\u015F\u0131nca stop'u buraya \xE7ek"
    },seviye2:{
      tetik:+(e.close*1.06).toFixed(2),stop:+(e.close*(1+.06-Re*.5)).toFixed(2),aciklama:"+%6'da stop break-even \xFCst\xFCne"
    },seviye3:{
      tetik:+(e.close*1.1).toFixed(2),stop:+(e.close*(1+.1-Re*.3)).toFixed(2),aciklama:"+%10'da k\xE2r\u0131n \xE7o\u011Funu kilitle"
    }
  }
  :null;
  return{
    signals:Me,final:w,confidence:J,last:e,trendMod:b,mod:X,dipSignal:be,trendBias:W,trendStr:L,shortBias:P,adx:E,trendStrong:B,trendWeak:z,atr:u>0?+u.toFixed(2):null,stopLoss:yt,target1:Be,target2:Ot,riskReward:"1:1.3",ma200:e.ma200,waitReasons:Ce,net:+me.toFixed(1),higherTrend:i,htfNote:Ee,profile:ee,entryHint:re,entryDetail:Oe,trailingStop:ot,stopPct:+Re.toFixed(4)
  }
}
function backtest(t){
  if(!t||t.length<60)return null;
  const i=enrichData(t);
  if(i.length<60)return null;
  const a=[];
  let e=null;
  for(let c=30;
  c<i.length-1;
  c++){
    const b=i.slice(0,c+1),y=getSignals(b),u=i[c+1];
    !y||!u||(e?u.low<=e.stop?(a.push({
      pnl:(e.stop-e.entry)/e.entry,win:!1,bars:c+1-e.idx
    }),e=null):u.high>=e.target?(a.push({
      pnl:(e.target-e.entry)/e.entry,win:!0,bars:c+1-e.idx
    }),e=null):y.final==="SAT"&&y.confidence>=60&&(a.push({
      pnl:(u.close-e.entry)/e.entry,win:u.close>e.entry,bars:c+1-e.idx
    }),e=null):y.final==="AL"&&y.confidence>=50&&y.stopLoss&&y.target1&&(e={
      entry:u.open,stop:y.stopLoss,target:y.target1,idx:c+1
    }))
  }
  if(a.length<2)return{
    trades:a.length,winrate:0,avgPnl:0,score:0,error:"Yeterli sinyal yok (1y i\xE7inde 2'den az AL)"
  };
  const r=a.filter(c=>c.win).length/a.length,d=a.reduce((c,b)=>c+b.pnl,0)/a.length,n=+(r*100+d*200).toFixed(1);
  return{
    trades:a.length,winrate:+(r*100).toFixed(1),avgPnl:+(d*100).toFixed(2),score:n
  }
}
async function sendAlertEmail(t,i,a,e,r){
  const d=await fetch("https://api.emailjs.com/api/v1.0/email/send",{
    method:"POST",headers:{
      "Content-Type":"application/json"
    },body:JSON.stringify({
      service_id:EMAILJS_SERVICE_ID,template_id:EMAILJS_TEMPLATE_ID,user_id:EMAILJS_PUBLIC_KEY,template_params:{
        to_email:t,symbol:i,signal:a,price:e!=null?(+e).toFixed(2):"\u2014",confidence:(r??0)+"%",time:new Date().toLocaleString("tr-TR"),message:`${i} hissesi i\xE7in ${a} sinyali. Fiyat: ${e!=null?(+e).toFixed(2):"\u2014"}\u20BA, G\xFCven: ${r??0}%, Zaman: ${new Date().toLocaleString("tr-TR")}`
      }
    })
  });
  if(!d.ok)throw new Error(`EmailJS: ${d.status}`)
}
const T=(()=>{
  const D={
    bg:"#0a0e17",bg1:"#141b2d",bg2:"#1d2438",border:"#252d44",border2:"#323a55",text:"#f0f3fa",muted:"#8a93a8",dim:"#454d66",green:"#00d68f",red:"#ff5a5a",yellow:"#f4b942",blue:"#4a8eff",orange:"#ff8a4c",purple:"#9b6dff"
  };
  const L={
    bg:"#f7f8fb",bg1:"#ffffff",bg2:"#eef1f6",border:"#d7dce5",border2:"#bcc4d2",text:"#0a0e17",muted:"#5e6776",dim:"#9ba4b4",green:"#00b87a",red:"#e63946",yellow:"#d97706",blue:"#2563eb",orange:"#ea580c",purple:"#7c3aed"
  };
  const isDark=(localStorage.getItem("feybot_theme")||"light")==="dark";
  const p=isDark?D:L;
  try{
    document.documentElement.style.setProperty("--bg",p.bg);
    document.documentElement.style.setProperty("--text",p.text);
    document.body&&(document.body.style.background=p.bg,document.body.style.color=p.text);
  }
  catch{
  }
  return {
    ...p,font:"-apple-system, BlinkMacSystemFont, \'SF Pro Display\', \'SF Pro Text\', \'Inter\', \'Segoe UI\', system-ui, sans-serif",fontD:"-apple-system, BlinkMacSystemFont, \'SF Pro Display\', \'Inter\', \'Segoe UI\', system-ui, sans-serif",fontMono:"ui-monospace, \'SF Mono\', \'Menlo\', \'Roboto Mono\', \'Consolas\', monospace"
  };
})(),CSS=`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  *{box-sizing:border-box;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale} html,body{background:${T.bg};margin:0;padding:0;font-family:${T.font};letter-spacing:-0.011em;font-size:14px;line-height:1.45}
  body{-webkit-tap-highlight-color:transparent;-webkit-text-size-adjust:100%}
  h1,h2,h3{font-family:${T.fontD};letter-spacing:-0.02em;font-weight:600}
  /* Say\u0131lar tabular-nums ile hizal\u0131, fiyat tablolar\u0131nda titreme yok */
  input,button{font-family:inherit;letter-spacing:inherit}
  .tnum{font-variant-numeric:tabular-nums;font-feature-settings:"tnum"}
  ::-webkit-scrollbar{width:3px;height:3px} ::-webkit-scrollbar-thumb{background:${T.border2};border-radius:2px}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
  @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
  .btn{transition:all .15s}.btn:active{filter:brightness(.9)}.btn:hover{filter:brightness(1.15);transform:translateY(-1px)}
  .sc{transition:all .2s}.sc:hover{transform:translateY(-2px)}
  .nav-item{transition:all .15s;cursor:pointer;border-left:3px solid transparent}
  .nav-item:hover{background:rgba(56,189,248,.06)}
  .nav-item.active{border-left-color:#00e5a0;background:rgba(0,229,160,.06)}
  .mob-bottom{display:none}
  @media (max-width:720px){
    html,body{font-size:13px}
    .desk-only{display:none!important}
    .mob-bottom{display:flex!important;position:fixed;bottom:0;left:0;right:0;background:${T.bg1};border-top:1px solid ${T.border};z-index:99}
    .mob-bottom .nav-item{flex:1;border-left:none;border-bottom:3px solid transparent;padding:10px 0!important}
    .mob-bottom .nav-item.active{border-bottom-color:${T.green};border-left-color:transparent}
    .mob-bottom .nav-item > div:first-child{font-size:18px!important}
    .mob-bottom .nav-item > div:nth-child(2){font-size:9px!important;margin-top:3px!important}
    .mob-pad{padding:12px 10px!important}
    .mob-h1{font-size:24px!important}
    .mob-px{font-size:26px!important}
    .has-bottom-nav{padding-bottom:60px!important}
    /* Mobil ticker \u2014 akan kompakt sembol+fiyat g\xF6r\xFCn\xFCr */
    .ticker-bar > div > div > div{padding:4px 10px!important;min-width:75px!important}
    .ticker-bar > div > div > div > div:first-child > span:not(:first-child){font-size:11px!important}
    .ticker-bar > div > div > div > div:nth-child(2) > span{font-size:10px!important}
    /* Email/AI panel input mobilde tam geni\u015Flik */
    input[type="email"], input[type="password"]{width:100%!important;max-width:100%!important;flex:1 1 100%!important}
    /* Stat box mobilde daha kompakt \u2014 9-10 stat s\u0131\u011Fs\u0131n */
    .mob-stat{padding:6px 8px!important;min-width:62px!important;flex:1 1 60px!important;font-size:12px!important}
    .mob-stat > div:first-child{font-size:8px!important}
    .mob-stat > div:nth-child(2){font-size:11px!important}
    /* Mobil number input \u2014 sa\u011Fa yasl\u0131 say\u0131 g\xF6r\xFCn\xFCm */
    input[type="number"]{text-align:right;font-variant-numeric:tabular-nums}
  }
`;
function SigCard({
  name:t,sig:i
}){
  if(!i)return null;
  const a=i.dir==="AL"?T.green:i.dir==="SAT"?T.red:T.muted,e=i.dir==="AL"?`${T.green}08`:i.dir==="SAT"?`${T.red}08`:T.bg2;
  return React.createElement("div",{
    className:"sc",style:{
      background:e,border:`1px solid ${a}33`,borderRadius:8,padding:"12px 14px",flex:"1 1 110px",minWidth:100,animation:"fadeIn .3s"
    }
  },React.createElement("div",{
    style:{
      fontSize:11,color:T.muted,marginBottom:5,letterSpacing:1
    }
  },t),React.createElement("div",{
    style:{
      display:"flex",alignItems:"center",gap:6,marginBottom:4
    }
  },React.createElement("span",{
    style:{
      fontSize:16,fontWeight:700,color:a,fontFamily:T.fontD,letterSpacing:1
    }
  },i.dir),React.createElement("span",{
    style:{
      fontSize:10,color:T.muted,marginLeft:"auto"
    }
  },i.value)),React.createElement("div",{
    style:{
      fontSize:10,color:T.muted,marginBottom:6,minHeight:14
    }
  },i.label),React.createElement("div",{
    style:{
      height:2,background:T.dim,borderRadius:1
    }
  },React.createElement("div",{
    style:{
      height:"100%",width:`${i.strength}%`,background:`linear-gradient(90deg,${a}88,${a})`,transition:"width .8s",borderRadius:1
    }
  })),React.createElement("div",{
    style:{
      fontSize:9,color:a,marginTop:3,textAlign:"right"
    }
  },i.strength,"%"))
}
function Leg({
  color:t,label:i,dashed:a
}){
  return React.createElement("div",{
    style:{
      display:"flex",alignItems:"center",gap:5
    }
  },React.createElement("svg",{
    width:"18",height:"3"
  },React.createElement("line",{
    x1:"0",y1:"1.5",x2:"18",y2:"1.5",stroke:t,strokeWidth:"2",strokeDasharray:a?"4 2":"0"
  })),React.createElement("span",{
    style:{
      fontSize:11,color:T.muted,fontFamily:T.font
    }
  },i))
}
function StatBox({
  label:t,value:i,color:a
}){
  return React.createElement("div",{
    className:"mob-stat",style:{
      background:T.bg2,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px",flex:"1 1 80px",textAlign:"center",minWidth:75
    }
  },React.createElement("div",{
    style:{
      fontSize:9,color:T.muted,marginBottom:3,letterSpacing:1
    }
  },t),React.createElement("div",{
    className:"tnum",style:{
      fontSize:13,fontWeight:700,color:a||T.text
    }
  },i))
}
function PriceTip({
  active:t,payload:i,label:a
}){
  if(!t||!i?.length)return null;
  const e=i[0]?.payload;
  return React.createElement("div",{
    style:{
      background:T.bg1,border:`1px solid ${T.border2}`,borderRadius:6,padding:"8px 12px",fontSize:12,fontFamily:T.font,boxShadow:"0 4px 20px rgba(0,0,0,.7)"
    }
  },React.createElement("div",{
    style:{
      color:T.muted,marginBottom:3
    }
  },a),e&&React.createElement(React.Fragment,null,React.createElement("div",{
    style:{
      color:T.blue
    }
  },"K: ",e.close?.toFixed(2),"\u20BA"),React.createElement("div",null,React.createElement("span",{
    style:{
      color:T.green
    }
  },"Y:",e.high?.toFixed(2))," ",React.createElement("span",{
    style:{
      color:T.red
    }
  },"D:",e.low?.toFixed(2))),e.ma20&&React.createElement("div",{
    style:{
      color:T.yellow
    }
  },"MA20: ",e.ma20),e.ma200&&React.createElement("div",{
    style:{
      color:T.orange
    }
  },"MA200: ",e.ma200)))
}
function Spark({
  data:t,h:i=22,color:a
}){
  if(!t||t.length<2)return null;
  const e=200,r=Math.min(...t),d=Math.max(...t)-r||1,n=t.map((b,y)=>`${y/(t.length-1)*e},${i-(b-r)/d*(i-2)-1}`).join(" "),c=t[t.length-1]>=t[0]?"#00e5a0":"#e63946";
  return React.createElement("svg",{
    viewBox:`0 0 ${e} ${i}`,preserveAspectRatio:"none",width:"100%",height:i,style:{
      display:"block"
    }
  },React.createElement("polyline",{
    points:n,fill:"none",stroke:a||c,strokeWidth:1.5,strokeLinejoin:"round"
  }))
}
function LWChart({
  data:t,height:i=420,mode:a="candle"
}){
  const e=useRef(null),r=useRef(null);
  return useEffect(()=>{
    if(!e.current||!window.LightweightCharts||!t?.length)return;
    const d=window.LightweightCharts.createChart(e.current,{
      width:e.current.clientWidth,height:i,layout:{
        background:{
          type:"solid",color:"#ffffff"
        },textColor:"#9aa6c0",fontFamily:T.font
      },grid:{
        vertLines:{
          color:"#1e2d47",style:1
        },horzLines:{
          color:"#1e2d47",style:1
        }
      },timeScale:{
        timeVisible:!0,secondsVisible:!1,borderColor:"#253352"
      },rightPriceScale:{
        borderColor:"#253352"
      },crosshair:{
        mode:0,vertLine:{
          color:"#38bdf8",width:1,style:3
        },horzLine:{
          color:"#38bdf8",width:1,style:3
        }
      }
    });
    r.current=d;
    const n=d.addCandlestickSeries({
      upColor:"#00e5a0",downColor:"#e63946",borderUpColor:"#00e5a0",borderDownColor:"#e63946",wickUpColor:"#00e5a0",wickDownColor:"#e63946"
    }),c=d.addLineSeries({
      color:"#fbbf24",lineWidth:1,priceLineVisible:!1,lastValueVisible:!1
    }),b=d.addLineSeries({
      color:"#a78bfa",lineWidth:1,priceLineVisible:!1,lastValueVisible:!1
    }),y=d.addLineSeries({
      color:"#fb923c",lineWidth:1,lineStyle:2,priceLineVisible:!1,lastValueVisible:!1
    }),u=d.addLineSeries({
      color:"rgba(56,189,248,0.4)",lineWidth:1,lineStyle:3,priceLineVisible:!1,lastValueVisible:!1
    }),E=d.addLineSeries({
      color:"rgba(56,189,248,0.4)",lineWidth:1,lineStyle:3,priceLineVisible:!1,lastValueVisible:!1
    }),B=t.length,z=Math.floor(Date.now()/1e3),O=(L,W)=>L.ts&&L.ts>1e12?Math.floor(L.ts/1e3):L.ts&&L.ts>1e9?Math.floor(L.ts):z-(B-1-W)*86400,M=L=>{
      const W=L.sort((V,q)=>V.time-q.time),P=[];
      for(const V of W)(!P.length||V.time>P[P.length-1].time)&&P.push(V);
      return P
    },N=a==="ha"?["haOpen","haHigh","haLow","haClose"]:["open","high","low","close"];
    n.setData(M(t.filter(L=>L[N[0]]!=null&&L[N[1]]!=null&&L[N[2]]!=null&&L[N[3]]!=null).map((L,W)=>({
      time:O(L,W),open:L[N[0]],high:L[N[1]],low:L[N[2]],close:L[N[3]]
    })))),c.setData(M(t.map((L,W)=>L.ma20!=null?{
      time:O(L,W),value:L.ma20
    }
    :null).filter(Boolean))),b.setData(M(t.map((L,W)=>L.ma50!=null?{
      time:O(L,W),value:L.ma50
    }
    :null).filter(Boolean))),y.setData(M(t.map((L,W)=>L.ma200!=null?{
      time:O(L,W),value:L.ma200
    }
    :null).filter(Boolean))),u.setData(M(t.map((L,W)=>L.bbU!=null?{
      time:O(L,W),value:L.bbU
    }
    :null).filter(Boolean))),E.setData(M(t.map((L,W)=>L.bbL!=null?{
      time:O(L,W),value:L.bbL
    }
    :null).filter(Boolean))),d.timeScale().fitContent();
    const K=new ResizeObserver(()=>d.applyOptions({
      width:e.current.clientWidth
    }));
    return K.observe(e.current),()=>{
      K.disconnect(),d.remove()
    }
  },[t,i,a]),React.createElement("div",{
    ref:e,style:{
      width:"100%",height:i,background:"#ffffff",borderRadius:8
    }
  })
}
function getRiskScore(t,i){
  if(!t||!t.last)return{
    level:"ORTA",color:"#f4b04a",emoji:"\u26A0\uFE0F",reasons:["Veri yetersiz"],score:50
  };
  const a=t.last,e=i??a.close,r=t.atr&&e?t.atr/e*100:0,d=(a.volume||0)*e,n=t.confidence||50,c=t.adx||0,b=[];
  let y=0;
  r<2.5?y+=10:r<4.5?(y+=25,b.push(`ATR %${r.toFixed(1)} \u2014 orta volatilite`)):r<7?(y+=45,b.push(`ATR %${r.toFixed(1)} \u2014 y\xFCksek volatilite`)):(y+=65,b.push(`ATR %${r.toFixed(1)} \u2014 a\u015F\u0131r\u0131 volatilite`)),d>1e6?y+=0:d>3e5?y+=8:d>8e4?(y+=20,b.push("Orta likidite (~spread)")):(y+=40,b.push("D\xFC\u015F\xFCk likidite \u2014 spread riski b\xFCy\xFCk")),n<55?(y+=25,b.push("G\xFCven d\xFC\u015F\xFCk (<%55)")):n<65&&(y+=12),c>0&&c<18&&(y+=12,b.push("Zay\u0131f trend (ADX<18)")),t.htfNote&&t.htfNote.includes("\u26A0")&&(y+=18,b.push("G\xFCnl\xFCk trend \xE7eli\u015Fkili"));
  let u,E,B;
  return y<=30?(u="D\xDC\u015E\xDCK",E="#22c98a",B="\u2705"):y<=60?(u="ORTA",E="#f4b04a",B="\u26A0\uFE0F"):(u="Y\xDCKSEK",E="#e63946",B="\u{1F525}"),{
    level:u,color:E,emoji:B,score:y,atrPct:+r.toFixed(2),turnover:Math.round(d),reasons:b
  }
}
function classifyTradeMode(t){
  if(!t||!t.profile)return"other";
  const i=t.profile.dur||"",a=/HAFTA|AY/.test(i),e=/GÜN/.test(i),r=t.adx||0,d=t.confidence||0,n=t.signals?.PA?.label||"",c=/ORB|BURST|FLIP|Hammer|Engulf|Star|Doji/i.test(n)||/ORB|DİP FLIP|BURST|TOP REV/i.test(t.mod||""),b=!t.htfNote||!t.htfNote.includes("\u26A0");
  return a&&r>=18&&b&&d>=55?"swing":e&&c&&d>=58?"day":a?"swing":e?"day":"other"
}
async function aiAnalyze(t,i,a,e,r,d,n,c){
  const b='Sen profesyonel bir BIST/kripto trade analistsin. Kullan\u0131c\u0131n\u0131n verdi\u011Fi teknik veriyi (indikat\xF6r snapshot + bot karar\u0131) son makro/\u015Firket haberleriyle harmanlay\u0131p T\xFCrk\xE7e, k\u0131sa ve uygulanabilir bir trade \xF6nerisi yapacaks\u0131n. Format: 1 c\xFCmle \xF6zet + 3-4 madde "ARTILAR/EKS\u0130LER" + 1 net karar (AL/SAT/BEKLE) + tahmini vade.',y=`Sembol: ${i} (${a})
Tip: ${n?"Kripto (Binance USDT)":"BIST hissesi"}
Botun teknik karar\u0131: ${e.final} %${e.confidence} \xB7 ${e.mod}
Mevcut fiyat: ${r.price}
Trend: MA200 ${e.trendMod} \xB7 ADX ${e.adx?.toFixed(0)} \xB7 \xDCst TF: ${e.higherTrend||"\u2014"}
Vade profili: ${d?.dur||"\u2014"} (${d?.why||""})
\u0130ndikat\xF6r: RSI ${r.rsi}, MACD hist ${r.macdHist}, BB pozisyon ${r.bbPos}, Stoch ${r.stoch}, ATR ${r.atr}
Price Action: ${e.signals?.PA?.label||"\u2014"}
Stop: ${e.stopLoss} \xB7 H1: ${e.target1} \xB7 H2: ${e.target2}
${c&&c.length>5?`
=== KULLANICI GE\xC7M\u0130\u015E\u0130 (son trade kararlar\u0131, AI buradan ders \xE7\u0131kar) ===
${c}
`:""}
Bu hisse i\xE7in:
1. Son 1-2 ay i\xE7indeki \u015Firket-\xF6zel haberler ve sekt\xF6r trendlerini d\xFC\u015F\xFCn (KAP a\xE7\u0131klamalar\u0131, k\xE2r beklentileri, kur etkisi).
2. Botun teknik karar\u0131n\u0131 haber kontekstiyle de\u011Ferlendir \u2014 onayl\u0131yor mu, \xE7eli\u015Fiyor mu?
3. Net trade \xF6nerin nedir? Stop ve hedef seviyeleri uygun mu? Vade ger\xE7ek\xE7i mi?
4. Risk uyar\u0131s\u0131 varsa belirt.
${c&&c.length>5?'5. KULLANICI GE\xC7M\u0130\u015E\u0130NDEN ba\u011Flam\u0131 kullan \u2014 bu sembolde \xF6nceki karar\u0131, isabet oran\u0131n\u0131, ba\u015Far\u0131l\u0131/ba\u015Far\u0131s\u0131z patternlerini hat\u0131rlat. "Ge\xE7en sefer X dedin sonu\xE7 Y oldu" gibi \xF6\u011Fretici bir ton kullan.':""}`,u=await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",headers:{
      "content-type":"application/json","x-api-key":t,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"
    },body:JSON.stringify({
      model:"claude-sonnet-4-5",max_tokens:800,system:b,messages:[{
        role:"user",content:y
      }]
    })
  });
  if(!u.ok){
    const E=await u.text();
    throw new Error(`API ${u.status}: ${E.slice(0,200)}`)
  }
  return(await u.json()).content?.[0]?.text||"Yan\u0131t bo\u015F."
}
function feyAIScanTopPicks(t,i,a,e){
  if(!t||t.length===0)return"\u{1F985} EAGLE EYE — EN G\xDC\xC7L\xDC AL\n\nHen\xFCz AL sinyali yok. \xD6nce TARA \xE7alıştır.";
  const r=t.map(u=>{
    const E=u.riskLevel==="Y\xDCKSEK"?25:u.riskLevel==="ORTA"?8:0;
    let B=0;
    if(e)for(const[z,O]of Object.entries(BIST_SECTORS))if(O.includes(u.sym)&&e[z]!=null){B=Math.min(15,Math.max(-15,e[z]*5));break}
    return{...u,finalScore:(u.priority||u.confidence||0)-E+B}
  }).sort((u,E)=>E.finalScore-u.finalScore),d=r.slice(0,5),n={};
  d.forEach(u=>{for(const[E,B]of Object.entries(BIST_SECTORS))if(B.includes(u.sym)){n[E]=(n[E]||0)+1;break}});
  const c=Object.entries(n).sort((u,E)=>E[1]-u[1])[0],b=r.filter(u=>u.riskLevel==="Y\xDCKSEK").slice(0,2),circ=["①","②","③","④","⑤","⑥","⑦","⑧"],y=[];
  y.push("\u{1F985} EAGLE EYE — EN G\xDC\xC7L\xDC "+d.length+" AL"),y.push("");
  d.forEach((u,E)=>{
    const z=u.riskLevel==="D\xDCŞ\xDCK"?"✅":u.riskLevel==="Y\xDCKSEK"?"\u{1F525}":"⚠️",v=u.durationLabel?u.durationLabel.replace("G\xDCN","g").replace("HAFTA","hf").replace("AY","ay").replace(/\s/g,""):"";
    y.push(`${circ[E]||E+1+"."} ${u.sym}  AL %${u.confidence} ${z}`),u.target1&&u.stopLoss&&y.push(`    \u{1F3AF} ${u.target1}   ⛔ ${u.stopLoss}${v?"   ⏱ "+v:""}`)
  }),y.push("");
  c&&c[1]>=2?y.push("\u{1F4CA} "+c[0]+" sekt\xF6r\xFC \xF6ne \xE7ıkıyor ("+c[1]+" hisse)"):y.push("\u{1F4CA} Sekt\xF6r dağınık — sinyaller bireysel");
  b.length>0&&y.push("\u{1F6AB} Uzak dur: "+b.map(u=>u.sym).join(", ")+" (y\xFCksek risk)");
  i?.length>0&&y.push("\u{1F4C9} Satışta: "+i.slice(0,3).map(u=>u.sym).join(", "));
  return y.push(""),y.push("EAGLE EYE AI \xB7 yerel \xB7 yatırım tavsiyesi değildir"),y.join("\n")
}
async function aiScanTopPicks(t,i,a,e){
  if(!t)throw new Error("AI API key gerekli");
  if(!i||i.length===0)throw new Error("\xD6nce TARA \xE7al\u0131\u015Ft\u0131r (AL sonucu bulunamad\u0131)");
  const r=i.slice(0,15),d=(a||[]).slice(0,5),n=u=>`${u.sym} | ${u.signal} %${u.confidence} | ${u.mod} | ATR%${((u.atr||0)/(u.price||1)*100).toFixed(1)} | ADX${(u.adx||0).toFixed(0)}${u.paLabel?" | PA:"+u.paLabel:""}${u.htfNote?" | "+u.htfNote.replace(/[^\w/üöışç ]/gi,""):""}${u.durationLabel?" | "+u.durationLabel:""}`,c=`Sen profesyonel bir BIST trade taray\u0131c\u0131s\u0131s\u0131n. Sana botun tarama sonucunda buldu\u011Fu g\xFC\xE7l\xFC AL sinyalleri verilecek. Bu listeden BUG\xDCN giri\u015F i\xE7in en g\xFC\xE7l\xFC 5 f\u0131rsat\u0131 se\xE7eceksin. Kriterler: teknik konsens\xFCs, sekt\xF6r/\u015Firket ba\u011Flam\u0131, son haberler, risk-\xF6d\xFCl oran\u0131. T\xFCrk\xE7e, k\u0131sa ve eyleme d\xF6n\xFCk yaz.
Format (kesin):
# \u{1F3AF} BUG\xDCN\xDCN EN G\xDC\xC7L\xDC 5 AL
1. SEMBOL \u2014 1 c\xFCmle gerek\xE7e (teknik+haber)
2. ...
3. ...
4. ...
5. ...
## S\u0131ralama mant\u0131\u011F\u0131
- 1-2 c\xFCmle: Bug\xFCn hangi sekt\xF6r/tema \xF6ne \xE7\u0131k\u0131yor.
## Uzak dur
- Listede \xE7\u0131kmas\u0131na ra\u011Fmen tavsiye etmediklerin (varsa 1-2 sembol + neden)`,b=`BIST TARAYICI \xC7IKTISI (${new Date().toLocaleDateString("tr-TR")})
=== En g\xFC\xE7l\xFC AL adaylar\u0131 (priority s\u0131ras\u0131na g\xF6re) ===
${r.map(n).join(`
`)}
${d.length?`=== Sat\u0131\u015F bask\u0131s\u0131ndaki hisseler (uzak durulacaklar) ===
${d.map(n).join(`
`)}
`:""}${e?`
=== Kullan\u0131c\u0131 ge\xE7mi\u015Fi (varsa ba\u011Flam\u0131 kullan) ===
${e}
`:""}
G\xF6rev: Yukar\u0131daki listeden BUG\xDCN i\xE7in en g\xFC\xE7l\xFC 5 AL f\u0131rsat\u0131n\u0131 se\xE7. Salt teknik de\u011Fil, haberleri ve sekt\xF6r momentumunu da d\xFC\u015F\xFCn. E\u011Fer \xE7o\u011Fu zay\u0131fsa 5'ten az\u0131n\u0131 \xF6ner (3-4 olabilir).`,y=await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",headers:{
      "content-type":"application/json","x-api-key":t,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"
    },body:JSON.stringify({
      model:"claude-sonnet-4-5",max_tokens:1200,system:c,messages:[{
        role:"user",content:b
      }]
    })
  });
  if(!y.ok){
    const u=await y.text();
    throw new Error(`API ${y.status}: ${u.slice(0,200)}`)
  }
  return(await y.json()).content?.[0]?.text||"Yan\u0131t bo\u015F."
}
function calcPnl(t,i,a){
  const e=(i-t)*a,r=t>0?(i-t)/t*100:0;
  return{
    pnl:+e.toFixed(2),pnlPct:+r.toFixed(2)
  }
}
const NEWS_SOURCES=[{
  id:"hur-eko",name:"H\xFCrriyet Eko.",url:"https://www.hurriyet.com.tr/rss/ekonomi",category:"ekonomi"
},{
  id:"mil-eko",name:"Milliyet Eko.",url:"https://www.milliyet.com.tr/rss/rssNew/ekonomiRss.xml",category:"ekonomi"
},{
  id:"dunya",name:"D\xFCnya Gazetesi",url:"https://www.dunya.com/rss",category:"borsa"
},{
  id:"bloomberg",name:"BloombergHT",url:"https://www.bloomberght.com/rss",category:"borsa"
},{
  id:"cnn-eko",name:"CNN T\xFCrk Eko.",url:"https://www.cnnturk.com/feed/rss/ekonomi/news",category:"ekonomi"
},{
  id:"trt-eko",name:"TRT Ekonomi",url:"https://www.trthaber.com/ekonomi_articles.rss",category:"ekonomi"
},{
  id:"aa-eko",name:"AA Ekonomi",url:"https://www.aa.com.tr/tr/rss/default?cat=ekonomi",category:"ekonomi"
},{
  id:"sabah",name:"Sabah Ekonomi",url:"https://www.sabah.com.tr/rss/ekonomi.xml",category:"ekonomi"
},{
  id:"bbc-tr",name:"BBC T\xFCrk\xE7e",url:"https://feeds.bbci.co.uk/turkce/rss.xml",category:"dunya"
},{
  id:"aa-dunya",name:"AA D\xFCnya",url:"https://www.aa.com.tr/tr/rss/default?cat=dunya",category:"dunya"
},{
  id:"aa-poli",name:"AA Siyaset",url:"https://www.aa.com.tr/tr/rss/default?cat=politika",category:"siyaset"
}],NEWS_IMPACT=[{
  kw:/(?:faiz\s*artış|faiz\s*artır|faiz\s*yükselt|sıkı\s*para|TCMB.*artır)/i,sectors:{
    Bankalar:1.5,"\u0130n\u015Faat/GYO":-1.5,Holding:-.8,Otomotiv:-.8
  }
},{
  kw:/(?:faiz\s*indirim|faiz\s*düşür|gevşek\s*para|TCMB.*indirim)/i,sectors:{
    Bankalar:-1,"\u0130n\u015Faat/GYO":1.5,Otomotiv:1,Holding:.8,Perakende:.6
  }
},{
  kw:/(?:enflasyon\s*(?:yüksel|art))|enflasyon\s*verisi/i,sectors:{
    Bankalar:-.5,Sanayi:-.3,"G\u0131da/Perakende":.3
  }
},{
  kw:/(?:dolar\s*(?:yüksel|fırla|rekor)|dolar\s*(?:zirvе|tarihi))/i,sectors:{
    Sanayi:.8,Madencilik:1,Havayolu:-.6,Otomotiv:-.6
  },exporters:1
},{
  kw:/(?:dolar\s*(?:düş|geriler)|TL\s*değer)/i,sectors:{
    Sanayi:-.5,Havayolu:.8,Otomotiv:.6
  },exporters:-1
},{
  kw:/(?:euro\s*yüksel|euro\s*rekor)/i,sectors:{
    Sanayi:.6,Otomotiv:-.5
  }
},{
  kw:/(?:petrol\s*(?:yüksel|art|fırla)|brent\s*(?:yüksel|art))/i,sectors:{
    Havayolu:-1.2,Otomotiv:-.4
  },stocks:{
    TUPRS:1.2,AYGAZ:.8
  }
},{
  kw:/(?:petrol\s*(?:düş|geriler))/i,sectors:{
    Havayolu:1,Otomotiv:.4
  },stocks:{
    TUPRS:-1,AYGAZ:-.6
  }
},{
  kw:/(?:altın\s*(?:yüksel|rekor|fırla))/i,stocks:{
    KOZAL:1.5,KOZAA:1.2,IPEKE:1,CVKMD:.8
  }
},{
  kw:/(?:doğal\s*gaz|gaz\s*fiyat)/i,sectors:{
    Enerji:.7
  }
},{
  kw:/(?:demir.*çelik|çelik\s*(?:fiyat|talep))/i,stocks:{
    EREGL:1,KRDMD:1,ISDMR:.8,BRSAN:.5
  }
},{
  kw:/(?:kredi\s*derecelendirme|S&P|Moody|Fitch).*(?:not\s*art|yüksel|pozitif)/i,sectors:{
    Bankalar:1.5,Holding:1
  }
},{
  kw:/(?:kredi\s*derecelendirme|S&P|Moody|Fitch).*(?:not\s*düş|negatif|indirim)/i,sectors:{
    Bankalar:-1.5,Holding:-1
  }
},{
  kw:/(?:asgari\s*ücret\s*(?:art|zam))/i,sectors:{
    "G\u0131da/Perakende":.8,Sanayi:-.5
  },stocks:{
    BIMAS:.8,MGROS:.7,SOKM:.6
  }
},{
  kw:/(?:bütçe\s*açığ|bütçe\s*açıklan)/i,sectors:{
    Bankalar:-.4
  }
},{
  kw:/(?:turizm\s*(?:rekor|art)|otel\s*doluluk)/i,sectors:{
    Havayolu:1
  },stocks:{
    MAALT:1.2,TEKTU:1,AYCES:.8
  }
},{
  kw:/(?:Fed|FED).*(?:faiz\s*indirim|gevşek)/i,sectors:{
    Bankalar:.5,Holding:.8,Sanayi:.5
  }
},{
  kw:/(?:Fed|FED).*(?:faiz\s*art|sıkı)/i,sectors:{
    Bankalar:-.5,Holding:-.8
  }
},{
  kw:/(?:savaş|jeopolit|gerilim|çatışma|ambargo)/i,sectors:{
    Madencilik:.5,Havayolu:-.8
  },stocks:{
    ASELS:1,OTKAR:.8
  }
},{
  kw:/(?:Rusya|Ukrayna).*ateşkes/i,sectors:{
    Havayolu:.8
  }
},{
  kw:/(?:kar\s*payı|temettü\s*(?:dağıt|öde))/i,generic:.3
},{
  kw:/(?:bedelsiz\s*sermaye|sermaye\s*artırım)/i,generic:.5
},{
  kw:/(?:zarar\s*açıklan|zarar\s*büyü)/i,generic:-.8
},{
  kw:/(?:rekor\s*kar|net\s*kar.*(?:art|yüksel))/i,generic:.7
},{
  id:"bbc-world",name:"BBC World",url:"https://feeds.bbci.co.uk/news/world/rss.xml",category:"dunya"
},{
  id:"bbc-business",name:"BBC Business",url:"https://feeds.bbci.co.uk/news/business/rss.xml",category:"ekonomi"
},{
  id:"nyt-home",name:"NYT",url:"https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",category:"dunya"
},{
  id:"nyt-business",name:"NYT Business",url:"https://rss.nytimes.com/services/xml/rss/nyt/Business.xml",category:"ekonomi"
},{
  id:"reuters-biz",name:"Reuters",url:"https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best",category:"ekonomi"
},{
  id:"guardian-biz",name:"Guardian Business",url:"https://www.theguardian.com/uk/business/rss",category:"ekonomi"
},{
  id:"cnbc-top",name:"CNBC",url:"https://www.cnbc.com/id/100003114/device/rss/rss.html",category:"ekonomi"
},{
  id:"ft-home",name:"Financial Times",url:"https://www.ft.com/rss/home",category:"ekonomi"
}];
function detectStockMentions(t){
  if(!t)return[];
  const i=new Set,a=t.toUpperCase();
  return BIST_STOCKS.forEach(([e,r])=>{
    if(e.length<3)return;
    if(new RegExp("\\b"+e+"\\b").test(a)){
      i.add(e);
      return
    }
    const d=(r.split(/\s/)[0]||"").toUpperCase();
    d.length>=5&&a.includes(d)&&i.add(e)
  }),Array.from(i)
}
function analyzeNewsImpact(t,i=""){
  const a=(t+" "+i).slice(0,500),e=new Map,r=new Map;
  let d=[];
  for(const c of NEWS_IMPACT)c.kw.test(a)&&(d.push(c.kw.source.slice(0,30)),c.sectors&&Object.entries(c.sectors).forEach(([b,y])=>{
    r.set(b,(r.get(b)||0)+y),(BIST_SECTORS[b]||[]).forEach(u=>{
      e.set(u,(e.get(u)||0)+y*.6)
    })
  }),c.stocks&&Object.entries(c.stocks).forEach(([b,y])=>{
    e.set(b,(e.get(b)||0)+y)
  }));
  detectStockMentions(a).forEach(c=>{
    e.set(c,(e.get(c)||0)+.5)
  });
  const n=Array.from(e.values()).reduce((c,b)=>c+Math.abs(b),0),secS=Array.from(r.entries()).sort((c,b)=>Math.abs(b[1])-Math.abs(c[1])),affS=Array.from(e.entries()).sort((c,b)=>Math.abs(b[1])-Math.abs(c[1])).slice(0,6);
  let cmt="";
  if(secS.length){
    const pos=secS.filter(x=>x[1]>.2),neg=secS.filter(x=>x[1]<-.2),P=[];
    pos.length&&P.push("\u{1F4C8} "+pos.slice(0,2).map(x=>x[0]).join(", ")+" olumlu etkilenebilir"),neg.length&&P.push("\u{1F4C9} "+neg.slice(0,2).map(x=>x[0]).join(", ")+" baskı altında"),cmt=P.join(" \xB7 "),affS.length>0&&(cmt+=" — \xF6ne \xE7ıkan: "+affS.slice(0,3).map(x=>x[0]+(x[1]>0?" ↑":" ↓")).join(", "))
  }else if(affS.length)cmt="İlgili hisseler: "+affS.slice(0,4).map(x=>x[0]+(x[1]>0?" ↑":x[1]<0?" ↓":"")).join(", ");
  else cmt="Genel piyasa haberi — belirgin tek hisse etkisi yok.";
  return{
    affected:affS,sectors:secS,impact:n>0?Array.from(e.values()).reduce((c,b)=>c+b,0)/Math.max(1,e.size):0,matched:d,comment:cmt
  }
}
async function fetchNewsRSS(t){
  const enc=encodeURIComponent(t.url),to=(U,ms)=>{const c=new AbortController,X=setTimeout(()=>c.abort(),ms);return fetch(U,{signal:c.signal,redirect:"follow"}).finally(()=>clearTimeout(X))},clean=x=>(x||"").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/<[^>]+>/g,"").replace(/&[a-z]+;/g," ").replace(/&#\d+;/g," ").replace(/\s+/g," ").trim(),mk=(u,z,lnk,dt)=>{const O=analyzeNewsImpact(u,z);return{id:t.id+":"+u.slice(0,60),source:t.name,sourceId:t.id,category:t.category,title:u,link:lnk||"",date:dt||"",desc:(z||"").slice(0,240),affected:O.affected.map(([M])=>M),affectedScore:Object.fromEntries(O.affected),sectors:O.sectors,impact:O.impact,matched:O.matched,comment:O.comment}},parseXML=x=>{const out=[],items=x.match(/<item[\s\S]*?<\/item>/gi)||[];for(const b of items.slice(0,20)){const g=M=>{const N=b.match(new RegExp("<"+M+"[^>]*>([\\s\\S]*?)</"+M+">","i"));return N?clean(N[1]):""},u=g("title");u&&u.length>=10&&out.push(mk(u,g("description")||g("summary"),g("link"),g("pubDate")||g("date")))}return out};
  try{const r=await to("https://api.rss2json.com/v1/api.json?rss_url="+enc+"&count=20",9e3);if(r.ok){const j=await r.json();if(j.status==="ok"&&j.items?.length)return j.items.slice(0,20).map(it=>mk((it.title||"").trim(),clean(it.description||it.content),it.link,it.pubDate)).filter(x=>x.title.length>=10)}}catch{}
  try{const r=await to("https://api.allorigins.win/get?url="+enc,8e3);if(r.ok){const j=await r.json(),res=parseXML(j.contents||"");if(res.length)return res}}catch{}
  try{const r=await to("https://cors.lol/?url="+enc,9e3);if(r.ok){const x=await r.text();if(x.includes("<item")){const res=parseXML(x);if(res.length)return res}}}catch{}
  try{const r=await to("https://api.codetabs.com/v1/proxy?quest="+enc,9e3);if(r.ok){const x=await r.text();if(x.includes("<item")){const res=parseXML(x);if(res.length)return res}}}catch{}
  return[]
}
function feyAILocalAnalysis(t,i,a,e,r,d,n,c,b,y){
  const u=a.last||{
  },E=a.final,B=a.confidence,z=a.mod,O=a.adx||0,M=a.trendMod||a.higherTrend||"\u2014",N=getRiskScore(a,e.price),K=a.signals?.PA?.label,L=a.signals?.PA?.strength||0,W=classifyTradeMode(a),P=[];
  u.ma200&&u.close>u.ma200&&P.push("Fiyat MA200 \xFCst\xFCnde (uzun trend yukar\u0131)"),u.ma50&&u.ma200&&u.ma50>u.ma200&&P.push("Golden Cross aktif (MA50>MA200)"),u.macdHist>0&&P.push("MACD histogram\u0131 pozitif (momentum yukar\u0131)"),u.rsi>=40&&u.rsi<=65&&P.push(`RSI ${u.rsi.toFixed(0)} sa\u011Fl\u0131kl\u0131 b\xF6lgede`),O>=25&&P.push(`ADX ${O.toFixed(0)} \u2014 g\xFC\xE7l\xFC trend onayl\u0131`),K&&L>=75&&P.push(`Price Action: ${K} (g\xFC\xE7 ${L})`),a.htfNote&&a.htfNote.includes("\u2713")&&P.push("G\xFCnl\xFCk trend AYNI Y\xD6N onay\u0131"),a.dipSignal?.score>=5&&P.push(`Dip Avc\u0131 ${a.dipSignal.score}/7 \u015Fart`),u.volume&&u.avgVol&&u.volume>u.avgVol*1.3&&P.push(`Hacim ortalaman\u0131n %${Math.round((u.volume/u.avgVol-1)*100)} \xFCst\xFCnde`);
  const V=[];
  u.rsi>=70&&V.push(`RSI ${u.rsi.toFixed(0)} a\u015F\u0131r\u0131 al\u0131mda \u2014 geri \xE7ekilme riski`),u.rsi<=30&&V.push(`RSI ${u.rsi.toFixed(0)} a\u015F\u0131r\u0131 sat\u0131mda \u2014 temkinli ol`),u.ma200&&u.close<u.ma200&&V.push("Fiyat MA200 alt\u0131nda (uzun trend zay\u0131f)"),O>0&&O<18&&V.push(`ADX ${O.toFixed(0)} \u2014 zay\u0131f trend, y\xF6n belirsiz`),a.htfNote&&a.htfNote.includes("\u26A0")&&V.push("G\xFCnl\xFCk trend \xC7EL\u0130\u015EK\u0130L\u0130 \u2014 alt-\xFCst TF uyumsuz"),N.level==="Y\xDCKSEK"&&V.push(`Y\xFCksek risk \u2014 ATR %${N.atrPct}, likidite ${N.turnover.toLocaleString("tr-TR")} TL`),u.bbU&&u.close>u.bbU*.98&&V.push(`Bollinger \xFCst banda yak\u0131n (%${((u.close-u.bbL)/(u.bbU-u.bbL)*100).toFixed(0)})`);
  const q=E==="AL"?`AL %${B}`:E==="SAT"?`SAT %${B}`:`BEKLE %${B}`;
  let ge="";
  E==="AL"&&M==="YUKARI"?ge="Trend yukar\u0131, sinyal g\xFC\xE7l\xFC \u2192 momentum'a kat\u0131l":E==="AL"&&a.dipSignal?ge="Dip d\xF6n\xFC\u015F tespit edildi \u2192 erken giri\u015F":E==="AL"?ge="Zay\u0131f-orta AL \u2014 k\xFC\xE7\xFCk lot, s\u0131k\u0131 stop":E==="SAT"&&M==="ASAGI"?ge="Trend a\u015Fa\u011F\u0131 + sat sinyali \u2192 \xE7\u0131k\u0131\u015F":E==="SAT"?ge="Geri \xE7ekilme bekleniyor":ge=a.waitReasons?.length?`Bekle: ${a.waitReasons.join(" \xB7 ")}`:"\u0130ndikat\xF6rler net sinyal vermiyor";
  let Y="";
  const ie=(c||[]).filter(H=>H.sym===t);
  if(ie.length>0){
    const H=ie.filter(ne=>ne.pnlPct>0).length,ve=ie.reduce((ne,Je)=>ne+(Je.pnlPct||0),0)/ie.length;
    Y=`
## \u{1F4DA} Bu hissede ge\xE7mi\u015Fin
- ${ie.length} trade, ${H}'i kazan\xE7 (%${Math.round(H/ie.length*100)} isabet)
- Ortalama PNL: ${ve>=0?"+":""}${ve.toFixed(1)}%`;
    const Q=ie.slice(-3).reverse();
    Y+=`
- Son trade'ler: ${Q.map(ne=>`${ne.entry}\u2192${ne.exit} (${ne.pnlPct>=0?"+":""}${ne.pnlPct.toFixed(1)}%)`).join(" \xB7 ")}`
  }
  const $=(n||[]).find(H=>H.sym===t);
  let Ve="";
  if($){
    const H=(e.price-$.entry)/$.entry*100;
    Ve=`
## \u{1F4BC} A\xE7\u0131k pozisyonun var
- ${$.lots} lot, giri\u015F ${$.entry}\u20BA \xB7 Anl\u0131k PNL: ${H>=0?"+":""}${H.toFixed(2)}%${$.stop?` \xB7 Stop ${$.stop}\u20BA`:""}${$.target?` \xB7 Hedef ${$.target}\u20BA`:""}`
  }
  let he="";
  b!=null&&(he=`
## \u{1F3E2} Sekt\xF6r ba\u011Flam\u0131
- Bug\xFCn sekt\xF6r ortalama: ${b>=0?"+":""}${b.toFixed(2)}% \u2014 ${b>.5?"pozitif rotasyon":b<-.5?"negatif bask\u0131":"yatay"}`);
  let Ke="";
  y&&y.length>0&&(Ke=`
## \u{1F4F0} Son haberler (etki)
${y.slice(0,3).map(H=>`- ${H.title} \u2192 ${H.impact>0?"\u2191":H.impact<0?"\u2193":"\u2014"}`).join(`
`)}`);
  let we="";
  if(a.stopLoss){
    const H=e.price,ve=Math.abs((H-a.stopLoss)/H*100).toFixed(1),Q=Math.abs((a.target1-H)/H*100).toFixed(1),ne=a.target2?Math.abs((a.target2-H)/H*100).toFixed(1):null;
    we=`
## \u{1F3AF} Plan
- **Giri\u015F**: ${H}\u20BA
- **Stop**: ${a.stopLoss}\u20BA (-${ve}%)
- **H1**: ${a.target1}\u20BA (+${Q}%)${ne?`
- **H2**: ${a.target2}\u20BA (+${ne}%)`:""}
- **Vade**: ${r?.dur||"\u2014"}
- **Risk**: ${N.emoji} ${N.level}`
  }
  const lehine=P.length>0?P.slice(0,4).join(" \xB7 "):"belirgin sinyal yok",dikkat=V.length>0?V.slice(0,3).join(" \xB7 "):"belirgin risk yok",plan=a.stopLoss?`\u{1F3AF} G\u0130R\u0130\u015E ${e.price}\u20BA  \u26D4 STOP ${a.stopLoss}  \u{1F3C1} HEDEF ${a.target1}${a.target2?" / "+a.target2:""}  \u23F1 ${r?.dur||"\u2014"}`:"";
  return`\u{1F985} EAGLE EYE \u2014 ${t}${i?"  \xB7  "+i:""}

\u27A4  ${q}   ${N.emoji} ${N.level} R\u0130SK
${ge}.
${plan?"\n"+plan+"\n":""}
\u2705 Lehine:  ${lehine}
\u26A0\uFE0F Dikkat:  ${dikkat}${Y}${Ve}${he}${Ke}
\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014
EAGLE EYE AI \xB7 yerel motor \xB7 yat\u0131r\u0131m tavsiyesi de\u011Fildir`
}
function buildUserHistoryContext(t,i,a,e){
  const r=[],d=(a||[]).slice(-20);
  if(d.length>0){
    const n=d.filter(c=>(c.pnlPct||0)>0).length;
    r.push(`KAPANAN TRADE'LER (${d.length}): isabet %${Math.round(n/d.length*100)}`),d.slice(-10).forEach(c=>{
      r.push(`\u2022 ${c.sym}: giri\u015F ${c.entry}\u20BA \u2192 \xE7\u0131k\u0131\u015F ${c.exit}\u20BA (PNL ${c.pnlPct>=0?"+":""}${c.pnlPct?.toFixed(1)}%) \u2014 "${(c.reason||"").slice(0,80)}"`)
    })
  }
  if(t&&t.length>0&&(r.push(`
A\xC7IK POZ\u0130SYONLAR (${t.length}):`),t.slice(0,10).forEach(n=>{
    const c=e&&n.sym===e?" [BU H\u0130SSE]":"";
    r.push(`\u2022 ${n.sym}${c}: ${n.lots} lot, giri\u015F ${n.entry}\u20BA${n.stop?", stop "+n.stop:""}${n.note?` (not: "${n.note.slice(0,50)}")`:""}`)
  })),i&&i.length>0){
    const n=e?i.filter(c=>c.symbol===e).slice(-5):i.slice(-10);
    n.length>0&&(r.push(`
SON S\u0130NYAL DE\u011E\u0130\u015E\u0130MLER\u0130:`),n.forEach(c=>{
      r.push(`\u2022 ${c.symbol}: ${c.from} \u2192 ${c.to} (${c.dateKey||"\u2014"})`)
    }))
  }
  return r.join(`
`)
}
function ChartTip({
  active:t,payload:i,label:a
}){
  return!t||!i?.length?null:React.createElement("div",{
    style:{
      background:T.bg1,border:`1px solid ${T.border2}`,borderRadius:6,padding:"8px 12px",fontSize:12,fontFamily:T.font
    }
  },React.createElement("div",{
    style:{
      color:T.muted,marginBottom:3
    }
  },a),i.map((e,r)=>React.createElement("div",{
    key:r,style:{
      color:e.color||e.stroke||T.text
    }
  },e.name,": ",typeof e.value=="number"?e.value.toFixed(4):e.value)))
}
const BistLogo=({
  size:t=22
})=>{
  const[i,a]=useState(!1);
  return i?React.createElement("span",{
    style:{
      fontSize:t,lineHeight:1
    }
  },"\u20BA"):React.createElement("img",{
    src:"bist-logo.png",alt:"BIST",width:t,height:t,onError:()=>a(!0),style:{
      display:"block",margin:"0 auto",borderRadius:"50%"
    }
  })
};
function NavBtn({
  id:t,page:i,setPage:a,icon:e,label:r,badge:d
}){
  const n=i===t;
  return React.createElement("div",{
    className:`nav-item${n?" active":""}`,onClick:()=>a(t),style:{
      padding:"14px 0",textAlign:"center",position:"relative"
    }
  },React.createElement("div",{
    style:{
      fontSize:20,color:n?T.green:T.muted,lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center",height:22
    }
  },e),React.createElement("div",{
    style:{
      fontSize:10,color:n?T.green:T.muted,letterSpacing:.2,marginTop:4,fontWeight:500
    }
  },r),d>0&&React.createElement("div",{
    style:{
      position:"absolute",top:6,right:8,background:T.green,color:T.bg,borderRadius:"50%",width:16,height:16,fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700
    }
  },d>99?"99+":d))
}
let _audioCtx=null;
function notifySignal(t,i,a,e){
  if(!(!("Notification"in window)||Notification.permission!=="granted"))try{
    const r="bist-logo.png",d=`${t}: ${i} ${e?`%${e}`:""}`,n=`${a!=null?"Fiyat: "+(+a).toFixed(2)+"\u20BA \xB7 ":""}Sinyal de\u011Fi\u015Fti \u2014 kontrol et`,c=new Notification(d,{
      body:n,icon:r,badge:r,tag:"feysbot-"+t,vibrate:[200,100,200],silent:!1
    });
    c.onclick=()=>{
      window.focus(),c.close()
    },setTimeout(()=>c.close(),1e4)
  }
  catch{
  }
}
function playBip(t="up"){
  try{
    _audioCtx||(_audioCtx=new(window.AudioContext||window.webkitAudioContext));
    const i=_audioCtx;
    i.state==="suspended"&&i.resume();
    const a=i.createOscillator(),e=i.createGain();
    a.connect(e),e.connect(i.destination),a.type="sine";
    const r=t==="up"?660:880,d=t==="up"?990:440;
    a.frequency.setValueAtTime(r,i.currentTime),a.frequency.exponentialRampToValueAtTime(d,i.currentTime+.12),e.gain.setValueAtTime(1e-4,i.currentTime),e.gain.exponentialRampToValueAtTime(.18,i.currentTime+.02),e.gain.exponentialRampToValueAtTime(1e-4,i.currentTime+.22),a.start(),a.stop(i.currentTime+.25)
  }
  catch{
  }
}
const mailCooldown={
};
function canSendMail(t){
  const i=mailCooldown[t]??0;
  return Date.now()-i<30*60*1e3?!1:(mailCooldown[t]=Date.now(),!0)
}
const ls={
  load:(t,i)=>{
    try{
      return JSON.parse(localStorage.getItem(t)||JSON.stringify(i))
    }
    catch{
      return i
    }
  },save:(t,i)=>{
    try{
      localStorage.setItem(t,JSON.stringify(i))
    }
    catch{
    }
  }
};
function BISTBot(){
  const[t,i]=useState("market"),[a,e]=useState("THYAO"),[r,d]=useState("fiyat"),[n,c]=useState(""),[b,y]=useState(!1),[u,E]=useState([]),[B,z]=useState({
  }),[O,M]=useState(!1),[N,K]=useState(null),[L,W]=useState(null),[P,V]=useState(0),[q,ge]=useState(!1),[Y,ie]=useState([]),[$,Ve]=useState([]),[he,Ke]=useState(!1),[we,Ie]=useState({
  }),[H,ve]=useState(!1),[Q,ne]=useState(null),[Je,se]=useState([]),[dt,tt]=useState(!1),[ct,it]=useState(null),[pt,mt]=useState(null),[ce,Ge]=useState(null),[I,f]=useState(!1),[_,pe]=useState("candle"),[Z,gt]=useState(()=>{
    try{
      return JSON.parse(localStorage.getItem("feybot_positions")||"[]")
    }
    catch{
      return[]
    }
  }),[nt,at]=useState(null),[xt,Ft]=useState(""),[Ye,je]=useState(""),[kt,ht]=useState(""),[ft,Me]=useState(""),[$e,Pe]=useState(""),[be,me]=useState(""),[w,J]=useState(()=>ls.load(LS_JOURNAL,[])),[X,Ce]=useState(()=>ls.load(LS_FAVGRP,{
  })),[Ee,ee]=useState("__ALL__"),[Ae,te]=useState("all"),[oe,vt]=useState(()=>ls.load(LS_AICACHE,null)),[He,Et]=useState(!1),[Re,yt]=useState(null),[Be,Ot]=useState("today"),[re,Oe]=useState(()=>ls.load("feybot_alarms",[])),[ot,g]=useState(null),[F,G]=useState("price"),[U,Te]=useState(">"),[De,Ne]=useState("");
  useEffect(()=>{
    ls.save("feybot_alarms",re)
  },[re]),useEffect(()=>{
    if(!re||re.length===0)return;
    let o=!1;
    const l=re.map(p=>{
      if(p.fired)return p;
      const S=B[p.sym];
      if(!S)return p;
      let C=null;
      if(p.type==="price")C=S.price;
      else if(p.type==="rsi"){
        const m=liveCache[p.sym];
        if(!m||m.length<14)return p;
        const k=enrichData(m);
        C=k[k.length-1]?.rsi
      }
      else if(p.type==="ma200"){
        const m=histCache[p.sym];
        if(!m||m.length<200)return p;
        const k=enrichData(m);
        C=k[k.length-1]?.ma200
      }
      else if(p.type==="macd"){
        const m=liveCache[p.sym];
        if(!m||m.length<26)return p;
        const k=enrichData(m);
        C=k[k.length-1]?.macdHist
      }
      if(C==null)return p;
      if(p.op===">"&&C>p.value||p.op==="<"&&C<p.value){
        o=!0;
        const m=p.type==="price"?`Fiyat ${p.op} ${p.value}\u20BA`:`${p.type.toUpperCase()} ${p.op} ${p.value}`;
        try{
          if("Notification"in window&&Notification.permission==="granted"){
            const k=new Notification(`\u{1F514} ${p.sym} ALARM: ${m}`,{
              body:`Anl\u0131k: ${C.toFixed(2)} \xB7 Fiyat: ${S.price?.toFixed(2)}\u20BA`,icon:"bist-logo.png",tag:"alarm-"+p.id,vibrate:[200,100,200]
            });
            k.onclick=()=>{
              window.focus(),k.close()
            },setTimeout(()=>k.close(),12e3)
          }
        }
        catch{
        }
        return{
          ...p,fired:!0,firedAt:Date.now(),firedValue:+C.toFixed(2),firedPrice:S.price
        }
      }
      return p
    });
    o&&Oe(l)
  },[B]);
  const[le,Ue]=useState(()=>ls.load("feybot_news",[])),[Le,$t]=useState(!1),[rt,ai]=useState("all"),[Nt,oi]=useState(()=>+localStorage.getItem("feybot_news_ts")||0),Pt=async()=>{
    if(!Le){
      $t(!0);
      try{
        const o=await(async()=>{const A=[];for(const C of NEWS_SOURCES){try{A.push(...await fetchNewsRSS(C))}catch{}await new Promise(R=>setTimeout(R,260))}return A})(),l=new Set,p=o.filter(C=>{
          const m=C.title.toLowerCase().slice(0,80);
          return l.has(m)?!1:(l.add(m),!0)
        });
        p.sort((C,m)=>{
          const k=Date.parse(C.date||0);
          return(Date.parse(m.date||0)||0)-(k||0)
        }),Ue(p.slice(0,80)),ls.save("feybot_news",p.slice(0,80));
        const S=Date.now();
        oi(S),localStorage.setItem("feybot_news_ts",S)
      }
      catch(o){
        console.error("news",o)
      }
      finally{
        $t(!1)
      }
    }
  };
  useEffect(()=>{
    t==="news"&&Date.now()-Nt>30*60*1e3&&Pt()
  },[t]);
  const[bt,ri]=useState(()=>ls.load(LS_SECTORHIST,{
  }));
  useEffect(()=>{
    try{
      localStorage.setItem("feybot_positions",JSON.stringify(Z))
    }
    catch{
    }
  },[Z]),useEffect(()=>{
    ls.save(LS_JOURNAL,w)
  },[w]),useEffect(()=>{
    ls.save(LS_FAVGRP,X)
  },[X]),useEffect(()=>{
    const o=new Date().toISOString().slice(0,10);
    if(bt[o])return;
    const l={
    };
    if(Object.entries(BIST_SECTORS).forEach(([C,m])=>{
      const k=m.map(s=>B[s]?.rate).filter(s=>s!=null);
      k.length>=2&&(l[C]=+(k.reduce((s,A)=>s+A,0)/k.length).toFixed(2))
    }),Object.keys(l).length===0)return;
    const p=new Date(Date.now()-60*864e5).toISOString().slice(0,10),S={
      ...Object.fromEntries(Object.entries(bt).filter(([C])=>C>=p)),[o]:l
    };
    ri(S),ls.save(LS_SECTORHIST,S)
  },[B,bt]);
  const li=(o,l,p)=>{
    at({
      sym:o,livePrice:p,sigRes:l
    }),Ft(""),je((p??l?.last?.close??"").toString()),ht((l?.stopLoss??"").toString()),Me((l?.target1??"").toString()),Pe(l?.mod??"");
    const S=l?`${l.mod||"Sinyal"} \xB7 G\xFCven %${l.confidence} \xB7 ATR ${l.atr?.toFixed(2)}`:"";
    me(S)
  },si=()=>{
    if(!nt||!+xt||!+Ye)return;
    const o={
      id:Date.now(),sym:nt.sym,lots:+xt,entry:+Ye,stop:+kt||null,target:+ft||null,note:$e,reason:be||"",openedAt:Date.now(),ts:Date.now()
    };
    gt(l=>[...l,o]),at(null)
  },ui=(o,l)=>{
    const p=Z.find(S=>S.id===o);
    if(p){
      const S=l??B[p.sym]?.price??p.entry,C=Math.max(1,Math.round((Date.now()-(p.openedAt||p.ts))/864e5)),m=calcPnl(p.entry,S,p.lots),k={
        id:p.id,sym:p.sym,lots:p.lots,entry:p.entry,exit:+S.toFixed(2),pnl:+m.pnl.toFixed(0),pnlPct:m.pnlPct,days:C,reason:p.reason||p.note||"",note:p.note||"",openedAt:p.openedAt||p.ts,closedAt:Date.now()
      };
      J(s=>[...s,k].slice(-200))
    }
    gt(S=>S.filter(C=>C.id!==o))
  },[Tt,di]=useState(()=>+(localStorage.getItem("feybot_pf")||1e5)),[Ht,ci]=useState(()=>+(localStorage.getItem("feybot_risk")||1.5)),[pi,mi]=useState(0),[xe,Ut]=useState(localStorage.getItem("feybot_aikey")||""),[gi,Wt]=useState(!1),[ue,Ct]=useState(null),[lt,Vt]=useState(!1),[Rt,zt]=useState(null),jt=async(o,l,p,S,C)=>{
    if(zt(null),Ct(null),!p||!p.last){
      zt("Sinyal verisi hen\xFCz haz\u0131rlanmad\u0131 \u2014 birka\xE7 saniye bekleyip tekrar dene.");
      return
    }
    const m=p.last,k=m.bbU&&m.bbL&&m.bbU!==m.bbL?((m.close-m.bbL)/(m.bbU-m.bbL)).toFixed(2):"\u2014",s={
      price:C||m.close,rsi:m.rsi?.toFixed(1)??"\u2014",macdHist:m.macdHist?.toFixed(3)??"\u2014",bbPos:k,stoch:m.stochRsi?.toFixed(1)??"\u2014",atr:p.atr??"\u2014"
    },A=(()=>{
      for(const[h,R]of Object.entries(BIST_SECTORS)){
        if(!R.includes(o))continue;
        const D=R.map(j=>B[j]?.rate).filter(j=>j!=null);
        if(D.length>=2)return D.reduce((j,Se)=>j+Se,0)/D.length
      }
      return null
    })(),x=(le||[]).filter(h=>h.affected&&h.affected.includes(o)).slice(0,3);
    if(!xe){
      const h=feyAILocalAnalysis(o,l,p,s,p.profile,S,Z,w,A,x);
      Ct({
        symbol:o,text:h,time:new Date().toLocaleTimeString("tr-TR"),engine:"eagle-ai"
      });
      return
    }
    if(Date.now()-pi<5e3){
      zt("\xC7ok h\u0131zl\u0131 \u2014 5 sn bekle (API maliyeti korumas\u0131)");
      return
    }
    mi(Date.now()),Vt(!0);
    try{
      const h=buildUserHistoryContext(Z,_e,w,o),R=await aiAnalyze(xe,o,l,p,s,p.profile,S,h);
      Ct({
        symbol:o,text:R,time:new Date().toLocaleTimeString("tr-TR"),engine:"claude"
      })
    }
    catch(h){
      const R=feyAILocalAnalysis(o,l,p,s,p.profile,S,Z,w,A,x);
      Ct({
        symbol:o,text:R+`
---
\u26A0 Claude API hatas\u0131: `+h.message+" \u2014 yerel motor cevap verdi.",time:new Date().toLocaleTimeString("tr-TR"),engine:"eagle-ai-fallback"
      })
    }
    finally{
      Vt(!1)
    }
  },[qe,Zt]=useState(localStorage.getItem(LS_EMAIL)||""),[Ze,_t]=useState(!!localStorage.getItem(LS_EMAIL)),[xi,Xt]=useState(!1),[Jt,fi]=useState(()=>ls.load(LS_ALERTS,[])),[yi,qt]=useState(!1),[Kt,Bt]=useState(null),[ae,bi]=useState(()=>ls.load(LS_FAVS,[])),[_e,Qt]=useState(()=>ls.load(LS_SIGHIST,[])),[sgE,sgZ]=useState(-1),[sgQ,sgQz]=useState(""),[sgTara,sgTaraz]=useState(!1),[pap,papZ]=useState(()=>ls.load("feybot_paper",{cash:1e5,start:1e5,pos:{},trades:[],seen:{},dayKey:"",dayStart:1e5})),st=useRef(ls.load(LS_PREVSIGS,{
  })),Xe=useRef(a);
  useEffect(()=>{
    Xe.current=a
  },[a]),useEffect(()=>{
    if(!_e||!_e.length)return;
    const today=new Date().toISOString().slice(0,10);
    papZ(P=>{
      let{cash:cash,start:start,pos:pos,trades:trades,seen:seen,dayKey:dayKey,dayStart:dayStart}=P,ch=!1;
      pos={...pos},seen={...seen},trades=[...trades];
      for(const sg of _e){
        const id=sg.symbol+"_"+sg.dateKey+"_"+sg.to;
        if(seen[id])continue;
        const px=allStocks[sg.symbol]?.price||+sg.price;
        if(!px||!isFinite(px)){seen[id]=1;continue}
        if(sg.to==="AL"&&!pos[sg.symbol]){
          const lot=Math.floor(cash*.1/px);
          lot>0&&(cash-=lot*px,pos[sg.symbol]={lot:lot,entry:px,date:sg.dateKey||today},ch=!0)
        }else if(sg.to==="SAT"&&pos[sg.symbol]){
          const q=pos[sg.symbol];
          cash+=q.lot*px,trades.unshift({sym:sg.symbol,entry:q.entry,exit:px,lot:q.lot,pnl:+((px-q.entry)*q.lot).toFixed(0),pnlPct:+((px-q.entry)/q.entry*100).toFixed(2),open:q.date,close:today}),delete pos[sg.symbol],ch=!0
        }
        seen[id]=1,ch=!0
      }
      let mailDue=!1;
      dayKey&&dayKey!==today&&(mailDue=!0,dayStart=cash+Object.entries(pos).reduce((a,[s,q])=>a+q.lot*(allStocks[s]?.price||q.entry),0));
      if(!ch&&dayKey===today)return P;
      const np={cash:cash,start:start,pos:pos,trades:trades.slice(0,200),seen:seen,dayKey:today,dayStart:dayStart||start};
      ls.save("feybot_paper",np);
      if(mailDue&&Ze&&qe)try{
        const eq=np.cash+Object.entries(np.pos).reduce((a,[s,q])=>a+q.lot*(allStocks[s]?.price||q.entry),0),kz=eq-np.start,kzp=(kz/np.start*100).toFixed(2);
        sendAlertEmail(qe,"\u{1F4B0} SİMÜLATÖR",kz>=0?"KAR":"ZARAR",eq.toFixed(0),kzp).catch(()=>{})
      }catch{}
      return np
    })
  },[_e,allStocks]),useEffect(()=>{
    localStorage.setItem("feybot_pf",Tt)
  },[Tt]),useEffect(()=>{
    localStorage.setItem("feybot_risk",Ht)
  },[Ht]),useEffect(()=>{
    const o=Object.keys(st.current);
    if(o.length>100){
      const l={
      };
      o.slice(-100).forEach(p=>{
        l[p]=st.current[p]
      }),st.current=l,ls.save(LS_PREVSIGS,l)
    }
  },[P]);
  const ei=o=>{
    bi(l=>{
      const p=l.includes(o)?l.filter(S=>S!==o):[...l,o];
      return ls.save(LS_FAVS,p),p
    })
  },wt=useMemo(()=>{
    const o=n.toUpperCase();
    return o.length<1?STOCKS:STOCKS.filter(l=>l.symbol.includes(o)||l.name.toUpperCase().includes(o))
  },[n]),Qe=useCallback(o=>{
    const l=liveCache[o]??[],p=histCache[o]??[],S=l.length>=30?l:[...p,...l];
    S.length>0?E(enrichData(S)):E([])
  },[]),ut=useCallback(async()=>{
    M(!0),K(null);
    try{
      const o=STOCKS.slice(0,50).map(A=>A.symbol),l=Array.from(new Set([Xe.current,...ae,...o])).filter(Boolean),p=new Date().toLocaleTimeString("tr-TR",{
        hour:"2-digit",minute:"2-digit",second:"2-digit"
      }),S={
        ...B
      },C=5;
      for(let A=0;
      A<l.length;
      A+=C){
        const x=l.slice(A,A+C);
        await Promise.all(x.map(async h=>{
          try{
            const R=await fetchYahooChart(h,"15m","5d");
            if(R?.rows?.length){
              liveCache[h]=R.rows,liveTS[h]=Date.now();
              const D=R.rows[R.rows.length-1],j=R.meta?.regularMarketPrice??D.close,Se=R.meta?.previousClose??R.meta?.chartPreviousClose;
              let ze;
              if(Se&&Se>0)ze=+((j-Se)/Se*100).toFixed(2);
              else{
                const Fe=new Date((D.ts||Date.now())+108e5).toISOString().slice(0,10);
                let ye=D;
                for(const de of R.rows)if(new Date((de.ts||0)+108e5).toISOString().slice(0,10)===Fe){
                  ye=de;
                  break
                }
                ze=ye.open>0?+((j-ye.open)/ye.open*100).toFixed(2):0
              }
              S[h]={
                price:j,rate:ze,hacim:D.volume
              },saveCache(h)
            }
          }
          catch{
          }
        }))
      }
      z(S),W(p),Qe(Xe.current);
      const m={
        ...st.current
      },k=[],s=[];
      for(const A of l){
        const x=liveCache[A]??[];
        if(!(x.length<20))try{
          const h=getSignals(enrichData(x),getHigherTrend(histCache[A]),histCache[A]);
          if(!h)continue;
          const R=m[A];
          if(R!==void 0&&R!==h.final&&(s.push({
            symbol:A,from:R,to:h.final,price:h.last.close?.toFixed(2),confidence:h.confidence,time:p,dateKey:new Date().toISOString().slice(0,10)
          }),(h.final==="AL"||h.final==="SAT")&&(playBip(h.final==="AL"?"up":"down"),notifySignal(A,h.final,h.last.close,h.confidence)),Ze&&qe&&h.final!=="N\xD6TR"&&canSendMail(A))){
            qt(!0);
            try{
              await sendAlertEmail(qe,A,h.final,h.last.close,h.confidence),k.push({
                symbol:A,signal:h.final,price:h.last.close?.toFixed(2),time:p,sent:!0
              })
            }
            catch(D){
              k.push({
                symbol:A,signal:h.final,price:h.last.close?.toFixed(2),time:p,sent:!1,error:D.message
              })
            }
            finally{
              qt(!1)
            }
          }
          m[A]=h.final
        }
        catch{
        }
      }
      st.current=m,ls.save(LS_PREVSIGS,m),s.length>0&&Qt(A=>{
        const x=[...s,...A].slice(0,200);
        return ls.save(LS_SIGHIST,x),x
      }),k.length>0&&fi(A=>{
        const x=[...k,...A].slice(0,50);
        return ls.save(LS_ALERTS,x),x
      }),V(A=>A+1)
    }
    catch(o){
      K(`Veri al\u0131namad\u0131: ${o.message}`)
    }
    finally{
      M(!1)
    }
  },[Ze,qe,Qe,ae]);
  useEffect(()=>{
    ut();
    let o;
    const l=()=>{
      const p=new Date().getHours(),S=p>=10&&p<18?6e4:24e4;
      o=setTimeout(async()=>{
        await ut(),l()
      },S)
    };
    return l(),()=>clearTimeout(o)
  },[]),useEffect(()=>{
    t==="crypto"&&$.length===0&&!he&&Gt(!1)
  },[t]),useEffect(()=>{
    let o=!1;
    Qe(a);
    const l=async(p=1)=>{
      if(o)return;
      const S=await fetchYahooChart(a,"15m","5d");
      o||(S?.rows?.length?(liveCache[a]=S.rows,liveTS[a]=Date.now(),saveCache(a),Qe(a)):p<3&&setTimeout(()=>l(p+1),2500))
    };
    return(!liveCache[a]||liveCache[a].length<20||Date.now()-(liveTS[a]??0)>3*6e4)&&l(),(!histCache[a]||Date.now()-(histTS[a]??0)>12*36e5)&&fetchYahooChart(a,"1d","1y").then(p=>{
      o||!p?.rows?.length||(histCache[a]=p.rows,histTS[a]=Date.now(),saveCache(a))
    }),()=>{
      o=!0
    }
  },[a,Qe]),useEffect(()=>{
    const o=()=>Object.keys(liveCache).forEach(l=>{
      (liveCache[l]?.length??0)>0&&saveCache(l)
    });
    return window.addEventListener("beforeunload",o),()=>window.removeEventListener("beforeunload",o)
  },[]),useEffect(()=>{
    const o=()=>{
      document.visibilityState==="visible"&&(ut(),fetchYahooChart(Xe.current,"15m","5d").then(l=>{
        l?.rows?.length&&(liveCache[Xe.current]=l.rows,liveTS[Xe.current]=Date.now(),saveCache(Xe.current),Qe(Xe.current))
      }))
    };
    return document.addEventListener("visibilitychange",o),window.addEventListener("focus",o),()=>{
      document.removeEventListener("visibilitychange",o),window.removeEventListener("focus",o)
    }
  },[ut,Qe]);
  const Ai=async()=>{
    Bt("sending");
    try{
      await sendAlertEmail(qe,"THYAO","AL",99.5,82),Bt("ok")
    }
    catch{
      Bt("err")
    }
    setTimeout(()=>Bt(null),4e3)
  },Si=async o=>{
    ne(o),i("cryptoDetail"),tt(!0),se([]),it(null);
    const[l,p]=await Promise.all([fetchCryptoKlines(o.pair,"15m",200,o.coingeckoId),fetchCryptoKlines(o.pair,"1d",100,o.coingeckoId)]);
    l?.length&&se(enrichData(l)),p?.length&&(it(getHigherTrend(p)),mt(p)),tt(!1)
  },Gt=async(o=!1)=>{
    Ke(!0);
    const l=await fetchTopCryptos();
    if(Ve(l),Ke(!1),o&&l.length){
      ve(!0);
      const p={
      },S=6;
      for(let C=0;
      C<l.length;
      C+=S){
        const m=l.slice(C,C+S);
        await Promise.all(m.map(async k=>{
          try{
            const[s,A]=await Promise.all([fetchCryptoKlines(k.pair,"15m",200,k.coingeckoId),fetchCryptoKlines(k.pair,"1d",100,k.coingeckoId)]);
            if(!s||s.length<20)return;
            const x=getSignals(enrichData(s),getHigherTrend(A),A);
            x&&x.final!=="N\xD6TR"&&x.confidence>=50&&(p[k.symbol]={
              signal:x.final,confidence:x.confidence,mod:x.mod,price:k.price,atr:x.atr,stopLoss:x.stopLoss,target1:x.target1,paLabel:x.signals?.PA?.label,paStrength:x.signals?.PA?.strength,priority:x.confidence+(x.signals?.PA?.strength>=86?25:0)
            })
          }
          catch{
          }
        })),Ie({
          ...p
        })
      }
      ve(!1)
    }
  },Fi=async()=>{
    ge(!0),ie([]);
    const o=[],l=["A1CAP","AEFES","AFYON","AGESA","AGHOL","AGROT","AHGAZ","AKBNK","AKCNS","AKFYE","AKGRT","AKSA","AKSEN","AKSGY","AKSUE","ALARK","ALBRK","ALCAR","ALCTL","ALFAS","ALKIM","ALTIN","ALTNY","ANELE","ANHYT","ANSGR","ARCLK","ARDYZ","ASELS","ASTOR","ASUZU","AYDEM","AYGAZ","AYEN","BAGFS","BAKAB","BANVT","BERA","BIENY","BIMAS","BINHO","BIOEN","BJKAS","BRSAN","BRYAT","BSOKE","BTCIM","BUCIM","BURCE","CANTE","CCOLA","CEMAS","CEMTS","CIMSA","CLEBI","CMBTN","CWENE","DAPGM","DEVA","DGATE","DGGYO","DOAS","DOHOL","DOCO","ECILC","ECZYT","EGEEN","EKGYO","EKSUN","ENERY","ENJSA","ENKAI","EREGL","ESEN","EUREN","FENER","FORTE","FROTO","GARAN","GENIL","GESAN","GLYHO","GOLTS","GOZDE","GSDHO","GSRAY","GUBRF","HALKB","HEKTS","ICBCT","IEYHO","IHGZT","INDES","INFO","INVEO","IPEKE","ISCTR","ISDMR","ISMEN","ISGYO","JANTS","KAREL","KARSN","KARTN","KCAER","KCHOL","KENT","KFEIN","KLGYO","KLMSN","KLSER","KMPUR","KOCMT","KONTR","KONYA","KORDS","KOZAA","KOZAL","KRDMA","KRDMB","KRDMD","LIDFA","LMKDC","LOGO","MAALT","MAGEN","MAVI","MERCN","METRO","MGROS","MIATK","MNDRS","MPARK","NATEN","NETAS","NTHOL","NUHCM","ODAS","ORGE","OTKAR","OYAKC","OYAYO","PAGYO","PARSN","PEKGY","PETKM","PGSUS","PINSU","PNSUT","PRKAB","PRKME","PSGYO","QNBFB","QUAGR","RAYSG","REEDR","SAHOL","SANEL","SARKY","SASA","SDTTR","SELEC","SEYKM","SISE","SKBNK","SMRTG","SODA","SOKM","TABGD","TATGD","TAVHL","TBORG","TCELL","THYAO","TKFEN","TKNSA","TMSN","TOASO","TRGYO","TSKB","TSPOR","TTKOM","TTRAK","TUKAS","TUPRS","TURSG","ULKER","ULUUN","VAKBN","VESBE","VESTL","YATAS","YEOTK","YKBNK","YYAPI","ZOREN","ZRGYO"],p=Array.from(new Set([...ae,...l])),S=8;
    for(let C=0;
    C<p.length;
    C+=S){
      const m=p.slice(C,C+S);
      (await Promise.all(m.map(async k=>{
        try{
          let s=liveCache[k];
          const A=Date.now()-(liveTS[k]??0);
          if(!s||s.length<20||A>3*60*1e3){
            const de=await fetchYahooChart(k,"15m","5d");
            de?.rows?.length&&(liveCache[k]=de.rows,liveTS[k]=Date.now(),s=de.rows)
          }
          if(!s||s.length<20)return null;
          const x=s[s.length-1];
          if(s.slice(-5).reduce((de,ke)=>de+(ke.volume||0),0)/5*(x?.close||0)<1e5)return null;
          let h=histCache[k];
          if(!h||h.length<50){
            const de=await fetchYahooChart(k,"1d","6mo");
            de?.rows?.length&&(histCache[k]=de.rows,histTS[k]=Date.now(),h=de.rows)
          }
          const R=getHigherTrend(h),D=getSignals(enrichData(s),R,h);
          if(!D||D.final==="N\xD6TR"||D.confidence<50)return null;
          const j=D.htfNote&&D.htfNote.includes("\u2713")?15:0,Se=D.signals.PA?.strength>=86?25:D.signals.PA?.strength>=80?12:0,ze=D.dipSignal?.score>=5?18:D.dipSignal?.score>=4?8:0,Fe=getRiskScore(D,D.last?.close),ye=classifyTradeMode(D);
          return{
            sym:k,signal:D.final,confidence:D.confidence,mod:D.mod,price:D.last.close,atr:D.atr,stopLoss:D.stopLoss,target1:D.target1,adx:D.adx,dipScore:D.dipSignal?.score,paLabel:D.signals.PA?.label,paStrength:D.signals.PA?.strength,htfNote:D.htfNote,durationLabel:D.profile?.dur,riskLevel:Fe.level,riskColor:Fe.color,riskEmoji:Fe.emoji,tradeMode:ye,priority:D.confidence+Se+ze+j
          }
        }
        catch{
          return null
        }
      }))).filter(Boolean).forEach(k=>o.push(k)),ie([...o].sort((k,s)=>k.signal!==s.signal?k.signal==="AL"?-1:1:k.sym.localeCompare(s.sym)))
    }
    ge(!1)
  },fe=B[a],v=useMemo(()=>getSignals(u,getHigherTrend(histCache[a]),histCache[a]),[u,a]),ti=useMemo(()=>{
    const o=["AKBNK","GARAN","ISCTR","YKBNK","HALKB","VAKBN","SAHOL","KCHOL","THYAO","BIMAS","FROTO","TOASO","SISE","EREGL","ASELS","TUPRS","PETKM","MGROS","TCELL","TTKOM"].map(l=>B[l]?.rate).filter(l=>l!=null);
    return o.length>5?+(o.reduce((l,p)=>l+p,0)/o.length).toFixed(2):null
  },[B]),et=fe?.rate!=null&&ti!=null?+(fe.rate-ti).toFixed(2):null,Dt=useMemo(()=>Y.filter(o=>o.signal==="AL").sort((o,l)=>(l.priority??l.confidence)-(o.priority??o.confidence)).slice(0,5),[Y]),Lt=useMemo(()=>Y.filter(o=>o.signal==="SAT").sort((o,l)=>(l.priority??l.confidence)-(o.priority??o.confidence)).slice(0,5),[Y]),ki=()=>{
    f(!0),setTimeout(()=>{
      const o=histCache[a];
      o&&o.length>60?Ge(backtest(o)):Ge({
        trades:0,winrate:0,avgPnl:0,score:0,error:"Yeterli ge\xE7mi\u015F veri yok"
      }),f(!1)
    },50)
  },At=u.slice(-80),It=fe?.rate??0,We=It>=0,ii=STOCKS.find(o=>o.symbol===a),Mt=ae.includes(a),St=v?.final==="AL"?T.green:v?.final==="SAT"?T.red:T.muted,Yt=v?.trendMod==="YUKARI"?T.green:v?.trendMod==="ASAGI"?T.red:T.muted,ni=At.filter((o,l)=>l%Math.ceil(Math.max(At.length/8,1))===0).map(o=>o.date),hi=[{
    id:"fiyat",label:"F\u0130YAT"
  },{
    id:"rsi",label:"RSI"
  },{
    id:"macd",label:"MACD"
  }],vi=useMemo(()=>ae.map(o=>{
    const l=liveCache[o]??[],p=B[o];
    if(l.length<20)return{
      sym:o,signal:"\u2014",confidence:0,price:p?.price,rate:p?.rate
    };
    try{
      const S=getSignals(enrichData(l),getHigherTrend(histCache[o]),histCache[o]);
      return{
        sym:o,signal:S?.final??"\u2014",confidence:S?.confidence??0,price:p?.price,rate:p?.rate,mod:S?.mod
      }
    }
    catch{
      return{
        sym:o,signal:"\u2014",confidence:0,price:p?.price,rate:p?.rate
      }
    }
  }),[P,ae,B]);
  return React.createElement("div",{
    className:"has-bottom-nav",style:{
      minHeight:"100vh",background:T.bg,color:T.text,fontFamily:T.font,display:"flex",flexDirection:"column"
    }
  },React.createElement("style",null,CSS),React.createElement("div",{
    style:{
      background:T.bg1,borderBottom:`1px solid ${T.border}`,flexShrink:0
    }
  },React.createElement("div",{
    style:{
      display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 14px",borderBottom:`1px solid ${T.border}`
    }
  },React.createElement("div",{
    style:{
      display:"flex",alignItems:"center",gap:10
    }
  },React.createElement("div",{
    style:{
      width:0,height:0,overflow:"hidden"
    }
  }),React.createElement("img",{
    src:"icon-192.png",width:48,height:48,alt:"",style:{
      borderRadius:11,display:"block"
    }
  }),React.createElement("span",{
    style:{
      fontFamily:T.fontD,fontSize:32,fontWeight:800,letterSpacing:-.5
    }
  },React.createElement("span",{
    style:{
      color:T.text
    }
  },"EAGLE EYE"),React.createElement("span",{
    style:{
      color:T.green,marginLeft:5,fontWeight:700
    }
  },": bistIQ")),React.createElement("span",{
    className:"desk-only",style:{
      fontSize:10,color:T.muted,border:`1px solid ${T.border}`,padding:"2px 8px",borderRadius:4,letterSpacing:.3,fontWeight:500
    }
  },"v7.2")),React.createElement("div",{
    style:{
      display:"flex",alignItems:"center",gap:8
    }
  },O&&React.createElement("div",{
    style:{
      width:9,height:9,border:`1.5px solid ${T.dim}`,borderTop:`1.5px solid ${T.blue}`,borderRadius:"50%",animation:"spin 1s linear infinite"
    }
  }),L&&React.createElement("span",{
    onClick:()=>ut(),title:"Şimdi yenile",style:{
      fontSize:10,color:T.green,animation:"pulse 3s infinite",cursor:"pointer",userSelect:"none"
    }
  },"\u21BB ",L),React.createElement("button",{
    className:"btn",title:"Tema de\u011Fi\u015Ftir (Ayd\u0131nl\u0131k/Karanl\u0131k)",onClick:()=>{
      var c=localStorage.getItem("feybot_theme")||"light";
      localStorage.setItem("feybot_theme",c==="dark"?"light":"dark"),location.reload()
    },style:{
      background:T.bg2,border:`1px solid ${T.border}`,color:T.muted,borderRadius:5,padding:"4px 8px",cursor:"pointer",fontSize:12,lineHeight:1
    }
  },(localStorage.getItem("feybot_theme")||"light")==="dark"?"\u2600\uFE0F":"\uD83C\uDF19"),React.createElement("button",{
    className:"btn",onClick:()=>Wt(o=>!o),style:{
      background:xe?`${T.purple}15`:T.bg2,border:`1px solid ${xe?T.purple:T.border}`,color:xe?T.purple:T.muted,borderRadius:5,padding:"4px 8px",cursor:"pointer",fontSize:10
    }
  },"\u{1F916} ",xe?"AI":"AI?"),React.createElement("button",{
    className:"btn",onClick:()=>Xt(o=>!o),style:{
      background:Ze?`${T.green}15`:T.bg2,border:`1px solid ${Ze?T.green:T.border}`,color:Ze?T.green:T.muted,borderRadius:5,padding:"4px 8px",cursor:"pointer",fontSize:10
    }
  },yi?"\u{1F4E4}":Ze?"\u{1F514} ON":"\u{1F514} OFF"))),React.createElement("div",{
    className:"ticker-bar",style:{
      overflow:"hidden",position:"relative"
    }
  },React.createElement("div",{
    style:{
      position:"absolute",left:0,top:0,bottom:0,width:50,background:`linear-gradient(90deg,${T.bg1},transparent)`,zIndex:2,pointerEvents:"none"
    }
  }),React.createElement("div",{
    style:{
      position:"absolute",right:0,top:0,bottom:0,width:50,background:`linear-gradient(270deg,${T.bg1},transparent)`,zIndex:2,pointerEvents:"none"
    }
  }),React.createElement("div",{
    style:{
      display:"flex",animation:"marquee 240s linear infinite",width:"max-content"
    }
  },[0,1].map(o=>React.createElement("div",{
    key:o,style:{
      display:"flex"
    }
  },STOCKS.slice(0,50).map(l=>{
    const p=B[l.symbol],S=p?p.rate>=0:!0,C=a===l.symbol&&t==="market",m=ae.includes(l.symbol);
    return React.createElement("div",{
      key:l.symbol+o,onClick:()=>{
        e(l.symbol),i("market")
      },style:{
        cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"flex-start",gap:1,padding:"6px 14px",flexShrink:0,borderRight:`1px solid ${T.border}`,borderBottom:C?`2px solid ${T.green}`:"2px solid transparent",background:C?`${T.green}06`:"transparent",minWidth:90
      }
    },React.createElement("div",{
      style:{
        display:"flex",alignItems:"center",gap:4
      }
    },m&&React.createElement("span",{
      style:{
        fontSize:9,color:T.yellow
      }
    },"\u2605"),React.createElement("span",{
      style:{
        fontSize:12,fontWeight:700,color:C?T.green:T.blue,letterSpacing:.3
      }
    },l.symbol)),p?React.createElement("div",{
      style:{
        display:"flex",alignItems:"center",gap:5
      }
    },React.createElement("span",{
      className:"tnum",style:{
        fontSize:11,color:T.text,fontWeight:500
      }
    },p.price.toFixed(2),"\u20BA"),React.createElement("span",{
      className:"tnum",style:{
        fontSize:10,color:S?T.green:T.red,fontWeight:600
      }
    },S?"\u25B2":"\u25BC",Math.abs(p.rate).toFixed(2),"%")):React.createElement("span",{
      style:{
        fontSize:9,color:T.dim,animation:"pulse 1.5s infinite"
      }
    },"\xB7\xB7\xB7"))
  })))))),gi&&React.createElement("div",{
    style:{
      background:T.bg1,borderBottom:`1px solid ${T.border}`,padding:"12px 14px",animation:"fadeIn .2s",flexShrink:0
    }
  },React.createElement("div",{
    style:{
      maxWidth:1116,margin:"0 auto"
    }
  },React.createElement("div",{
    style:{
      fontSize:12,color:T.purple,fontWeight:700,marginBottom:6
    }
  },"\u{1F916} AI ANAL\u0130Z \u2014 Anthropic Claude"),React.createElement("div",{
    style:{
      fontSize:10,color:T.muted,marginBottom:8,lineHeight:1.5
    }
  },"API anahtar\u0131nla teknik analizi haber + makro ba\u011Flamla harmanlar. Anahtar SADECE telefonunda saklan\u0131r (localStorage), sunucumuza g\xF6nderilmez. Do\u011Frudan api.anthropic.com'a HTTPS iste\u011Fi gider.",React.createElement("br",null),"Anahtar al: ",React.createElement("span",{
    style:{
      color:T.blue
    }
  },"console.anthropic.com \u2192 API Keys")),React.createElement("div",{
    style:{
      display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"
    }
  },React.createElement("input",{
    type:"password",value:xe,onChange:o=>Ut(o.target.value),placeholder:"sk-ant-api03-...",style:{
      background:T.bg,border:`1px solid ${T.border}`,color:T.text,borderRadius:5,padding:"6px 10px",fontSize:11,fontFamily:T.font,width:280,outline:"none"
    }
  }),React.createElement("button",{
    className:"btn",onClick:()=>{
      localStorage.setItem("feybot_aikey",xe),Wt(!1)
    },style:{
      background:`${T.purple}20`,border:`1px solid ${T.purple}`,color:T.purple,borderRadius:5,padding:"6px 12px",cursor:"pointer",fontSize:11
    }
  },"KAYDET"),xe&&React.createElement("button",{
    className:"btn",onClick:()=>{
      Ut(""),localStorage.removeItem("feybot_aikey")
    },style:{
      background:`${T.red}10`,border:`1px solid ${T.red}44`,color:T.red,borderRadius:5,padding:"6px 12px",cursor:"pointer",fontSize:11
    }
  },"S\u0130L")))),xi&&React.createElement("div",{
    style:{
      background:T.bg1,borderBottom:`1px solid ${T.border}`,padding:"12px 14px",animation:"fadeIn .2s",flexShrink:0
    }
  },React.createElement("div",{
    style:{
      maxWidth:1116,margin:"0 auto"
    }
  },React.createElement("div",{
    style:{
      fontSize:11,color:T.muted,marginBottom:8
    }
  },"\u{1F4E7} Sinyal de\u011Fi\u015Fince mail \u2014 30dk cooldown."),React.createElement("div",{
    style:{
      display:"flex",gap:8,marginBottom:8,alignItems:"center",flexWrap:"wrap"
    }
  },React.createElement("button",{
    className:"btn",onClick:async()=>{
      if(!("Notification"in window)){
        alert("Taray\u0131c\u0131 bildirim desteklemiyor");
        return
      }
      await Notification.requestPermission()==="granted"&&new Notification("EAGLE EYE: bistIQ",{
        body:"\u{1F514} Bildirim aktif \u2014 sinyal de\u011Fi\u015Fince telefonun titreyecek",icon:"bist-logo.png"
      })
    },style:{
      background:`${T.orange}20`,border:`1px solid ${T.orange}`,color:T.orange,borderRadius:5,padding:"6px 12px",cursor:"pointer",fontSize:11
    }
  },"\u{1F514} PUSH B\u0130LD\u0130R\u0130M A\xC7"),React.createElement("span",{
    style:{
      fontSize:10,color:T.muted
    }
  },typeof Notification<"u"?Notification.permission==="granted"?"\u2713 Aktif \u2014 telefon kilitliyken bile uyar\u0131r":Notification.permission==="denied"?"\u274C Reddedildi (Safari ayarlardan a\xE7)":"Permission bekleniyor":"Desteklenmiyor")),React.createElement("div",{
    style:{
      display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"
    }
  },React.createElement("input",{
    type:"email",value:qe,onChange:o=>Zt(o.target.value),placeholder:"ornek@gmail.com",style:{
      background:T.bg,border:`1px solid ${T.border}`,color:T.text,borderRadius:5,padding:"6px 10px",fontSize:12,fontFamily:T.font,width:200,outline:"none"
    }
  }),React.createElement("button",{
    className:"btn",onClick:()=>{
      qe.includes("@")&&(_t(!0),localStorage.setItem(LS_EMAIL,qe),Xt(!1))
    },style:{
      background:`${T.blue}20`,border:`1px solid ${T.blue}`,color:T.blue,borderRadius:5,padding:"6px 12px",cursor:"pointer",fontSize:11
    }
  },Ze?"\u2713 G\xDCNCELLE":"KAYDET"),Ze&&React.createElement(React.Fragment,null,React.createElement("button",{
    className:"btn",onClick:Ai,style:{
      background:T.bg2,border:`1px solid ${T.border}`,color:T.muted,borderRadius:5,padding:"6px 12px",cursor:"pointer",fontSize:11
    }
  },Kt==="sending"?"...":Kt==="ok"?"\u2713 OK":Kt==="err"?"\u2717":"TEST"),React.createElement("button",{
    className:"btn",onClick:()=>{
      _t(!1),Zt(""),localStorage.removeItem(LS_EMAIL),localStorage.removeItem(LS_PREVSIGS),st.current={
      }
    },style:{
      background:`${T.red}10`,border:`1px solid ${T.red}44`,color:T.red,borderRadius:5,padding:"6px 12px",cursor:"pointer",fontSize:11
    }
  },"KAPAT"))))),React.createElement("div",{
    style:{
      display:"flex",flex:1,minHeight:0
    }
  },React.createElement("div",{
    className:"desk-only",style:{
      width:72,background:T.bg1,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",gap:2,padding:"10px 0",position:"sticky",top:0,height:"100vh",flexShrink:0
    }
  },React.createElement(NavBtn,{
    id:"market",page:t,setPage:i,icon:React.createElement(BistLogo,{
      size:22
    }),label:"BIST"
  }),React.createElement(NavBtn,{
    id:"hissekart",page:t,setPage:i,icon:"📋",label:"KART"
  }),React.createElement(NavBtn,{
    id:"news",page:t,setPage:i,icon:"📰",label:"HABER"
  }),React.createElement(NavBtn,{
    id:"favorites",page:t,setPage:i,icon:"★",label:"FAVORİ",badge:ae.length
  }),React.createElement(NavBtn,{
    id:"scanner",page:t,setPage:i,icon:"🔍",label:"TARA"
  }),React.createElement(NavBtn,{
    id:"portfolio",page:t,setPage:i,icon:"💼",label:"PORTFÖY",badge:Z.length
  }),React.createElement(NavBtn,{id:"sim",page:t,setPage:i,icon:"💰",label:"SİM"}),),React.createElement("div",{
    style:{
      flex:1,overflowY:"auto"
    }
  },t==="favorites"&&(()=>{
    const o=["Banka","Sanayi","Holding","Enerji","Madencilik","Perakende","Teknoloji"],l=new Set(o);
    Object.values(X).forEach(s=>(s||[]).forEach(A=>l.add(A)));
    const p=Array.from(l),S=Ee==="__ALL__"?ae:Ee==="__NONE__"?ae.filter(s=>!X[s]?.length):ae.filter(s=>(X[s]||[]).includes(Ee)),C=(s,A)=>{
      Ce(x=>{
        const h=new Set(x[s]||[]);
        return h.has(A)?h.delete(A):h.add(A),{
          ...x,[s]:Array.from(h)
        }
      })
    },m=()=>{
      const s=prompt("Yeni liste ad\u0131 (\xF6rn: Temett\xFC, D\xFC\u015F\xFCk PD, Watchlist X)")?.trim();
      s&&(Ce(A=>({
        ...A,__placeholder__:[...A.__placeholder__||[],s]
      })),ee(s))
    },k=(s,A,x,h)=>React.createElement("button",{
      key:s,className:"btn",onClick:()=>ee(s),style:{
        background:Ee===s?`${h||T.yellow}25`:T.bg2,border:`1px solid ${Ee===s?h||T.yellow:T.border}`,color:Ee===s?h||T.yellow:T.muted,borderRadius:16,padding:"4px 10px",cursor:"pointer",fontSize:10,fontWeight:Ee===s?700:500
      }
    },A,x!=null?` \xB7 ${x}`:"");
    return React.createElement("div",{
      className:"mob-pad",style:{
        padding:"20px",maxWidth:1060,margin:"0 auto"
      }
    },React.createElement("div",{
      style:{
        display:"flex",alignItems:"center",gap:12,marginBottom:12,flexWrap:"wrap"
      }
    },React.createElement("span",{
      style:{
        fontFamily:T.fontD,fontSize:22,fontWeight:700,color:T.yellow
      }
    },"\u2605 FAVOR\u0130LER"),React.createElement("span",{
      style:{
        fontSize:11,color:T.muted
      }
    },S.length,"/",ae.length," hisse"),React.createElement("button",{
      className:"btn",onClick:m,style:{
        marginLeft:"auto",background:`${T.green}15`,border:`1px solid ${T.green}55`,color:T.green,borderRadius:5,padding:"4px 10px",cursor:"pointer",fontSize:10,fontWeight:700
      }
    },"+ YEN\u0130 L\u0130STE")),ae.length>0&&React.createElement("div",{
      style:{
        display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"
      }
    },k("__ALL__","\u{1F310} T\xDCM\xDC",ae.length,T.yellow),p.map(s=>{
      const A=ae.filter(x=>(X[x]||[]).includes(s)).length;
      return k(s,s,A,T.blue)
    }),k("__NONE__","Gruplanmam\u0131\u015F",ae.filter(s=>!X[s]?.length).length,T.muted)),ae.length===0?React.createElement("div",{
      style:{
        textAlign:"center",padding:"60px 20px",color:T.muted,fontSize:13
      }
    },React.createElement("div",{
      style:{
        fontSize:32,marginBottom:12
      }
    },"\u2606"),"Hen\xFCz favori yok. Hisse sayfas\u0131nda \u2606 butonuna bas."):React.createElement("div",{
      style:{
        display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10
      }
    },vi.filter(s=>S.includes(s.sym)).map(s=>{
      const A=s.signal==="AL"?T.green:s.signal==="SAT"?T.red:T.muted,x=(s.rate??0)>=0,h=X[s.sym]||[];
      return React.createElement("div",{
        key:s.sym,style:{
          background:T.bg1,border:`1px solid ${A}33`,borderRadius:10,padding:"12px 14px",animation:"fadeIn .3s"
        }
      },React.createElement("div",{
        onClick:()=>{
          e(s.sym),i("market")
        },style:{
          cursor:"pointer"
        }
      },React.createElement("div",{
        style:{
          display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8
        }
      },React.createElement("div",null,React.createElement("div",{
        style:{
          fontFamily:T.fontD,fontSize:17,fontWeight:700,color:T.text,letterSpacing:1
        }
      },s.sym),React.createElement("div",{
        style:{
          fontSize:10,color:T.muted
        }
      },STOCKS_MAP[s.sym]||"")),React.createElement("div",{
        style:{
          textAlign:"right"
        }
      },s.price!=null&&React.createElement("div",{
        style:{
          fontFamily:T.fontD,fontSize:15,fontWeight:700,color:x?T.green:T.red
        }
      },s.price.toFixed(2),"\u20BA"),s.rate!=null&&React.createElement("div",{
        style:{
          fontSize:11,color:x?T.green:T.red
        }
      },x?"\u25B2":"\u25BC",Math.abs(s.rate).toFixed(2),"%"))),(()=>{
        const R=(histCache[s.sym]||[]).slice(-30).map(D=>D.close);
        return R.length>5?React.createElement("div",{
          style:{
            marginBottom:8,width:"100%"
          }
        },React.createElement(Spark,{
          data:R,h:24
        })):null
      })(),React.createElement("div",{
        style:{
          display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8
        }
      },React.createElement("span",{
        style:{
          background:`${A}15`,border:`1px solid ${A}44`,color:A,borderRadius:20,padding:"3px 12px",fontSize:11,fontWeight:700
        }
      },s.signal),s.confidence>0&&React.createElement("span",{
        style:{
          fontSize:11,color:T.muted
        }
      },"%",s.confidence),React.createElement("button",{
        onClick:R=>{
          R.stopPropagation(),ei(s.sym)
        },style:{
          background:"transparent",border:"none",cursor:"pointer",color:T.yellow,fontSize:14
        }
      },"\u2605"))),React.createElement("div",{
        style:{
          display:"flex",gap:3,flexWrap:"wrap",borderTop:`1px solid ${T.border}`,paddingTop:6
        }
      },p.slice(0,6).map(R=>{
        const D=h.includes(R);
        return React.createElement("span",{
          key:R,onClick:j=>{
            j.stopPropagation(),C(s.sym,R)
          },style:{
            fontSize:8,padding:"2px 6px",borderRadius:8,background:D?`${T.blue}22`:"transparent",color:D?T.blue:T.dim,border:`1px solid ${D?T.blue+"55":T.border}`,cursor:"pointer",fontWeight:D?700:400
          }
        },D?"\u2713 ":"",R)
      })))
    })))
  })(),t==="crypto"&&React.createElement("div",{
    className:"mob-pad",style:{
      padding:"20px",maxWidth:1060,margin:"0 auto"
    }
  },React.createElement("div",{
    style:{
      display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"
    }
  },React.createElement("span",{
    style:{
      fontFamily:T.fontD,fontSize:22,fontWeight:700,color:T.yellow
    }
  },"\u20BF KR\u0130PTO"),React.createElement("button",{
    className:"btn",onClick:()=>Gt(!1),disabled:he,style:{
      background:T.bg2,border:`1px solid ${T.border}`,color:T.muted,borderRadius:5,padding:"5px 10px",cursor:"pointer",fontSize:11
    }
  },he?"...":"\u{1F504} YEN\u0130LE"),React.createElement("button",{
    className:"btn",onClick:()=>Gt(!0),disabled:H,style:{
      background:`${T.green}20`,border:`1px solid ${T.green}`,color:T.green,borderRadius:5,padding:"5px 12px",cursor:"pointer",fontSize:11,fontWeight:700
    }
  },H?`TARANIYOR ${Object.keys(we).length}`:"\u26A1 S\u0130NYAL TARA"),React.createElement("span",{
    style:{
      fontSize:10,color:T.muted,marginLeft:"auto"
    }
  },"Binance \xB7 Top 50 USDT \xB7 Hacme g\xF6re")),$.length===0&&!he&&React.createElement("div",{
    style:{
      textAlign:"center",padding:"40px 20px",color:T.muted,fontSize:13
    }
  },React.createElement("div",{
    style:{
      fontSize:32,marginBottom:12
    }
  },"\u20BF"),React.createElement("div",{
    style:{
      marginBottom:8
    }
  },"YEN\u0130LE'ye bas \u2014 kripto verileri y\xFCklenir."),React.createElement("div",{
    style:{
      fontSize:10,color:T.dim,marginTop:12,lineHeight:1.5,maxWidth:480,margin:"12px auto 0"
    }
  },"\u24D8 T\xFCrkiye'den Binance API bazen engelli olabilir. Bot 3 katmanl\u0131 fallback dener:",React.createElement("br",null),React.createElement("b",{
    style:{
      color:T.text
    }
  },"1)")," Binance direkt \u2192 ",React.createElement("b",{
    style:{
      color:T.text
    }
  },"2)")," CORS proxy \xFCzerinden Binance \u2192 ",React.createElement("b",{
    style:{
      color:T.text
    }
  },"3)")," CoinGecko (son \xE7are)",React.createElement("br",null),"H\xE2l\xE2 y\xFCklenmezse VPN ile dene veya birka\xE7 dakika sonra tekrar bas.")),he&&$.length===0&&React.createElement("div",{
    style:{
      textAlign:"center",padding:"40px 20px",color:T.yellow
    }
  },React.createElement("div",{
    style:{
      width:32,height:32,border:`3px solid ${T.dim}`,borderTop:`3px solid ${T.yellow}`,borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 12px"
    }
  }),React.createElement("div",{
    style:{
      fontSize:12
    }
  },"Binance \u2192 Proxy \u2192 CoinGecko fallback zinciri deneniyor...")),$.length>0&&$[0]?.source&&$[0].source!=="binance"&&React.createElement("div",{
    style:{
      background:`${T.yellow}10`,border:`1px solid ${T.yellow}44`,borderRadius:6,padding:"6px 10px",marginBottom:10,fontSize:10,color:T.yellow
    }
  },"\u24D8 Veri kayna\u011F\u0131: ",React.createElement("b",null,$[0].source==="binance-proxy"?"Binance (proxy)":"CoinGecko")," \u2014 Binance direkt eri\u015Filemedi\u011Fi i\xE7in fallback aktif."),React.createElement("div",{
    style:{
      display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8
    }
  },$.sort((o,l)=>l.volume-o.volume).map(o=>{
    const l=o.rate>=0,p=we[o.symbol],S=p?.signal==="AL"?T.green:p?.signal==="SAT"?T.red:T.border;
    return React.createElement("div",{
      key:o.symbol,onClick:()=>Si(o),style:{
        background:T.bg1,border:`1px solid ${S}44`,borderRadius:8,padding:"10px 12px",animation:"fadeIn .3s",cursor:"pointer"
      }
    },React.createElement("div",{
      style:{
        display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6
      }
    },React.createElement("span",{
      style:{
        fontFamily:T.fontD,fontSize:16,fontWeight:700,color:T.text,letterSpacing:1
      }
    },o.symbol),p&&React.createElement("span",{
      style:{
        background:`${S}15`,border:`1px solid ${S}66`,color:S,borderRadius:12,padding:"2px 8px",fontSize:10,fontWeight:700
      }
    },p.signal," %",p.confidence)),React.createElement("div",{
      style:{
        display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:4
      }
    },React.createElement("span",{
      style:{
        fontSize:16,fontWeight:700,color:l?T.green:T.red
      }
    },"$",o.price.toFixed(o.price<1?4:2)),React.createElement("span",{
      style:{
        fontSize:11,color:l?T.green:T.red,fontWeight:600
      }
    },l?"\u25B2":"\u25BC",Math.abs(o.rate).toFixed(2),"%")),p?.paLabel&&p.paStrength>=80&&React.createElement("div",{
      style:{
        fontSize:10,color:T.green,fontWeight:700,marginBottom:3
      }
    },"\u26A1 ",p.paLabel),p&&React.createElement("div",{
      style:{
        fontSize:10,color:T.muted,display:"flex",gap:8,flexWrap:"wrap"
      }
    },React.createElement("span",null,p.mod),p.target1&&React.createElement("span",{
      style:{
        color:T.green
      }
    },"H: ",p.target1),p.stopLoss&&React.createElement("span",{
      style:{
        color:T.red
      }
    },"S: ",p.stopLoss)),React.createElement("div",{
      style:{
        fontSize:9,color:T.dim,marginTop:5,borderTop:`1px solid ${T.border}`,paddingTop:4
      }
    },"Hacim: $",(o.volume/1e6).toFixed(1),"M"))
  }))),t==="cryptoDetail"&&Q&&(()=>{
    const o=Je,l=o.length>=20?getSignals(o,ct,pt):null,p=o.slice(-80),S=(Q.rate??0)>=0,C=l?.final==="AL"?T.green:l?.final==="SAT"?T.red:T.muted,m=l?.trendMod==="YUKARI"?T.green:l?.trendMod==="ASAGI"?T.red:T.muted,k=p.filter((x,h)=>h%Math.ceil(Math.max(p.length/8,1))===0).map(x=>x.date),s=Q.price,A=x=>x==null?"\u2014":x<1?x.toFixed(4):x.toFixed(2);
    return React.createElement("div",{
      className:"mob-pad",style:{
        maxWidth:1060,margin:"0 auto",padding:"16px 14px"
      }
    },React.createElement("div",{
      style:{
        display:"flex",alignItems:"center",gap:10,marginBottom:14
      }
    },React.createElement("button",{
      className:"btn",onClick:()=>{
        i("crypto"),ne(null),se([])
      },style:{
        background:T.bg2,border:`1px solid ${T.border}`,color:T.muted,borderRadius:5,padding:"5px 10px",cursor:"pointer",fontSize:12
      }
    },"\u2190 KR\u0130PTO"),React.createElement("h1",{
      className:"mob-h1",style:{
        margin:0,fontFamily:T.fontD,fontSize:28,fontWeight:700,letterSpacing:2
      }
    },Q.symbol),React.createElement("span",{
      style:{
        fontSize:10,color:T.muted,border:`1px solid ${T.border}`,padding:"2px 8px",borderRadius:4
      }
    },"USDT \xB7 Binance")),React.createElement("div",{
      style:{
        display:"flex",alignItems:"baseline",gap:10,marginBottom:14
      }
    },React.createElement("span",{
      className:"mob-px",style:{
        fontFamily:T.fontD,fontSize:32,fontWeight:700,color:S?T.green:T.red
      }
    },"$",A(Q.price)),React.createElement("span",{
      style:{
        fontSize:13,color:S?T.green:T.red,fontWeight:600
      }
    },S?"\u25B2":"\u25BC"," ",Math.abs(Q.rate).toFixed(2),"%"),React.createElement("span",{
      style:{
        fontSize:11,color:T.muted,marginLeft:"auto"
      }
    },"Hacim $",(Q.volume/1e6).toFixed(1),"M")),dt&&React.createElement("div",{
      style:{
        background:T.bg2,border:`1px solid ${T.yellow}44`,borderRadius:8,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:8
      }
    },React.createElement("div",{
      style:{
        width:9,height:9,border:`1.5px solid ${T.dim}`,borderTop:`1.5px solid ${T.yellow}`,borderRadius:"50%",animation:"spin 1s linear infinite"
      }
    }),React.createElement("span",{
      style:{
        fontSize:12,color:T.yellow
      }
    },"Binance'tan Veri \xE7ekiliyor\u2026")),l&&(()=>{
      const x=l.atr??0,h=l.stopLoss,R=l.target1,D=l.target2,j=h?+((s-h)/s*100).toFixed(2):null,Se=R?+((R-s)/s*100).toFixed(2):null,ze=D?+((D-s)/s*100).toFixed(2):null;
      let Fe="BEKLE",ye="";
      const de=l.profile?`Vade: ${l.profile.dur} \xB7 ${l.profile.why}`:"";
      return l.final==="AL"&&l.trendMod==="YUKARI"?(Fe="TREND Y\xD6N\xDCNDE AL",ye=`MA200 \xFCst\xFCnde \xB7 ADX ${l.adx?.toFixed(0)} \xB7 ${de}`):l.final==="AL"&&l.dipSignal?(Fe="D\u0130P D\xD6N\xDC\u015E AL",ye=`${l.dipSignal.score}/7 \u015Fart \xB7 ${de}`):l.final==="AL"?(Fe="TEMK\u0130NL\u0130 AL",ye=`ADX ${l.adx?.toFixed(0)} (zay\u0131f) \xB7 ${de}`):l.final==="SAT"&&l.trendMod==="ASAGI"?(Fe="\xC7IKI\u015E / SAT",ye="MA200 alt\u0131nda \xB7 pozisyon kapat"):l.final==="SAT"?(Fe="SAT",ye="Sat\u0131\u015F bask\u0131s\u0131"):(Fe="BEKLE",ye=l.waitReasons?.length?"Sebep: "+l.waitReasons.join(" \xB7 "):"Net sinyal yok"),React.createElement("div",{
        style:{
          background:`linear-gradient(135deg,${T.bg1},${T.bg2})`,border:`1px solid ${C}44`,borderRadius:12,padding:"16px",marginBottom:12,position:"relative"
        }
      },React.createElement("div",{
        style:{
          position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${C},transparent)`
        }
      }),React.createElement("div",{
        style:{
          display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:10,marginBottom:12
        }
      },React.createElement("div",null,React.createElement("div",{
        style:{
          display:"flex",gap:6,alignItems:"center",marginBottom:6,flexWrap:"wrap"
        }
      },React.createElement("span",{
        style:{
          background:`${m}15`,border:`1px solid ${m}44`,color:m,borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:700
        }
      },l.mod),l.adx>0&&React.createElement("span",{
        style:{
          background:T.bg2,border:`1px solid ${T.border}`,color:l.trendStrong?T.green:T.muted,borderRadius:20,padding:"3px 10px",fontSize:10
        }
      },"ADX ",l.adx.toFixed(0)),l.profile&&React.createElement("span",{
        style:{
          background:`${T.yellow}15`,border:`1px solid ${T.yellow}66`,color:T.yellow,borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:700
        }
      },"\u23F1 ",l.profile.dur),l.htfNote&&React.createElement("span",{
        style:{
          background:T.bg2,border:`1px solid ${T.border}`,color:l.htfNote.includes("\u2713")?T.green:T.red,borderRadius:20,padding:"3px 10px",fontSize:10
        }
      },l.htfNote)),React.createElement("div",{
        style:{
          fontFamily:T.fontD,fontSize:24,fontWeight:700,color:C,letterSpacing:2,marginBottom:6
        }
      },Fe),React.createElement("div",{
        style:{
          fontSize:11,color:T.muted,maxWidth:380,lineHeight:1.5
        }
      },ye)),React.createElement("div",{
        style:{
          background:T.bg,border:`1px solid ${C}33`,borderRadius:10,padding:"10px 18px",textAlign:"center"
        }
      },React.createElement("div",{
        style:{
          fontSize:9,color:T.muted,letterSpacing:2
        }
      },"G\xDCVEN"),React.createElement("div",{
        style:{
          fontFamily:T.fontD,fontSize:30,fontWeight:700,color:C,lineHeight:1
        }
      },l.confidence),React.createElement("div",{
        style:{
          fontSize:10,color:T.muted
        }
      },"%"))),h&&React.createElement("div",{
        style:{
          display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(80px,1fr))",gap:6
        }
      },[{
        l:"\u2192 G\u0130R\u0130\u015E",sub:"Al\u0131m fiyat\u0131",p:"$"+A(s),x:null,c:T.blue
      },{
        l:"\u26D4 ZARAR DUR",sub:"Stop seviyesi",p:"$"+A(h),x:j?`-${Math.abs(j)}%`:null,c:T.red
      },{
        l:"\u{1F3AF} 1. HEDEF",sub:"\u0130lk sat\u0131\u015F",p:"$"+A(R),x:Se?`+${Se}%`:null,c:T.green
      },{
        l:"\u{1F3AF} 2. HEDEF",sub:"Uzun tut",p:"$"+A(D),x:ze?`+${ze}%`:null,c:T.green
      },{
        l:"\u{1F4CA} OYNAKLIK",sub:"ATR",p:"$"+A(x),x:null,c:T.yellow
      }].map(ke=>React.createElement("div",{
        key:ke.l,style:{
          background:`${ke.c}10`,border:`1px solid ${ke.c}40`,borderRadius:10,padding:"10px 12px",textAlign:"center"
        }
      },React.createElement("div",{
        style:{
          fontSize:10,color:ke.c,marginBottom:4,letterSpacing:.2,fontWeight:600
        }
      },ke.l),React.createElement("div",{
        className:"tnum",style:{
          fontSize:14,fontWeight:700,color:T.text,marginBottom:2
        }
      },ke.p),ke.x&&React.createElement("div",{
        className:"tnum",style:{
          fontSize:10,color:ke.c,fontWeight:600
        }
      },ke.x),ke.sub&&React.createElement("div",{
        style:{
          fontSize:9,color:T.muted,marginTop:3
        }
      },ke.sub)))))
    })(),l&&React.createElement("div",{
      style:{
        display:"flex",gap:8,alignItems:"center",marginBottom:10,flexWrap:"wrap"
      }
    },React.createElement("button",{
      className:"btn",onClick:()=>jt(Q.symbol,Q.symbol,l,!0,Q.price),disabled:lt,style:{
        background:`${T.purple}20`,border:`1px solid ${T.purple}`,color:T.purple,borderRadius:6,padding:"8px 14px",cursor:lt?"wait":"pointer",fontSize:12,fontWeight:700
      }
    },lt?"\u{1F916} ANAL\u0130Z...":"\u{1F916} AI ANAL\u0130Z"),!xe&&React.createElement("span",{
      style:{
        fontSize:10,color:T.muted
      }
    },"\xD6nce \xFCst barda \u{1F916} \u2192 API key")),Rt&&React.createElement("div",{
      style:{
        background:`${T.red}10`,border:`1px solid ${T.red}44`,borderRadius:8,padding:"8px 12px",marginBottom:10,fontSize:11,color:T.red
      }
    },"\u26A0 ",Rt),ue&&ue.symbol===Q.symbol&&(()=>{
      const x=ue.engine==="eagle-ai"||ue.engine==="eagle-ai-fallback"?T.green:T.purple,h=ue.engine==="eagle-ai"?"\u{1F9E0} EAGLE EYE AI YEREL":ue.engine==="eagle-ai-fallback"?"\u{1F9E0} EAGLE EYE AI (Claude fallback)":"\u{1F916} CLAUDE";
      return React.createElement("div",{
        style:{
          background:`${x}08`,border:`1px solid ${x}44`,borderRadius:10,padding:"12px 14px",marginBottom:10,animation:"fadeIn .3s"
        }
      },React.createElement("div",{
        style:{
          display:"flex",alignItems:"center",gap:8,marginBottom:6
        }
      },React.createElement("span",{
        style:{
          fontFamily:T.fontD,fontSize:13,fontWeight:700,color:x
        }
      },h," \u2014 AI ANAL\u0130Z"),React.createElement("span",{
        style:{
          fontSize:10,color:T.muted,marginLeft:"auto"
        }
      },ue.time)),React.createElement("div",{
        style:{
          fontSize:14,color:T.text,lineHeight:1.7,whiteSpace:"pre-wrap"
        }
      },ue.text))
    })(),l&&React.createElement("div",{
      style:{
        display:"flex",gap:6,flexWrap:"wrap",marginBottom:12
      }
    },React.createElement(SigCard,{
      name:"MA TREND",sig:l.signals.MA
    }),React.createElement(SigCard,{
      name:"MACD",sig:l.signals.MACD
    }),React.createElement(SigCard,{
      name:"RSI 14",sig:l.signals.RSI
    }),React.createElement(SigCard,{
      name:"BOLLINGER",sig:l.signals.BB
    }),React.createElement(SigCard,{
      name:"STOCH",sig:l.signals.SRSI
    }),React.createElement(SigCard,{
      name:"HACİM",sig:l.signals.VOL
    }),React.createElement(SigCard,{
      name:"ADX",sig:l.signals.ADX
    }),React.createElement(SigCard,{
      name:"SUPERTREND",sig:l.signals.STR
    }),React.createElement(SigCard,{
      name:"PRICE ACT.",sig:l.signals.PA
    }),React.createElement(SigCard,{
      name:"MOMENTUM",sig:l.signals.MOM
    })),React.createElement("div",{
      style:{
        background:T.bg1,border:`1px solid ${T.border}`,borderRadius:12,padding:"8px",marginBottom:14
      }
    },o.length>=5?React.createElement(LWChart,{
      data:o,height:400,mode:_
    }):React.createElement("div",{
      style:{
        height:400,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8,color:T.muted
      }
    },React.createElement("div",{
      style:{
        width:24,height:24,border:`2px solid ${T.dim}`,borderTop:`2px solid ${T.yellow}`,borderRadius:"50%",animation:"spin 1s linear infinite"
      }
    }),React.createElement("span",{
      style:{
        fontSize:12
      }
    },Q.symbol," i\xE7in Binance data y\xFCkleniyor..."))),l&&React.createElement("div",{
      style:{
        display:"flex",gap:6,flexWrap:"wrap",marginBottom:14
      }
    },React.createElement(StatBox,{
      label:"FİYAT",value:"$"+A(s),color:S?T.green:T.red
    }),React.createElement(StatBox,{
      label:"DEĞ.",value:(S?"\u25B2":"\u25BC")+Math.abs(Q.rate).toFixed(2)+"%",color:S?T.green:T.red
    }),React.createElement(StatBox,{
      label:"RSI",value:l.last?.rsi?.toFixed(1)??"\u2014",color:T.purple
    }),React.createElement(StatBox,{
      label:"ADX",value:l.adx?.toFixed(0)??"\u2014",color:l.trendStrong?T.green:T.muted
    }),React.createElement(StatBox,{
      label:"ATR",value:l.atr?"$"+A(l.atr):"\u2014",color:T.yellow
    }),React.createElement(StatBox,{
      label:"ST",value:l.last?.stDir===1?"\u2191":"\u2193",color:l.last?.stDir===1?T.green:T.red
    })))
  })(),t==="sectors"&&(()=>{
    const o=Object.entries(BIST_SECTORS).map(([s,A])=>{
      const x=A.map(R=>({
        sym:R,...B[R]||{
        }
      })).filter(R=>R.rate!=null);
      if(x.length<2)return{
        name:s,avg:null,count:0,total:A.length,stocks:[]
      };
      const h=x.reduce((R,D)=>R+D.rate,0)/x.length;
      return x.sort((R,D)=>D.rate-R.rate),{
        name:s,avg:+h.toFixed(2),count:x.length,total:A.length,stocks:x
      }
    }),l=Object.keys(bt).sort(),p=l.slice(-7),S=l.slice(-30),C=(s,A)=>{
      const x=A.map(h=>bt[h]?.[s]).filter(h=>h!=null);
      return x.length===0?null:+(x.reduce((h,R)=>h+R,0)/x.length).toFixed(2)
    },m=o.map(s=>{
      const A=C(s.name,p),x=C(s.name,S);
      let h=s.avg;
      Be==="w"&&(h=A??s.avg),Be==="m"&&(h=x??s.avg);
      const R=A!=null&&x!=null?+(A-x).toFixed(2):null;
      return{
        ...s,avg7:A,avg30:x,showAvg:h,momentum:R
      }
    }).filter(s=>s.showAvg!=null).sort((s,A)=>(A.showAvg||0)-(s.showAvg||0)),k=(s,A)=>React.createElement("button",{
      className:"btn",onClick:()=>Ot(s),style:{
        background:Be===s?`${T.purple}25`:T.bg2,border:`1px solid ${Be===s?T.purple:T.border}`,color:Be===s?T.purple:T.muted,borderRadius:14,padding:"3px 12px",cursor:"pointer",fontSize:10,fontWeight:Be===s?700:500
      }
    },A);
    return React.createElement("div",{
      className:"mob-pad",style:{
        padding:"20px",maxWidth:1060,margin:"0 auto"
      }
    },React.createElement("div",{
      style:{
        display:"flex",alignItems:"center",gap:12,marginBottom:10,flexWrap:"wrap"
      }
    },React.createElement("span",{
      style:{
        fontFamily:T.fontD,fontSize:22,fontWeight:700,color:T.purple
      }
    },"\u{1F3E2} SEKT\xD6REL PANO"),React.createElement("span",{
      style:{
        fontSize:11,color:T.muted
      }
    },m.length," sekt\xF6r"),React.createElement("span",{
      style:{
        fontSize:10,color:T.dim,marginLeft:"auto"
      }
    },"* TARA \xE7al\u0131\u015Ft\u0131r\u0131nca daha doluTur")),React.createElement("div",{
      style:{
        display:"flex",gap:6,marginBottom:12,flexWrap:"wrap",alignItems:"center"
      }
    },k("today","\u{1F4C5} BUG\xDCN"),k("w",`7G ort (${p.length}g)`),k("m",`30G ort (${S.length}g)`),React.createElement("span",{
      style:{
        fontSize:9,color:T.dim,marginLeft:6
      }
    },Be==="today"&&"Bug\xFCnk\xFC sekt\xF6r ortalama %'si",Be==="w"&&"Son 7 g\xFCn \u2014 sekt\xF6r momentumu",Be==="m"&&"Son 30 g\xFCn \u2014 uzun vadeli trend")),m.length===0?React.createElement("div",{
      style:{
        textAlign:"center",padding:"60px",color:T.muted,fontSize:13
      }
    },React.createElement("div",{
      style:{
        fontSize:32,marginBottom:12
      }
    },"\u{1F3E2}"),"Sekt\xF6r verisi y\xFCkleniyor \u2014 TARA sekmesinden bir tarama yap, geri d\xF6n."):React.createElement("div",{
      style:{
        display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(300px,100%),1fr))",gap:10
      }
    },m.map(s=>{
      const A=s.showAvg>.5?T.green:s.showAvg<-.5?T.red:T.muted,x=s.stocks.slice(0,3),h=s.stocks.slice(-2).reverse(),R=s.momentum!=null?s.momentum>.3?T.green:s.momentum<-.3?T.red:T.muted:T.muted;
      return React.createElement("div",{
        key:s.name,style:{
          background:T.bg1,border:`1px solid ${A}44`,borderRadius:10,padding:"12px 14px"
        }
      },React.createElement("div",{
        style:{
          display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4
        }
      },React.createElement("span",{
        style:{
          fontFamily:T.fontD,fontSize:16,fontWeight:700,color:T.text,letterSpacing:.3
        }
      },s.name),React.createElement("span",{
        className:"tnum",style:{
          fontSize:18,fontWeight:700,color:A
        }
      },s.showAvg>0?"+":"",s.showAvg.toFixed(2),"%")),s.momentum!=null&&React.createElement("div",{
        style:{
          fontSize:9,color:R,marginBottom:4,fontWeight:600
        }
      },s.momentum>.3?"\u2197 PARA G\u0130R\u0130YOR":s.momentum<-.3?"\u2198 PARA \xC7IKIYOR":"\u2192 STABIL",React.createElement("span",{
        style:{
          color:T.dim,marginLeft:4
        }
      },"(7g vs 30g: ",s.momentum>0?"+":"",s.momentum.toFixed(2),"pp)")),React.createElement("div",{
        style:{
          fontSize:9,color:T.dim,marginBottom:8
        }
      },s.count,"/",s.total," hisse \xB7 BUG\xDCN ",s.avg>0?"+":"",s.avg?.toFixed(2),"% \xB7 7g ",s.avg7!=null?(s.avg7>0?"+":"")+s.avg7.toFixed(2)+"%":"\u2014"," \xB7 30g ",s.avg30!=null?(s.avg30>0?"+":"")+s.avg30.toFixed(2)+"%":"\u2014"),x.length>0&&React.createElement("div",{
        style:{
          marginBottom:6
        }
      },React.createElement("div",{
        style:{
          fontSize:9,color:T.green,fontWeight:700,marginBottom:3,letterSpacing:.3
        }
      },"\u2191 EN \u0130Y\u0130"),x.map(D=>React.createElement("div",{
        key:D.sym,onClick:()=>{
          e(D.sym),i("market")
        },style:{
          display:"flex",justifyContent:"space-between",padding:"3px 6px",fontSize:11,cursor:"pointer",borderRadius:4,background:T.bg2,marginBottom:2
        }
      },React.createElement("span",{
        style:{
          color:T.blue,fontWeight:600
        }
      },D.sym),React.createElement("span",{
        className:"tnum",style:{
          color:T.green
        }
      },D.rate>=0?"+":"",D.rate.toFixed(2),"%")))),h.length>0&&h[0].rate<0&&React.createElement("div",null,React.createElement("div",{
        style:{
          fontSize:9,color:T.red,fontWeight:700,marginBottom:3,letterSpacing:.3
        }
      },"\u2193 EN ZAYIF"),h.map(D=>React.createElement("div",{
        key:D.sym,onClick:()=>{
          e(D.sym),i("market")
        },style:{
          display:"flex",justifyContent:"space-between",padding:"3px 6px",fontSize:11,cursor:"pointer",borderRadius:4,background:T.bg2,marginBottom:2
        }
      },React.createElement("span",{
        style:{
          color:T.blue,fontWeight:600
        }
      },D.sym),React.createElement("span",{
        className:"tnum",style:{
          color:T.red
        }
      },D.rate>=0?"+":"",D.rate.toFixed(2),"%")))))
    })))
  })(),t==="news"&&(()=>{
    const o=[{
      id:"all",label:"\u{1F310} T\xDCM\xDC",col:T.blue
    },{
      id:"borsa",label:"\u{1F4CA} BORSA",col:T.green
    },{
      id:"ekonomi",label:"\u{1F4B0} EKONOM\u0130",col:T.yellow
    },{
      id:"siyaset",label:"\u{1F3DB} S\u0130YASET",col:T.purple
    },{
      id:"dunya",label:"\u{1F30D} D\xDCNYA",col:T.red
    }],l=le.filter(m=>rt==="all"||m.category===rt),p=new Map;
    le.slice(0,30).forEach(m=>(m.sectors||[]).forEach(([k,s])=>p.set(k,(p.get(k)||0)+s)));
    const S=Array.from(p.entries()).sort((m,k)=>Math.abs(k[1])-Math.abs(m[1])).slice(0,6),C=m=>{
      const k=Date.parse(m);
      if(!k)return"";
      const s=Date.now()-k;
      return s<36e5?Math.round(s/6e4)+" dk \xF6nce":s<864e5?Math.round(s/36e5)+" sa \xF6nce":new Date(k).toLocaleDateString("tr-TR")
    };
    return React.createElement("div",{
      className:"mob-pad",style:{
        padding:"20px",maxWidth:1060,margin:"0 auto"
      }
    },React.createElement("div",{
      style:{
        display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"
      }
    },React.createElement("span",{
      style:{
        fontFamily:T.fontD,fontSize:22,fontWeight:700,color:T.yellow
      }
    },"\u{1F4F0} HABER AKI\u015EI"),React.createElement("button",{
      className:"btn",onClick:Pt,disabled:Le,style:{
        background:Le?T.bg2:`${T.green}20`,border:`1px solid ${T.green}`,color:T.green,borderRadius:6,padding:"5px 12px",cursor:Le?"wait":"pointer",fontSize:11,fontWeight:700
      }
    },Le?"Y\xDCKLEN\u0130YOR...":"\u{1F504} YEN\u0130LE"),React.createElement("span",{
      style:{
        fontSize:10,color:T.dim,marginLeft:"auto"
      }
    },le.length," ba\u015Fl\u0131k \xB7 ",Nt?`${Math.round((Date.now()-Nt)/6e4)}dk \xF6nce`:"ilk y\xFCkleme")),React.createElement("div",{
      style:{
        display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"
      }
    },o.map(m=>{
      const k=m.id==="all"?le.length:le.filter(s=>s.category===m.id).length;
      return React.createElement("button",{
        key:m.id,className:"btn",onClick:()=>ai(m.id),style:{
          background:rt===m.id?`${m.col}22`:T.bg2,border:`1px solid ${rt===m.id?m.col:T.border}`,color:rt===m.id?m.col:T.muted,borderRadius:14,padding:"4px 10px",cursor:"pointer",fontSize:10,fontWeight:rt===m.id?700:500
        }
      },m.label,k>0?` \xB7 ${k}`:"")
    })),S.length>0&&React.createElement("div",{
      style:{
        background:`linear-gradient(135deg, ${T.bg1}, ${T.bg2})`,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px",marginBottom:12
      }
    },React.createElement("div",{
      style:{
        fontSize:11,fontWeight:700,color:T.text,marginBottom:6
      }
    },"\u{1F4CA} Haberlerin sekt\xF6r etkisi (son 30 ba\u015Fl\u0131k)"),React.createElement("div",{
      style:{
        display:"flex",gap:5,flexWrap:"wrap"
      }
    },S.map(([m,k])=>{
      const s=k>0?T.green:T.red;
      return React.createElement("span",{
        key:m,style:{
          background:`${s}15`,border:`1px solid ${s}44`,color:s,borderRadius:12,padding:"3px 10px",fontSize:10,fontWeight:600
        }
      },m," ",k>0?"\u2191":"\u2193"," ",Math.abs(k).toFixed(1))
    }))),l.length===0&&!Le&&React.createElement("div",{
      style:{
        textAlign:"center",padding:"60px 20px",color:T.muted,fontSize:13
      }
    },React.createElement("div",{
      style:{
        fontSize:32,marginBottom:12
      }
    },"\u{1F4F0}"),le.length===0?"\u0130lk y\xFCkleme \u2014 YEN\u0130LE'ye bas.":"Bu kategoride ba\u015Fl\u0131k yok."),Le&&le.length===0&&React.createElement("div",{
      style:{
        textAlign:"center",padding:"40px 20px",color:T.yellow
      }
    },React.createElement("div",{
      style:{
        width:32,height:32,border:`3px solid ${T.dim}`,borderTop:`3px solid ${T.yellow}`,borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 12px"
      }
    }),React.createElement("div",{
      style:{
        fontSize:12
      }
    },"Haberler \xE7ekiliyor\u2026")),React.createElement("div",{
      style:{
        display:"flex",flexDirection:"column",gap:8
      }
    },l.slice(0,60).map(m=>{
      const k=m.impact>.5?T.green:m.impact<-.5?T.red:T.muted;
      return React.createElement("div",{
        key:m.id,style:{
          background:T.bg1,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",animation:"fadeIn .2s"
        }
      },React.createElement("div",{
        style:{
          display:"flex",alignItems:"center",gap:6,marginBottom:4,fontSize:9,color:T.dim
        }
      },React.createElement("span",{
        style:{
          color:T.blue,fontWeight:700
        }
      },m.source),React.createElement("span",null,"\xB7"),React.createElement("span",null,C(m.date)),m.impact!==0&&React.createElement("span",{
        style:{
          marginLeft:"auto",color:k,fontWeight:700
        }
      },m.impact>0?"\u2191 Pozitif":m.impact<0?"\u2193 Negatif":"\u2014")),React.createElement("a",{
        href:m.link,target:"_blank",rel:"noopener noreferrer",style:{
          display:"block",fontSize:13,color:T.text,fontWeight:600,textDecoration:"none",marginBottom:5,lineHeight:1.4
        }
      },m.title),m.desc&&React.createElement("div",{
        style:{
          fontSize:10,color:T.muted,marginBottom:6,lineHeight:1.4
        }
      },m.desc.slice(0,200),m.desc.length>200?"...":""),m.comment&&React.createElement("div",{
        style:{
          fontSize:11.5,color:T.blue,background:`${T.blue}0d`,borderRadius:7,padding:"7px 10px",marginBottom:6,lineHeight:1.5,fontWeight:600,border:`1px solid ${T.blue}22`
        }
      },"\u{1F985} ",m.comment),(m.affected?.length>0||m.sectors?.length>0)&&React.createElement("div",{
        style:{
          display:"flex",gap:4,flexWrap:"wrap",borderTop:`1px dashed ${T.border}`,paddingTop:6
        }
      },m.sectors?.slice(0,3).map(([s,A])=>{
        const x=A>0?T.green:T.red;
        return React.createElement("span",{
          key:s,style:{
            background:`${x}10`,color:x,border:`1px solid ${x}33`,borderRadius:10,padding:"1px 7px",fontSize:9
          }
        },"\u{1F3E2} ",s," ",A>0?"\u2191":"\u2193")
      }),m.affected?.slice(0,5).map(s=>{
        const A=m.affectedScore?.[s]||0,x=A>0?T.green:A<0?T.red:T.muted;
        return React.createElement("span",{
          key:s,onClick:()=>{
            e(s),i("market")
          },style:{
            background:`${x}15`,color:x,border:`1px solid ${x}44`,borderRadius:10,padding:"1px 7px",fontSize:9,cursor:"pointer",fontWeight:700
          }
        },s," ",A>0?"\u2191":A<0?"\u2193":"")
      })))
    })),React.createElement("div",{
      style:{
        fontSize:9,color:T.dim,textAlign:"center",marginTop:16,lineHeight:1.5
      }
    },"\u24D8 EAGLE EYE AI keyword tabanl\u0131 etki analizi: faiz/dolar/petrol/sekt\xF6r/\u015Firket isimleri ba\u015Fl\u0131kta tespit edilip ilgili hisselere \u2191/\u2193 etiketi atan\u0131r. ",React.createElement("b",null,"Yat\u0131r\u0131m tavsiyesi de\u011Fildir.")))
  })(),t==="portfolio"&&React.createElement("div",{
    className:"mob-pad",style:{
      padding:"20px",maxWidth:1060,margin:"0 auto"
    }
  },React.createElement("div",{
    style:{
      display:"flex",alignItems:"center",gap:12,marginBottom:16,flexWrap:"wrap"
    }
  },React.createElement("span",{
    style:{
      fontFamily:T.fontD,fontSize:22,fontWeight:700,color:T.blue
    }
  },"\u{1F4BC} PORTF\xD6Y"),React.createElement("span",{
    style:{
      fontSize:11,color:T.muted
    }
  },Z.length," pozisyon"),Z.length>0&&(()=>{
    let o=0,l=0;
    Z.forEach(C=>{
      const m=B[C.sym]?.price??C.entry;
      o+=C.lots*C.entry,l+=C.lots*m
    });
    const p=l-o,S=o>0?p/o*100:0;
    return React.createElement("div",{
      style:{
        display:"flex",gap:14,alignItems:"center",marginLeft:"auto",flexWrap:"wrap"
      }
    },React.createElement("span",{
      style:{
        fontSize:11,color:T.muted
      }
    },"Maliyet: ",React.createElement("b",{
      className:"tnum",style:{
        color:T.text
      }
    },o.toFixed(0),"\u20BA")),React.createElement("span",{
      style:{
        fontSize:11,color:T.muted
      }
    },"Anl\u0131k: ",React.createElement("b",{
      className:"tnum",style:{
        color:T.text
      }
    },l.toFixed(0),"\u20BA")),React.createElement("span",{
      style:{
        fontSize:13,fontWeight:700,color:p>=0?T.green:T.red
      },className:"tnum"
    },"K/Z: ",p>=0?"+":"",p.toFixed(0),"\u20BA (",p>=0?"+":"",S.toFixed(2),"%)"))
  })()),Z.length===0?React.createElement("div",{
    style:{
      textAlign:"center",padding:"60px 20px",color:T.muted,fontSize:13
    }
  },React.createElement("div",{
    style:{
      fontSize:32,marginBottom:12
    }
  },"\u{1F4BC}"),"Hen\xFCz pozisyon yok.",React.createElement("br",null),React.createElement("span",{
    style:{
      fontSize:11,marginTop:8,display:"block"
    }
  },"BIST detay\u0131nda trade \xF6neri kart\u0131n\u0131n alt\u0131nda ",React.createElement("b",{
    style:{
      color:T.green
    }
  },"+ Pozisyon A\xE7")," butonuna bas.")):React.createElement("div",{
    style:{
      display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(280px,100%),1fr))",gap:10
    }
  },Z.map(o=>{
    const l=B[o.sym]?.price??o.entry,p=calcPnl(o.entry,l,o.lots),S=p.pnl,C=p.pnlPct,m=S>=0,k=o.stop&&l<=o.stop,s=o.target&&l>=o.target;
    return React.createElement("div",{
      key:o.id,onClick:()=>{
        e(o.sym),i("market")
      },style:{
        background:T.bg1,border:`1px solid ${m?T.green:T.red}44`,borderRadius:10,padding:"12px 14px",cursor:"pointer"
      }
    },React.createElement("div",{
      style:{
        display:"flex",justifyContent:"space-between",marginBottom:8
      }
    },React.createElement("div",null,React.createElement("div",{
      style:{
        fontFamily:T.fontD,fontSize:17,fontWeight:700,color:T.text
      }
    },o.sym),React.createElement("div",{
      style:{
        fontSize:10,color:T.muted
      }
    },o.lots," lot @ ",o.entry.toFixed(2),"\u20BA")),React.createElement("div",{
      style:{
        textAlign:"right"
      }
    },React.createElement("div",{
      className:"tnum",style:{
        fontSize:16,fontWeight:700,color:m?T.green:T.red
      }
    },S>=0?"+":"",S.toFixed(0),"\u20BA"),React.createElement("div",{
      className:"tnum",style:{
        fontSize:11,color:m?T.green:T.red
      }
    },C>=0?"+":"",C.toFixed(2),"%"))),React.createElement("div",{
      style:{
        fontSize:10,color:T.muted,display:"flex",gap:8,flexWrap:"wrap",marginBottom:6
      }
    },React.createElement("span",null,"Anl\u0131k: ",React.createElement("b",{
      className:"tnum",style:{
        color:T.text
      }
    },l.toFixed(2),"\u20BA")),o.stop&&React.createElement("span",{
      style:{
        color:k?T.red:T.muted
      }
    },"Stop: ",React.createElement("b",{
      className:"tnum"
    },o.stop.toFixed(2)),k?" \u26A0":""),o.target&&React.createElement("span",{
      style:{
        color:s?T.green:T.muted
      }
    },"H: ",React.createElement("b",{
      className:"tnum"
    },o.target.toFixed(2)),s?" \u2713":"")),o.note&&React.createElement("div",{
      style:{
        fontSize:10,color:T.dim,fontStyle:"italic",marginBottom:4
      }
    },"\u{1F3F7} ",o.note),o.reason&&React.createElement("div",{
      style:{
        fontSize:10,color:T.purple,marginBottom:6,lineHeight:1.4,background:T.bg2,padding:"4px 6px",borderRadius:4
      }
    },"\u{1F4DD} ",o.reason),React.createElement("button",{
      className:"btn",onClick:A=>{
        A.stopPropagation(),confirm(`${o.sym} pozisyonunu kapat? (anl\u0131k ${l.toFixed(2)}\u20BA'den, g\xFCnl\xFC\u011Fe kaydedilecek)`)&&ui(o.id,l)
      },style:{
        background:`${T.red}15`,border:`1px solid ${T.red}44`,color:T.red,borderRadius:5,padding:"3px 10px",cursor:"pointer",fontSize:10,width:"100%"
      }
    },"KAPAT (PNL: ",S>=0?"+":"",S.toFixed(0),"\u20BA)"))
  })),w.length>0&&(()=>{
    const o=w.filter(s=>(s.pnlPct||0)>0).length,l=w.filter(s=>(s.pnlPct||0)<=0).length,p=o/w.length*100,S=w.reduce((s,A)=>s+(A.pnl||0),0),C=o?w.filter(s=>s.pnlPct>0).reduce((s,A)=>s+A.pnlPct,0)/o:0,m=l?w.filter(s=>s.pnlPct<=0).reduce((s,A)=>s+A.pnlPct,0)/l:0,k=w.reduce((s,A)=>s+(A.days||1),0)/w.length;
    return React.createElement("div",{
      style:{
        marginTop:20,paddingTop:16,borderTop:`1px solid ${T.border}`
      }
    },React.createElement("div",{
      style:{
        display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"
      }
    },React.createElement("span",{
      style:{
        fontSize:14,fontWeight:700,color:T.purple
      }
    },"\u{1F4D3} TRADE G\xDCNL\xDC\u011E\xDC"),React.createElement("span",{
      style:{
        fontSize:10,color:T.muted
      }
    },w.length," kapanan trade"),w.length>0&&React.createElement("button",{
      className:"btn",onClick:()=>{
        confirm(`${w.length} g\xFCnl\xFCk kayd\u0131n\u0131 sil?`)&&(J([]),ls.save(LS_JOURNAL,[]))
      },style:{
        marginLeft:"auto",background:T.bg2,border:`1px solid ${T.border}`,color:T.muted,borderRadius:5,padding:"3px 10px",cursor:"pointer",fontSize:9
      }
    },"TEM\u0130ZLE")),React.createElement("div",{
      style:{
        display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:8,marginBottom:12
      }
    },React.createElement("div",{
      style:{
        background:T.bg2,padding:"6px 10px",borderRadius:6,textAlign:"center"
      }
    },React.createElement("div",{
      style:{
        fontSize:9,color:T.muted
      }
    },"\u0130SABET"),React.createElement("div",{
      className:"tnum",style:{
        fontSize:16,fontWeight:700,color:p>=50?T.green:T.red
      }
    },p.toFixed(0),"%"),React.createElement("div",{
      style:{
        fontSize:9,color:T.dim
      }
    },o,"K / ",l,"Z")),React.createElement("div",{
      style:{
        background:T.bg2,padding:"6px 10px",borderRadius:6,textAlign:"center"
      }
    },React.createElement("div",{
      style:{
        fontSize:9,color:T.muted
      }
    },"TOPLAM PNL"),React.createElement("div",{
      className:"tnum",style:{
        fontSize:15,fontWeight:700,color:S>=0?T.green:T.red
      }
    },S>=0?"+":"",S.toFixed(0),"\u20BA")),React.createElement("div",{
      style:{
        background:T.bg2,padding:"6px 10px",borderRadius:6,textAlign:"center"
      }
    },React.createElement("div",{
      style:{
        fontSize:9,color:T.muted
      }
    },"ORT. KAZAN\xC7"),React.createElement("div",{
      className:"tnum",style:{
        fontSize:14,fontWeight:700,color:T.green
      }
    },"+",C.toFixed(1),"%")),React.createElement("div",{
      style:{
        background:T.bg2,padding:"6px 10px",borderRadius:6,textAlign:"center"
      }
    },React.createElement("div",{
      style:{
        fontSize:9,color:T.muted
      }
    },"ORT. ZARAR"),React.createElement("div",{
      className:"tnum",style:{
        fontSize:14,fontWeight:700,color:T.red
      }
    },m.toFixed(1),"%")),React.createElement("div",{
      style:{
        background:T.bg2,padding:"6px 10px",borderRadius:6,textAlign:"center"
      }
    },React.createElement("div",{
      style:{
        fontSize:9,color:T.muted
      }
    },"ORT. TUTMA"),React.createElement("div",{
      className:"tnum",style:{
        fontSize:14,fontWeight:700,color:T.blue
      }
    },k.toFixed(0)," g\xFCn"))),React.createElement("div",{
      style:{
        display:"flex",flexDirection:"column",gap:6
      }
    },[...w].reverse().slice(0,20).map((s,A)=>{
      const x=(s.pnlPct||0)>0;
      return React.createElement("div",{
        key:s.id||A,onClick:()=>{
          e(s.sym),i("market")
        },style:{
          background:T.bg2,border:`1px solid ${x?T.green+"33":T.red+"33"}`,borderRadius:6,padding:"8px 10px",cursor:"pointer",animation:"fadeIn .15s"
        }
      },React.createElement("div",{
        style:{
          display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4,flexWrap:"wrap",gap:6
        }
      },React.createElement("div",{
        style:{
          display:"flex",gap:8,alignItems:"baseline",flexWrap:"wrap"
        }
      },React.createElement("span",{
        style:{
          fontFamily:T.fontD,fontSize:13,fontWeight:700,color:T.blue
        }
      },s.sym),React.createElement("span",{
        className:"tnum",style:{
          fontSize:11,color:T.muted
        }
      },s.entry,"\u20BA \u2192 ",s.exit,"\u20BA"),React.createElement("span",{
        style:{
          fontSize:10,color:T.dim
        }
      },s.lots," lot \xB7 ",s.days,"g")),React.createElement("span",{
        className:"tnum",style:{
          fontSize:14,fontWeight:700,color:x?T.green:T.red
        }
      },s.pnlPct>=0?"+":"",s.pnlPct?.toFixed(1),"% (",s.pnl>=0?"+":"",s.pnl,"\u20BA)")),s.reason&&React.createElement("div",{
        style:{
          fontSize:10,color:T.muted,lineHeight:1.4,fontStyle:"italic"
        }
      },"\u{1F4DD} ",s.reason))
    })))
  })()),t==="scanner"&&(()=>{
    const o=Y.filter(m=>Ae==="all"?!0:Ae==="swing"?m.tradeMode==="swing":Ae==="day"?m.tradeMode==="day":!0),l=Y.filter(m=>m.tradeMode==="swing").length,p=Y.filter(m=>m.tradeMode==="day").length,S=async()=>{
      if(Y.length===0){
        yt("\xD6nce TARA'ya bas, sonra AI \xF6nerisini iste");
        return
      }
      Et(!0),yt(null);
      const m=Y.filter(x=>x.signal==="AL").sort((x,h)=>(h.priority||0)-(x.priority||0)),k=Y.filter(x=>x.signal==="SAT").sort((x,h)=>(h.priority||0)-(x.priority||0)),s={
      };
      Object.entries(BIST_SECTORS).forEach(([x,h])=>{
        const R=h.map(D=>B[D]?.rate).filter(D=>D!=null);
        R.length>=2&&(s[x]=R.reduce((D,j)=>D+j,0)/R.length)
      });
      const A=!xe;
      try{
        let x,h;
        if(A)x=feyAIScanTopPicks(m,k,null,s),h="eagle-ai";
        else{
          const D=buildUserHistoryContext(Z,_e,w,null);
          try{
            x=await aiScanTopPicks(xe,m,k,D),h="claude"
          }
          catch(j){
            x=feyAIScanTopPicks(m,k,null,s)+`
---
\u26A0 Claude hatas\u0131: `+j.message+" \u2014 yerel motor cevap verdi.",h="eagle-ai-fallback"
          }
        }
        const R={
          text:x,time:new Date().toLocaleString("tr-TR"),count:m.length,engine:h
        };
        vt(R),ls.save(LS_AICACHE,R)
      }
      catch(x){
        yt(x.message)
      }
      finally{
        Et(!1)
      }
    },C=(m,k,s)=>React.createElement("button",{
      className:"btn",onClick:()=>te(m),style:{
        background:Ae===m?`${T.purple}25`:T.bg2,border:`1px solid ${Ae===m?T.purple:T.border}`,color:Ae===m?T.purple:T.muted,borderRadius:16,padding:"4px 12px",cursor:"pointer",fontSize:11,fontWeight:Ae===m?700:500
      }
    },k,s!=null?` \xB7 ${s}`:"");
    return React.createElement("div",{
      className:"mob-pad",style:{
        padding:"20px",maxWidth:1060,margin:"0 auto"
      }
    },React.createElement("div",{
      style:{
        display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"
      }
    },React.createElement("span",{
      style:{
        fontFamily:T.fontD,fontSize:22,fontWeight:700,color:T.purple
      }
    },"\u232C TARAYICI"),React.createElement("button",{
      className:"btn",onClick:Fi,disabled:q,style:{
        background:q?T.bg2:`${T.green}20`,border:`1px solid ${T.green}`,color:T.green,borderRadius:6,padding:"6px 16px",cursor:q?"wait":"pointer",fontSize:12,fontWeight:700
      }
    },q?`TARANIYOR... ${Y.length}`:"\u25B6 TARA"),React.createElement("button",{
      className:"btn",onClick:S,disabled:He||Y.length===0,title:"Tarama sonuçlarını Claude AI'a verip bugünün en güçlü 5 fırsatını seçtir",style:{
        background:He?T.bg2:`${T.purple}20`,border:`1px solid ${T.purple}`,color:T.purple,borderRadius:6,padding:"6px 14px",cursor:He?"wait":Y.length===0?"not-allowed":"pointer",fontSize:12,fontWeight:700,opacity:Y.length===0?.5:1
      }
    },He?"AI D\xDC\u015E\xDCN\xDCYOR...":"\u{1F916} AI \xD6NER\u0130S\u0130"),React.createElement("button",{
      className:"btn",disabled:Y.length===0,title:"Tarama sonu\xE7lar\u0131n\u0131 PDF olarak kaydet/yazd\u0131r",onClick:()=>{
        if(!Y.length)return;
        const W=window.open("","_blank");
        if(!W)return;
        const esc=v=>String(v??"").replace(/[<>&]/g,m=>({"<":"&lt;",">":"&gt;","&":"&amp;"}[m])),al=Y.filter(x=>x.signal==="AL"),st=Y.filter(x=>x.signal==="SAT"),row=x=>`<tr><td><b>${esc(x.sym)}</b></td><td style="color:${x.signal==="AL"?"#00875a":"#d32f2f"};font-weight:700">${esc(x.signal)} %${esc(x.confidence)}</td><td>${esc(x.mod)}</td><td>${esc((x.price||0).toFixed?x.price.toFixed(2):x.price)}\u20BA</td><td>${esc(x.stopLoss)}</td><td>${esc(x.target1)}</td><td>${esc(x.durationLabel)}</td><td>${esc(x.riskLevel)}</td></tr>`;
        W.document.write(`<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>EAGLE EYE bistIQ \u2014 TARA ${new Date().toLocaleDateString("tr-TR")}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:32px;color:#0a0e17;max-width:900px;margin:0 auto}h1{font-size:22px;margin:0 0 4px;letter-spacing:-.3px}.sub{color:#5e6776;font-size:13px;margin-bottom:20px}h2{font-size:15px;margin:22px 0 8px;border-left:3px solid #00875a;padding-left:8px}table{width:100%;border-collapse:collapse;font-size:12.5px;margin-bottom:10px}th{text-align:left;padding:8px 10px;background:#eef1f6;border-bottom:2px solid #d7dce5;font-size:11px;text-transform:uppercase;letter-spacing:.4px;color:#5e6776}td{padding:7px 10px;border-bottom:1px solid #eef1f6}tr:hover{background:#fafbfd}.f{margin-top:24px;padding-top:12px;border-top:1px solid #d7dce5;font-size:10.5px;color:#9ba4b4}@media print{body{padding:0}}</style></head><body><h1>\u{1F985} EAGLE EYE: bistIQ \u2014 TARA Sonu\xE7lar\u0131</h1><div class="sub">${new Date().toLocaleString("tr-TR")} \xB7 ${Y.length} sinyal (${al.length} AL, ${st.length} SAT)</div>${al.length?`<h2>\u{1F4C8} AL Sinyalleri (${al.length})</h2><table><thead><tr><th>Sembol</th><th>Sinyal</th><th>Mod</th><th>Fiyat</th><th>Stop</th><th>Hedef</th><th>Vade</th><th>Risk</th></tr></thead><tbody>${al.map(row).join("")}</tbody></table>`:""}${st.length?`<h2>\u{1F4C9} SAT Sinyalleri (${st.length})</h2><table><thead><tr><th>Sembol</th><th>Sinyal</th><th>Mod</th><th>Fiyat</th><th>Stop</th><th>Hedef</th><th>Vade</th><th>Risk</th></tr></thead><tbody>${st.map(row).join("")}</tbody></table>`:""}<div class="f">EAGLE EYE: bistIQ \xB7 BIST canl\u0131 sinyal botu \xB7 Yat\u0131r\u0131m tavsiyesi de\u011Fildir. Veriler ~15dk gecikmeli olabilir.</div></body></html>`);
        W.document.close();
        setTimeout(()=>W.print(),350)
      },style:{
        background:Y.length===0?T.bg2:`${T.blue}15`,border:`1px solid ${Y.length===0?T.border:T.blue}`,color:Y.length===0?T.muted:T.blue,borderRadius:6,padding:"6px 14px",cursor:Y.length===0?"not-allowed":"pointer",fontSize:12,fontWeight:700,opacity:Y.length===0?.5:1
      }
    },"\u{1F4C4} PDF"),React.createElement("span",{
      style:{
        fontSize:11,color:T.muted,marginLeft:"auto"
      }
    },"BIST 200+ \xB7 G\xFCven \u2265 %50")),Y.length>0&&React.createElement("div",{
      style:{
        display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"
      }
    },C("all","\u{1F310} T\xDCM\xDC",Y.length),C("swing","\u{1F4C8} SWING",l),C("day","\u26A1 DAY TRADE",p),React.createElement("span",{
      style:{
        fontSize:10,color:T.dim,alignSelf:"center",marginLeft:8
      }
    },Ae==="swing"&&"1-4 hafta vade \xB7 ADX\u226518 \xB7 HTF onayl\u0131",Ae==="day"&&"1-3 g\xFCn vade \xB7 ORB/BURST/FLIP tetik",Ae==="all"&&"T\xFCm sinyaller (vade fark etmez)")),(oe||He||Re)&&(()=>{
      const m=!oe||oe.engine==="eagle-ai"||oe.engine==="eagle-ai-fallback"?T.green:T.purple,k=oe?.engine==="claude"?"\u{1F916} CLAUDE TARAYICI":oe?.engine==="eagle-ai-fallback"?"\u{1F9E0} EAGLE EYE AI TARAYICI (Claude fallback)":"\u{1F9E0} EAGLE EYE AI TARAYICI";
      return React.createElement("div",{
        style:{
          background:`linear-gradient(135deg, ${m}15, ${T.bg2})`,border:`1px solid ${m}66`,borderRadius:10,padding:"12px 14px",marginBottom:14
        }
      },React.createElement("div",{
        style:{
          display:"flex",alignItems:"center",gap:8,marginBottom:8
        }
      },React.createElement("span",{
        style:{
          fontSize:14,fontWeight:700,color:m
        }
      },k),oe&&React.createElement("span",{
        style:{
          fontSize:9,color:T.dim
        }
      },oe.time,oe.count?` \xB7 ${oe.count} aday de\u011Ferlendirildi`:""),oe&&React.createElement("button",{
        className:"btn",onClick:()=>{
          vt(null),ls.save(LS_AICACHE,null)
        },style:{
          marginLeft:"auto",background:"transparent",border:"none",color:T.muted,cursor:"pointer",fontSize:14
        }
      },"\xD7")),He&&React.createElement("div",{
        style:{
          fontSize:11,color:T.muted,animation:"pulse 1.5s infinite"
        }
      },xe?"Claude tarama sonu\xE7lar\u0131n\u0131 analiz ediyor (~10-20 sn)...":"EAGLE EYE AI yerel motor s\u0131ral\u0131yor (an\u0131nda)..."),Re&&React.createElement("div",{
        style:{
          fontSize:12,color:T.red,padding:6
        }
      },"\u26A0 ",Re),oe&&!He&&React.createElement("div",{
        style:{
          fontSize:14,color:T.text,lineHeight:1.75,whiteSpace:"pre-wrap",fontFamily:T.font,fontWeight:500
        }
      },oe.text))
    })(),Y.length===0&&!q&&React.createElement("div",{
      style:{
        textAlign:"center",padding:"60px 20px",color:T.muted,fontSize:13
      }
    },React.createElement("div",{
      style:{
        fontSize:32,marginBottom:12
      }
    },"\u232C"),"En g\xFC\xE7l\xFC AL/SAT sinyallerini bulmak i\xE7in TARA'ya bas.",React.createElement("br",null),React.createElement("span",{
      style:{
        fontSize:11,color:T.dim
      }
    },"Tarama sonras\u0131 \u{1F916} AI \xD6NER\u0130S\u0130 \u2014 EAGLE EYE AI yerel motor (API key gerekmez) bug\xFCn\xFCn en iyi 5'ini se\xE7er. Key varsa Claude devreye girer.")),Y.length>0&&o.length===0&&React.createElement("div",{
      style:{
        textAlign:"center",padding:"30px",color:T.muted,fontSize:12
      }
    },"Bu modda e\u015Fle\u015Fen sinyal yok. Di\u011Fer chip'leri dene veya T\xDCM\xDC'ne d\xF6n."),React.createElement("div",{
      style:{
        display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:8
      }
    },o.map(m=>{
      const k=m.signal==="AL"?T.green:T.red;
      return React.createElement("div",{
        key:m.sym,onClick:()=>{
          e(m.sym),i("market")
        },style:{
          background:T.bg1,border:`1px solid ${k}44`,borderRadius:8,padding:"10px 12px",cursor:"pointer",animation:"fadeIn .2s"
        }
      },React.createElement("div",{
        style:{
          display:"flex",justifyContent:"space-between",marginBottom:6,alignItems:"center"
        }
      },React.createElement("span",{
        style:{
          fontFamily:T.fontD,fontSize:16,fontWeight:700,color:T.blue,letterSpacing:1
        }
      },m.sym),React.createElement("div",{
        style:{
          display:"flex",gap:4
        }
      },m.riskLevel&&React.createElement("span",{
        title:`Risk: ${m.riskLevel}`,style:{
          background:`${m.riskColor}15`,border:`1px solid ${m.riskColor}66`,color:m.riskColor,borderRadius:10,padding:"1px 6px",fontSize:10,fontWeight:700
        }
      },m.riskEmoji),React.createElement("span",{
        style:{
          background:`${k}15`,border:`1px solid ${k}66`,color:k,borderRadius:12,padding:"2px 10px",fontSize:11,fontWeight:700
        }
      },m.signal," %",m.confidence))),React.createElement("div",{
        style:{
          fontSize:10,color:T.muted,marginBottom:5
        }
      },m.mod,m.tradeMode==="swing"&&React.createElement("span",{
        style:{
          marginLeft:6,color:T.blue
        }
      },"\xB7 \u{1F4C8} SWING"),m.tradeMode==="day"&&React.createElement("span",{
        style:{
          marginLeft:6,color:T.yellow
        }
      },"\xB7 \u26A1 DAY")),m.paLabel&&m.paStrength>=80&&React.createElement("div",{
        style:{
          fontSize:10,color:T.green,marginBottom:4,fontWeight:700
        }
      },"\u26A1 ",m.paLabel),React.createElement("div",{
        style:{
          display:"flex",gap:8,fontSize:11,flexWrap:"wrap"
        }
      },React.createElement("span",{
        style:{
          color:T.text
        }
      },(B[m.sym]?.price??m.price)?.toFixed(2),"\u20BA"),m.stopLoss&&React.createElement("span",{
        style:{
          color:T.red
        }
      },"S: ",m.stopLoss),m.target1&&React.createElement("span",{
        style:{
          color:T.green
        }
      },"H: ",m.target1),m.durationLabel&&React.createElement("span",{
        style:{
          color:T.yellow,fontWeight:700
        }
      },"\u23F1 ",m.durationLabel),m.adx>0&&React.createElement("span",{
        style:{
          color:T.muted
        }
      },"ADX:",m.adx.toFixed(0)),m.dipScore&&React.createElement("span",{
        style:{
          color:T.orange
        }
      },"D\u0130P ",m.dipScore,"/7")))
    })))
  })(),t==="sim"&&(()=>{
  const eqPos=Object.entries(pap.pos).map(([s,q])=>({sym:s,lot:q.lot,entry:q.entry,date:q.date,cur:allStocks[s]?.price||q.entry})),posVal=eqPos.reduce((a,p)=>a+p.lot*p.cur,0),eq=pap.cash+posVal,tot=eq-pap.start,totP=tot/pap.start*100,dayB=pap.dayStart||pap.start,day=eq-dayB,wins=pap.trades.filter(x=>x.pnl>0).length,cell=(L,V,C)=>React.createElement("div",{style:{flex:1,minWidth:88,background:T.bg2,borderRadius:10,padding:"10px 12px"}},React.createElement("div",{style:{fontSize:10,color:T.muted,marginBottom:3}},L),React.createElement("div",{className:"tnum",style:{fontSize:17,fontWeight:800,color:C||T.text}},V)),fmt=v=>v.toLocaleString("tr-TR",{maximumFractionDigits:0});
  return React.createElement("div",{className:"mob-pad",style:{padding:"20px",maxWidth:1060,margin:"0 auto"}},React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}},React.createElement("span",{style:{fontFamily:T.fontD,fontSize:22,fontWeight:800,color:T.text}},"💰 SANAL TRADER"),React.createElement("span",{style:{fontSize:11,color:T.muted}},"Bot sinyalleriyle otomatik sanal alım-satım"),React.createElement("button",{className:"btn",onClick:()=>{confirm("Sim\xFClat\xF6r\xFC sıfırla? T\xFCm sanal işlemler silinir.")&&papZ(()=>{const np={cash:1e5,start:1e5,pos:{},trades:[],seen:{},dayKey:new Date().toISOString().slice(0,10),dayStart:1e5};return ls.save("feybot_paper",np),np})},style:{marginLeft:"auto",background:T.bg2,border:`1px solid ${T.border}`,color:T.muted,borderRadius:6,padding:"5px 12px",cursor:"pointer",fontSize:11}},"↺ Sıfırla")),React.createElement("div",{style:{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}},cell("Anlık Değer",fmt(eq)+"₺",T.text),cell("Toplam K/Z",(tot>=0?"+":"")+fmt(tot)+"₺",tot>=0?T.green:T.red),cell("Getiri",(totP>=0?"+":"")+totP.toFixed(2)+"%",totP>=0?T.green:T.red),cell("Bug\xFCn",(day>=0?"+":"")+fmt(day)+"₺",day>=0?T.green:T.red)),React.createElement("div",{style:{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}},cell("Nakit",fmt(pap.cash)+"₺",T.muted),cell("A\xE7ık Poz.",eqPos.length+"",T.blue),cell("Kapanan",pap.trades.length+"",T.muted),cell("İsabet",pap.trades.length?Math.round(wins/pap.trades.length*100)+"%":"—",T.purple)),qe&&Ze&&React.createElement("button",{className:"btn",onClick:()=>{sendAlertEmail(qe,"💰 SİMÜLATÖR",tot>=0?"KAR":"ZARAR",eq.toFixed(0),totP.toFixed(2)).then(()=>alert("\xD6zet mail g\xF6nderildi")).catch(()=>alert("Mail hatası"))},style:{background:`${T.green}15`,border:`1px solid ${T.green}66`,color:T.green,borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:12,fontWeight:600,marginBottom:14}},"📧 G\xFCnl\xFCk \xD6zet Maille"),eqPos.length>0&&React.createElement("div",{style:{marginBottom:14}},React.createElement("div",{style:{fontSize:13,fontWeight:700,color:T.text,marginBottom:8}},"📂 A\xE7ık Pozisyonlar"),eqPos.map(p=>{const pnl=(p.cur-p.entry)*p.lot,up=pnl>=0;return React.createElement("div",{key:p.sym,onClick:()=>{e(p.sym),i("market")},style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",background:T.bg1,border:`1px solid ${up?T.green+"33":T.red+"33"}`,borderRadius:8,marginBottom:6,cursor:"pointer"}},React.createElement("div",{},React.createElement("b",{style:{color:T.blue}},p.sym),React.createElement("span",{style:{fontSize:10,color:T.muted,marginLeft:8}},p.lot+" lot @ "+p.entry.toFixed(2))),React.createElement("div",{className:"tnum",style:{textAlign:"right",color:up?T.green:T.red,fontWeight:700}},(up?"+":"")+pnl.toFixed(0)+"₺",React.createElement("div",{style:{fontSize:10}},(up?"+":"")+((p.cur-p.entry)/p.entry*100).toFixed(2)+"%")))})),React.createElement("div",{style:{fontSize:13,fontWeight:700,color:T.text,marginBottom:8}},"📒 İşlem Ge\xE7mişi"),pap.trades.length===0?React.createElement("div",{style:{textAlign:"center",padding:"30px",color:T.muted,fontSize:12}},"Hen\xFCz kapanan işlem yok. Bot AL sinyali verince sanal alım yapılır, SAT'ta kapanır."):pap.trades.slice(0,40).map((x,k)=>{const up=x.pnl>=0;return React.createElement("div",{key:k,style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:T.bg2,borderRadius:7,marginBottom:5,fontSize:12}},React.createElement("div",{},React.createElement("b",{style:{color:T.blue}},x.sym),React.createElement("span",{className:"tnum",style:{fontSize:10,color:T.muted,marginLeft:8}},x.entry+"→"+x.exit),React.createElement("span",{style:{fontSize:9,color:T.dim,marginLeft:6}},x.close)),React.createElement("span",{className:"tnum",style:{color:up?T.green:T.red,fontWeight:700}},(up?"+":"")+x.pnl+"₺ ("+(up?"+":"")+x.pnlPct+"%)"))}),React.createElement("div",{style:{fontSize:9,color:T.dim,textAlign:"center",marginTop:16}},"Sanal para 100.000₺ \xB7 Bot sinyalleriyle otomatik \xB7 Her AL'da nakit %10'u \xB7 Yatırım tavsiyesi değildir"))
})(),t==="signals"&&(()=>{
    const o=new Date().toISOString().slice(0,10),l=_e.filter(x=>!x.dateKey||x.dateKey===o),p=_e.filter(x=>x.dateKey).slice(0,100).map(x=>{
      const h=+x.price,R=B[x.symbol]?.price;
      if(!h||!R)return{
        ...x,delta:null,hit:null
      };
      const D=(R-h)/h*100,j=x.to==="AL"?D>0:x.to==="SAT"?D<0:null;
      return{
        ...x,delta:+D.toFixed(2),current:R,hit:j
      }
    }),S=p.filter(x=>x.delta!=null&&x.to!=="N\xD6TR"),C=S.length,m=S.filter(x=>x.hit).length,k=C>0?m/C*100:0,s=S.filter(x=>x.to==="AL").reduce((x,h)=>x+h.delta,0)/Math.max(1,S.filter(x=>x.to==="AL").length),A=S.filter(x=>x.to==="SAT").reduce((x,h)=>x+h.delta,0)/Math.max(1,S.filter(x=>x.to==="SAT").length);
    return React.createElement("div",{
      className:"mob-pad",style:{
        padding:"20px",maxWidth:1060,margin:"0 auto"
      }
    },React.createElement("div",{
      style:{
        display:"flex",alignItems:"center",gap:12,marginBottom:14,flexWrap:"wrap"
      }
    },React.createElement("span",{
      style:{
        fontFamily:T.fontD,fontSize:22,fontWeight:700,color:T.blue
      }
    },"\u{1F4F6} S\u0130NYAL GE\xC7M\u0130\u015E\u0130"),_e.length>0&&React.createElement("button",{
      className:"btn",onClick:()=>{
        Qt([]),ls.save(LS_SIGHIST,[])
      },style:{
        background:T.bg2,border:`1px solid ${T.border}`,color:T.muted,borderRadius:5,padding:"3px 10px",cursor:"pointer",fontSize:10,marginLeft:"auto"
      }
    },"TEM\u0130ZLE")),React.createElement("div",{
      style:{
        display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"
      }
    },React.createElement("input",{
      value:sgQ,onChange:ev=>sgQz(ev.target.value),placeholder:"Hisse ara (\xF6rn THYAO)\u2026",style:{
        flex:1,minWidth:140,background:T.bg2,border:`1px solid ${T.border}`,borderRadius:8,padding:"7px 12px",fontSize:13,color:T.text,outline:"none"
      }
    }),sgQ&&React.createElement("button",{
      onClick:()=>sgQz(""),style:{
        background:T.bg2,border:`1px solid ${T.border}`,color:T.muted,borderRadius:8,padding:"7px 10px",cursor:"pointer",fontSize:12
      }
    },"\u2715"),React.createElement("button",{
      onClick:()=>sgTaraz(!sgTara),title:"Yaln\u0131zca TARA'da sinyal veren hisseler",style:{
        background:sgTara?`${T.green}20`:T.bg2,border:`1px solid ${sgTara?T.green:T.border}`,color:sgTara?T.green:T.muted,borderRadius:999,padding:"6px 14px",cursor:"pointer",fontSize:12,fontWeight:600,whiteSpace:"nowrap"
      }
    },"\u{1F50D} Sadece TARA")),re.length>0&&(()=>{
      const x=re.filter(R=>!R.fired),h=re.filter(R=>R.fired);
      return React.createElement("div",{
        style:{
          background:`linear-gradient(135deg, ${T.yellow}10, ${T.bg2})`,border:`1px solid ${T.yellow}55`,borderRadius:10,padding:"12px 14px",marginBottom:12
        }
      },React.createElement("div",{
        style:{
          display:"flex",alignItems:"center",gap:8,marginBottom:8
        }
      },React.createElement("span",{
        style:{
          fontSize:13,fontWeight:700,color:T.yellow
        }
      },"\u{1F514} E\u015E\u0130K ALARMLARI"),React.createElement("span",{
        style:{
          fontSize:10,color:T.muted
        }
      },x.length," aktif \xB7 ",h.length," tetiklendi"),h.length>0&&React.createElement("button",{
        className:"btn",onClick:()=>Oe(re.filter(R=>!R.fired)),style:{
          marginLeft:"auto",background:T.bg2,border:`1px solid ${T.border}`,color:T.muted,borderRadius:4,padding:"2px 8px",cursor:"pointer",fontSize:9
        }
      },"VURANLARI S\u0130L")),React.createElement("div",{
        style:{
          display:"flex",flexDirection:"column",gap:4
        }
      },re.slice(-15).reverse().map(R=>{
        const D=R.type==="price"?"Fiyat":R.type==="rsi"?"RSI":R.type==="ma200"?"MA200":"MACD",j=R.fired?T.green:T.muted;
        return React.createElement("div",{
          key:R.id,onClick:()=>{
            e(R.sym),i("market")
          },style:{
            display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 8px",background:T.bg,borderRadius:5,cursor:"pointer",border:`1px solid ${R.fired?T.green+"33":T.border}`
          }
        },React.createElement("div",{
          style:{
            display:"flex",gap:8,alignItems:"baseline"
          }
        },React.createElement("span",{
          style:{
            fontFamily:T.fontD,fontSize:12,fontWeight:700,color:T.blue
          }
        },R.sym),React.createElement("span",{
          style:{
            fontSize:10,color:j
          }
        },D," ",R.op," ",React.createElement("b",{
          className:"tnum"
        },R.value)),R.fired&&React.createElement("span",{
          style:{
            fontSize:9,color:T.green,fontWeight:700
          }
        },"\u2713 VURDU")),React.createElement("button",{
          className:"btn",onClick:Se=>{
            Se.stopPropagation(),Oe(re.filter(ze=>ze.id!==R.id))
          },style:{
            background:"transparent",border:"none",cursor:"pointer",color:T.muted,fontSize:12,padding:"0 4px"
          }
        },"\xD7"))
      })))
    })(),C>0&&React.createElement("div",{
      style:{
        background:`linear-gradient(135deg, ${T.bg1}, ${T.bg2})`,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px",marginBottom:12
      }
    },React.createElement("div",{
      style:{
        fontSize:11,fontWeight:700,color:T.text,marginBottom:8,letterSpacing:.3
      }
    },"\u{1F3AF} BOT PERFORMANSI"),React.createElement("div",{
      style:{
        display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(90px,1fr))",gap:8
      }
    },React.createElement("div",{
      style:{
        background:T.bg2,padding:"6px 10px",borderRadius:6,textAlign:"center"
      }
    },React.createElement("div",{
      style:{
        fontSize:9,color:T.muted,letterSpacing:.5
      }
    },"\u0130SABET"),React.createElement("div",{
      className:"tnum",style:{
        fontSize:18,fontWeight:700,color:k>=50?T.green:T.red
      }
    },k.toFixed(0),"%"),React.createElement("div",{
      style:{
        fontSize:9,color:T.dim
      }
    },m,"/",C)),React.createElement("div",{
      style:{
        background:T.bg2,padding:"6px 10px",borderRadius:6,textAlign:"center"
      }
    },React.createElement("div",{
      style:{
        fontSize:9,color:T.muted,letterSpacing:.5
      }
    },"AL ORT."),React.createElement("div",{
      className:"tnum",style:{
        fontSize:16,fontWeight:700,color:s>=0?T.green:T.red
      }
    },s>=0?"+":"",s.toFixed(2),"%")),React.createElement("div",{
      style:{
        background:T.bg2,padding:"6px 10px",borderRadius:6,textAlign:"center"
      }
    },React.createElement("div",{
      style:{
        fontSize:9,color:T.muted,letterSpacing:.5
      }
    },"SAT ORT."),React.createElement("div",{
      className:"tnum",style:{
        fontSize:16,fontWeight:700,color:A<=0?T.green:T.red
      }
    },A>=0?"+":"",A.toFixed(2),"%")),React.createElement("div",{
      style:{
        background:T.bg2,padding:"6px 10px",borderRadius:6,textAlign:"center"
      }
    },React.createElement("div",{
      style:{
        fontSize:9,color:T.muted,letterSpacing:.5
      }
    },"BUG\xDCN"),React.createElement("div",{
      className:"tnum",style:{
        fontSize:16,fontWeight:700,color:T.text
      }
    },l.length),React.createElement("div",{
      style:{
        fontSize:9,color:T.dim
      }
    },"sinyal")))),_e.length===0?React.createElement("div",{
      style:{
        textAlign:"center",padding:"60px",color:T.muted,fontSize:13
      }
    },"Hen\xFCz sinyal de\u011Fi\u015Fimi yok."):React.createElement("div",{
      style:{
        display:"flex",flexDirection:"column",gap:6
      }
    },(()=>{
      let pf=p;
      if(sgTara){
        const ts=new Set(Y.map(r=>r.sym));
        pf=pf.filter(x=>ts.has(x.symbol))
      }
      if(sgQ){
        const q=sgQ.toUpperCase();
        pf=pf.filter(x=>x.symbol.toUpperCase().includes(q))
      }
      return pf
    })().map((x,h)=>{
      const R=x.dateKey===o;
      return React.createElement(React.Fragment,{key:h},React.createElement("div",{
        onClick:()=>sgZ(sgE===h?-1:h),style:{
          display:"flex",gap:10,alignItems:"center",padding:"10px 12px",background:R?T.bg1:T.bg2,borderRadius:sgE===h?"8px 8px 0 0":8,cursor:"pointer",border:`1px solid ${x.hit===!0?T.green+"33":x.hit===!1?T.red+"33":T.border}`,flexWrap:"wrap"
        }
      },React.createElement("span",{
        style:{
          fontWeight:700,color:T.blue,fontSize:13,minWidth:60
        }
      },x.symbol),React.createElement("span",{
        style:{
          fontSize:12,color:x.from==="AL"?T.green:x.from==="SAT"?T.red:T.muted
        }
      },x.from),React.createElement("span",{
        style:{
          fontSize:11,color:T.muted
        }
      },"\u2192"),React.createElement("span",{
        style:{
          fontWeight:700,fontSize:13,color:x.to==="AL"?T.green:x.to==="SAT"?T.red:T.muted
        }
      },x.to),React.createElement("span",{
        className:"tnum",style:{
          fontSize:11,color:T.muted
        }
      },"@ ",x.price,"\u20BA"),x.delta!=null&&React.createElement("span",{
        className:"tnum",style:{
          fontSize:11,fontWeight:700,color:x.hit?T.green:T.red,background:(x.hit?T.green:T.red)+"15",padding:"2px 7px",borderRadius:8
        }
      },x.delta>0?"+":"",x.delta,"% ",x.hit?"\u2713":"\u2717"),React.createElement("span",{
        style:{
          fontSize:10,color:T.muted,border:`1px solid ${T.border}`,padding:"1px 6px",borderRadius:8
        }
      },"%",x.confidence),React.createElement("span",{
        style:{
          fontSize:10,color:T.dim,marginLeft:"auto"
        }
      },R?x.time:(x.dateKey??"").slice(5))),sgE===h&&React.createElement("div",{
        style:{
          padding:"10px 14px",background:T.bg1,borderRadius:"0 0 8px 8px",marginTop:-2,border:`1px solid ${T.border}`,borderTop:"none",fontSize:12,color:T.muted,lineHeight:1.7,animation:"fadeIn .2s"
        }
      },React.createElement("div",{
        style:{fontWeight:700,color:T.text,marginBottom:4}
      },x.symbol+" — Sinyal Detayı"),React.createElement("div",{},"Değişim: ",React.createElement("b",{style:{color:x.from==="AL"?T.green:x.from==="SAT"?T.red:T.muted}},x.from)," → ",React.createElement("b",{style:{color:x.to==="AL"?T.green:x.to==="SAT"?T.red:T.muted}},x.to)),React.createElement("div",{},"Sinyal fiyatı: ",React.createElement("b",{className:"tnum"},x.price+"₺")," \xB7 G\xFCven: %"+x.confidence),x.current!=null&&React.createElement("div",{},"G\xFCncel fiyat: ",React.createElement("b",{className:"tnum"},(+x.current).toFixed(2)+"₺")),x.delta!=null&&React.createElement("div",{},"Sinyalden bu yana: ",React.createElement("b",{className:"tnum",style:{color:x.hit?T.green:T.red}},(x.delta>0?"+":"")+x.delta+"% "+(x.hit?"✓ isabetli":"✗ ıskaladı"))),React.createElement("div",{style:{fontSize:11,color:T.dim,marginTop:3}},"Tarih: "+((x.dateKey||"")+" "+(x.time||""))),(()=>{const oth=p.filter(z=>z.symbol===x.symbol),w=oth.filter(z=>z.hit).length;return oth.length>1?React.createElement("div",{style:{marginTop:5,paddingTop:5,borderTop:`1px solid ${T.border}`,color:T.text}},x.symbol+" toplam "+oth.length+" sinyal \xB7 "+w+" isabet (%"+Math.round(w/oth.length*100)+")"):null})(),React.createElement("button",{className:"btn",onClick:Se=>{Se.stopPropagation(),e(x.symbol),i("market")},style:{marginTop:7,background:`${T.blue}15`,border:`1px solid ${T.blue}55`,color:T.blue,borderRadius:6,padding:"5px 12px",cursor:"pointer",fontSize:11,fontWeight:600}},"→ Hisseyi A\xE7")))
    })))
  })(),t==="alerts"&&React.createElement("div",{
    className:"mob-pad",style:{
      padding:"20px",maxWidth:1060,margin:"0 auto"
    }
  },React.createElement("div",{
    style:{
      display:"flex",alignItems:"center",gap:12,marginBottom:16
    }
  },React.createElement("span",{
    style:{
      fontFamily:T.fontD,fontSize:22,fontWeight:700,color:T.orange
    }
  },"\u25CE MA\u0130L UYARILARI")),Jt.length===0?React.createElement("div",{
    style:{
      textAlign:"center",padding:"60px",color:T.muted,fontSize:13
    }
  },"Hen\xFCz mail g\xF6nderilmedi.",React.createElement("br",null),React.createElement("span",{
    style:{
      fontSize:11,marginTop:8,display:"block"
    }
  },"\u{1F514} Yukar\u0131dan e-posta kaydet.")):React.createElement("div",{
    style:{
      display:"flex",flexDirection:"column",gap:6
    }
  },Jt.map((o,l)=>React.createElement("div",{
    key:l,style:{
      display:"flex",gap:10,alignItems:"center",padding:"10px 12px",background:T.bg1,borderRadius:8,border:`1px solid ${o.sent?T.green+"33":T.red+"33"}`,flexWrap:"wrap"
    }
  },React.createElement("span",{
    style:{
      fontWeight:700,color:T.blue,fontSize:13,minWidth:60
    }
  },o.symbol),React.createElement("span",{
    style:{
      fontWeight:700,fontSize:13,color:o.signal==="AL"?T.green:T.red
    }
  },o.signal),React.createElement("span",{
    style:{
      fontSize:12,color:T.blue
    }
  },o.price,"\u20BA"),React.createElement("span",{
    style:{
      fontSize:12,color:o.sent?T.green:T.red
    }
  },o.sent?"\u2713":`\u2717 ${o.error??"hata"}`),React.createElement("span",{
    style:{
      fontSize:10,color:T.dim,marginLeft:"auto"
    }
  },o.time))))),t==="market"&&React.createElement("div",{
    className:"mob-pad",style:{
      maxWidth:1060,margin:"0 auto",padding:"16px 14px"
    },onClick:()=>y(!1)
  },(()=>{
    const o=Object.entries(BIST_SECTORS).map(([l,p])=>{
      const S=p.map(m=>B[m]?.rate).filter(m=>m!=null);
      if(S.length<2)return{
        name:l,avg:null,count:0
      };
      const C=S.reduce((m,k)=>m+k,0)/S.length;
      return{
        name:l,avg:+C.toFixed(2),count:S.length,total:p.length
      }
    }).filter(l=>l.avg!=null).sort((l,p)=>p.avg-l.avg);
    return o.length===0?null:React.createElement("div",{
      style:{
        background:T.bg1,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px",marginBottom:14
      }
    },React.createElement("div",{
      style:{
        display:"flex",alignItems:"center",gap:8,marginBottom:8
      }
    },React.createElement("span",{
      style:{
        fontSize:11,fontWeight:700,color:T.text,letterSpacing:.3
      }
    },"\u{1F4CA} SEKT\xD6REL PERFORMANS (BUG\xDCN)"),React.createElement("span",{
      style:{
        fontSize:9,color:T.dim
      }
    },o.length," sekt\xF6r")),React.createElement("div",{
      style:{
        display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(140px,100%),1fr))",gap:6
      }
    },o.map(l=>{
      const p=l.avg>.5?T.green:l.avg<-.5?T.red:T.muted,S=Math.min(100,Math.abs(l.avg)*15);
      return React.createElement("div",{
        key:l.name,style:{
          background:T.bg2,borderRadius:6,padding:"6px 8px",border:`1px solid ${p}33`
        }
      },React.createElement("div",{
        style:{
          display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:3
        }
      },React.createElement("span",{
        style:{
          fontSize:10,color:T.text,fontWeight:500
        }
      },l.name),React.createElement("span",{
        className:"tnum",style:{
          fontSize:11,color:p,fontWeight:700
        }
      },l.avg>0?"+":"",l.avg.toFixed(2),"%")),React.createElement("div",{
        style:{
          height:3,background:T.dim,borderRadius:1.5,overflow:"hidden"
        }
      },React.createElement("div",{
        style:{
          height:"100%",width:`${S}%`,background:p,borderRadius:1.5,marginLeft:l.avg<0?`${100-S}%`:0
        }
      })),React.createElement("div",{
        style:{
          fontSize:8,color:T.dim,marginTop:2
        }
      },l.count,"/",l.total," hisse"))
    })))
  })(),(Dt.length>0||Lt.length>0)&&React.createElement("div",{
    style:{
      display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(220px,100%),1fr))",gap:10,marginBottom:14
    }
  },Dt.length>0&&React.createElement("div",{
    style:{
      background:`linear-gradient(135deg,${T.green}10,${T.bg1})`,border:`1px solid ${T.green}44`,borderRadius:10,padding:"10px 12px"
    }
  },React.createElement("div",{
    style:{
      fontSize:11,fontWeight:700,color:T.green,marginBottom:6,letterSpacing:.3
    }
  },"\u{1F525} EN G\xDC\xC7L\xDC 5 AL FIRSATI"),React.createElement("div",{
    style:{
      display:"flex",flexDirection:"column",gap:4
    }
  },Dt.map(o=>React.createElement("div",{
    key:o.sym,onClick:()=>e(o.sym),style:{
      display:"flex",gap:8,alignItems:"center",cursor:"pointer",padding:"4px 6px",borderRadius:4,background:T.bg2
    }
  },React.createElement("span",{
    style:{
      fontWeight:700,color:T.text,fontSize:12,minWidth:60
    }
  },o.sym),React.createElement("span",{
    style:{
      color:T.green,fontSize:11,fontWeight:600
    }
  },"%",o.confidence),o.durationLabel&&React.createElement("span",{
    style:{
      color:T.yellow,fontSize:10
    }
  },"\u23F1 ",o.durationLabel),React.createElement("span",{
    className:"tnum",style:{
      color:T.muted,fontSize:11,marginLeft:"auto"
    }
  },(B[o.sym]?.price??o.price)?.toFixed(2),"\u20BA"))))),Lt.length>0&&React.createElement("div",{
    style:{
      background:`linear-gradient(135deg,${T.red}10,${T.bg1})`,border:`1px solid ${T.red}44`,borderRadius:10,padding:"10px 12px"
    }
  },React.createElement("div",{
    style:{
      fontSize:11,fontWeight:700,color:T.red,marginBottom:6,letterSpacing:.3
    }
  },"\u{1F480} EN ZAYIF 5 (SAT)"),React.createElement("div",{
    style:{
      display:"flex",flexDirection:"column",gap:4
    }
  },Lt.map(o=>React.createElement("div",{
    key:o.sym,onClick:()=>e(o.sym),style:{
      display:"flex",gap:8,alignItems:"center",cursor:"pointer",padding:"4px 6px",borderRadius:4,background:T.bg2
    }
  },React.createElement("span",{
    style:{
      fontWeight:700,color:T.text,fontSize:12,minWidth:60
    }
  },o.sym),React.createElement("span",{
    style:{
      color:T.red,fontSize:11,fontWeight:600
    }
  },"%",o.confidence),o.durationLabel&&React.createElement("span",{
    style:{
      color:T.yellow,fontSize:10
    }
  },"\u23F1 ",o.durationLabel),React.createElement("span",{
    className:"tnum",style:{
      color:T.muted,fontSize:11,marginLeft:"auto"
    }
  },(B[o.sym]?.price??o.price)?.toFixed(2),"\u20BA")))))),Dt.length===0&&Lt.length===0&&React.createElement("div",{
    onClick:()=>i("scanner"),style:{
      background:T.bg1,border:`1px dashed ${T.border}`,borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:12,color:T.muted,textAlign:"center",cursor:"pointer"
    }
  },"\u{1F4A1} Bug\xFCn\xFCn en g\xFC\xE7l\xFC f\u0131rsatlar\u0131n\u0131 g\xF6rmek i\xE7in ",React.createElement("span",{
    style:{
      color:T.green,fontWeight:700
    }
  },"\u{1F50D} TARA"),' sekmesine git, "\u25B6 TARA" butonuna bas'),React.createElement("div",{
    style:{
      display:"grid",gridTemplateColumns:"1fr auto",gap:10,marginBottom:14,alignItems:"start"
    }
  },React.createElement("div",null,React.createElement("div",{
    style:{
      display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"
    }
  },React.createElement("h1",{
    className:"mob-h1",style:{
      margin:0,fontFamily:T.fontD,fontSize:28,fontWeight:700,letterSpacing:2
    }
  },a),React.createElement("button",{
    className:"btn",onClick:()=>ei(a),style:{
      background:Mt?`${T.yellow}15`:T.bg2,border:`1px solid ${Mt?T.yellow:T.border}`,color:Mt?T.yellow:T.dim,borderRadius:5,padding:"3px 8px",cursor:"pointer",fontSize:14,lineHeight:1
    }
  },Mt?"\u2605":"\u2606"),React.createElement("span",{
    style:{
      fontSize:10,color:T.muted,border:`1px solid ${T.border}`,padding:"2px 8px",borderRadius:4
    }
  },ii?.name)),fe?React.createElement("div",{
    style:{
      display:"flex",alignItems:"baseline",gap:10
    }
  },React.createElement("span",{
    className:"mob-px",style:{
      fontFamily:T.fontD,fontSize:32,fontWeight:700,color:We?T.green:T.red
    }
  },fe.price.toFixed(2),React.createElement("span",{
    style:{
      fontSize:14,color:T.muted,marginLeft:4
    }
  },"\u20BA")),React.createElement("span",{
    style:{
      fontSize:13,color:We?T.green:T.red,fontWeight:600
    }
  },We?"\u25B2":"\u25BC"," ",Math.abs(It).toFixed(2),"%")):React.createElement("div",{
    style:{
      fontSize:13,color:T.dim,animation:"pulse 1.5s infinite"
    }
  },"Veri \xE7ekiliyor\u2026")),React.createElement("div",{
    style:{
      position:"relative",minWidth:200
    },onClick:o=>o.stopPropagation()
  },React.createElement("div",{
    style:{
      display:"flex",alignItems:"center",gap:8,background:T.bg2,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px"
    }
  },React.createElement("span",{
    style:{
      color:T.muted,fontSize:13
    }
  },"\u2315"),React.createElement("input",{
    value:n,onChange:o=>{
      c(o.target.value),y(!0)
    },onFocus:()=>y(!0),placeholder:"Hisse ara...",style:{
      background:"transparent",border:"none",color:T.text,fontSize:12,fontFamily:T.font,outline:"none",width:"100%"
    }
  })),b&&wt.length>0&&wt.length<60&&React.createElement("div",{
    style:{
      position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:T.bg1,border:`1px solid ${T.border2}`,borderRadius:8,maxHeight:240,overflowY:"auto",zIndex:200,boxShadow:"0 8px 30px rgba(0,0,0,.8)"
    }
  },wt.slice(0,50).map(o=>{
    const l=B[o.symbol];
    return React.createElement("div",{
      key:o.symbol,onClick:()=>{
        e(o.symbol),c(""),y(!1)
      },style:{
        padding:"8px 12px",cursor:"pointer",display:"flex",gap:8,alignItems:"center",borderBottom:`1px solid ${T.border}`,background:a===o.symbol?`${T.green}0a`:"transparent"
      }
    },React.createElement("span",{
      style:{
        color:T.yellow,fontSize:10,minWidth:12
      }
    },ae.includes(o.symbol)?"\u2605":""),React.createElement("span",{
      style:{
        color:T.blue,fontWeight:700,fontSize:12,minWidth:55,letterSpacing:1
      }
    },o.symbol),React.createElement("span",{
      style:{
        color:T.muted,fontSize:11,flex:1
      }
    },o.name),l&&React.createElement("span",{
      style:{
        color:l.rate>=0?T.green:T.red,fontSize:11
      }
    },l.price.toFixed(2),"\u20BA"))
  })))),N&&React.createElement("div",{
    style:{
      background:`${T.red}0a`,border:`1px solid ${T.red}44`,borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12,color:T.red,display:"flex",justifyContent:"space-between",alignItems:"center"
    }
  },React.createElement("span",null,"\u26A0 ",N),React.createElement("button",{
    className:"btn",onClick:ut,style:{
      background:T.red,border:"none",color:"#000",borderRadius:4,padding:"4px 10px",cursor:"pointer",fontSize:10,fontWeight:700
    }
  },"TEKRAR")),u.length<20&&React.createElement("div",{
    style:{
      background:T.bg2,border:`1px solid ${T.yellow}44`,borderRadius:8,padding:"12px 14px",marginBottom:14
    }
  },React.createElement("div",{
    style:{
      display:"flex",alignItems:"center",gap:8
    }
  },React.createElement("div",{
    style:{
      width:9,height:9,border:`1.5px solid ${T.dim}`,borderTop:`1.5px solid ${T.yellow}`,borderRadius:"50%",animation:"spin 1s linear infinite",flexShrink:0
    }
  }),React.createElement("span",{
    style:{
      fontSize:12,color:T.yellow
    }
  },O?"Veri \xE7ekiliyor\u2026":"Veri bekleniyor \u2014 biraz bekle veya ba\u015Fka hisse se\xE7")),React.createElement("div",{
    style:{
      fontSize:10,color:T.muted,marginTop:6
    }
  },"\u0130lk y\xFCkleme 5-15 sn \u2014 proxy'ler yar\u0131\u015Fta. \xC7al\u0131\u015Ft\u0131ktan sonra cache'lenir, anl\u0131k olur.")),(()=>{
    const o=Object.entries(BIST_SECTORS).find(([,p])=>p.includes(a))?.[0],l=(le||[]).filter(p=>(p.affected||[]).includes(a)||o&&(p.sectors||[]).some(([S])=>S===o)).slice(0,5);
    return l.length===0?null:React.createElement("div",{
      style:{
        background:`linear-gradient(135deg, ${T.yellow}08, ${T.bg2})`,border:`1px solid ${T.yellow}33`,borderRadius:10,padding:"10px 12px",marginBottom:12
      }
    },React.createElement("div",{
      style:{
        display:"flex",alignItems:"center",gap:6,marginBottom:8
      }
    },React.createElement("span",{
      style:{
        fontSize:11,fontWeight:700,color:T.yellow
      }
    },"\u{1F4F0} ",a,"'yu etkileyebilecek haberler"),React.createElement("span",{
      style:{
        fontSize:9,color:T.dim
      }
    },"(EAGLE EYE AI etki analizi)"),React.createElement("span",{
      onClick:()=>i("news"),style:{
        marginLeft:"auto",fontSize:10,color:T.blue,cursor:"pointer"
      }
    },"t\xFCm\xFC \u2192")),React.createElement("div",{
      style:{
        display:"flex",flexDirection:"column",gap:5
      }
    },l.map(p=>{
      const S=p.affectedScore?.[a]||0,C=S>0?T.green:S<0?T.red:T.muted;
      return React.createElement("a",{
        key:p.id,href:p.link,target:"_blank",rel:"noopener noreferrer",style:{
          display:"flex",gap:6,alignItems:"flex-start",textDecoration:"none",padding:"5px 6px",borderRadius:5,background:T.bg
        }
      },React.createElement("span",{
        style:{
          color:C,fontWeight:700,fontSize:11,minWidth:14
        }
      },S>0?"\u2191":S<0?"\u2193":"\u2022"),React.createElement("div",{
        style:{
          flex:1,minWidth:0
        }
      },React.createElement("div",{
        style:{
          fontSize:11,color:T.text,lineHeight:1.4
        }
      },p.title.slice(0,110),p.title.length>110?"...":""),React.createElement("div",{
        style:{
          fontSize:9,color:T.dim
        }
      },p.source)))
    })))
  })(),At.length>1&&React.createElement("div",{
    style:{
      background:T.bg1,border:`1px solid ${T.border}`,borderRadius:12,padding:"12px",marginBottom:14
    }
  },React.createElement("div",{
    style:{
      display:"flex",alignItems:"baseline",gap:10,marginBottom:10,paddingBottom:8,borderBottom:`1px solid ${T.border}`,flexWrap:"wrap"
    }
  },React.createElement("span",{
    style:{
      fontFamily:T.fontD,fontSize:17,fontWeight:700,color:T.blue,letterSpacing:1
    }
  },a),fe?React.createElement(React.Fragment,null,React.createElement("span",{
    className:"tnum",style:{
      fontSize:22,fontWeight:700,color:We?T.green:T.red
    }
  },fe.price.toFixed(2),React.createElement("span",{
    style:{
      fontSize:12,color:T.muted,marginLeft:2
    }
  },"\u20BA")),React.createElement("span",{
    className:"tnum",style:{
      fontSize:13,fontWeight:600,color:We?T.green:T.red
    }
  },We?"\u25B2":"\u25BC"," ",Math.abs(It).toFixed(2),"%")):React.createElement("span",{
    style:{
      fontSize:12,color:T.dim,animation:"pulse 1.5s infinite"
    }
  },"Veri \xE7ekiliyor\u2026"),v?.last&&React.createElement("span",{
    className:"tnum",style:{
      fontSize:10,color:T.muted,marginLeft:"auto"
    }
  },"Y: ",v.last.high?.toFixed(2)," \xB7 D: ",v.last.low?.toFixed(2))),React.createElement("div",{
    style:{
      display:"flex",gap:3,marginBottom:11,borderBottom:`1px solid ${T.border}`,paddingBottom:8
    }
  },hi.map(o=>React.createElement("button",{
    key:o.id,className:"btn",onClick:()=>d(o.id),style:{
      background:r===o.id?`${T.green}12`:"transparent",border:r===o.id?`1px solid ${T.green}44`:"1px solid transparent",color:r===o.id?T.green:T.muted,borderRadius:5,padding:"5px 14px",cursor:"pointer",fontSize:11,letterSpacing:2,fontWeight:r===o.id?700:400
    }
  },o.label))),r==="fiyat"&&(()=>{
    const o=histCache[a]?.length>=20?enrichData(histCache[a]):[],l=u.length>=30?u:o;
    return React.createElement(React.Fragment,null,React.createElement("div",{
      style:{
        display:"flex",gap:6,marginBottom:8
      }
    },[{
      id:"candle",label:"Mum",desc:"Klasik OHLC mum grafi\u011Fi"
    },{
      id:"ha",label:"Heikin Ashi",desc:"G\xFCr\xFClt\xFCs\xFCz trend g\xF6r\xFCn\xFCm\xFC (k\u0131sa vade i\xE7in)"
    }].map(p=>React.createElement("button",{
      key:p.id,className:"btn",onClick:()=>pe(p.id),title:p.desc,style:{
        background:_===p.id?`${T.green}20`:T.bg2,border:`1px solid ${_===p.id?T.green:T.border}`,color:_===p.id?T.green:T.muted,borderRadius:6,padding:"5px 12px",cursor:"pointer",fontSize:11,fontWeight:_===p.id?700:500
      }
    },p.label)),l[l.length-1]?.orbFormed&&l[l.length-1]?.orbHi!=null&&React.createElement("span",{
      style:{
        fontSize:10,color:T.yellow,alignSelf:"center",marginLeft:6
      }
    },"ORB: ",React.createElement("span",{
      className:"tnum"
    },l[l.length-1].orbHi)," / ",React.createElement("span",{
      className:"tnum"
    },l[l.length-1].orbLo))),l.length<5?React.createElement("div",{
      style:{
        height:420,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8,color:T.muted,background:T.bg,borderRadius:8
      }
    },React.createElement("div",{
      style:{
        width:24,height:24,border:`2px solid ${T.dim}`,borderTop:`2px solid ${T.yellow}`,borderRadius:"50%",animation:"spin 1s linear infinite"
      }
    }),React.createElement("span",{
      style:{
        fontSize:12
      }
    },a," i\xE7in veri y\xFCkleniyor..."),React.createElement("span",{
      style:{
        fontSize:10,color:T.dim
      }
    },"Yahoo + \u0130\u015F Yat\u0131r\u0131m fallback denenmektedir")):React.createElement(LWChart,{
      data:l,height:420,mode:_
    }))
  })(),r==="rsi"&&React.createElement(React.Fragment,null,React.createElement(ResponsiveContainer,{
    width:"100%",height:220
  },React.createElement(ComposedChart,{
    data:At,margin:{
      top:4,right:8,bottom:0,left:0
    }
  },React.createElement(CartesianGrid,{
    strokeDasharray:"1 5",stroke:T.dim,opacity:.3
  }),React.createElement(XAxis,{
    dataKey:"date",tick:{
      fill:T.muted,fontSize:10,fontFamily:T.font
    },ticks:ni
  }),React.createElement(YAxis,{
    domain:[0,100],tick:{
      fill:T.muted,fontSize:10,fontFamily:T.font
    },width:28,ticks:[20,30,50,70,80]
  }),React.createElement(Tooltip,{
    content:React.createElement(ChartTip,null)
  }),React.createElement(ReferenceLine,{
    y:70,stroke:T.red+"55",strokeDasharray:"4 2",label:{
      value:"70",fill:T.red,fontSize:11,position:"right"
    }
  }),React.createElement(ReferenceLine,{
    y:50,stroke:T.muted+"44",strokeDasharray:"3 4"
  }),React.createElement(ReferenceLine,{
    y:30,stroke:T.green+"55",strokeDasharray:"4 2",label:{
      value:"30",fill:T.green,fontSize:11,position:"right"
    }
  }),React.createElement(Line,{
    dataKey:"rsiSignal",stroke:T.yellow+"88",strokeWidth:1.5,dot:!1,strokeDasharray:"3 2",name:"Sinyal"
  }),React.createElement(Area,{
    dataKey:"rsi",stroke:T.purple,strokeWidth:2.2,fill:T.purple+"10",name:"RSI-14"
  })))),r==="macd"&&React.createElement(React.Fragment,null,React.createElement(ResponsiveContainer,{
    width:"100%",height:220
  },React.createElement(ComposedChart,{
    data:At,margin:{
      top:4,right:8,bottom:0,left:0
    }
  },React.createElement(CartesianGrid,{
    strokeDasharray:"1 5",stroke:T.dim,opacity:.3
  }),React.createElement(XAxis,{
    dataKey:"date",tick:{
      fill:T.muted,fontSize:10,fontFamily:T.font
    },ticks:ni
  }),React.createElement(YAxis,{
    tick:{
      fill:T.muted,fontSize:10,fontFamily:T.font
    },width:50,tickFormatter:o=>o.toFixed(2)
  }),React.createElement(Tooltip,{
    content:React.createElement(ChartTip,null)
  }),React.createElement(ReferenceLine,{
    y:0,stroke:T.border2,strokeWidth:1.5
  }),React.createElement(Bar,{
    dataKey:"macdHist",name:"Hist",shape:o=>{
      const{
        x:l,y:p,width:S,height:C,value:m
      }
      =o,k=Math.abs(C),s=m>=0?p:p+C;
      return React.createElement("rect",{
        x:l,y:s,width:S,height:Math.max(k,1),fill:m>=0?T.green:T.red,rx:1
      })
    }
  }),React.createElement(Line,{
    dataKey:"macdLine",name:"MACD",stroke:T.blue,strokeWidth:2,dot:!1
  }),React.createElement(Line,{
    dataKey:"macdSig",name:"Sinyal",stroke:T.orange,strokeWidth:1.5,dot:!1,strokeDasharray:"4 2"
  }))))),v&&(()=>{
    const o=fe?.price??v.last.close,l=v.stopLoss?+((o-v.stopLoss)/o*100).toFixed(2):null,p=v.target1?+((v.target1-o)/o*100).toFixed(2):null,S=v.target2?+((v.target2-o)/o*100).toFixed(2):null;
    let C="",m="";
    const k=v.profile,s=k?`Vade: ${k.dur} \xB7 ${k.why}`:"Standart swing";
    return v.final==="AL"&&v.trendMod==="YUKARI"?(C="TREND Y\xD6N\xDCNDE AL",m=`MA200 \xFCst\xFCnde, ADX ${v.adx?.toFixed(0)} \xB7 ${s}`):v.final==="AL"&&v.dipSignal?(C="D\u0130P D\xD6N\xDC\u015E AL",m=`${v.dipSignal.score}/7 \u015Fart \xB7 ${s}`):v.final==="AL"?(C="TEMK\u0130NL\u0130 AL",m=`ADX ${v.adx?.toFixed(0)} (zay\u0131f trend) \xB7 K\xFC\xE7\xFCk giri\u015F \xB7 ${s}`):v.final==="SAT"&&v.trendMod==="ASAGI"?(C="\xC7IKI\u015E / SAT",m="MA200 alt\u0131nda \xB7 Pozisyon kapat \xB7 5-10 g\xFCn bask\u0131 s\xFCrebilir"):v.final==="SAT"?(C="SAT",m="Sat\u0131\u015F bask\u0131s\u0131 \xB7 3-7 g\xFCn geri \xE7ekilme bekleniyor"):(C="BEKLE",m=v.waitReasons?.length?"Sebep: "+v.waitReasons.join(" \xB7 "):"\u0130ndikat\xF6rler net sinyal vermiyor (net puan: "+v.net+")"),React.createElement("div",{
      style:{
        marginBottom:14,animation:"fadeIn .3s"
      }
    },React.createElement("div",{
      style:{
        background:`linear-gradient(135deg,${T.bg1},${T.bg2})`,border:`1px solid ${St}44`,borderRadius:12,padding:"16px",marginBottom:10,position:"relative",overflow:"hidden"
      }
    },React.createElement("div",{
      style:{
        position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${St},transparent)`
      }
    }),React.createElement("div",{
      style:{
        display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12,marginBottom:v.stopLoss?14:0
      }
    },React.createElement("div",null,React.createElement("div",{
      style:{
        display:"flex",gap:6,alignItems:"center",marginBottom:6,flexWrap:"wrap"
      }
    },React.createElement("span",{
      style:{
        background:`${Yt}15`,border:`1px solid ${Yt}44`,color:Yt,borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:700,letterSpacing:1
      }
    },v.mod),v.trendStr!=null&&React.createElement("span",{
      style:{
        background:T.bg2,border:`1px solid ${T.border}`,color:T.muted,borderRadius:20,padding:"3px 10px",fontSize:10
      }
    },"TREND %",v.trendStr," ",v.trendBias==="YUKARI"?"\u2191":v.trendBias==="ASAGI"?"\u2193":"\u2192"),v.adx>0&&React.createElement("span",{
      style:{
        background:T.bg2,border:`1px solid ${T.border}`,color:v.trendStrong?T.green:T.muted,borderRadius:20,padding:"3px 10px",fontSize:10
      }
    },"ADX ",v.adx.toFixed(0)),v.profile&&React.createElement("span",{
      style:{
        background:`${T.yellow}15`,border:`1px solid ${T.yellow}66`,color:T.yellow,borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:700
      }
    },"\u23F1 ",v.profile.dur),v.htfNote&&React.createElement("span",{
      style:{
        background:T.bg2,border:`1px solid ${T.border}`,color:v.htfNote.includes("\u2713")?T.green:T.red,borderRadius:20,padding:"3px 10px",fontSize:10
      }
    },v.htfNote),(()=>{
      const A=getRiskScore(v,fe?.price);
      return React.createElement("span",{
        title:`Risk skoru: ${A.score}/100
ATR%: ${A.atrPct}
Likidite: ${(A.turnover/1e3).toFixed(0)}K TL
${A.reasons.join(" \xB7 ")||"Risk d\xFC\u015F\xFCk"}`,style:{
          background:`${A.color}15`,border:`1px solid ${A.color}88`,color:A.color,borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:700
        }
      },A.emoji," R\u0130SK: ",A.level)
    })()),React.createElement("div",{
      style:{
        fontFamily:T.fontD,fontSize:24,fontWeight:700,color:St,letterSpacing:2,marginBottom:6
      }
    },C),React.createElement("div",{
      style:{
        fontSize:11,color:T.muted,maxWidth:380,lineHeight:1.5
      }
    },m)),React.createElement("div",{
      style:{
        background:T.bg,border:`1px solid ${St}33`,borderRadius:10,padding:"10px 18px",textAlign:"center"
      }
    },React.createElement("div",{
      style:{
        fontSize:9,color:T.muted,letterSpacing:2,marginBottom:3
      }
    },"G\xDCVEN"),React.createElement("div",{
      style:{
        fontFamily:T.fontD,fontSize:30,fontWeight:700,color:St,lineHeight:1
      }
    },v.confidence),React.createElement("div",{
      style:{
        fontSize:10,color:T.muted
      }
    },"%"))),v.stopLoss&&React.createElement("div",{
      style:{
        display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(80px,1fr))",gap:6
      }
    },[{
      label:"\u2192 G\u0130R\u0130\u015E",sub:"Al\u0131m fiyat\u0131",price:o.toFixed(2)+"\u20BA",pct:null,color:T.blue
    },{
      label:"\u26D4 ZARAR DUR",sub:"Stop seviyesi",price:v.stopLoss+"\u20BA",pct:l?`-${Math.abs(l)}%`:null,color:T.red
    },{
      label:"\u{1F3AF} 1. HEDEF",sub:"\u0130lk sat\u0131\u015F",price:v.target1+"\u20BA",pct:p?`+${p}%`:null,color:T.green
    },{
      label:"\u{1F3AF} 2. HEDEF",sub:"Uzun tut",price:v.target2+"\u20BA",pct:S?`+${S}%`:null,color:T.green
    },{
      label:"\u{1F4CA} OYNAKLIK",sub:"ATR \xB7 "+v.riskReward,price:v.atr+"\u20BA",pct:null,color:T.yellow
    }].map(A=>React.createElement("div",{
      key:A.label,style:{
        background:`${A.color}10`,border:`1px solid ${A.color}40`,borderRadius:10,padding:"10px 12px",textAlign:"center"
      }
    },React.createElement("div",{
      style:{
        fontSize:10,color:A.color,marginBottom:4,letterSpacing:.2,fontWeight:600
      }
    },A.label),React.createElement("div",{
      className:"tnum",style:{
        fontSize:16,fontWeight:700,color:T.text,marginBottom:2
      }
    },A.price),A.pct&&React.createElement("div",{
      className:"tnum",style:{
        fontSize:11,color:A.color,fontWeight:600
      }
    },A.pct),A.sub&&React.createElement("div",{
      style:{
        fontSize:9,color:T.muted,marginTop:3,letterSpacing:.1
      }
    },A.sub))))),React.createElement("div",{
      style:{
        display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"
      }
    },v.entryHint&&React.createElement("div",{
      style:{
        flex:"1 1 200px",background:v.entryHint==="\u015E\u0130MD\u0130"?`${T.green}10`:`${T.yellow}10`,border:`1px solid ${v.entryHint==="\u015E\u0130MD\u0130"?T.green:T.yellow}40`,borderRadius:8,padding:"8px 12px"
      }
    },React.createElement("div",{
      style:{
        fontSize:10,color:v.entryHint==="\u015E\u0130MD\u0130"?T.green:T.yellow,fontWeight:700,marginBottom:3
      }
    },"\u23F1 G\u0130R\u0130\u015E ZAMANI: ",v.entryHint),React.createElement("div",{
      style:{
        fontSize:10,color:T.muted,lineHeight:1.4
      }
    },v.entryDetail)),et!=null&&React.createElement("div",{
      style:{
        flex:"0 1 auto",background:et>0?`${T.green}10`:`${T.red}10`,border:`1px solid ${et>0?T.green:T.red}40`,borderRadius:8,padding:"8px 12px",textAlign:"center"
      }
    },React.createElement("div",{
      style:{
        fontSize:9,color:T.muted,marginBottom:2
      }
    },"BIST 100'E G\xD6RE"),React.createElement("div",{
      className:"tnum",style:{
        fontSize:13,fontWeight:700,color:et>0?T.green:T.red
      }
    },et>0?"+":"",et,"%"),React.createElement("div",{
      style:{
        fontSize:9,color:T.muted
      }
    },et>0?"daha g\xFC\xE7l\xFC":"daha zay\u0131f"))),React.createElement("div",{
      style:{
        display:"flex",gap:8,alignItems:"center",marginBottom:10,flexWrap:"wrap"
      }
    },React.createElement("button",{
      className:"btn",onClick:()=>jt(a,ii?.name||a,v,!1,fe?.price),disabled:lt,style:{
        background:`${T.purple}20`,border:`1px solid ${T.purple}`,color:T.purple,borderRadius:6,padding:"8px 14px",cursor:lt?"wait":"pointer",fontSize:12,fontWeight:700
      }
    },lt?"\u{1F916} ANAL\u0130Z...":"\u{1F916} AI ANAL\u0130Z"),React.createElement("button",{
      className:"btn",onClick:ki,disabled:I,style:{
        background:`${T.blue}20`,border:`1px solid ${T.blue}`,color:T.blue,borderRadius:6,padding:"8px 14px",cursor:I?"wait":"pointer",fontSize:12,fontWeight:700
      }
    },I?"\u{1F52C} \xC7ALI\u015ETIRILIYOR...":"\u{1F52C} BACKTEST (1 y\u0131l)"),React.createElement("button",{
      className:"btn",onClick:()=>li(a,v,fe?.price),style:{
        background:`${T.green}20`,border:`1px solid ${T.green}`,color:T.green,borderRadius:6,padding:"8px 14px",cursor:"pointer",fontSize:12,fontWeight:700
      }
    },"\u{1F4BC} + POZ\u0130SYON A\xC7"),React.createElement("button",{
      className:"btn",onClick:()=>{
        g({
          sym:a
        }),G("price"),Te(">"),Ne(fe?.price?.toFixed(2)||"")
      },style:{
        background:`${T.yellow}15`,border:`1px solid ${T.yellow}66`,color:T.yellow,borderRadius:6,padding:"8px 14px",cursor:"pointer",fontSize:12,fontWeight:700
      }
    },"\u{1F514} ALARM KUR"),!xe&&React.createElement("span",{
      style:{
        fontSize:10,color:T.muted
      }
    },"Yerel AI haz\u0131r \xB7 \u{1F916} \u2192 key (opsiyonel)")),ce&&React.createElement("div",{
      style:{
        background:`${T.blue}08`,border:`1px solid ${T.blue}44`,borderRadius:10,padding:"10px 14px",marginBottom:10
      }
    },React.createElement("div",{
      style:{
        fontSize:12,fontWeight:700,color:T.blue,marginBottom:6
      }
    },"\u{1F52C} 1 Y\u0131ll\u0131k Backtest Sonucu"),ce.error?React.createElement("div",{
      style:{
        fontSize:11,color:T.red
      }
    },ce.error):React.createElement("div",{
      style:{
        display:"flex",gap:14,flexWrap:"wrap",fontSize:11
      }
    },React.createElement("span",null,React.createElement("b",null,ce.trades)," trade"),React.createElement("span",{
      style:{
        color:ce.winrate>=50?T.green:T.red
      }
    },"Kazanma: ",React.createElement("b",null,"%",ce.winrate)),React.createElement("span",{
      style:{
        color:ce.avgPnl>=0?T.green:T.red
      }
    },"Ort. PnL: ",React.createElement("b",null,ce.avgPnl>0?"+":"","%",ce.avgPnl)),React.createElement("span",{
      style:{
        color:T.muted
      }
    },"Skor: ",React.createElement("b",null,ce.score)))),v.final==="AL"&&v.trailingStop&&React.createElement("div",{
      style:{
        display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(260px,100%),1fr))",gap:10,marginBottom:10
      }
    },React.createElement("div",{
      style:{
        background:`${T.green}08`,border:`1px solid ${T.green}44`,borderRadius:10,padding:"10px 14px"
      }
    },React.createElement("div",{
      style:{
        fontSize:12,fontWeight:700,color:T.green,marginBottom:8
      }
    },"\u{1F4C8} K\xC2R KORUYUCU TRAILING STOP"),[v.trailingStop.seviye1,v.trailingStop.seviye2,v.trailingStop.seviye3].map((A,x)=>React.createElement("div",{
      key:x,style:{
        display:"flex",justifyContent:"space-between",fontSize:11,padding:"4px 0",borderTop:x>0?`1px solid ${T.border}`:"none"
      }
    },React.createElement("span",{
      className:"tnum",style:{
        color:T.muted
      }
    },"Tetik: ",React.createElement("b",{
      style:{
        color:T.text
      }
    },A.tetik,"\u20BA")),React.createElement("span",{
      className:"tnum",style:{
        color:T.green
      }
    },"Stop \u2192 ",React.createElement("b",null,A.stop,"\u20BA")))),React.createElement("div",{
      style:{
        fontSize:9,color:T.muted,marginTop:6,lineHeight:1.4
      }
    },"Fiyat tetik seviyesine ula\u015Ft\u0131\u011F\u0131nda manuel olarak stop'unu yukar\u0131 \xE7ek \u2014 k\xE2r kilitlenir, y\xF6n d\xF6nd\xFC\u011F\xFCnde geri vermezsin.")),(()=>{
      const A=v.stopPct,x=Tt*(l/100),h=o*A,R=h>0?Math.floor(x/h):0,D=R*o;
      return React.createElement("div",{
        style:{
          background:`${T.blue}08`,border:`1px solid ${T.blue}44`,borderRadius:10,padding:"10px 14px"
        }
      },React.createElement("div",{
        style:{
          fontSize:12,fontWeight:700,color:T.blue,marginBottom:8
        }
      },"\u{1F4BC} POZ\u0130SYON B\xDCY\xDCKL\xDC\u011E\xDC"),React.createElement("div",{
        style:{
          display:"flex",gap:8,marginBottom:6,flexWrap:"wrap"
        }
      },React.createElement("input",{
        type:"number",value:Tt,onChange:j=>di(+j.target.value||0),style:{
          background:T.bg,border:`1px solid ${T.border}`,color:T.text,borderRadius:5,padding:"4px 8px",fontSize:11,width:110
        },placeholder:"Portföy ₺"
      }),React.createElement("input",{
        type:"number",value:l,onChange:j=>ci(+j.target.value||0),step:"0.5",style:{
          background:T.bg,border:`1px solid ${T.border}`,color:T.text,borderRadius:5,padding:"4px 8px",fontSize:11,width:70
        },placeholder:"Risk %"
      })),React.createElement("div",{
        className:"tnum",style:{
          fontSize:13,color:T.text,marginBottom:4
        }
      },React.createElement("b",{
        style:{
          color:T.green,fontSize:18
        }
      },R)," lot \u2248 ",React.createElement("b",null,D.toFixed(0),"\u20BA")),React.createElement("div",{
        className:"tnum",style:{
          fontSize:10,color:T.muted
        }
      },"Maks. risk: ",x.toFixed(0),"\u20BA \xB7 Stop mesafesi: %",(A*100).toFixed(1)))
    })()),Rt&&React.createElement("div",{
      style:{
        background:`${T.red}10`,border:`1px solid ${T.red}44`,borderRadius:8,padding:"8px 12px",marginBottom:10,fontSize:11,color:T.red
      }
    },"\u26A0 ",Rt),ue&&ue.symbol===a&&(()=>{
      const A=ue.engine==="eagle-ai"||ue.engine==="eagle-ai-fallback"?T.green:T.purple,x=ue.engine==="eagle-ai"?"\u{1F9E0} EAGLE EYE AI YEREL":ue.engine==="eagle-ai-fallback"?"\u{1F9E0} EAGLE EYE AI (Claude fallback)":"\u{1F916} CLAUDE";
      return React.createElement("div",{
        style:{
          background:`${A}08`,border:`1px solid ${A}44`,borderRadius:10,padding:"12px 14px",marginBottom:10,animation:"fadeIn .3s"
        }
      },React.createElement("div",{
        style:{
          display:"flex",alignItems:"center",gap:8,marginBottom:6
        }
      },React.createElement("span",{
        style:{
          fontFamily:T.fontD,fontSize:13,fontWeight:700,color:A
        }
      },x," \u2014 AI ANAL\u0130Z"),React.createElement("span",{
        style:{
          fontSize:10,color:T.muted,marginLeft:"auto"
        }
      },ue.time)),React.createElement("div",{
        style:{
          fontSize:14,color:T.text,lineHeight:1.7,whiteSpace:"pre-wrap"
        }
      },ue.text))
    })(),v.dipSignal&&React.createElement("div",{
      style:{
        background:`${v.dipSignal.color}08`,border:`1px solid ${v.dipSignal.color}44`,borderRadius:10,padding:"10px 14px",marginBottom:10
      }
    },React.createElement("div",{
      style:{
        display:"flex",alignItems:"center",gap:10,marginBottom:6
      }
    },React.createElement("span",{
      style:{
        fontFamily:T.fontD,fontSize:14,fontWeight:700,color:v.dipSignal.color,letterSpacing:1
      }
    },v.dipSignal.label),React.createElement("span",{
      style:{
        fontSize:10,color:T.muted,border:`1px solid ${T.border}`,padding:"1px 6px",borderRadius:10
      }
    },v.dipSignal.score,"/7")),React.createElement("div",{
      style:{
        display:"flex",gap:5,flexWrap:"wrap"
      }
    },Object.entries(v.dipSignal.checks).map(([A,x])=>{
      const h={
        rsiDip:"RSI Dip",macdTurning:"MACD\u2191",bbBottom:"BB Alt",highVolume:"Hacim 2x",stochDip:"Stoch<20",obvTurning:"OBV\u2191",stFlip:"ST Y\xF6n"
      };
      return React.createElement("span",{
        key:A,style:{
          fontSize:10,padding:"3px 8px",borderRadius:10,background:x?`${T.green}15`:T.bg2,color:x?T.green:T.dim,border:`1px solid ${x?T.green+"44":T.border}`,fontWeight:x?700:400
        }
      },x?"\u2713":"\u2717"," ",h[A])
    }))),React.createElement("div",{
      style:{
        display:"flex",gap:6,flexWrap:"wrap"
      }
    },React.createElement(SigCard,{
      name:"MA TREND",sig:v.signals.MA
    }),React.createElement(SigCard,{
      name:"MACD",sig:v.signals.MACD
    }),React.createElement(SigCard,{
      name:"RSI 14",sig:v.signals.RSI
    }),React.createElement(SigCard,{
      name:"BOLLINGER",sig:v.signals.BB
    }),React.createElement(SigCard,{
      name:"STOCH",sig:v.signals.SRSI
    }),React.createElement(SigCard,{
      name:"HACİM",sig:v.signals.VOL
    }),React.createElement(SigCard,{
      name:"ADX",sig:v.signals.ADX
    }),React.createElement(SigCard,{
      name:"SUPERTREND",sig:v.signals.STR
    }),React.createElement(SigCard,{
      name:"PRICE ACT.",sig:v.signals.PA
    }),React.createElement(SigCard,{
      name:"MOMENTUM",sig:v.signals.MOM
    })))
  })(),fe&&React.createElement("div",{
    style:{
      display:"flex",gap:6,flexWrap:"wrap",marginBottom:14
    }
  },React.createElement(StatBox,{
    label:"CANLI",value:fe.price.toFixed(2)+"\u20BA",color:We?T.green:T.red
  }),React.createElement(StatBox,{
    label:"DEĞİŞİM",value:(We?"\u25B2":"\u25BC")+Math.abs(It).toFixed(2)+"%",color:We?T.green:T.red
  }),React.createElement(StatBox,{
    label:"RSI",value:v?.last?.rsi?.toFixed(1)??"\u2014",color:T.purple
  }),React.createElement(StatBox,{
    label:"ADX",value:v?.adx?.toFixed(0)??"\u2014",color:v?.trendStrong?T.green:T.muted
  }),React.createElement(StatBox,{
    label:"MA200",value:v?.last?.ma200?.toFixed(2)??"\u2014",color:T.orange
  }),React.createElement(StatBox,{
    label:"ATR",value:v?.atr?v.atr+"\u20BA":"\u2014",color:T.yellow
  }),React.createElement(StatBox,{
    label:"VWAP",value:v?.last?.vwap?.toFixed(2)??"\u2014",color:T.purple
  }),React.createElement(StatBox,{
    label:"ST",value:v?.last?.stDir===1?"\u2191":v?.last?.stDir===-1?"\u2193":"\u2014",color:v?.last?.stDir===1?T.green:T.red
  }),React.createElement(StatBox,{
    label:"MFI",value:v?.last?.mfi?.toFixed(0)??"\u2014",color:v?.last?.mfi>80?T.red:v?.last?.mfi<20?T.green:T.muted
  }),React.createElement(StatBox,{
    label:"TSI",value:v?.last?.tsi?.toFixed(1)??"\u2014",color:v?.last?.tsi>0?T.green:T.red
  })),React.createElement("div",{
    style:{
      textAlign:"center",paddingBottom:24,paddingTop:16,borderTop:`1px solid ${T.border}`,marginTop:20
    }
  },React.createElement("div",{
    style:{
      fontFamily:T.fontD,fontSize:16,fontWeight:700,letterSpacing:-.4,marginBottom:6
    }
  },React.createElement("span",{
    style:{
      color:T.red
    }
  },"EAGLE EYE"),React.createElement("span",{
    style:{
      color:T.green,marginLeft:5
    }
  },": bistIQ")),React.createElement("div",{
    style:{
      fontSize:10,color:T.dim,letterSpacing:.2
    }
  },"Bu uygulama yat\u0131r\u0131m tavsiyesi de\u011Fildir."))))),nt&&React.createElement("div",{
    onClick:()=>at(null),style:{
      position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1e3,padding:16
    }
  },React.createElement("div",{
    onClick:o=>o.stopPropagation(),style:{
      background:T.bg1,border:`1px solid ${T.green}66`,borderRadius:12,padding:20,maxWidth:380,width:"100%",animation:"fadeIn .2s"
    }
  },React.createElement("div",{
    style:{
      fontFamily:T.fontD,fontSize:18,fontWeight:700,color:T.green,marginBottom:12
    }
  },"\u{1F4BC} ",nt.sym," POZ\u0130SYON A\xC7"),React.createElement("div",{
    style:{
      display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10
    }
  },React.createElement("label",{
    style:{
      fontSize:11,color:T.muted
    }
  },"Lot adedi",React.createElement("input",{
    type:"number",value:xt,onChange:o=>Ft(o.target.value),autoFocus:!0,style:{
      width:"100%",marginTop:4,background:T.bg,border:`1px solid ${T.border}`,color:T.text,borderRadius:5,padding:"6px 10px",fontSize:13,fontFamily:T.font
    }
  })),React.createElement("label",{
    style:{
      fontSize:11,color:T.muted
    }
  },"Giri\u015F fiyat\u0131 \u20BA",React.createElement("input",{
    type:"number",step:"0.01",value:Ye,onChange:o=>je(o.target.value),style:{
      width:"100%",marginTop:4,background:T.bg,border:`1px solid ${T.border}`,color:T.text,borderRadius:5,padding:"6px 10px",fontSize:13,fontFamily:T.font
    }
  })),React.createElement("label",{
    style:{
      fontSize:11,color:T.muted
    }
  },"Stop \u20BA",React.createElement("input",{
    type:"number",step:"0.01",value:kt,onChange:o=>ht(o.target.value),style:{
      width:"100%",marginTop:4,background:T.bg,border:`1px solid ${T.red}33`,color:T.text,borderRadius:5,padding:"6px 10px",fontSize:13,fontFamily:T.font
    }
  })),React.createElement("label",{
    style:{
      fontSize:11,color:T.muted
    }
  },"Hedef \u20BA",React.createElement("input",{
    type:"number",step:"0.01",value:ft,onChange:o=>Me(o.target.value),style:{
      width:"100%",marginTop:4,background:T.bg,border:`1px solid ${T.green}33`,color:T.text,borderRadius:5,padding:"6px 10px",fontSize:13,fontFamily:T.font
    }
  }))),React.createElement("label",{
    style:{
      fontSize:11,color:T.muted,display:"block",marginBottom:8
    }
  },"Etiket / k\u0131sa not",React.createElement("input",{
    type:"text",value:$e,onChange:o=>Pe(o.target.value),placeholder:"Trend Takip / Dip Avcı / Swing...",style:{
      width:"100%",marginTop:4,background:T.bg,border:`1px solid ${T.border}`,color:T.text,borderRadius:5,padding:"6px 10px",fontSize:12,fontFamily:T.font
    }
  })),React.createElement("label",{
    style:{
      fontSize:11,color:T.purple,display:"block",marginBottom:12,fontWeight:600
    }
  },"\u{1F4DD} Neden al\u0131yorum? ",React.createElement("span",{
    style:{
      color:T.dim,fontWeight:400
    }
  },"(AI'a ve g\xFCnl\xFC\u011Fe ge\xE7er)"),React.createElement("textarea",{
    value:be,onChange:o=>me(o.target.value),rows:3,placeholder:"Örn: MA200 üstüne kırılım, ADX 28, RSI dipten döndü, hacim 2× ortalama. Bilanço beklentisi pozitif. Stop %4.",style:{
      width:"100%",marginTop:4,background:T.bg,border:`1px solid ${T.purple}44`,color:T.text,borderRadius:5,padding:"6px 10px",fontSize:12,fontFamily:T.font,resize:"vertical",minHeight:60
    }
  })),React.createElement("div",{
    style:{
      display:"flex",gap:8
    }
  },React.createElement("button",{
    className:"btn",onClick:si,style:{
      flex:1,background:T.green,border:"none",color:T.bg,borderRadius:6,padding:"10px",cursor:"pointer",fontSize:13,fontWeight:700
    }
  },"\u2713 KAYDET"),React.createElement("button",{
    className:"btn",onClick:()=>at(null),style:{
      flex:1,background:T.bg2,border:`1px solid ${T.border}`,color:T.muted,borderRadius:6,padding:"10px",cursor:"pointer",fontSize:13
    }
  },"\u0130PTAL")))),ot&&React.createElement("div",{
    onClick:()=>g(null),style:{
      position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1e3,padding:16
    }
  },React.createElement("div",{
    onClick:o=>o.stopPropagation(),style:{
      background:T.bg1,border:`1px solid ${T.yellow}66`,borderRadius:12,padding:20,maxWidth:380,width:"100%",animation:"fadeIn .2s"
    }
  },React.createElement("div",{
    style:{
      fontFamily:T.fontD,fontSize:18,fontWeight:700,color:T.yellow,marginBottom:12
    }
  },"\u{1F514} ",ot.sym," ALARM KUR"),React.createElement("div",{
    style:{
      fontSize:11,color:T.muted,marginBottom:12
    }
  },"Belirledi\u011Fin ko\u015Ful sa\u011Flan\u0131nca telefonda bildirim al\u0131rs\u0131n (Notification a\xE7\u0131k olmal\u0131)."),React.createElement("label",{
    style:{
      fontSize:11,color:T.muted,display:"block",marginBottom:10
    }
  },"G\xF6sterge",React.createElement("select",{
    value:F,onChange:o=>G(o.target.value),style:{
      width:"100%",marginTop:4,background:T.bg,border:`1px solid ${T.border}`,color:T.text,borderRadius:5,padding:"6px 10px",fontSize:13,fontFamily:T.font
    }
  },React.createElement("option",{
    value:"price"
  },"Fiyat (\u20BA)"),React.createElement("option",{
    value:"rsi"
  },"RSI (0-100)"),React.createElement("option",{
    value:"ma200"
  },"MA200 (fiyatla kar\u015F\u0131la\u015Ft\u0131r)"),React.createElement("option",{
    value:"macd"
  },"MACD histogram\u0131"))),React.createElement("div",{
    style:{
      display:"grid",gridTemplateColumns:"80px 1fr",gap:8,marginBottom:12
    }
  },React.createElement("label",{
    style:{
      fontSize:11,color:T.muted
    }
  },"Ko\u015Ful",React.createElement("select",{
    value:U,onChange:o=>Te(o.target.value),style:{
      width:"100%",marginTop:4,background:T.bg,border:`1px solid ${T.border}`,color:T.text,borderRadius:5,padding:"6px 10px",fontSize:13,fontFamily:T.font
    }
  },React.createElement("option",{
    value:">"
  },"\xDCst\xFCne \xE7\u0131karsa >"),React.createElement("option",{
    value:"<"
  },"Alt\u0131na d\xFC\u015Ferse <"))),React.createElement("label",{
    style:{
      fontSize:11,color:T.muted
    }
  },"De\u011Fer",React.createElement("input",{
    type:"number",step:"0.01",value:De,onChange:o=>Ne(o.target.value),autoFocus:!0,style:{
      width:"100%",marginTop:4,background:T.bg,border:`1px solid ${T.border}`,color:T.text,borderRadius:5,padding:"6px 10px",fontSize:13,fontFamily:T.font
    }
  }))),React.createElement("div",{
    style:{
      fontSize:10,color:T.dim,marginBottom:12,lineHeight:1.5
    }
  },"\xD6rnek: ",ot.sym," ",React.createElement("b",null,"RSI < 30")," (a\u015F\u0131r\u0131 sat\u0131m), ",React.createElement("b",null,"Fiyat > 132\u20BA")," (k\u0131r\u0131l\u0131m), ",React.createElement("b",null,"MA200 < fiyat")," (trend k\u0131r\u0131l\u0131r)"),React.createElement("div",{
    style:{
      display:"flex",gap:8
    }
  },React.createElement("button",{
    className:"btn",onClick:()=>{
      if(!+De)return;
      const o={
        id:Date.now(),sym:ot.sym,type:F,op:U,value:+De,fired:!1,createdAt:Date.now()
      };
      Oe(l=>[...l,o].slice(-50)),g(null)
    },style:{
      flex:1,background:T.yellow,border:"none",color:T.bg,borderRadius:6,padding:"10px",cursor:"pointer",fontSize:13,fontWeight:700
    }
  },"\u2713 KAYDET"),React.createElement("button",{
    className:"btn",onClick:()=>g(null),style:{
      flex:1,background:T.bg2,border:`1px solid ${T.border}`,color:T.muted,borderRadius:6,padding:"10px",cursor:"pointer",fontSize:13
    }
  },"\u0130PTAL")))),React.createElement("div",{
    className:"mob-bottom"
  },React.createElement(NavBtn,{
    id:"market",page:t,setPage:i,icon:React.createElement(BistLogo,{
      size:22
    }),label:"BIST"
  }),React.createElement(NavBtn,{
    id:"hissekart",page:t,setPage:i,icon:"📋",label:"KART"
  }),React.createElement(NavBtn,{
    id:"news",page:t,setPage:i,icon:"📰",label:"HABER"
  }),React.createElement(NavBtn,{
    id:"favorites",page:t,setPage:i,icon:"★",label:"FAVORİ",badge:ae.length
  }),React.createElement(NavBtn,{
    id:"scanner",page:t,setPage:i,icon:"🔍",label:"TARA"
  }),React.createElement(NavBtn,{
    id:"portfolio",page:t,setPage:i,icon:"💼",label:"PORTFÖY",badge:Z.length
  }),React.createElement(NavBtn,{id:"sim",page:t,setPage:i,icon:"💰",label:"SİM"}),))
}
const root=ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(BISTBot,null)),document.getElementById("boot").classList.add("gone");
