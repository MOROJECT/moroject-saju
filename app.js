/*! app.js — © 2026 모로젝트. All rights reserved.
 * 해석 문안과 이 파일의 구성은 모로젝트의 저작물입니다. 무단 복제·재배포를 금합니다.
 * 포함된 제3자 구성요소는 각자의 라이선스를 따릅니다 — vendor/ 및 NOTICE 참조.
 */
(function () {
  'use strict';

  var C = window.CORPUS;
  var $ = function (id) { return document.getElementById(id); };
  var state = null;

  if (window.SEOUL_TZ) window.Ambiguity.loadTz(window.SEOUL_TZ);
  $('disclaimer').textContent = C.disclaimer;





  try {
    if (window.self !== window.top) {
      document.documentElement.classList.add('embedded');
    }
  } catch (e) {
    document.documentElement.classList.add('embedded');
  }


  $('glossary-body').innerHTML = Object.keys(C.plain).map(function (k) {
    return '<dt>' + esc(k) + '</dt><dd>' + esc(C.plain[k]) + '</dd>';
  }).join('');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function h(tag, cls, html) {
    return '<' + tag + (cls ? ' class="' + cls + '"' : '') + '>' + (html || '') + '</' + tag + '>';
  }
  function section(title, body, note) {
    return h('section', null, h('h2', null, esc(title)) +
      (note ? h('p', 'note', note) : '') + body);
  }

  
  function foldSection(title, body, note, open) {
    return '<details class="fold"' + (open ? ' open' : '') + '>' +
      '<summary>' + esc(title) + '</summary>' +
      (note ? h('p', 'note', note) : '') + body + '</details>';
  }
  function card(title, body, extra) {
    return h('div', 'card', h('h3', null, esc(title)) +
      h('p', null, body) + (extra || ''));
  }
  
  function term(word) {
    var d = C.plain[word];
    return d ? '<abbr title="' + esc(d) + '">' + esc(word) + '</abbr>' : esc(word);
  }

  var WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];
  function mmdd(d) { return (d.getMonth() + 1) + '월 ' + d.getDate() + '일'; }

  

  
  function rotate(list, date) {
    var seed = Math.floor(date.getTime() / 86400000);
    return list[((seed % list.length) + list.length) % list.length];
  }

  function introBlock(date) {
    var s = state, I = C.intro;
    var greet = s.name
      ? rotate(I.greetNamed, date).replace('{name}', esc(s.name))
      : esc(rotate(I.greetAnon, date));
    var dateText = (date.getMonth() + 1) + '월 ' + date.getDate() + '일 ' +
                   WEEKDAY[date.getDay()] + '요일';
    return h('div', 'intro',
      h('p', 'idate', esc(dateText)) +
      h('p', 'igreet', greet) +
      h('p', 'ilead', esc(rotate(I.lead, date))));
  }

  function nowPanel() {
    var s = state;
    var now = new Date();
    var today = window.Daily.forDay(now, s.chart);
    var week = window.Daily.forWeek(now, s.chart);
    var f = C.daily.toYongshin[today.toYongshin] ||
            { tag: '무난한 날', tone: 'flat', body: '오늘은 특별히 두드러지는 기운이 없습니다.' };
    var extra = C.daily.toIlgan[today.toIlgan];
    var who = s.name ? esc(s.name) + '님' : '오늘';

    var head = h('div', 'hero ' + f.tone,
      h('p', 'hk', esc(who) + '의 오늘') +
      h('div', 'htag', esc(f.tag)) +
      h('p', 'hb', esc(f.body)) +
      (extra ? h('p', 'hb dim', esc(extra)) : '') +
      h('p', 'hmeta', '오늘의 기운 ' + h('b', null, esc(today.ganZhi)) +
        ' (' + esc(today.dayOhaeng) + ') · 나에게 맞는 기운 ' +
        h('b', null, esc(today.yongshin || '—'))));

    var rows = week.map(function (d, i) {
      var wf = C.daily.toYongshin[d.toYongshin] || { tag: '무난', tone: 'flat' };
      return h('div', 'day ' + wf.tone + (i === 0 ? ' first' : ''),
        h('span', 'dd', (i === 0 ? '오늘' : WEEKDAY[d.date.getDay()])) +
        h('span', 'dm', mmdd(d.date)) +
        h('span', 'dg', esc(d.ganZhi)) +
        h('span', 'dt', esc(wf.tag)));
    }).join('');

    var goods = week.filter(function (d) { return d.score === 'good'; });
    var cautions = week.filter(function (d) { return d.score === 'caution'; });
    var summary = [];
    if (goods.length) summary.push('좋은 날 ' + goods.map(function (d) { return mmdd(d.date); }).join(', '));
    if (cautions.length) summary.push('조심할 날 ' + cautions.map(function (d) { return mmdd(d.date); }).join(', '));
    if (!summary.length) summary.push('이번 주는 큰 기복 없이 무난합니다.');

    return introBlock(now) + head +
      section('이번 주', h('div', 'week', rows) + h('p', 'note', esc(summary.join(' · '))),
        '그 날의 기운이 ' + term('용신') + '과 맞는지로 봅니다.') +
      h('p', 'closing', esc(C.intro.closing)) +
      (s.warnings.length ? h('p', 'crossref',
        '⚠ 태어난 시각이 경계에 걸려 <b>사주가 갈릴 수 있습니다.</b> ' +
        '바로 아래에서 이유를 확인하세요.') : '');
  }

  

  function paljaBlock() {
    var s = state, p = s.chart.result.palja, manse = s.chart.result.manse || {};
    var order = [['year', p.yearPillar], ['month', p.monthPillar],
                 ['day', p.dayPillar], ['hour', p.hourPillar]];
    var cells = order.map(function (pair) {
      var key = pair[0], pill = pair[1], meta = C.pillars[key], m = manse[key] || {};
      var faded = (key === 'hour' && !s.hourGiven) ? ' faded' : '';
      return h('div', 'pillar' + faded,
        h('p', 'k', esc(meta.label)) +
        h('div', 'han', esc(pill.stem + pill.branch)) +
        h('div', 'gung', esc(meta.gung)));
    }).join('');
    return h('div', 'palja', cells);
  }

  function mePanel() {
    var s = state, chart = s.chart, ilgan = chart.result.ilgan;
    var body = '';
    var who = s.name ? esc(s.name) + '님의 ' : '';

    var stamp = h('p', 'stamp',
      esc(s.input.year + '년 ' + s.input.month + '월 ' + s.input.day + '일 ' +
          String(s.input.hour).padStart(2, '0') + ':' +
          String(s.input.minute).padStart(2, '0')) + ' · ' + esc(s.input.gender) +
      (s.hanja ? ' · ' + esc(s.hanja) : (s.noHanja && s.name ? ' · 한글 이름' : '')));

    body += stamp + paljaBlock();
    if (!s.hourGiven) {
      body += h('p', 'note', '태어난 시각을 안 넣으셨습니다. <b>시(時) 자리는 참고만 하세요.</b>');
    }

    var f = C.ilgan[ilgan.char];
    if (f) body += card('나는 어떤 사람인가 — ' + f.title, esc(f.body));

    var sk = C.sinkangyak[chart.counts.sinKangYak];
    if (sk) body += card('내 기운의 세기 — ' + sk.title, sk.body);

    var y = chart.result.yongshin || {};
    if (y.ohaeng) {
      var tip = C.lacking[y.ohaeng] ? C.lacking[y.ohaeng].tip : null;
      body += card('나에게 맞는 기운 — ' + y.ohaeng,
        '이 사주를 풀어주는 기운은 <b>' + esc(y.ohaeng) + '</b>입니다. ' +
        '어려울 때 이 기운을 늘리는 쪽으로 움직이면 수월합니다.',
        tip ? h('p', 'tip', '가까이 두면 좋은 것: ' + esc(tip)) : '');
    }


    var counts = chart.counts, order = ['木', '火', '土', '金', '水'];
    var label = { 木: '나무', 火: '불', 土: '흙', 金: '쇠', 水: '물' };
    var max = Math.max.apply(null, order.map(function (k) { return counts.ohaeng[k]; })) || 1;
    var bars = order.map(function (k) {
      var n = counts.ohaeng[k], pct = Math.max(Math.round(n / max * 100), 2);
      return h('div', 'bar-row',
        h('span', 'bl', esc(k) + ' ' + esc(label[k])) +
        h('span', 'bt', '<i style="width:' + pct + '%"></i>') +
        h('span', 'bn', n + '개'));
    }).join('');
    var ob = h('div', 'bars', bars);
    counts.lacking.forEach(function (k) {
      var lf = C.lacking[k];
      if (lf) ob += card(lf.title, esc(lf.body), h('p', 'tip', '보충: ' + esc(lf.tip)));
    });
    if (!counts.lacking.length) {
      ob += h('p', 'ok', '✓ 다섯 기운이 모두 있습니다. 한쪽으로 크게 비지 않았습니다.');
    }
    body += section('다섯 기운의 균형', ob,
      '많고 적음은 여덟 글자에 나타난 <b>개수</b>로만 봅니다.');

    return h('h2', 'panel-title', who + '사주') + body;
  }

  

  function deepPanel() {
    var chart = state.chart, counts = chart.counts, body = '';

    if (chart.result.kyukguk) {
      body += card('삶을 끌고 가는 방식 — ' + chart.result.kyukguk,
        '사주를 대표하는 기운입니다. 세상을 대하는 주된 무기라고 보면 됩니다. (' +
        term('격국') + ')');
    }


    var groups = ['비겁', '식상', '재성', '관성', '인성'];
    var meaning = { 비겁: '나·동료·경쟁', 식상: '표현·재능', 재성: '돈·실물',
                    관성: '직장·책임', 인성: '공부·문서' };
    var rows = groups.map(function (g) {
      return h('tr', null,
        h('td', null, esc(g) + h('span', 'sub', esc(meaning[g]))) +
        h('td', 'num', counts.shipsinGroup[g] + '개') +
        h('td', null, esc(counts.shipsinGroupGrade[g])));
    }).join('');
    var sb = h('div', 'scroll', h('table', null,
      '<thead><tr><th>영역</th><th>개수</th><th>세기</th></tr></thead>' +
      h('tbody', null, rows)));
    groups.forEach(function (g) {
      var gr = counts.shipsinGroupGrade[g];
      var txt = C.shipsinGrade[g] && C.shipsinGrade[g][gr];
      if (txt) sb += card(g + ' · ' + gr, esc(txt));
    });
    counts.missingShipsin.forEach(function (g) {
      var mf = C.missingShipsin[g];
      if (mf) sb += card(mf.title, esc(mf.body));
    });
    body += foldSection('영역별 에너지', sb,
      term('십신') + ' — 돈·직장·공부·표현 같은 인생 영역의 세기입니다.', true);


    var pk = ['year', 'month', 'day', 'hour'];
    var prow = pk.map(function (k) {
      var m = (chart.result.manse || {})[k] || {}, meta = C.pillars[k];
      var ships = [m.stemShipsinKo, m.branchShipsinKo].filter(Boolean).join(' · ');
      return h('tr', null,
        h('td', null, esc(meta.label)) +
        h('td', null, esc(meta.gung)) +
        h('td', 'sub2', esc(meta.area)) +
        h('td', null, esc(ships || '—')) +
        h('td', null, esc(m.unseong || '—')));
    }).join('');
    body += foldSection('네 자리가 맡는 영역',
      h('div', 'scroll', h('table', null,
        '<thead><tr><th>자리</th><th>맡는 곳</th><th>영역·시기</th><th>' +
        '에너지</th><th>단계</th></tr></thead>' + h('tbody', null, prow))),
      '같은 기운도 <b>어느 자리에 있느냐</b>에 따라 인생의 다른 영역으로 나타납니다. (' +
      term('궁위') + ')');


    var seen = {};
    Object.keys(chart.result.manse || {}).forEach(function (k) {
      ((chart.result.manse[k].shinsals) || []).forEach(function (x) { seen[x] = true; });
    });
    var names = Object.keys(seen);
    var nb = names.length
      ? names.map(function (x) { return card(x, esc(C.shinsal[x] || '이 사주에 나타난 기운입니다.')); }).join('') +
        h('p', 'note', '이건 양념입니다. 이것만으로 좋다 나쁘다 하지 않습니다.')
      : h('p', 'ok', '두드러진 것이 잡히지 않았습니다.');
    body += foldSection('특별한 기운', nb, term('신살'));


    var watch = [];
    Object.keys(counts.ohaeng).forEach(function (k) {
      var g = counts.ohaengGrade[k];
      if (g === '없음' || g === '과다') watch.push([k, g]);
    });
    body += foldSection('몸에서 챙길 곳',
      watch.length
        ? watch.map(function (p) { return card(p[0] + ' ' + p[1], esc(C.health[p[0]] || '')); }).join('')
        : h('p', 'ok', '크게 치우친 기운이 없습니다.'),
      '치우친 기운에 해당하는 <b>관리 포인트</b>까지만 봅니다. 병을 진단하지 않습니다.');


    var dw = chart.daewoon || [];
    if (dw.length) {
      var drow = dw.map(function (d) {
        return h('tr', null,
          h('td', 'num', esc(d.startAge) + '세부터') +
          h('td', 'num', esc(d.startYear) + '년~') +
          h('td', 'han-sm', esc(d.ganZhi)));
      }).join('');
      body += foldSection('10년 단위 큰 흐름',
        h('div', 'scroll', h('table', null,
          '<thead><tr><th>나이</th><th>시기</th><th>기운</th></tr></thead>' +
          h('tbody', null, drow))),
        term('대운') + ' — 각 구간이 나에게 맞는 기운과 어울리는지로 흐름을 읽습니다.');
    }
    return body;
  }

  

  function splitPanel() {
    var w = state.warnings;
    if (!w.length) {
      return h('h2', 'panel-title', '갈릴 여지 없음') +
        h('p', 'ok', '✓ 태어난 시각이 경계 구간에 걸리지 않았습니다. ' +
          '이 사주는 계산 프로그램끼리 이견이 적습니다.');
    }
    var items = w.map(function (x) {
      return h('div', 'warn ' + x.severity,
        h('div', 'wt', esc(x.title)) + h('div', 'wd', esc(x.detail)));
    }).join('');
    return h('h2', 'panel-title', '내 사주가 갈릴 수 있는 이유') +
      h('p', 'note', '다른 곳에서는 이 부분을 말하지 않고 하나로 정해서 보여줍니다. ' +
        '어느 쪽이 맞는지는 <b>여기서도 정하지 않습니다</b> — 갈린다는 사실만 알려드립니다.') +
      items;
  }

  


  var PANELS = { now: nowPanel, split: splitPanel, me: mePanel, deep: deepPanel };

  

  function syncHanja() {
    var off = $('nohanja').checked;
    $('hanja').disabled = off;
    if (off) $('hanja').value = '';
  }
  $('nohanja').addEventListener('change', syncHanja);
  $('time').addEventListener('input', function () { this.dataset.touched = '1'; });

  function render() {
    var dateVal = $('date').value;
    if (!dateVal) return;
    var timeVal = $('time').value || '12:00';
    var d = dateVal.split('-').map(Number), t = timeVal.split(':').map(Number);
    var input = {
      year: d[0], month: d[1], day: d[2],
      hour: t[0], minute: t[1] || 0, gender: $('gender').value
    };
    var lon = parseFloat($('place').value);

    try {
      var withSolar = window.SajuEngine.computeChart(input, { solarTime: true, lon: lon });
      var withoutSolar = window.SajuEngine.computeChart(input, { solarTime: false });
      state = {
        input: input,
        name: $('name').value.trim(),
        hanja: $('nohanja').checked ? '' : $('hanja').value.trim(),
        noHanja: $('nohanja').checked,
        hourGiven: timeVal !== '12:00' || $('time').dataset.touched === '1',
        chart: withoutSolar,
        warnings: window.Ambiguity.detect(input, withSolar, withoutSolar)
      };
    } catch (e) {
      $('panel-now').hidden = false;
      $('panel-now').innerHTML = h('p', 'err', '계산에 실패했습니다: ' + esc(e.message));
      return;
    }

    Object.keys(PANELS).forEach(function (k) {
      var el = $('panel-' + k);
      el.innerHTML = PANELS[k]();
      el.hidden = false;
    });
    $('panel-now').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  $('form').addEventListener('submit', function (e) { e.preventDefault(); render(); });
  syncHanja();
})();
