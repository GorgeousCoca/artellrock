/* Файл собран скриптом scripts/generate-site-content.mjs из PHOTOS.md. Вручную не правьте. */

export type QuartzDecor = {
  name: string;
  image: string;
};

export type QuartzBrand = {
  slug: string;
  name: string;
  logo: string | null;
  decors: QuartzDecor[];
};

export const quartzBrands: QuartzBrand[] = [
  {
    "slug": "aleph-stone",
    "name": "Aleph Stone",
    "logo": null,
    "decors": [
      {
        "name": "A100 Clear Quartz",
        "image": "/images/Aleph_Stone/A100 Clear Quartz.webp"
      },
      {
        "name": "A30 Ultra White",
        "image": "/images/Aleph_Stone/A30 Ultra White.webp"
      },
      {
        "name": "A33 Carrara Ideal",
        "image": "/images/Aleph_Stone/A33 Carrara Ideal.webp"
      },
      {
        "name": "A35 Bianco Marble",
        "image": "/images/Aleph_Stone/A35 Bianco Marble.webp"
      },
      {
        "name": "A60 Calacatta Spring",
        "image": "/images/Aleph_Stone/A60 Calacatta Spring.webp"
      },
      {
        "name": "A62 Calacatta Lincoln",
        "image": "/images/Aleph_Stone/A62 Calacatta Lincoln.webp"
      },
      {
        "name": "A63 Artico",
        "image": "/images/Aleph_Stone/A63 Artico.webp"
      },
      {
        "name": "A66 Storm Grey Mat",
        "image": "/images/Aleph_Stone/a66-storm-grey-mat.webp"
      },
      {
        "name": "A69 Artico Perlato Mat",
        "image": "/images/Aleph_Stone/a69-artico-perlato-mat.webp"
      },
      {
        "name": "A70 Arabescato White",
        "image": "/images/Aleph_Stone/A70 Arabescato White.webp"
      },
      {
        "name": "A75 Arabescato Delicato",
        "image": "/images/Aleph_Stone/A75 Arabescato Delicato.webp"
      },
      {
        "name": "A76 Arabescato Miele",
        "image": "/images/Aleph_Stone/A76 Arabescato Miele.webp"
      },
      {
        "name": "A77 Arabescato Nature",
        "image": "/images/Aleph_Stone/A77 Arabescato Nature.webp"
      },
      {
        "name": "A78 Arabescato Notte",
        "image": "/images/Aleph_Stone/A78 Arabescato Notte.webp"
      },
      {
        "name": "A79 Arabescato Irish",
        "image": "/images/Aleph_Stone/A79 Arabescato Irish.webp"
      },
      {
        "name": "A80 Statuario NG",
        "image": "/images/Aleph_Stone/A80 Statuario NG.webp"
      },
      {
        "name": "A82 Golden Age",
        "image": "/images/Aleph_Stone/A82 Golden Age.webp"
      },
      {
        "name": "A87 Ariston",
        "image": "/images/Aleph_Stone/A87 Ariston.webp"
      },
      {
        "name": "A88 Calacatta Luxe",
        "image": "/images/Aleph_Stone/A88 Calacatta Luxe.webp"
      },
      {
        "name": "A89 Emperador",
        "image": "/images/Aleph_Stone/A89 Emperador.webp"
      },
      {
        "name": "A90 Solomeo Mat",
        "image": "/images/Aleph_Stone/a90-solomeo-mat.webp"
      },
      {
        "name": "A91 Travertino",
        "image": "/images/Aleph_Stone/A91 Travertino.webp"
      },
      {
        "name": "A92 Onyx Blue",
        "image": "/images/Aleph_Stone/A92 Onyx Blue.webp"
      },
      {
        "name": "A93 Taj Mahal",
        "image": "/images/Aleph_Stone/A93 Taj Mahal.webp"
      },
      {
        "name": "A94 Onyx Bianco",
        "image": "/images/Aleph_Stone/A94 Onyx Bianco.webp"
      },
      {
        "name": "A95 Desert Rose",
        "image": "/images/Aleph_Stone/A95 Desert Rose.webp"
      },
      {
        "name": "A96 Ivory Glace",
        "image": "/images/Aleph_Stone/A96 Ivory Glace.webp"
      },
      {
        "name": "A97 Onice Ambra",
        "image": "/images/Aleph_Stone/A97 Onice Ambra.webp"
      },
      {
        "name": "A99 Ocean Grey",
        "image": "/images/Aleph_Stone/A99 Ocean Grey.webp"
      }
    ]
  },
  {
    "slug": "asterum",
    "name": "Asterum",
    "logo": "/images/Brands_icon/Asterum.png",
    "decors": [
      {
        "name": "0001 Perfecta",
        "image": "/images/Asterum/0001 Perfecta.webp"
      },
      {
        "name": "1001 Coliseum",
        "image": "/images/Asterum/1001 Coliseum.webp"
      },
      {
        "name": "1101 Megapolis",
        "image": "/images/Asterum/1101 Megapolis.webp"
      },
      {
        "name": "1104 Macedonia",
        "image": "/images/Asterum/1104 Macedonia.webp"
      },
      {
        "name": "1105 Trufaldino",
        "image": "/images/Asterum/1105 Trufaldino.webp"
      },
      {
        "name": "3000 Jakarta",
        "image": "/images/Asterum/3000 Jakarta.webp"
      },
      {
        "name": "3002 Cappucino",
        "image": "/images/Asterum/3002 Cappucino.webp"
      },
      {
        "name": "3003 Cleopatra",
        "image": "/images/Asterum/3003 Cleopatra.webp"
      },
      {
        "name": "3004 Buckingham",
        "image": "/images/Asterum/3004 Buckingham.webp"
      },
      {
        "name": "3101 Alaska",
        "image": "/images/Asterum/3101 Alaska.webp"
      },
      {
        "name": "3102 Palladium",
        "image": "/images/Asterum/3102 Palladium.webp"
      },
      {
        "name": "3103 Leonardo",
        "image": "/images/Asterum/3103 Leonardo.webp"
      },
      {
        "name": "3104 Tundra",
        "image": "/images/Asterum/3104 Tundra.webp"
      },
      {
        "name": "3200 Arabica",
        "image": "/images/Asterum/3200 Arabica.webp"
      },
      {
        "name": "3402 Palladium Matt",
        "image": "/images/Asterum/3402 Palladium Matt.webp"
      },
      {
        "name": "4002 Derbent",
        "image": "/images/Asterum/4002 Derbent.webp"
      },
      {
        "name": "4101 Safary",
        "image": "/images/Asterum/4101 Safary.webp"
      },
      {
        "name": "4102 Husky",
        "image": "/images/Asterum/4102 Husky.webp"
      },
      {
        "name": "4103 Niagara",
        "image": "/images/Asterum/4103 Niagara.webp"
      },
      {
        "name": "4104 Bionica",
        "image": "/images/Asterum/4104 Bionica.webp"
      },
      {
        "name": "5001 Albion",
        "image": "/images/Asterum/5001 Albion.webp"
      },
      {
        "name": "5002 Caracum",
        "image": "/images/Asterum/5002 Caracum.webp"
      },
      {
        "name": "5003 Michelangelo",
        "image": "/images/Asterum/5003 Michelangelo.webp"
      },
      {
        "name": "5101 Everest",
        "image": "/images/Asterum/5101 Everest.webp"
      },
      {
        "name": "5108 Vanessa",
        "image": "/images/Asterum/5108 Vanessa.webp"
      },
      {
        "name": "5109 Picanto",
        "image": "/images/Asterum/5109 Picanto.webp"
      },
      {
        "name": "5110 Charaur",
        "image": "/images/Asterum/5110 Charaur.webp"
      },
      {
        "name": "5400 Himalayas Matt",
        "image": "/images/Asterum/5400 Himalayas Matt.webp"
      },
      {
        "name": "5401 Aurelia Matt",
        "image": "/images/Asterum/5401 Aurelia Matt.webp"
      },
      {
        "name": "6101 Archeolog",
        "image": "/images/Asterum/6101 Archeolog.webp"
      },
      {
        "name": "6106 Bagira",
        "image": "/images/Asterum/6106 Bagira.webp"
      },
      {
        "name": "7401 Hippy Matt",
        "image": "/images/Asterum/7401 Hippy Matt.webp"
      }
    ]
  },
  {
    "slug": "avant",
    "name": "Avant Quartz",
    "logo": "/images/Brands_icon/Avant.png",
    "decors": [
      {
        "name": "1000 Dizhon",
        "image": "/images/Avant_Quartz/1000-dizhon.webp"
      },
      {
        "name": "1012 Amen",
        "image": "/images/Avant_Quartz/1012-amen.webp"
      },
      {
        "name": "1111 Avalon",
        "image": "/images/Avant_Quartz/1111-avalon.webp"
      },
      {
        "name": "1220 Klermon",
        "image": "/images/Avant_Quartz/1220-klermon.webp"
      },
      {
        "name": "2060 Grey Tur",
        "image": "/images/Avant_Quartz/2060-grey-tur.webp"
      },
      {
        "name": "5700 Kalakatta Ameli Print",
        "image": "/images/Avant_Quartz/5700-kalakatta-ameli-print.webp"
      },
      {
        "name": "5750 Kalakatta Sheri Print",
        "image": "/images/Avant_Quartz/5750-kalakatta-sheri-print.webp"
      },
      {
        "name": "5751 Kalakatta Besson Print",
        "image": "/images/Avant_Quartz/5751-kalakatta-besson-print.webp"
      },
      {
        "name": "5752 Kalakatta Krespen Print",
        "image": "/images/Avant_Quartz/5752-kalakatta-krespen-print.webp"
      },
      {
        "name": "5753 Kalakatta Averon Print",
        "image": "/images/Avant_Quartz/5753-kalakatta-averon-print.webp"
      },
      {
        "name": "5754 Kalakatta Vive Print",
        "image": "/images/Avant_Quartz/5754-kalakatta-vive-print.webp"
      },
      {
        "name": "5800 Travertin Supp Print",
        "image": "/images/Avant_Quartz/5800-travertin-supp-print.webp"
      },
      {
        "name": "7000 Kalakatta Eno",
        "image": "/images/Avant_Quartz/7000-kalakatta-eno.webp"
      },
      {
        "name": "7030 Kalakatta Shenonso",
        "image": "/images/Avant_Quartz/7030-kalakatta-shenonso.webp"
      },
      {
        "name": "7040 Kalakatta Bomenil",
        "image": "/images/Avant_Quartz/7040-kalakatta-bomenil.webp"
      },
      {
        "name": "7060 Kalakatta Mon Sen Mishel",
        "image": "/images/Avant_Quartz/7060-kalakatta-mon-sen-mishel.webp"
      },
      {
        "name": "7070 Kalakatta Versal",
        "image": "/images/Avant_Quartz/7070-kalakatta-versal.webp"
      },
      {
        "name": "7080 Kalakatta Perfon",
        "image": "/images/Avant_Quartz/7080-kalakatta-perfon.webp"
      },
      {
        "name": "7090 Kalakatta Rona Alpy",
        "image": "/images/Avant_Quartz/7090-kalakatta-rona-alpy.webp"
      },
      {
        "name": "7100 Statuario Lill",
        "image": "/images/Avant_Quartz/7100-statuario-lill.webp"
      },
      {
        "name": "7200 Akvitaniya Blanka",
        "image": "/images/Avant_Quartz/7200-akvitaniya-blanka.webp"
      },
      {
        "name": "7400 Kalakatta Dofine",
        "image": "/images/Avant_Quartz/7400-kalakatta-dofine.webp"
      },
      {
        "name": "7470 Kalakatta Bern",
        "image": "/images/Avant_Quartz/7470-kalakatta-bern.webp"
      },
      {
        "name": "7500 Kalakatta Arras",
        "image": "/images/Avant_Quartz/7500-kalakatta-arras.webp"
      },
      {
        "name": "7550 Kalakatta Kanny Gold Mat",
        "image": "/images/Avant_Quartz/7550-kalakatta-kanny-gold-mat.webp"
      },
      {
        "name": "7560 Kalakatta Albi Mat",
        "image": "/images/Avant_Quartz/7560-kalakatta-albi-mat.webp"
      },
      {
        "name": "7570 Kalakatta Talans",
        "image": "/images/Avant_Quartz/7570-kalakatta-talans.webp"
      },
      {
        "name": "7630 Kalakatta Vensen",
        "image": "/images/Avant_Quartz/7630-kalakatta-vensen.webp"
      },
      {
        "name": "7670 Kalakatta Kassel",
        "image": "/images/Avant_Quartz/7670-kalakatta-kassel.webp"
      },
      {
        "name": "7700 Kalakatta Marsel",
        "image": "/images/Avant_Quartz/7700-kalakatta-marsel.webp"
      },
      {
        "name": "7810 Kalakatta Modan",
        "image": "/images/Avant_Quartz/7810-kalakatta-modan.webp"
      },
      {
        "name": "7888 Kalakatta Dinan",
        "image": "/images/Avant_Quartz/7888-kalakatta-dinan.webp"
      },
      {
        "name": "7970 Kalakatta Trua",
        "image": "/images/Avant_Quartz/7970-kalakatta-trua.webp"
      },
      {
        "name": "7980 Nitstsa Blank",
        "image": "/images/Avant_Quartz/7980-nitstsa-blank.webp"
      },
      {
        "name": "7985 Nitstsa Noir Mat",
        "image": "/images/Avant_Quartz/7985-nitstsa-noir-mat.webp"
      },
      {
        "name": "8011 Nant Matovyy",
        "image": "/images/Avant_Quartz/8011-nant-matovyy.webp"
      },
      {
        "name": "8033 Karkasson Matovyy",
        "image": "/images/Avant_Quartz/8033-karkasson-matovyy.webp"
      },
      {
        "name": "8044 Evri Matovyy",
        "image": "/images/Avant_Quartz/8044-evri-matovyy.webp"
      },
      {
        "name": "8046 Eson Matovyy",
        "image": "/images/Avant_Quartz/8046-eson-matovyy.webp"
      },
      {
        "name": "8059 Laval Matovyy",
        "image": "/images/Avant_Quartz/8059-laval-matovyy.webp"
      },
      {
        "name": "8100 Mulen Matovyy",
        "image": "/images/Avant_Quartz/8100-mulen-matovyy.webp"
      },
      {
        "name": "8580 Tarn Matovyy",
        "image": "/images/Avant_Quartz/8580-tarn-matovyy.webp"
      },
      {
        "name": "8800 Kassis Matovyy",
        "image": "/images/Avant_Quartz/8800-kassis-matovyy.webp"
      },
      {
        "name": "8810 Renn Templ Matovyy",
        "image": "/images/Avant_Quartz/8810-renn-templ-matovyy.webp"
      },
      {
        "name": "8811 Reze Matovyy",
        "image": "/images/Avant_Quartz/8811-reze-matovyy.webp"
      },
      {
        "name": "9005 Burbonne",
        "image": "/images/Avant_Quartz/9005-burbonne.webp"
      },
      {
        "name": "9006 Limuzen",
        "image": "/images/Avant_Quartz/9006-limuzen.webp"
      },
      {
        "name": "9010 Korsika",
        "image": "/images/Avant_Quartz/9010-korsika.webp"
      },
      {
        "name": "9023 Lotaringiya",
        "image": "/images/Avant_Quartz/9023-lotaringiya.webp"
      },
      {
        "name": "9050 Gris Fonse",
        "image": "/images/Avant_Quartz/9050-gris-fonse.webp"
      },
      {
        "name": "9133 Avinon Gris",
        "image": "/images/Avant_Quartz/9133-avinon-gris.webp"
      },
      {
        "name": "9172 Blave",
        "image": "/images/Avant_Quartz/9172-blave.webp"
      },
      {
        "name": "9173 Vilen",
        "image": "/images/Avant_Quartz/9173-vilen.webp"
      },
      {
        "name": "9212 Sen Trope",
        "image": "/images/Avant_Quartz/9212-sen-trope.webp"
      },
      {
        "name": "9510 Vanilla Ansi",
        "image": "/images/Avant_Quartz/9510-vanilla-ansi.webp"
      },
      {
        "name": "9603 Sen Malo",
        "image": "/images/Avant_Quartz/9603-sen-malo.webp"
      }
    ]
  },
  {
    "slug": "avarus",
    "name": "Avarus",
    "logo": "/images/Brands_icon/Avarus.png",
    "decors": [
      {
        "name": "R104 Belaya Tayga",
        "image": "/images/Avarus/r104-belaya-tayga.webp"
      },
      {
        "name": "R112 Sol Kaspiya",
        "image": "/images/Avarus/r112-sol-kaspiya.webp"
      },
      {
        "name": "R122 Almazy Yakutii",
        "image": "/images/Avarus/r122-almazy-yakutii.webp"
      },
      {
        "name": "R403 Skaly Karelii",
        "image": "/images/Avarus/r403-skaly-karelii.webp"
      },
      {
        "name": "R444 Ay Petri",
        "image": "/images/Avarus/r444-ay-petri.webp"
      },
      {
        "name": "R500 Zhemchug Primorya",
        "image": "/images/Avarus/r500-zhemchug-primorya.webp"
      },
      {
        "name": "R503 Uralskie Gory",
        "image": "/images/Avarus/r503-uralskie-gory.webp"
      },
      {
        "name": "R510 Chernoe More",
        "image": "/images/Avarus/r510-chernoe-more.webp"
      },
      {
        "name": "R511 Lyod Baykala",
        "image": "/images/Avarus/r511-lyod-baykala.webp"
      },
      {
        "name": "R515 Vulkany Kamchatki",
        "image": "/images/Avarus/r515-vulkany-kamchatki.webp"
      },
      {
        "name": "R520 Astrakhanskie Peski",
        "image": "/images/Avarus/r520-astrakhanskie-peski.webp"
      },
      {
        "name": "R522 Zolotoe Koltso",
        "image": "/images/Avarus/r522-zolotoe-koltso.webp"
      },
      {
        "name": "R531 Donskaya Step",
        "image": "/images/Avarus/r531-donskaya-step.webp"
      },
      {
        "name": "R538 Gory Kavkaza",
        "image": "/images/Avarus/r538-gory-kavkaza.webp"
      },
      {
        "name": "R541 Snega Sibiri",
        "image": "/images/Avarus/r541-snega-sibiri.webp"
      },
      {
        "name": "R543 Pik Elbrusa",
        "image": "/images/Avarus/r543-pik-elbrusa.webp"
      },
      {
        "name": "R555 Baltiyskiy Bereg",
        "image": "/images/Avarus/r555-baltiyskiy-bereg.webp"
      },
      {
        "name": "R558 Prostory Povolzhya",
        "image": "/images/Avarus/r558-prostory-povolzhya.webp"
      },
      {
        "name": "R575 Krasnaya Polyana",
        "image": "/images/Avarus/r575-krasnaya-polyana.webp"
      },
      {
        "name": "R590 Severnoe Siyanie",
        "image": "/images/Avarus/r590-severnoe-siyanie.webp"
      },
      {
        "name": "R677 Moskovskaya Noch",
        "image": "/images/Avarus/r677-moskovskaya-noch.webp"
      },
      {
        "name": "RM104 Belaya Tayga Mat",
        "image": "/images/Avarus/rm104-belaya-tayga-mat.webp"
      },
      {
        "name": "RM403 Skaly Karelii Mat",
        "image": "/images/Avarus/rm403-skaly-karelii-mat.webp"
      },
      {
        "name": "RM444 Ay Petri Mat",
        "image": "/images/Avarus/rm444-ay-petri-mat.webp"
      },
      {
        "name": "RM500 Zhemchug Primorya Mat",
        "image": "/images/Avarus/rm500-zhemchug-primorya-mat.webp"
      },
      {
        "name": "RM510 Chernoe More Mat",
        "image": "/images/Avarus/rm510-chernoe-more-mat.webp"
      },
      {
        "name": "RM511 Lyod Baykala Mat",
        "image": "/images/Avarus/rm511-lyod-baykala-mat.webp"
      },
      {
        "name": "RM520 Astrakhanskie Peski Mat",
        "image": "/images/Avarus/rm520-astrakhanskie-peski-mat.webp"
      },
      {
        "name": "RM543 Pik Elbrusa Mat",
        "image": "/images/Avarus/rm543-pik-elbrusa-mat.webp"
      },
      {
        "name": "RM560 Zolotye Vorota Mat",
        "image": "/images/Avarus/rm560-zolotye-vorota-mat.webp"
      }
    ]
  },
  {
    "slug": "belenco",
    "name": "Belenco",
    "logo": "/images/Brands_icon/Belenco.png",
    "decors": [
      {
        "name": "1010 Premium White Seta",
        "image": "/images/Belenco/1010 Premium White Seta.webp"
      },
      {
        "name": "1010 Premium White",
        "image": "/images/Belenco/1010 Premium White.webp"
      },
      {
        "name": "1110 Iceberg",
        "image": "/images/Belenco/1110 Iceberg.webp"
      },
      {
        "name": "1123 Perla White",
        "image": "/images/Belenco/1123 Perla White.webp"
      },
      {
        "name": "1124 Amalfi",
        "image": "/images/Belenco/1124 Amalfi.webp"
      },
      {
        "name": "1189 Calacatta Garda",
        "image": "/images/Belenco/1189 Calacatta Garda.webp"
      },
      {
        "name": "1219 Calacatta Victory",
        "image": "/images/Belenco/1219 Calacatta Victory.webp"
      },
      {
        "name": "1220 Calacatta Paletino",
        "image": "/images/Belenco/1220 Calacatta Paletino.webp"
      },
      {
        "name": "1221 Calacatta Valencia",
        "image": "/images/Belenco/1221 Calacatta Valencia.webp"
      },
      {
        "name": "1227 Pixie Wings",
        "image": "/images/Belenco/1227 Pixie Wings.webp"
      },
      {
        "name": "2214 Teos",
        "image": "/images/Belenco/2214 Teos.webp"
      },
      {
        "name": "2219 Calacatta Venezia",
        "image": "/images/Belenco/2219 Calacatta Venezia.webp"
      },
      {
        "name": "2229 Calacatta Venus",
        "image": "/images/Belenco/2229 Calacatta Venus.webp"
      },
      {
        "name": "2254 Aurora",
        "image": "/images/Belenco/2254 Aurora.webp"
      },
      {
        "name": "2543 Ashen Seta",
        "image": "/images/Belenco/2543 Ashen Seta.webp"
      },
      {
        "name": "2543 Ashen",
        "image": "/images/Belenco/2543 Ashen.webp"
      },
      {
        "name": "2555 Artesia",
        "image": "/images/Belenco/2555 Artesia.webp"
      },
      {
        "name": "3110 Polaris Seta",
        "image": "/images/Belenco/3110 Polaris Seta.webp"
      },
      {
        "name": "3110 Polaris",
        "image": "/images/Belenco/3110 Polaris.webp"
      },
      {
        "name": "3113 Daphne Crack",
        "image": "/images/Belenco/3113 Daphne Crack.webp"
      },
      {
        "name": "3333 Boletus Seta",
        "image": "/images/Belenco/3333 Boletus Seta.webp"
      },
      {
        "name": "3333 Boletus",
        "image": "/images/Belenco/3333 Boletus.webp"
      },
      {
        "name": "3516 Hypnose",
        "image": "/images/Belenco/3516 Hypnose.webp"
      },
      {
        "name": "3555 Parma Seta",
        "image": "/images/Belenco/3555 Parma Seta.webp"
      },
      {
        "name": "3555 Parma",
        "image": "/images/Belenco/3555 Parma.webp"
      },
      {
        "name": "3618 Olympos",
        "image": "/images/Belenco/3618 Olympos.webp"
      },
      {
        "name": "3727 Just Black",
        "image": "/images/Belenco/3727 Just Black.webp"
      },
      {
        "name": "4043 Aizano Seta",
        "image": "/images/Belenco/4043 Aizano Seta.webp"
      },
      {
        "name": "4043 Aizano",
        "image": "/images/Belenco/4043 Aizano.webp"
      },
      {
        "name": "4110 Diamond White",
        "image": "/images/Belenco/4110 Diamond White.webp"
      },
      {
        "name": "4120 Calacatta Alya",
        "image": "/images/Belenco/4120 Calacatta Alya.webp"
      },
      {
        "name": "4123 Kashmera White",
        "image": "/images/Belenco/4123 Kashmera White.webp"
      },
      {
        "name": "4217 Rapture",
        "image": "/images/Belenco/4217 Rapture.webp"
      },
      {
        "name": "4227 Fairy White",
        "image": "/images/Belenco/4227 Fairy White.webp"
      },
      {
        "name": "4242 Statuario Volga",
        "image": "/images/Belenco/4242 Statuario Volga.webp"
      },
      {
        "name": "4262 Kristella White",
        "image": "/images/Belenco/4262 Kristella White.webp"
      },
      {
        "name": "4444 Sahara Beige",
        "image": "/images/Belenco/4444 Sahara Beige.webp"
      },
      {
        "name": "4456 Cadiz",
        "image": "/images/Belenco/4456 Cadiz.webp"
      },
      {
        "name": "4458 Chakra Beige",
        "image": "/images/Belenco/4458 Chakra Beige.webp"
      },
      {
        "name": "4524 La Luna",
        "image": "/images/Belenco/4524 La Luna.webp"
      },
      {
        "name": "4535 Terre Grey",
        "image": "/images/Belenco/4535 Terre Grey.webp"
      },
      {
        "name": "4558 Babilon Seta",
        "image": "/images/Belenco/4558 Babilon Seta.webp"
      },
      {
        "name": "4558 Babilon",
        "image": "/images/Belenco/4558 Babilon.webp"
      },
      {
        "name": "5050 Forza Fume",
        "image": "/images/Belenco/5050 Forza Fume.webp"
      },
      {
        "name": "5113 Minta",
        "image": "/images/Belenco/5113 Minta.webp"
      },
      {
        "name": "5114 Carola",
        "image": "/images/Belenco/5114 Carola.webp"
      },
      {
        "name": "5139 Juliet White",
        "image": "/images/Belenco/5139 Juliet White.webp"
      },
      {
        "name": "5219 Statuario Crux",
        "image": "/images/Belenco/5219 Statuario Crux.webp"
      },
      {
        "name": "5224 Elegance",
        "image": "/images/Belenco/5224 Elegance.webp"
      },
      {
        "name": "5250 Elexir White Seta",
        "image": "/images/Belenco/5250 Elexir White Seta.webp"
      },
      {
        "name": "5250 Elexir White",
        "image": "/images/Belenco/5250 Elexir White.webp"
      },
      {
        "name": "5329 Mocca Mousse",
        "image": "/images/Belenco/5329 Mocca Mousse.webp"
      },
      {
        "name": "5751 Gala Black",
        "image": "/images/Belenco/5751 Gala Black.webp"
      },
      {
        "name": "6114 Belluno Honed",
        "image": "/images/Belenco/6114 Belluno Honed.webp"
      },
      {
        "name": "6114 Belluno",
        "image": "/images/Belenco/6114 Belluno.webp"
      },
      {
        "name": "6139 Everst White",
        "image": "/images/Belenco/6139 Everst White.webp"
      },
      {
        "name": "6214 Stardust",
        "image": "/images/Belenco/6214 Stardust.webp"
      },
      {
        "name": "6229 Aspendos",
        "image": "/images/Belenco/6229 Aspendos.webp"
      },
      {
        "name": "7119 Calacatta Venatino",
        "image": "/images/Belenco/7119 Calacatta Venatino.webp"
      },
      {
        "name": "7123 Carrara Bela",
        "image": "/images/Belenco/7123 Carrara Bela.webp"
      },
      {
        "name": "7220 Pantheon",
        "image": "/images/Belenco/7220 Pantheon.webp"
      },
      {
        "name": "7227 Armilla",
        "image": "/images/Belenco/7227 Armilla.webp"
      },
      {
        "name": "7353 Pergamon",
        "image": "/images/Belenco/7353 Pergamon.webp"
      },
      {
        "name": "7458 Granada",
        "image": "/images/Belenco/7458 Granada.webp"
      },
      {
        "name": "7537 Metropol Grey Seta",
        "image": "/images/Belenco/7537 Metropol Grey Seta.webp"
      },
      {
        "name": "7537 Metropol Grey",
        "image": "/images/Belenco/7537 Metropol Grey.webp"
      },
      {
        "name": "7543 Montana",
        "image": "/images/Belenco/7543 Montana.webp"
      },
      {
        "name": "8113 Anemon",
        "image": "/images/Belenco/8113 Anemon.webp"
      },
      {
        "name": "8119 Calacatta Verona",
        "image": "/images/Belenco/8119 Calacatta Verona.webp"
      },
      {
        "name": "8123 Carrara Luca",
        "image": "/images/Belenco/8123 Carrara Luca.webp"
      },
      {
        "name": "8250 Columbia Gray",
        "image": "/images/Belenco/8250 Columbia Gray.webp"
      },
      {
        "name": "8262 Mont Blanc Snow",
        "image": "/images/Belenco/8262 Mont Blanc Snow.webp"
      },
      {
        "name": "8727 Spa Black Seta",
        "image": "/images/Belenco/8727 Spa Black Seta.webp"
      },
      {
        "name": "8727 Spa Black",
        "image": "/images/Belenco/8727 Spa Black.webp"
      },
      {
        "name": "8765 Volcano Black Seta",
        "image": "/images/Belenco/8765 Volcano Black Seta.webp"
      },
      {
        "name": "8765 Volcano Black",
        "image": "/images/Belenco/8765 Volcano Black.webp"
      },
      {
        "name": "9113 Alinda",
        "image": "/images/Belenco/9113 Alinda.webp"
      },
      {
        "name": "9119 Calacatta Veneto",
        "image": "/images/Belenco/9119 Calacatta Veneto.webp"
      },
      {
        "name": "9219 Marquina Tierra Seta",
        "image": "/images/Belenco/9219 Marquina Tierra Seta.webp"
      },
      {
        "name": "9219 Marquina Tierra",
        "image": "/images/Belenco/9219 Marquina Tierra.webp"
      },
      {
        "name": "9242 Arena Seta",
        "image": "/images/Belenco/9242 Arena Seta.webp"
      },
      {
        "name": "9242 Arena",
        "image": "/images/Belenco/9242 Arena.webp"
      },
      {
        "name": "9719 Marquina Lavanga",
        "image": "/images/Belenco/9719 Marquina Lavanga.webp"
      }
    ]
  },
  {
    "slug": "caesarstone",
    "name": "Caesarstone",
    "logo": "/images/Brands_icon/Caesarstone.webp",
    "decors": [
      {
        "name": "1141 Pure White",
        "image": "/images/Caesarstone/1141 Pure White.webp"
      },
      {
        "name": "2040 Urban",
        "image": "/images/Caesarstone/2040 Urban.webp"
      },
      {
        "name": "2141 Snow",
        "image": "/images/Caesarstone/2141 Snow.webp"
      },
      {
        "name": "2230 Linen",
        "image": "/images/Caesarstone/2230 Linen.webp"
      },
      {
        "name": "3100 Jet Black",
        "image": "/images/Caesarstone/3100 Jet Black.webp"
      },
      {
        "name": "3141 Osprey",
        "image": "/images/Caesarstone/3141 Osprey.webp"
      },
      {
        "name": "3142 While Shimmer",
        "image": "/images/Caesarstone/3142 While Shimmer.webp"
      },
      {
        "name": "4003 Sleek Concrete Mat",
        "image": "/images/Caesarstone/4003-sleek-concrete-mat.webp"
      },
      {
        "name": "4011 Cloudbust Concrete Mat",
        "image": "/images/Caesarstone/4011-cloudbust-concrete-mat.webp"
      },
      {
        "name": "4023 Topus Concrete Mat",
        "image": "/images/Caesarstone/4023-topus-concrete-mat.webp"
      },
      {
        "name": "4030 Oyster",
        "image": "/images/Caesarstone/4030 Oyster.webp"
      },
      {
        "name": "4033 Rugged Concrete Mat",
        "image": "/images/Caesarstone/4033-rugged-concrete-mat.webp"
      },
      {
        "name": "4043 Primordia Mat",
        "image": "/images/Caesarstone/4043-primordia-mat.webp"
      },
      {
        "name": "4044 Airy Concrete Mat",
        "image": "/images/Caesarstone/4044-airy-concrete-mat.webp"
      },
      {
        "name": "4120 Raven",
        "image": "/images/Caesarstone/4120 Raven.webp"
      },
      {
        "name": "4130 Clamshell",
        "image": "/images/Caesarstone/4130 Clamshell.webp"
      },
      {
        "name": "4230 Shitake",
        "image": "/images/Caesarstone/4230 Shitake.webp"
      },
      {
        "name": "4350 Mink",
        "image": "/images/Caesarstone/4350 Mink.webp"
      },
      {
        "name": "4600 Organic White",
        "image": "/images/Caesarstone/4600 Organic White.webp"
      },
      {
        "name": "4735 Oxidian Mat",
        "image": "/images/Caesarstone/4735-oxidian-mat.webp"
      },
      {
        "name": "5000 London Grey",
        "image": "/images/Caesarstone/5000 London Grey.webp"
      },
      {
        "name": "5003 Piatra Grey",
        "image": "/images/Caesarstone/5003 Piatra Grey.webp"
      },
      {
        "name": "5031 Statuario Maximus",
        "image": "/images/Caesarstone/5031 Statuario Maximus.webp"
      },
      {
        "name": "5100 Vanilla Noir",
        "image": "/images/Caesarstone/5100 Vanilla Noir.webp"
      },
      {
        "name": "5110 Alpine Mist",
        "image": "/images/Caesarstone/5110 Alpine Mist.webp"
      },
      {
        "name": "5111 Statuario Nuvo",
        "image": "/images/Caesarstone/5111 Statuario Nuvo.webp"
      },
      {
        "name": "5131 Calacatta Nuvo",
        "image": "/images/Caesarstone/5131 Calacatta Nuvo.webp"
      },
      {
        "name": "5133 Symphony Grey",
        "image": "/images/Caesarstone/5133 Symphony Grey.webp"
      },
      {
        "name": "5141 Frosty Carina",
        "image": "/images/Caesarstone/5141 Frosty Carina.webp"
      },
      {
        "name": "5143 White Attica",
        "image": "/images/Caesarstone/5143 White Attica.webp"
      },
      {
        "name": "5212 Taj Royale",
        "image": "/images/Caesarstone/5212 Taj Royale.webp"
      },
      {
        "name": "5810 Black Tempal Mat",
        "image": "/images/Caesarstone/5810-black-tempal-mat.webp"
      },
      {
        "name": "6003 Coastal Grey",
        "image": "/images/Caesarstone/6003 Coastal Grey.webp"
      },
      {
        "name": "6046 Moorland Fog",
        "image": "/images/Caesarstone/6046 Moorland Fog.webp"
      },
      {
        "name": "6131 Bianco Drift",
        "image": "/images/Caesarstone/6131 Bianco Drift.webp"
      },
      {
        "name": "6134 Georgian Bluffs",
        "image": "/images/Caesarstone/6134 Georgian Bluffs.webp"
      },
      {
        "name": "6141 Ocean Foam",
        "image": "/images/Caesarstone/6141 Ocean Foam.webp"
      },
      {
        "name": "6313 Turbine Grey",
        "image": "/images/Caesarstone/6313 Turbine Grey.webp"
      },
      {
        "name": "6338 Woodlands",
        "image": "/images/Caesarstone/6338 Woodlands.webp"
      },
      {
        "name": "7110 Burnt Cordite",
        "image": "/images/Caesarstone/7110 Burnt Cordite.webp"
      },
      {
        "name": "9141 Ice Snow",
        "image": "/images/Caesarstone/9141 Ice Snow.webp"
      }
    ]
  },
  {
    "slug": "etna",
    "name": "Etna Quartz",
    "logo": "/images/Brands_icon/Etna.png",
    "decors": [
      {
        "name": "EQAC 036 Antica Grey",
        "image": "/images/Etna_Quartz/EQAC 036 Antica Grey.webp"
      },
      {
        "name": "Eqag 099 Titanium Leather Mat",
        "image": "/images/Etna_Quartz/eqag-099-titanium-leather-mat.webp"
      },
      {
        "name": "EQAM 042 Volakas Extra",
        "image": "/images/Etna_Quartz/EQAM 042 Volakas Extra.webp"
      },
      {
        "name": "EQAM 043 Bianco Crystallo",
        "image": "/images/Etna_Quartz/EQAM 043 Bianco Crystallo.webp"
      },
      {
        "name": "EQAM 046 Arabescato Corcia",
        "image": "/images/Etna_Quartz/EQAM 046 Arabescato Corcia.webp"
      },
      {
        "name": "EQC 067 Pure White",
        "image": "/images/Etna_Quartz/EQC 067 Pure White.webp"
      },
      {
        "name": "Eqcc 061 Antico Classic Mat",
        "image": "/images/Etna_Quartz/eqcc-061-antico-classic-mat.webp"
      },
      {
        "name": "EQCM 059 Canvas Gold",
        "image": "/images/Etna_Quartz/EQCM 059 Canvas Gold.webp"
      },
      {
        "name": "EQHG 004 Canvas",
        "image": "/images/Etna_Quartz/EQHG 004 Canvas.webp"
      },
      {
        "name": "Eqhg 004 Canvas Matovyy",
        "image": "/images/Etna_Quartz/eqhg-004-canvas-matovyy.webp"
      },
      {
        "name": "EQHM 001 Perlino Bianco",
        "image": "/images/Etna_Quartz/EQHM 001 Perlino Bianco.webp"
      },
      {
        "name": "EQHM 002 Calacatta Venato",
        "image": "/images/Etna_Quartz/EQHM 002 Calacatta Venato.webp"
      },
      {
        "name": "EQHM 003 Canvas",
        "image": "/images/Etna_Quartz/EQHM 003 Canvas.webp"
      },
      {
        "name": "EQHM 005 Mandala",
        "image": "/images/Etna_Quartz/EQHM 005 Mandala.webp"
      },
      {
        "name": "EQHM 006 Negro Marquina",
        "image": "/images/Etna_Quartz/EQHM 006 Negro Marquina.webp"
      },
      {
        "name": "EQHM 007 Grey Marquina",
        "image": "/images/Etna_Quartz/EQHM 007 Grey Marquina.webp"
      },
      {
        "name": "EQHM 029 Sahara Noir",
        "image": "/images/Etna_Quartz/EQHM 029 Sahara Noir.webp"
      },
      {
        "name": "Eqhm 007 Grey Marquina Mat",
        "image": "/images/Etna_Quartz/eqhm-007-grey-marquina-mat.webp"
      },
      {
        "name": "EQJC 052 Black Mirror",
        "image": "/images/Etna_Quartz/EQJC 052 Black Mirror.webp"
      },
      {
        "name": "Eqjc 054 Antica Dark Bronze Mat",
        "image": "/images/Etna_Quartz/eqjc-054-antica-dark-bronze-mat.webp"
      },
      {
        "name": "EQJM 073 Calacatta Etna",
        "image": "/images/Etna_Quartz/EQJM 073 Calacatta Etna.webp"
      },
      {
        "name": "EQJO 069 Onyx Bianco",
        "image": "/images/Etna_Quartz/EQJO 069 Onyx Bianco.webp"
      },
      {
        "name": "EQJQ 077 Patagonia Extra",
        "image": "/images/Etna_Quartz/EQJQ 077 Patagonia Extra.webp"
      },
      {
        "name": "EQMM 070 Calacatta Star",
        "image": "/images/Etna_Quartz/EQMM 070 Calacatta Star.webp"
      },
      {
        "name": "EQMM 071 Golden Silk",
        "image": "/images/Etna_Quartz/EQMM 071 Golden Silk.webp"
      },
      {
        "name": "EQMM 072 Moon Valley",
        "image": "/images/Etna_Quartz/EQMM 072 Moon Valley.webp"
      },
      {
        "name": "EQMM 101 Carrara",
        "image": "/images/Etna_Quartz/EQMM 101 Carrara.webp"
      },
      {
        "name": "EQMM 102 Cream Beige",
        "image": "/images/Etna_Quartz/EQMM 102 Cream Beige.webp"
      },
      {
        "name": "EQMM 104 Etna Delicato",
        "image": "/images/Etna_Quartz/EQMM 104 Etna Delicato.webp"
      },
      {
        "name": "EQMO 079 Aquamarine",
        "image": "/images/Etna_Quartz/EQMO 079 Aquamarine.webp"
      },
      {
        "name": "EQMO 103 Ice Onyx",
        "image": "/images/Etna_Quartz/EQMO 103 Ice Onyx.webp"
      },
      {
        "name": "EQPG 022 Bianco Antico",
        "image": "/images/Etna_Quartz/EQPG 022 Bianco Antico.webp"
      },
      {
        "name": "EQPM 008 Calacatta Santorini",
        "image": "/images/Etna_Quartz/EQPM 008 Calacatta Santorini.webp"
      },
      {
        "name": "EQPM 020 Sofita Beige",
        "image": "/images/Etna_Quartz/EQPM 020 Sofita Beige.webp"
      },
      {
        "name": "EQPM 023 White Ice",
        "image": "/images/Etna_Quartz/EQPM 023 White Ice.webp"
      },
      {
        "name": "EQPM 025 Azul Imperiale",
        "image": "/images/Etna_Quartz/EQPM 025 Azul Imperiale.webp"
      },
      {
        "name": "EQPM 026 Brown Perlino",
        "image": "/images/Etna_Quartz/EQPM 026 Brown Perlino.webp"
      },
      {
        "name": "EQPM 027 Ambra",
        "image": "/images/Etna_Quartz/EQPM 027 Ambra.webp"
      },
      {
        "name": "EQPM 028 Black Perlino",
        "image": "/images/Etna_Quartz/EQPM 028 Black Perlino.webp"
      },
      {
        "name": "EQPM 068 Panda White",
        "image": "/images/Etna_Quartz/EQPM 068 Panda White.webp"
      },
      {
        "name": "EQT 017 Bianco Extra",
        "image": "/images/Etna_Quartz/EQT 017 Bianco Extra.webp"
      },
      {
        "name": "Eqt 017 Bianco Extra Mat",
        "image": "/images/Etna_Quartz/eqt-017-bianco-extra-mat.webp"
      },
      {
        "name": "EQTM 018 Calacatta Borghini",
        "image": "/images/Etna_Quartz/EQTM 018 Calacatta Borghini.webp"
      }
    ]
  },
  {
    "slug": "noblle",
    "name": "Noblle Quartz",
    "logo": "/images/Brands_icon/Noblle.png",
    "decors": [
      {
        "name": "Q117 Jade White",
        "image": "/images/Noblle_Quartz/Q117 Jade White.webp"
      },
      {
        "name": "Q131 Black Sand",
        "image": "/images/Noblle_Quartz/Q131 Black Sand.webp"
      },
      {
        "name": "Q650 Pietra Grigia",
        "image": "/images/Noblle_Quartz/Q650 Pietra Grigia.webp"
      },
      {
        "name": "Q703 Calacatta Borghini",
        "image": "/images/Noblle_Quartz/Q703 Calacatta Borghini.webp"
      },
      {
        "name": "Q707 Sahara Noir",
        "image": "/images/Noblle_Quartz/Q707 Sahara Noir.webp"
      },
      {
        "name": "Q716 Carrara Sun",
        "image": "/images/Noblle_Quartz/Q716 Carrara Sun.webp"
      },
      {
        "name": "Q717 Bianco Giogia",
        "image": "/images/Noblle_Quartz/Q717 Bianco Giogia.webp"
      },
      {
        "name": "Q718 Carrara Moon",
        "image": "/images/Noblle_Quartz/Q718 Carrara Moon.webp"
      },
      {
        "name": "Q719 Carrara Black",
        "image": "/images/Noblle_Quartz/Q719 Carrara Black.webp"
      },
      {
        "name": "Q735 Bianco Venato",
        "image": "/images/Noblle_Quartz/Q735 Bianco Venato.webp"
      },
      {
        "name": "Q740 Calacatta Venato",
        "image": "/images/Noblle_Quartz/Q740 Calacatta Venato.webp"
      },
      {
        "name": "Q744 Calacatta Bianco",
        "image": "/images/Noblle_Quartz/Q744 Calacatta Bianco.webp"
      },
      {
        "name": "Q750 Statuario Classic",
        "image": "/images/Noblle_Quartz/Q750 Statuario Classic.webp"
      },
      {
        "name": "Q757 Calacatta Aurum",
        "image": "/images/Noblle_Quartz/Q757 Calacatta Aurum.webp"
      },
      {
        "name": "Q765 Nero Marquina",
        "image": "/images/Noblle_Quartz/Q765 Nero Marquina.webp"
      },
      {
        "name": "Q785 Calacatta Gold",
        "image": "/images/Noblle_Quartz/Q785 Calacatta Gold.webp"
      },
      {
        "name": "Q790 Venato Royal",
        "image": "/images/Noblle_Quartz/Q790 Venato Royal.webp"
      },
      {
        "name": "Q795 Calacatta Magic Dark",
        "image": "/images/Noblle_Quartz/Q795 Calacatta Magic Dark.webp"
      },
      {
        "name": "Q796 Calacatta Magic White",
        "image": "/images/Noblle_Quartz/Q796 Calacatta Magic White.webp"
      },
      {
        "name": "Q797 Calacatta True Light",
        "image": "/images/Noblle_Quartz/Q797 Calacatta True Light.webp"
      },
      {
        "name": "Q798 Calacatta Elegant",
        "image": "/images/Noblle_Quartz/Q798 Calacatta Elegant.webp"
      },
      {
        "name": "Q810 Grey Glow",
        "image": "/images/Noblle_Quartz/Q810 Grey Glow.webp"
      },
      {
        "name": "Q811 Beton White Mat",
        "image": "/images/Noblle_Quartz/q811-beton-white-mat.webp"
      },
      {
        "name": "Q840 White Misterio",
        "image": "/images/Noblle_Quartz/Q840 White Misterio.webp"
      },
      {
        "name": "Q850 Urban Grigio",
        "image": "/images/Noblle_Quartz/Q850 Urban Grigio.webp"
      },
      {
        "name": "Q859 Beton Brass Mat",
        "image": "/images/Noblle_Quartz/q859-beton-brass-mat.webp"
      },
      {
        "name": "Q880 Beton Grey Mat",
        "image": "/images/Noblle_Quartz/q880-beton-grey-mat.webp"
      },
      {
        "name": "Q901 Patagonia Gold",
        "image": "/images/Noblle_Quartz/Q901 Patagonia Gold.webp"
      },
      {
        "name": "Q902 Patagonia Platinum",
        "image": "/images/Noblle_Quartz/Q902 Patagonia Platinum.webp"
      },
      {
        "name": "Q921 Arabescato Black",
        "image": "/images/Noblle_Quartz/Q921 Arabescato Black.webp"
      },
      {
        "name": "Q922 Arabescato White",
        "image": "/images/Noblle_Quartz/Q922 Arabescato White.webp"
      },
      {
        "name": "Q923 Arabescato Corchia",
        "image": "/images/Noblle_Quartz/Q923 Arabescato Corchia.webp"
      }
    ]
  },
  {
    "slug": "primax",
    "name": "Primax",
    "logo": "/images/Brands_icon/Primax.png",
    "decors": [
      {
        "name": "100 Ivory White",
        "image": "/images/Primax/100 Ivory White.webp"
      },
      {
        "name": "111 Snow White",
        "image": "/images/Primax/111 Snow White.webp"
      },
      {
        "name": "111 Snow White Mat",
        "image": "/images/Primax/111-snow-white-mat.webp"
      },
      {
        "name": "112 Crystal White",
        "image": "/images/Primax/112 Crystal White.webp"
      },
      {
        "name": "120 Light Grey Mat",
        "image": "/images/Primax/120-light-grey-mat.webp"
      },
      {
        "name": "130 Beige Sand Mat",
        "image": "/images/Primax/130-beige-sand-mat.webp"
      },
      {
        "name": "150 Black Satin Mat",
        "image": "/images/Primax/150-black-satin-mat.webp"
      },
      {
        "name": "312 Patagonia",
        "image": "/images/Primax/312 Patagonia.webp"
      },
      {
        "name": "313 White Arctic Mat",
        "image": "/images/Primax/313-white-arctic-mat.webp"
      },
      {
        "name": "331 Panda White",
        "image": "/images/Primax/331 Panda White.webp"
      },
      {
        "name": "335 Tiffani Blue",
        "image": "/images/Primax/335 Tiffani Blue.webp"
      },
      {
        "name": "340 Taj Mahal",
        "image": "/images/Primax/340 Taj Mahal.webp"
      },
      {
        "name": "345 Black Sea",
        "image": "/images/Primax/345 Black Sea.webp"
      },
      {
        "name": "702 Light Calacatta",
        "image": "/images/Primax/702 Light Calacatta.webp"
      },
      {
        "name": "703 Rich Calacatta",
        "image": "/images/Primax/703 Rich Calacatta.webp"
      },
      {
        "name": "704 Arabescata White",
        "image": "/images/Primax/704 Arabescata White.webp"
      },
      {
        "name": "706 Calacatta Grey Mat",
        "image": "/images/Primax/706-calacatta-grey-mat.webp"
      },
      {
        "name": "719 Earthquake Mat",
        "image": "/images/Primax/719-earthquake-mat.webp"
      },
      {
        "name": "722 Calacatta Warm Venatto Mat",
        "image": "/images/Primax/722-calacatta-warm-venatto-mat.webp"
      },
      {
        "name": "723 Calacatta Gold",
        "image": "/images/Primax/723 Calacatta Gold.webp"
      },
      {
        "name": "726 Virtrum Crystal",
        "image": "/images/Primax/726 Virtrum Crystal.webp"
      },
      {
        "name": "740 Rainbow Calacatta",
        "image": "/images/Primax/740 Rainbow Calacatta.webp"
      },
      {
        "name": "770 Sahara Noir",
        "image": "/images/Primax/770 Sahara Noir.webp"
      },
      {
        "name": "786 Calacatta Back Gold",
        "image": "/images/Primax/786 Calacatta Back Gold.webp"
      },
      {
        "name": "796 Noir Satin Mat",
        "image": "/images/Primax/796-noir-satin-mat.webp"
      },
      {
        "name": "812 Black Rock Mat",
        "image": "/images/Primax/812-black-rock-mat.webp"
      },
      {
        "name": "826 Concrete Grey Mat",
        "image": "/images/Primax/826-concrete-grey-mat.webp"
      },
      {
        "name": "833 Terracotta Mat",
        "image": "/images/Primax/833-terracotta-mat.webp"
      },
      {
        "name": "848 White Oxid Mat",
        "image": "/images/Primax/848-white-oxid-mat.webp"
      },
      {
        "name": "884 Dark Concrete Mat",
        "image": "/images/Primax/884-dark-concrete-mat.webp"
      },
      {
        "name": "892 Grey Oxid Mat",
        "image": "/images/Primax/892-grey-oxid-mat.webp"
      },
      {
        "name": "912 White Carrara",
        "image": "/images/Primax/912 White Carrara.webp"
      },
      {
        "name": "913 Golden Sunset",
        "image": "/images/Primax/913 Golden Sunset.webp"
      },
      {
        "name": "915 Dark Mist",
        "image": "/images/Primax/915 Dark Mist.webp"
      },
      {
        "name": "916 Emperador",
        "image": "/images/Primax/916 Emperador.webp"
      },
      {
        "name": "920 White Marble",
        "image": "/images/Primax/920 White Marble.webp"
      },
      {
        "name": "931 Sunny Carrara",
        "image": "/images/Primax/931 Sunny Carrara.webp"
      },
      {
        "name": "942 Ivory Grey",
        "image": "/images/Primax/942 Ivory Grey.webp"
      },
      {
        "name": "961 Ice Storm",
        "image": "/images/Primax/961 Ice Storm.webp"
      },
      {
        "name": "971 Ice Grey Mat",
        "image": "/images/Primax/971-ice-grey-mat.webp"
      }
    ]
  },
  {
    "slug": "quantra",
    "name": "Quantra Quartz",
    "logo": "/images/Brands_icon/Quantra_Quartz.png",
    "decors": [
      {
        "name": "1673 New Carrara",
        "image": "/images/Quantra_Quartz/1673 New Carrara.webp"
      },
      {
        "name": "2048 Snow White",
        "image": "/images/Quantra_Quartz/2048 Snow White.webp"
      },
      {
        "name": "2430 Artisan Wool",
        "image": "/images/Quantra_Quartz/2430 Artisan Wool.webp"
      },
      {
        "name": "2442 Semolina",
        "image": "/images/Quantra_Quartz/2442 Semolina.webp"
      },
      {
        "name": "2455 Ancient Beige",
        "image": "/images/Quantra_Quartz/2455 Ancient Beige.webp"
      },
      {
        "name": "2456 Brown Leaf",
        "image": "/images/Quantra_Quartz/2456 Brown Leaf.webp"
      },
      {
        "name": "6589 Classic Ivory",
        "image": "/images/Quantra_Quartz/6589 Classic Ivory.webp"
      },
      {
        "name": "7111 Agnolo Matt",
        "image": "/images/Quantra_Quartz/7111 Agnolo Matt.webp"
      },
      {
        "name": "7172 Arctic Breeze",
        "image": "/images/Quantra_Quartz/7172 Arctic Breeze.webp"
      },
      {
        "name": "7447 Bianco Venatino",
        "image": "/images/Quantra_Quartz/7447 Bianco Venatino.webp"
      },
      {
        "name": "7448 Bellini Matt",
        "image": "/images/Quantra_Quartz/7448 Bellini Matt.webp"
      },
      {
        "name": "7500 Masaccio",
        "image": "/images/Quantra_Quartz/7500 Masaccio.webp"
      },
      {
        "name": "7511 Botticelli",
        "image": "/images/Quantra_Quartz/7511 Botticelli.webp"
      },
      {
        "name": "7522 Raphael",
        "image": "/images/Quantra_Quartz/7522 Raphael.webp"
      },
      {
        "name": "7700 Antonio",
        "image": "/images/Quantra_Quartz/7700 Antonio.webp"
      },
      {
        "name": "7982 Rogier",
        "image": "/images/Quantra_Quartz/7982 Rogier.webp"
      },
      {
        "name": "8058 Hermes Grey Matt",
        "image": "/images/Quantra_Quartz/8058 Hermes Grey Matt.webp"
      },
      {
        "name": "9010 Calacatta Luca",
        "image": "/images/Quantra_Quartz/9010 Calacatta Luca.webp"
      },
      {
        "name": "9333 Calacatta Oro",
        "image": "/images/Quantra_Quartz/9333 Calacatta Oro.webp"
      },
      {
        "name": "9334 Calacatta Capri",
        "image": "/images/Quantra_Quartz/9334 Calacatta Capri.webp"
      },
      {
        "name": "9444 Calacatta Borghini",
        "image": "/images/Quantra_Quartz/9444 Calacatta Borghini.webp"
      },
      {
        "name": "9510 Cygnus Divine",
        "image": "/images/Quantra_Quartz/9510 Cygnus Divine.webp"
      },
      {
        "name": "9953 Sevilia",
        "image": "/images/Quantra_Quartz/9953 Sevilia.webp"
      },
      {
        "name": "9960 Pantheon",
        "image": "/images/Quantra_Quartz/9960 Pantheon.webp"
      },
      {
        "name": "9962 La Dolce Vita",
        "image": "/images/Quantra_Quartz/9962 La Dolce Vita.webp"
      },
      {
        "name": "9965 Golden Gate",
        "image": "/images/Quantra_Quartz/9965 Golden Gate.webp"
      },
      {
        "name": "9972 San Marco",
        "image": "/images/Quantra_Quartz/9972 San Marco.webp"
      },
      {
        "name": "9976 Pirouette",
        "image": "/images/Quantra_Quartz/9976 Pirouette.webp"
      },
      {
        "name": "9986 Fontainebleau",
        "image": "/images/Quantra_Quartz/9986 Fontainebleau.webp"
      },
      {
        "name": "9987 Champs-Elysees",
        "image": "/images/Quantra_Quartz/9987 Champs-Elysees.webp"
      },
      {
        "name": "9996 Leonardo",
        "image": "/images/Quantra_Quartz/9996 Leonardo.webp"
      }
    ]
  },
  {
    "slug": "radianz",
    "name": "Radianz",
    "logo": "/images/Brands_icon/Radianz_Quartz.png",
    "decors": [
      {
        "name": "AC711 Acacia",
        "image": "/images/Radianz_Quartz/AC711 Acacia.webp"
      },
      {
        "name": "AD151 Alinda",
        "image": "/images/Radianz_Quartz/AD151 Alinda.webp"
      },
      {
        "name": "AF953 Ashford Fog",
        "image": "/images/Radianz_Quartz/AF953 Ashford Fog.webp"
      },
      {
        "name": "AL450 Alluring",
        "image": "/images/Radianz_Quartz/AL450 Alluring.webp"
      },
      {
        "name": "AM174 Amalfi",
        "image": "/images/Radianz_Quartz/AM174 Amalfi.webp"
      },
      {
        "name": "AS955 Aster",
        "image": "/images/Radianz_Quartz/AS955 Aster.webp"
      },
      {
        "name": "AW130 Aleutian White",
        "image": "/images/Radianz_Quartz/AW130 Aleutian White.webp"
      },
      {
        "name": "AZ752 Aizano",
        "image": "/images/Radianz_Quartz/AZ752 Aizano.webp"
      },
      {
        "name": "BL260 Boletus",
        "image": "/images/Radianz_Quartz/BL260 Boletus.webp"
      },
      {
        "name": "BN178 Belluno",
        "image": "/images/Radianz_Quartz/BN178 Belluno.webp"
      },
      {
        "name": "CG910 Columbia Gray",
        "image": "/images/Radianz_Quartz/CG910 Columbia Gray.webp"
      },
      {
        "name": "CH949 Charocal",
        "image": "/images/Radianz_Quartz/CH949 Charocal.webp"
      },
      {
        "name": "CO811 Contrail",
        "image": "/images/Radianz_Quartz/CO811 Contrail.webp"
      },
      {
        "name": "CO925 Ceres",
        "image": "/images/Radianz_Quartz/CO925 Ceres.webp"
      },
      {
        "name": "CR157 Carola",
        "image": "/images/Radianz_Quartz/CR157 Carola.webp"
      },
      {
        "name": "CV110 Calacatta Venatino",
        "image": "/images/Radianz_Quartz/CV110 Calacatta Venatino.webp"
      },
      {
        "name": "CV130 Calacatta Veneto",
        "image": "/images/Radianz_Quartz/CV130 Calacatta Veneto.webp"
      },
      {
        "name": "CV152 Calacatta Valencia",
        "image": "/images/Radianz_Quartz/CV152 Calacatta Valencia.webp"
      },
      {
        "name": "CV199 Calacatta Victory",
        "image": "/images/Radianz_Quartz/CV199 Calacatta Victory.webp"
      },
      {
        "name": "DC155 Denali Cloud",
        "image": "/images/Radianz_Quartz/DC155 Denali Cloud.webp"
      },
      {
        "name": "DW105 Diamond White",
        "image": "/images/Radianz_Quartz/DW105 Diamond White.webp"
      },
      {
        "name": "EW120 Everest White",
        "image": "/images/Radianz_Quartz/EW120 Everest White.webp"
      },
      {
        "name": "GG900 Gentle Gray",
        "image": "/images/Radianz_Quartz/GG900 Gentle Gray.webp"
      },
      {
        "name": "GG950 Gold Canyon Gray",
        "image": "/images/Radianz_Quartz/GG950 Gold Canyon Gray.webp"
      },
      {
        "name": "GN290 Granada",
        "image": "/images/Radianz_Quartz/GN290 Granada.webp"
      },
      {
        "name": "IB989 Impala Black",
        "image": "/images/Radianz_Quartz/IB989 Impala Black.webp"
      },
      {
        "name": "IG910 Imperial Gray",
        "image": "/images/Radianz_Quartz/IG910 Imperial Gray.webp"
      },
      {
        "name": "JU155 Juniper",
        "image": "/images/Radianz_Quartz/JU155 Juniper.webp"
      },
      {
        "name": "KI992 Kunlun Ink",
        "image": "/images/Radianz_Quartz/KI992 Kunlun Ink.webp"
      },
      {
        "name": "KR217 Kiani Cream",
        "image": "/images/Radianz_Quartz/KR217 Kiani Cream.webp"
      },
      {
        "name": "LL195 Lucern Lake",
        "image": "/images/Radianz_Quartz/LL195 Lucern Lake.webp"
      },
      {
        "name": "LL712 La Luna",
        "image": "/images/Radianz_Quartz/LL712 La Luna.webp"
      },
      {
        "name": "MG780 Metropol Grey",
        "image": "/images/Radianz_Quartz/MG780 Metropol Grey.webp"
      },
      {
        "name": "MI150 Minta",
        "image": "/images/Radianz_Quartz/MI150 Minta.webp"
      },
      {
        "name": "MI780 Mirama Bronze",
        "image": "/images/Radianz_Quartz/MI780 Mirama Bronze.webp"
      },
      {
        "name": "ML950 Marquina Lavagna",
        "image": "/images/Radianz_Quartz/ML950 Marquina Lavagna.webp"
      },
      {
        "name": "MM211 Mocca Mousse",
        "image": "/images/Radianz_Quartz/MM211 Mocca Mousse.webp"
      },
      {
        "name": "MS141 Mont Blanc Snow",
        "image": "/images/Radianz_Quartz/MS141 Mont Blanc Snow.webp"
      },
      {
        "name": "MU410 Mariposa Buff",
        "image": "/images/Radianz_Quartz/MU410 Mariposa Buff.webp"
      },
      {
        "name": "NB278 Napoli Beige",
        "image": "/images/Radianz_Quartz/NB278 Napoli Beige.webp"
      },
      {
        "name": "NW124 Nantucket Whale",
        "image": "/images/Radianz_Quartz/NW124 Nantucket Whale.webp"
      },
      {
        "name": "PG722 Pergamon",
        "image": "/images/Radianz_Quartz/PG722 Pergamon.webp"
      },
      {
        "name": "PL187 Perla",
        "image": "/images/Radianz_Quartz/PL187 Perla.webp"
      },
      {
        "name": "PL722 Pluto",
        "image": "/images/Radianz_Quartz/PL722 Pluto.webp"
      },
      {
        "name": "PR710 Parma",
        "image": "/images/Radianz_Quartz/PR710 Parma.webp"
      },
      {
        "name": "RI177 Rio",
        "image": "/images/Radianz_Quartz/RI177 Rio.webp"
      },
      {
        "name": "SE155 Sequoia",
        "image": "/images/Radianz_Quartz/SE155 Sequoia.webp"
      },
      {
        "name": "SH145 St.Helens White",
        "image": "/images/Radianz_Quartz/SH145 St.Helens White.webp"
      },
      {
        "name": "SP850 Splendor",
        "image": "/images/Radianz_Quartz/SP850 Splendor.webp"
      },
      {
        "name": "UG950 Ural Gray",
        "image": "/images/Radianz_Quartz/UG950 Ural Gray.webp"
      },
      {
        "name": "VE150 Vega",
        "image": "/images/Radianz_Quartz/VE150 Vega.webp"
      },
      {
        "name": "VV254 Verona Verde",
        "image": "/images/Radianz_Quartz/VV254 Verona Verde.webp"
      },
      {
        "name": "WA389 Wilshire Amber",
        "image": "/images/Radianz_Quartz/WA389 Wilshire Amber.webp"
      }
    ]
  },
  {
    "slug": "smart",
    "name": "Smart Quartz",
    "logo": "/images/Brands_icon/Smart_Quartz.png",
    "decors": [
      {
        "name": "Antracite",
        "image": "/images/Smart_Quartz/Antracite.webp"
      },
      {
        "name": "Bianco Lasa",
        "image": "/images/Smart_Quartz/Bianco Lasa.webp"
      },
      {
        "name": "Bianco Venatino",
        "image": "/images/Smart_Quartz/Bianco Venatino.webp"
      },
      {
        "name": "Black Jasper Matovyy",
        "image": "/images/Smart_Quartz/black-jasper-matovyy.webp"
      },
      {
        "name": "Calacatta Moon",
        "image": "/images/Smart_Quartz/Calacatta Moon.webp"
      },
      {
        "name": "Calacatta Sun",
        "image": "/images/Smart_Quartz/Calacatta Sun.webp"
      },
      {
        "name": "Calacatta Tree",
        "image": "/images/Smart_Quartz/Calacatta Tree.webp"
      },
      {
        "name": "Coffee Brown Matovyy",
        "image": "/images/Smart_Quartz/coffee-brown-matovyy.webp"
      },
      {
        "name": "Coral Matovyy",
        "image": "/images/Smart_Quartz/coral-matovyy.webp"
      },
      {
        "name": "Crema Marfil Matovyy",
        "image": "/images/Smart_Quartz/crema-marfil-matovyy.webp"
      },
      {
        "name": "Giallo",
        "image": "/images/Smart_Quartz/Giallo.webp"
      },
      {
        "name": "Gold Arabescato",
        "image": "/images/Smart_Quartz/Gold Arabescato.webp"
      },
      {
        "name": "Illusion",
        "image": "/images/Smart_Quartz/Illusion.webp"
      },
      {
        "name": "Jasmine",
        "image": "/images/Smart_Quartz/Jasmine.webp"
      },
      {
        "name": "Linen",
        "image": "/images/Smart_Quartz/Linen.webp"
      },
      {
        "name": "Marquina",
        "image": "/images/Smart_Quartz/Marquina.webp"
      },
      {
        "name": "Moon Grey Matovyy",
        "image": "/images/Smart_Quartz/moon-grey-matovyy.webp"
      },
      {
        "name": "Moon White Matovyy",
        "image": "/images/Smart_Quartz/moon-white-matovyy.webp"
      },
      {
        "name": "Munsell",
        "image": "/images/Smart_Quartz/Munsell.webp"
      },
      {
        "name": "Negro Imperial",
        "image": "/images/Smart_Quartz/Negro Imperial.webp"
      },
      {
        "name": "Patagonia",
        "image": "/images/Smart_Quartz/Patagonia.webp"
      },
      {
        "name": "Rockland Matovyy",
        "image": "/images/Smart_Quartz/rockland-matovyy.webp"
      },
      {
        "name": "Russet",
        "image": "/images/Smart_Quartz/Russet.webp"
      },
      {
        "name": "Silver Night",
        "image": "/images/Smart_Quartz/Silver Night.webp"
      },
      {
        "name": "Slate Matovyy",
        "image": "/images/Smart_Quartz/slate-matovyy.webp"
      },
      {
        "name": "Statuario Gold",
        "image": "/images/Smart_Quartz/Statuario Gold.webp"
      },
      {
        "name": "Sunshine",
        "image": "/images/Smart_Quartz/Sunshine.webp"
      },
      {
        "name": "Super White",
        "image": "/images/Smart_Quartz/Super White.webp"
      },
      {
        "name": "Taj Mahal Matovyy",
        "image": "/images/Smart_Quartz/taj-mahal-matovyy.webp"
      },
      {
        "name": "Titanium",
        "image": "/images/Smart_Quartz/Titanium.webp"
      },
      {
        "name": "White Marble",
        "image": "/images/Smart_Quartz/White Marble.webp"
      },
      {
        "name": "White Sand",
        "image": "/images/Smart_Quartz/White Sand.webp"
      }
    ]
  },
  {
    "slug": "still-stone",
    "name": "Still Stone",
    "logo": null,
    "decors": [
      {
        "name": "G002 White Crystal",
        "image": "/images/Still_Stone/G002 White Crystal.webp"
      },
      {
        "name": "G2807 Black Crystal",
        "image": "/images/Still_Stone/G2807 Black Crystal.webp"
      },
      {
        "name": "GT1990 Calacatta Minore",
        "image": "/images/Still_Stone/GT1990 Calacatta Minore.webp"
      },
      {
        "name": "GT6010 Ural White",
        "image": "/images/Still_Stone/GT6010 Ural White.webp"
      },
      {
        "name": "GT7040 Calacatta Voski",
        "image": "/images/Still_Stone/GT7040 Calacatta Voski.webp"
      },
      {
        "name": "GT8077 Grapfite Vein",
        "image": "/images/Still_Stone/GT8077 Grapfite Vein.webp"
      },
      {
        "name": "GT8080 Morning Sky",
        "image": "/images/Still_Stone/GT8080 Morning Sky.webp"
      },
      {
        "name": "GT8155 Namibia White",
        "image": "/images/Still_Stone/GT8155 Namibia White.webp"
      },
      {
        "name": "GT8157 Carrara Extra",
        "image": "/images/Still_Stone/GT8157 Carrara Extra.webp"
      },
      {
        "name": "GT8183 Kalahari Sand",
        "image": "/images/Still_Stone/GT8183 Kalahari Sand.webp"
      },
      {
        "name": "GT8627 Rhodesia Black",
        "image": "/images/Still_Stone/GT8627 Rhodesia Black.webp"
      },
      {
        "name": "GT9001 Milk&Honey",
        "image": "/images/Still_Stone/GT9001 Milk&Honey.webp"
      },
      {
        "name": "GT9007 Chocolate Brownie",
        "image": "/images/Still_Stone/GT9007 Chocolate Brownie.webp"
      },
      {
        "name": "GT9170 Santorini Rock",
        "image": "/images/Still_Stone/GT9170 Santorini Rock.webp"
      },
      {
        "name": "GT9650 Arctica",
        "image": "/images/Still_Stone/GT9650 Arctica.webp"
      },
      {
        "name": "GT9680 Sahara Gold",
        "image": "/images/Still_Stone/GT9680 Sahara Gold.webp"
      },
      {
        "name": "GT9690 Arabescato",
        "image": "/images/Still_Stone/GT9690 Arabescato.webp"
      },
      {
        "name": "GT9750 Statuario",
        "image": "/images/Still_Stone/GT9750 Statuario.webp"
      },
      {
        "name": "GT9830 Marquina Teide",
        "image": "/images/Still_Stone/GT9830 Marquina Teide.webp"
      },
      {
        "name": "GT9980 Calacatta Maggiore",
        "image": "/images/Still_Stone/GT9980 Calacatta Maggiore.webp"
      },
      {
        "name": "GTA023 Ice Crystal",
        "image": "/images/Still_Stone/GTA023 Ice Crystal.webp"
      },
      {
        "name": "GTA026 Milky White",
        "image": "/images/Still_Stone/GTA026 Milky White.webp"
      },
      {
        "name": "GTA1006 Cream Quartz",
        "image": "/images/Still_Stone/GTA1006 Cream Quartz.webp"
      }
    ]
  },
  {
    "slug": "technistone",
    "name": "Technistone",
    "logo": "/images/Brands_icon/TechniStone.png",
    "decors": [
      {
        "name": "Brilliant Arabesco",
        "image": "/images/Technistone/Brilliant Arabesco.webp"
      },
      {
        "name": "Crystal Absolute White",
        "image": "/images/Technistone/Crystal Absolute White.webp"
      },
      {
        "name": "Crystal Polar White",
        "image": "/images/Technistone/Crystal Polar White.webp"
      },
      {
        "name": "Crystal Royal",
        "image": "/images/Technistone/Crystal Royal.webp"
      },
      {
        "name": "Gobi Black",
        "image": "/images/Technistone/Gobi Black.webp"
      },
      {
        "name": "Gobi Grey",
        "image": "/images/Technistone/Gobi Grey.webp"
      },
      {
        "name": "Morning Daisy Mat",
        "image": "/images/Technistone/morning-daisy-mat.webp"
      },
      {
        "name": "Noble Arco",
        "image": "/images/Technistone/Noble Arco.webp"
      },
      {
        "name": "Noble Areti Bianco",
        "image": "/images/Technistone/Noble Areti Bianco.webp"
      },
      {
        "name": "Noble Athos Brown",
        "image": "/images/Technistone/Noble Athos Brown.webp"
      },
      {
        "name": "Noble Botticino",
        "image": "/images/Technistone/Noble Botticino.webp"
      },
      {
        "name": "Noble Carrara",
        "image": "/images/Technistone/Noble Carrara.webp"
      },
      {
        "name": "Noble Concrete Grey",
        "image": "/images/Technistone/Noble Concrete Grey.webp"
      },
      {
        "name": "Noble Imperial Grey",
        "image": "/images/Technistone/Noble Imperial Grey.webp"
      },
      {
        "name": "Noble Ivory White",
        "image": "/images/Technistone/Noble Ivory White.webp"
      },
      {
        "name": "Noble Linea",
        "image": "/images/Technistone/Noble Linea.webp"
      },
      {
        "name": "Noble Olympos Mist",
        "image": "/images/Technistone/Noble Olympos Mist.webp"
      },
      {
        "name": "Noble Pietra Grey",
        "image": "/images/Technistone/Noble Pietra Grey.webp"
      },
      {
        "name": "Noble Portland Grey",
        "image": "/images/Technistone/Noble Portland Grey.webp"
      },
      {
        "name": "Noble Pro Cloud",
        "image": "/images/Technistone/Noble Pro Cloud.webp"
      },
      {
        "name": "Noble Pro Frost",
        "image": "/images/Technistone/Noble Pro Frost.webp"
      },
      {
        "name": "Noble Pro Storm",
        "image": "/images/Technistone/Noble Pro Storm.webp"
      },
      {
        "name": "Noble Quartzite",
        "image": "/images/Technistone/Noble Quartzite.webp"
      },
      {
        "name": "Noble Supreme White",
        "image": "/images/Technistone/Noble Supreme White.webp"
      },
      {
        "name": "Noble Troya",
        "image": "/images/Technistone/Noble Troya.webp"
      },
      {
        "name": "Noble Vintage",
        "image": "/images/Technistone/Noble Vintage.webp"
      },
      {
        "name": "Noble Arco Mat",
        "image": "/images/Technistone/noble-arco-mat.webp"
      },
      {
        "name": "Noble Concrete Grey Mat",
        "image": "/images/Technistone/noble-concrete-grey-mat.webp"
      },
      {
        "name": "Noble Portland Grey Mat",
        "image": "/images/Technistone/noble-portland-grey-mat.webp"
      },
      {
        "name": "Noble Quartzite Mat",
        "image": "/images/Technistone/noble-quartzite-mat.webp"
      },
      {
        "name": "Noble Vintage Mat",
        "image": "/images/Technistone/noble-vintage-mat.webp"
      },
      {
        "name": "Pearl Delta",
        "image": "/images/Technistone/Pearl Delta.webp"
      },
      {
        "name": "Taurus Black",
        "image": "/images/Technistone/Taurus Black.webp"
      },
      {
        "name": "Taurus Terazzo Dark",
        "image": "/images/Technistone/Taurus Terazzo Dark.webp"
      },
      {
        "name": "Taurus Terazzo Grey",
        "image": "/images/Technistone/Taurus Terazzo Grey.webp"
      },
      {
        "name": "Taurus Terazzo White",
        "image": "/images/Technistone/Taurus Terazzo White.webp"
      },
      {
        "name": "Taurus Terazzo Dark Mat",
        "image": "/images/Technistone/taurus-terazzo-dark-mat.webp"
      },
      {
        "name": "Wedding Lily Mat",
        "image": "/images/Technistone/wedding-lily-mat.webp"
      },
      {
        "name": "Wild Yucca",
        "image": "/images/Technistone/Wild Yucca.webp"
      }
    ]
  },
  {
    "slug": "vicostone",
    "name": "Vicostone",
    "logo": "/images/Brands_icon/Vicostone.png",
    "decors": [
      {
        "name": "BQ 100 Quasar Light",
        "image": "/images/Vicostone/BQ 100 Quasar Light.webp"
      },
      {
        "name": "BQ 200 Artic Snow",
        "image": "/images/Vicostone/BQ 200 Artic Snow.webp"
      },
      {
        "name": "BQ 2101 Pure Black",
        "image": "/images/Vicostone/BQ 2101 Pure Black.webp"
      },
      {
        "name": "BQ 2600 Valley White",
        "image": "/images/Vicostone/BQ 2600 Valley White.webp"
      },
      {
        "name": "BQ 2607 Serizzo Monterosa",
        "image": "/images/Vicostone/BQ 2607 Serizzo Monterosa.webp"
      },
      {
        "name": "BQ 6700 Covelani",
        "image": "/images/Vicostone/BQ 6700 Covelani.webp"
      },
      {
        "name": "BQ 6701 Camarina",
        "image": "/images/Vicostone/BQ 6701 Camarina.webp"
      },
      {
        "name": "BQ 6702 Costa Nova",
        "image": "/images/Vicostone/BQ 6702 Costa Nova.webp"
      },
      {
        "name": "BQ 7702 Moonglade",
        "image": "/images/Vicostone/BQ 7702 Moonglade.webp"
      },
      {
        "name": "BQ 8220 Carrara",
        "image": "/images/Vicostone/BQ 8220 Carrara.webp"
      },
      {
        "name": "BQ 8402 Delta",
        "image": "/images/Vicostone/BQ 8402 Delta.webp"
      },
      {
        "name": "BQ 8430 Botticino Classic",
        "image": "/images/Vicostone/BQ 8430 Botticino Classic.webp"
      },
      {
        "name": "BQ 8440 Bianco Venato",
        "image": "/images/Vicostone/BQ 8440 Bianco Venato.webp"
      },
      {
        "name": "BQ 8560 Dark Emperador",
        "image": "/images/Vicostone/BQ 8560 Dark Emperador.webp"
      },
      {
        "name": "BQ 8583 Akoya",
        "image": "/images/Vicostone/BQ 8583 Akoya.webp"
      },
      {
        "name": "BQ 8590 Dolce Vita",
        "image": "/images/Vicostone/BQ 8590 Dolce Vita.webp"
      },
      {
        "name": "BQ 8614 Altissimo",
        "image": "/images/Vicostone/BQ 8614 Altissimo.webp"
      },
      {
        "name": "BQ 8628 Statuario",
        "image": "/images/Vicostone/BQ 8628 Statuario.webp"
      },
      {
        "name": "BQ 8660 Venatino",
        "image": "/images/Vicostone/BQ 8660 Venatino.webp"
      },
      {
        "name": "BQ 8668 Ice Lake",
        "image": "/images/Vicostone/BQ 8668 Ice Lake.webp"
      },
      {
        "name": "BQ 8738 Greylac",
        "image": "/images/Vicostone/BQ 8738 Greylac.webp"
      },
      {
        "name": "BQ 8740 Nero Marquina",
        "image": "/images/Vicostone/BQ 8740 Nero Marquina.webp"
      },
      {
        "name": "BQ 8780 Argento",
        "image": "/images/Vicostone/BQ 8780 Argento.webp"
      },
      {
        "name": "BQ 8786 Thunder Blue",
        "image": "/images/Vicostone/BQ 8786 Thunder Blue.webp"
      },
      {
        "name": "BQ 8788 Diamante",
        "image": "/images/Vicostone/BQ 8788 Diamante.webp"
      },
      {
        "name": "BQ 8800 Bettoglio",
        "image": "/images/Vicostone/BQ 8800 Bettoglio.webp"
      },
      {
        "name": "BQ 8812 Java Noir",
        "image": "/images/Vicostone/BQ 8812 Java Noir.webp"
      },
      {
        "name": "BQ 8815 Misterio",
        "image": "/images/Vicostone/BQ 8815 Misterio.webp"
      },
      {
        "name": "BQ 8820 Misterio Gold",
        "image": "/images/Vicostone/BQ 8820 Misterio Gold.webp"
      },
      {
        "name": "BQ 8881 Gan Eden",
        "image": "/images/Vicostone/BQ 8881 Gan Eden.webp"
      },
      {
        "name": "BQ 8887 Amadeus",
        "image": "/images/Vicostone/BQ 8887 Amadeus.webp"
      },
      {
        "name": "BQ 8918 Vivalioro",
        "image": "/images/Vicostone/BQ 8918 Vivalioro.webp"
      },
      {
        "name": "BQ 8920 Forza",
        "image": "/images/Vicostone/BQ 8920 Forza.webp"
      },
      {
        "name": "BQ 9310 Silver Sea",
        "image": "/images/Vicostone/BQ 9310 Silver Sea.webp"
      },
      {
        "name": "BQ 9453 Taj Mahal",
        "image": "/images/Vicostone/BQ 9453 Taj Mahal.webp"
      },
      {
        "name": "BQ 9470 Azul Aran",
        "image": "/images/Vicostone/BQ 9470 Azul Aran.webp"
      },
      {
        "name": "BQ 9700 Sahara Noir",
        "image": "/images/Vicostone/BQ 9700 Sahara Noir.webp"
      },
      {
        "name": "Bq 2605 Denali Mat",
        "image": "/images/Vicostone/bq-2605-denali-mat.webp"
      },
      {
        "name": "Bq 3603 Galilea Mat",
        "image": "/images/Vicostone/bq-3603-galilea-mat.webp"
      },
      {
        "name": "Bq 5260 Beton 5mm Mat",
        "image": "/images/Vicostone/bq-5260-beton-5mm-mat.webp"
      },
      {
        "name": "Bq 5261 Materica 5mm Mat",
        "image": "/images/Vicostone/bq-5261-materica-5mm-mat.webp"
      },
      {
        "name": "Bq 5290 Nube 5mm Mat",
        "image": "/images/Vicostone/bq-5290-nube-5mm-mat.webp"
      },
      {
        "name": "Bq 5291 Rusty 5mm Mat",
        "image": "/images/Vicostone/bq-5291-rusty-5mm-mat.webp"
      },
      {
        "name": "Bq 5860 Corazon 5mm Mat",
        "image": "/images/Vicostone/bq-5860-corazon-5mm-mat.webp"
      },
      {
        "name": "Bq 5862 Oceanid 5mm Mat",
        "image": "/images/Vicostone/bq-5862-oceanid-5mm-mat.webp"
      },
      {
        "name": "Bq 6800 Grey Monet Mat",
        "image": "/images/Vicostone/bq-6800-grey-monet-mat.webp"
      },
      {
        "name": "Bq 8730 Cemento Mat",
        "image": "/images/Vicostone/bq-8730-cemento-mat.webp"
      },
      {
        "name": "Bq 8860 Concreto Mat",
        "image": "/images/Vicostone/bq-8860-concreto-mat.webp"
      },
      {
        "name": "Bq 8863 Tartufo Mat",
        "image": "/images/Vicostone/bq-8863-tartufo-mat.webp"
      },
      {
        "name": "Bq 8864 Naxos Mat",
        "image": "/images/Vicostone/bq-8864-naxos-mat.webp"
      },
      {
        "name": "Bq 8870 Olympus White Mat",
        "image": "/images/Vicostone/bq-8870-olympus-white-mat.webp"
      },
      {
        "name": "Bq 8891 Madreperola Mat",
        "image": "/images/Vicostone/bq-8891-madreperola-mat.webp"
      },
      {
        "name": "Bq 8926 Calacatta Caldia Mat",
        "image": "/images/Vicostone/bq-8926-calacatta-caldia-mat.webp"
      },
      {
        "name": "BS 124 Satined",
        "image": "/images/Vicostone/BS 124 Satined.webp"
      }
    ]
  }
];
