/*! daily.js — © 2026 모로젝트. All rights reserved.
 * 해석 문안과 이 파일의 구성은 모로젝트의 저작물입니다. 무단 복제·재배포를 금합니다.
 * 포함된 제3자 구성요소는 각자의 라이선스를 따릅니다 — vendor/ 및 NOTICE 참조.
 */
(function (global) {
  'use strict';

  var SAENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };

  var GEUK = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };

  
  function relation(from, to) {
    if (!from || !to) return null;
    if (from === to) return 'same';
    if (SAENG[from] === to) return 'helps';
    if (SAENG[to] === from) return 'drains';
    if (GEUK[from] === to) return 'attacks';
    if (GEUK[to] === from) return 'blocked';
    return null;
  }

  function stemOhaeng(stem) {
    var t = global.SajuDoctor && global.SajuDoctor.constants.STEM_OHAENG[stem];
    return t && t.ohaeng;
  }

  
  function dayGanZhi(date) {
    var lunar = global.Solar.fromYmd(
      date.getFullYear(), date.getMonth() + 1, date.getDate()).getLunar();
    return lunar.getDayInGanZhi();
  }

  
  function forDay(date, chart) {
    var ganZhi = dayGanZhi(date);
    var stem = ganZhi.charAt(0);
    var dayOhaeng = stemOhaeng(stem);
    var yongshin = chart.result.yongshin && chart.result.yongshin.ohaeng;
    var ilganOhaeng = chart.result.ilgan && chart.result.ilgan.ohaeng;

    var toYongshin = relation(dayOhaeng, yongshin);
    var toIlgan = relation(dayOhaeng, ilganOhaeng);

    var score;
    if (toYongshin === 'same' || toYongshin === 'helps') score = 'good';
    else if (toYongshin === 'attacks') score = 'caution';
    else score = 'flat';

    return {
      date: date,
      ganZhi: ganZhi,
      stem: stem,
      dayOhaeng: dayOhaeng,
      yongshin: yongshin,
      toYongshin: toYongshin,
      toIlgan: toIlgan,
      score: score
    };
  }

  
  function forWeek(startDate, chart) {
    var out = [];
    for (var i = 0; i < 7; i++) {
      var d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
      out.push(forDay(d, chart));
    }
    return out;
  }

  global.Daily = {
    forDay: forDay,
    forWeek: forWeek,
    relation: relation,
    dayGanZhi: dayGanZhi,
    stemOhaeng: stemOhaeng
  };
})(typeof window !== 'undefined' ? window : globalThis);
