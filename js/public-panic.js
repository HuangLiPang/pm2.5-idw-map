(function(window) {
  let dictionary = {
    '0': {
      "zh-TW": "請注意",
      "en-US": "Note"
    },
    '1': {
      'zh-TW': '微型感測器與標準測站的感測值，因為兩者感測原理不同，感測數值自然不相同，迄今仍無良好的系統校正方式，因此兩者的數值不宜直接進行比較。',
      'en-US': 'The data presented here are collected using low-cost PM2.5 sensors, which may result in different results to professional instruments. The calibration model between low-cost sensors and professional instruments is still an open challenge to the research field, and we will apply such calibration models to the dataset once it becomes available.'
    },
    '2': {
      'zh-TW': '根據目前已知的研究報告，微型感測器的感測數值在精確度上具有極高的一致性，且與標準測站的感測值亦有相同的趨勢表現，但在準確度方面，兩者間的誤差會隨著環境因素變化而產生極大的差異。',
      'en-US': 'It has been verified that the intra-model variability (IMV) of the low-cost sensors used in the data collection is below 5%, which is acceptable for data comparison and analysis works. Moreover, it has been shown that the low-cost sensors used in the data collection follows the same trend of professional instruments very well in many studies.'
    },
    '3': {
      'zh-TW': '本系統目前只負責資料之彙整與呈現，使用本系統所提供之各項資訊時，需謹守「趨勢比對」、「相對判斷」的原則，切勿過度解讀闡釋，以免產生其他爭議，有關空氣品質相關資訊，一切仍應以官方數據為準。',
      'en-US': 'The data presented here is intended for data collection and visualization only. When using the dataset for any research, analysis, and other purposes, please do not over-claim its applications. For more accurate air quality information, please refer to official data sources of the corresponding areas.'
    },
    '4': {
      'zh-TW': '微型感測器的使用，詳情請參考<a href="https://docs.google.com/document/d/e/2PACX-1vRvbXtk6I8xJ3fb-Ompr_ai9D-cSIe1-CFoZUamytrrPJbyDPDsjAGZF11ky-c8HlPjNIqAOQTJZDem/pub">FAQ</a>',
      'en-US': 'For more detailed information about low-cost sensors, please refer to this <a href="https://docs.google.com/document/d/e/2PACX-1vRvbXtk6I8xJ3fb-Ompr_ai9D-cSIe1-CFoZUamytrrPJbyDPDsjAGZF11ky-c8HlPjNIqAOQTJZDem/pub">FAQ</a>.'
    }
  };
  let currentLanguage = navigator.language;
  // remove warning
  $("a.close").click(function() {
    $("div.overlay").remove();
  })
  translate();

  function translate() {
    $("[data-list]").each(function() {
      // find element with data-xxx attribute
      var key = $(this).data('list');
      $(this).html(dictionary[key][currentLanguage] || dictionary[key]["en-US"]);
    });
  }
})(this)