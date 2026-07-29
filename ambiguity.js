/*! ambiguity.js — © 2026 모로젝트. All rights reserved.
 * 해석 문안과 이 파일의 구성은 모로젝트의 저작물입니다. 무단 복제·재배포를 금합니다.
 * 포함된 제3자 구성요소는 각자의 라이선스를 따릅니다 — vendor/ 및 NOTICE 참조.
 */
(function (global) {
  'use strict';

  var BASE_OFFSET_MIN = 540;
  var tz = null;

  function loadTz(data) { tz = data; }

  
  function offsetMinAt(input) {
    if (!tz) return null;
    var candidates = [tz.initialOffsetMin, BASE_OFFSET_MIN];
    tz.transitions.forEach(function (t) { candidates.push(t[1]); });

    for (var i = 0; i < candidates.length; i++) {
      var guess = candidates[i];
      var utcMs = Date.UTC(input.year, input.month - 1, input.day,
                           input.hour, input.minute) - guess * 60000;
      var actual = tz.initialOffsetMin;
      for (var j = 0; j < tz.transitions.length; j++) {
        if (utcMs >= tz.transitions[j][0]) actual = tz.transitions[j][1];
        else break;
      }
      if (actual === guess) return guess;
    }
    return BASE_OFFSET_MIN;
  }

  function fmtOffset(min) {
    var sign = min < 0 ? '-' : '+';
    var a = Math.abs(min);
    var h = Math.floor(a / 60), m = a % 60;
    return 'UTC' + sign + h + (m ? ':' + String(m).padStart(2, '0') : '');
  }

  
  function detect(input, withSolar, withoutSolar) {
    var warnings = [];

    var offset = offsetMinAt(input);
    if (offset !== null && offset !== BASE_OFFSET_MIN) {
      if (offset > BASE_OFFSET_MIN) {
        warnings.push({
          kind: 'dst',
          title: '서머타임 시행 중에 태어났습니다',
          detail: '그 시각 한국 표준시는 ' + fmtOffset(offset) + '였습니다. ' +
                  '서머타임을 반영하지 않는 앱은 시주를 한 칸 어긋나게 계산합니다. ' +
                  '한국은 1948~51, 1955~60, 1987~88년에 서머타임을 시행했는데, ' +
                  '이 구간을 제대로 처리하는 구현체는 드뭅니다.',
          severity: 'high'
        });
      } else {
        warnings.push({
          kind: 'meridian',
          title: '표준자오선이 지금과 달랐던 시기입니다',
          detail: '그 시각 한국 표준시는 ' + fmtOffset(offset) + '였습니다. ' +
                  '1954~61년 한국의 기준 자오선은 127.5°(UTC+8:30)였습니다. ' +
                  '이 시기를 UTC+9로 가정하는 앱은 30분을 잘못 봅니다.',
          severity: 'high'
        });
      }
    }

    if (input.hour === 23 || input.hour === 0) {
      warnings.push({
        kind: 'zi',
        title: '자시(子時) 경계에 태어났습니다',
        detail: '23시~1시는 하루가 바뀌는 지점입니다. 23시 이후를 다음 날로 보는 관례' +
                '(야자시)와 그대로 두는 관례(조자시)가 갈리며, 이에 따라 ' +
                '일주 자체가 달라집니다. 시주만이 아니라 일주가 바뀌는 문제입니다.',
        severity: 'high'
      });
    }

    if (withSolar && withoutSolar) {
      var a = global.SajuEngine.paljaString(withSolar.result);
      var b = global.SajuEngine.paljaString(withoutSolar.result);
      if (a !== b) {
        warnings.push({
          kind: 'solartime',
          title: '진태양시 보정을 적용하면 팔자가 달라집니다',
          detail: '경도 보정을 넣으면 ' + a + ', 넣지 않으면 ' + b + '입니다. ' +
                  '진태양시는 옵션이며 대부분의 라이브러리에서 기본으로 꺼져 있습니다. ' +
                  '어느 쪽이 옳은지는 유파에 따라 다릅니다 — 이 앱은 판정하지 않습니다.',
          severity: 'high'
        });
      }
    }

    var jieqi = nearestJieQi(input);
    if (jieqi && Math.abs(jieqi.diffMinutes) <= 24 * 60) {
      warnings.push({
        kind: 'solarterm',
        title: '절기 경계 하루 안에 태어났습니다',
        detail: '가장 가까운 절기 ' + jieqi.name + '가 ' + jieqi.iso +
                '입니다(약 ' + Math.round(Math.abs(jieqi.diffMinutes) / 60) + '시간 차이). ' +
                '절기 진입 시각은 구현체마다 몇 분씩 다르게 계산되고, 그 몇 분이 ' +
                '월주를 바꿉니다. bazi-diff 측정에서 월주는 가장 많이 갈리는 기둥이었습니다.',
        severity: 'medium'
      });
    }

    return warnings;
  }

  
  function nearestJieQi(input) {
    try {
      if (!global.Solar) return null;
      var lunar = global.Solar.fromYmdHms(input.year, input.month, input.day,
                                          input.hour, input.minute, 0).getLunar();
      var table = lunar.getJieQiTable();
      var target = new Date(input.year, input.month - 1, input.day,
                            input.hour, input.minute).getTime();
      var best = null;
      Object.keys(table).forEach(function (name) {
        var s = table[name];
        if (!s || typeof s.toYmdHms !== 'function') return;
        var iso = s.toYmdHms();
        var m = /^(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)$/.exec(iso);
        if (!m) return;
        var t = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime();
        var diff = (t - target) / 60000;
        if (!best || Math.abs(diff) < Math.abs(best.diffMinutes)) {
          best = { name: name, iso: iso, diffMinutes: diff };
        }
      });
      return best;
    } catch (e) {
      return null;
    }
  }

  global.Ambiguity = {
    loadTz: loadTz,
    detect: detect,
    offsetMinAt: offsetMinAt,
    fmtOffset: fmtOffset,
    nearestJieQi: nearestJieQi
  };
})(typeof window !== 'undefined' ? window : globalThis);
