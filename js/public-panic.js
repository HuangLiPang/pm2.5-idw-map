(function(window) {
  let dictionary = {
    '0': {
      "zh-TW": "請注意！",
      "en": "Warning!"
    },
    '1': {
      'zh-TW': '微型感測器與標準測站的感測值，因為兩者感測原理不同，感測數值自然不相同，迄今仍無良好的系統校正方式，因此兩者的數值不宜直接進行比較。',
      'en': 'Since the sensing principle is different, the sensing values ​​are naturally different between the miniature sensor and the standard station. So far, there is still no proper method for correction, so the values ​​of the miniature sensor and the standard station should not be directly compared.'
    },
    '2': {
      'zh-TW': '根據目前已知的研究報告，微型感測器的感測數值在精確度上具有極高的一致性，且與標準測站的感測值亦有相同的趨勢表現，但在準確度方面，兩者間的誤差會隨著環境因素變化而產生極大的差異。',
      'en': 'According to the research report currently known, the sensing values of the miniature sensors have extremely high consistency. The sensing values of the miniature sensors also have the same trend as the standard station. However, the error rate between the two will vary greatly with environmental factors.'
    },
    '3': {
      'zh-TW': '本系統目前只負責資料之彙整與呈現，使用本系統所提供之各項資訊時，需謹守「趨勢比對」、「相對判斷」的原則，切勿過度解讀闡釋，以免產生其他爭議，有關空氣品質相關資訊，一切仍應以官方數據為準。',
      'en': 'The system is only responsible for data collection and data presentation. While using the information provided by the system, we must adhere to the principle of "trend comparison" and "relative judgment". Do not overact about the information in order to avoid disputes. Air quality information should be based on official data.'
    },
    '4': {
      'zh-TW': '微型感測器的使用，詳情請參考<a href="https://docs.google.com/document/d/e/2PACX-1vRvbXtk6I8xJ3fb-Ompr_ai9D-cSIe1-CFoZUamytrrPJbyDPDsjAGZF11ky-c8HlPjNIqAOQTJZDem/pub">FAQ</a>',
      'en': 'Please reference the miniature sensor instruction in <a href="https://docs.google.com/document/d/e/2PACX-1vRvbXtk6I8xJ3fb-Ompr_ai9D-cSIe1-CFoZUamytrrPJbyDPDsjAGZF11ky-c8HlPjNIqAOQTJZDem/pub">FAQ</a>.'
    }
  };
  let currentLanguage = navigator.language || navigator.userLanguage;
  // add event handler to <select>
  $("select").change(changeLang);
  // remove warning
  $("a.close").click(function() {
    $("div.overlay").remove();
  })
  translate();

  function changeLang() {
    currentLanguage = $("select").val();
    translate();
  };

  function translate() {
    $("[data-list]").each(function() {
      // find element with data-xxx attribute
      var key = $(this).data('list');
      $(this).html(dictionary[key][currentLanguage] || "en");
    });
  }
})(this)