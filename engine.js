/*! engine.js — © 2026 모로젝트. All rights reserved.
 * 해석 문안과 이 파일의 구성은 모로젝트의 저작물입니다. 무단 복제·재배포를 금합니다.
 * 포함된 제3자 구성요소는 각자의 라이선스를 따릅니다 — vendor/ 및 NOTICE 참조.
 */
(function (global) {
  'use strict';

  var KST_MERIDIAN = 135;

  
  function lonOffsetMin(lon) {
    return Math.round((lon - KST_MERIDIAN) * 4);
  }

  
  function grade(n) {
    return n === 0 ? '없음' : n === 1 ? '약함' : n === 2 ? '보통' : n === 3 ? '강함' : '과다';
  }

  var GROUP = {
    비견: '비겁', 겁재: '비겁', 식신: '식상', 상관: '식상',
    편재: '재성', 정재: '재성', 편관: '관성', 정관: '관성',
    편인: '인성', 정인: '인성'
  };

  
  function buildCounts(r) {
    var keys = ['year', 'month', 'day', 'hour'];
    var pillars = keys.map(function (k) { return r.manse && r.manse[k]; })
                      .filter(Boolean);

    var ohaeng = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    pillars.forEach(function (p) {
      if (p.stemOhaeng) ohaeng[p.stemOhaeng]++;
      if (p.branchOhaeng) ohaeng[p.branchOhaeng]++;
    });

    var shipsinDetail = {
      비견: 0, 겁재: 0, 식신: 0, 상관: 0, 편재: 0,
      정재: 0, 편관: 0, 정관: 0, 편인: 0, 정인: 0
    };
    var shipsinGroup = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
    pillars.forEach(function (p) {
      [p.stemShipsinKo, p.branchShipsinKo].forEach(function (s) {
        if (s && Object.prototype.hasOwnProperty.call(shipsinDetail, s)) {
          shipsinDetail[s]++;
          shipsinGroup[GROUP[s]]++;
        }
      });
    });

    var ohaengGrade = {};
    Object.keys(ohaeng).forEach(function (k) { ohaengGrade[k] = grade(ohaeng[k]); });
    var shipsinGroupGrade = {};
    Object.keys(shipsinGroup).forEach(function (k) {
      shipsinGroupGrade[k] = grade(shipsinGroup[k]);
    });

    var reason = (r.yongshin && r.yongshin.reason) || '';
    var sinKangYak = /신강/.test(reason) ? '신강' : /신약/.test(reason) ? '신약' : '중화';

    return {
      ohaeng: ohaeng,
      ohaengGrade: ohaengGrade,
      lacking: Object.keys(ohaeng).filter(function (k) { return ohaeng[k] === 0; }),
      shipsinDetail: shipsinDetail,
      shipsinGroup: shipsinGroup,
      shipsinGroupGrade: shipsinGroupGrade,
      missingShipsin: Object.keys(shipsinGroup).filter(function (k) {
        return shipsinGroup[k] === 0;
      }),
      sinKangYak: sinKangYak
    };
  }

  
  function shiftMinutes(input, minutes) {
    var d = new Date(input.year, input.month - 1, input.day, input.hour, input.minute);
    d.setMinutes(d.getMinutes() + minutes);
    return {
      year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(),
      hour: d.getHours(), minute: d.getMinutes()
    };
  }

  
  function computeChart(input, opts) {
    opts = opts || {};
    var SD = global.SajuDoctor;
    if (!SD) throw new Error('SajuDoctor 미로드 — vendor/saju.js를 먼저 넣어야 한다');

    var offsetMin = 0;
    var used = input;
    if (opts.solarTime) {
      offsetMin = lonOffsetMin(typeof opts.lon === 'number' ? opts.lon : 126.98);
      used = shiftMinutes(input, offsetMin);
    }

    var result = SD.analyze({
      year: used.year, month: used.month, day: used.day,
      hour: used.hour, minute: used.minute, gender: input.gender
    });
    SD.enrichManse(result);

    return {
      input: input,
      usedTime: used,
      solarTime: !!opts.solarTime,
      offsetMin: offsetMin,
      result: result,
      counts: buildCounts(result),

      daewoon: (result.daewoon || []).filter(function (d) { return d && d.ganZhi; })
    };
  }

  function paljaString(result) {
    var p = result.palja;
    return [p.yearPillar, p.monthPillar, p.dayPillar, p.hourPillar]
      .map(function (x) { return x.stem + x.branch; }).join(' ');
  }

  global.SajuEngine = {
    computeChart: computeChart,
    buildCounts: buildCounts,
    lonOffsetMin: lonOffsetMin,
    paljaString: paljaString,
    grade: grade
  };
})(typeof window !== 'undefined' ? window : globalThis);
