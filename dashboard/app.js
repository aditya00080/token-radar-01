// sakmad radar dashboard: renders window.RADAR, no network, no framework.
(function () {
  var R = window.RADAR;
  if (!R) {
    document.getElementById('rows').innerHTML =
      '<tr><td colspan="8">No data: run main.ts first, it writes data.js beside this page.</td></tr>';
    return;
  }
  var M = R.model;

  function money(n) {
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return '$' + Math.round(n / 1e3) + 'k';
    return '$' + n;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function growthMul(row) {
    var g = Math.min(M.growth_cap, Math.max(M.growth_floor, row.change_7d == null ? 0 : row.change_7d));
    return Math.min(M.growth_max_mult, Math.max(M.growth_min_mult, 1 + g / 100));
  }
  function tenureMul(row) {
    return M.tenure_floor + (Math.min(row.age_days, M.tenure_days) / M.tenure_days) * M.tenure_range;
  }
  function chainMul(row) {
    return 1 + Math.min(Math.max(row.chains.length - 1, 0), M.chain_max_extra) * M.chain_step;
  }

  // Header meta + stats.
  document.getElementById('meta').textContent =
    'snapshot ' + R.as_of + ' · model ' + M.version + ' · ' + R.board_size + ' rows';
  var stats = document.getElementById('stats');
  stats.innerHTML = [
    [R.board_size, 'protocols ranked'],
    [R.watchlist_size, 'on the watchlist'],
    [R.early_size, 'early rows found'],
    [R.live_size, 'live tokens set aside'],
  ]
    .map(function (s) {
      return '<div class="stat"><b>' + s[0] + '</b><span>' + s[1] + '</span></div>';
    })
    .join('');

  // Category filter options, from the data itself.
  var cats = {};
  R.rows.forEach(function (r) {
    if (r.category) cats[r.category] = true;
  });
  var catSel = document.getElementById('cat');
  Object.keys(cats)
    .sort()
    .forEach(function (c) {
      var o = document.createElement('option');
      o.value = c;
      o.textContent = c;
      catSel.appendChild(o);
    });

  var selected = null;

  function filtered() {
    var q = document.getElementById('q').value.trim().toLowerCase();
    var cat = catSel.value;
    var watchOnly = document.getElementById('watch').checked;
    var rows = R.rows.filter(function (r) {
      if (watchOnly && !r.watchlist) return false;
      if (cat && r.category !== cat) return false;
      if (q) {
        var hay = (r.name + ' ' + r.slug + ' ' + (r.category || '')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    var sort = document.getElementById('sort').value;
    if (sort === 'value') rows.sort(function (a, b) { return b.implied_value_usd - a.implied_value_usd; });
    else if (sort === 'tvl') rows.sort(function (a, b) { return b.tvl_usd - a.tvl_usd; });
    else if (sort === 'growth')
      rows.sort(function (a, b) { return (b.change_7d == null ? -999 : b.change_7d) - (a.change_7d == null ? -999 : a.change_7d); });
    else rows.sort(function (a, b) { return a.rank - b.rank; });
    return rows;
  }

  function renderBoard() {
    var rows = filtered();
    var html = rows
      .map(function (r) {
        var chg = r.change_7d == null
          ? '<span>—</span>'
          : '<span class="' + (r.change_7d >= 0 ? 'up' : 'down') + '">' + (r.change_7d >= 0 ? '+' : '') + r.change_7d.toFixed(1) + '%</span>';
        return (
          '<tr data-slug="' + esc(r.slug) + '"' + (selected === r.slug ? ' class="sel"' : '') + '>' +
          '<td>' + r.rank + '</td>' +
          '<td><b>' + esc(r.name) + '</b><br><span style="color:var(--muted);font-size:12.5px">' + esc(r.slug) + '</span></td>' +
          '<td>' + esc(r.category || '—') + '</td>' +
          '<td>' + esc(r.chains.join(', ')) + '</td>' +
          '<td class="num">' + money(r.tvl_usd) + '</td>' +
          '<td class="num">' + chg + '</td>' +
          '<td class="num"><b>' + money(r.implied_value_usd) + '</b></td>' +
          '<td>' + (r.watchlist ? '<span class="tag-w">W</span>' : '<span class="tag-e">EARLY</span>') + '</td>' +
          '</tr>'
        );
      })
      .join('');
    document.getElementById('rows').innerHTML = html ||
      '<tr><td colspan="8">Nothing matches this filter.</td></tr>';
    document.getElementById('count').textContent =
      rows.length + ' of ' + R.rows.length + ' rows shown';
  }

  function renderDetail(slug) {
    var r = null;
    for (var i = 0; i < R.rows.length; i++) if (R.rows[i].slug === slug) r = R.rows[i];
    if (!r) return;
    selected = slug;
    var base = r.tvl_usd * M.base_multiple;
    var g = growthMul(r);
    var t = tenureMul(r);
    var c = chainMul(r);
    var el = document.getElementById('detail');
    el.innerHTML =
      '<h2>Detail</h2><h3>' + esc(r.name) + ' <span style="color:var(--muted);font-size:14px">#' + r.rank + ' · ' +
      (r.watchlist ? 'watchlist' : 'early find') + ' · ' + esc(r.category || 'no category') + ' · ' + esc(r.chains.join(', ')) + '</span></h3>' +
      '<p class="sub">Snapshot records no token for this protocol (no market cap, CoinGecko id or symbol). TVL ' +
      money(r.tvl_usd) + ' · 7-day change ' + (r.change_7d == null ? 'unreported' : r.change_7d.toFixed(1) + '%') +
      ' · tracked ' + r.age_days + ' days.</p>' +
      '<div class="factors">' +
      '<div class="factor"><b>' + money(base) + '</b><span>base = TVL × 0.30</span></div>' +
      '<div class="factor"><b>× ' + g.toFixed(2) + '</b><span>growth (7d ' + (r.change_7d == null ? 'n/a' : r.change_7d.toFixed(1) + '%') + ')</span></div>' +
      '<div class="factor"><b>× ' + t.toFixed(2) + '</b><span>tenure (' + r.age_days + ' days)</span></div>' +
      '<div class="factor"><b>× ' + c.toFixed(2) + '</b><span>chains (' + r.chains.length + ')</span></div>' +
      '<div class="factor total"><b>' + money(r.implied_value_usd) + '</b><span>implied value</span></div>' +
      '</div>' +
      '<h2 style="margin-top:14px">Farm plan — 30 days</h2>' +
      '<ol class="steps">' + r.farm_steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>';
    renderBoard();
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Live-token table: market values, never ranked.
  document.getElementById('live-rows').innerHTML = R.live
    .map(function (p) {
      return (
        '<tr><td><b>' + esc(p.name) + '</b></td>' +
        '<td>' + esc(p.symbol || '—') + '</td>' +
        '<td>' + esc(p.category || '—') + '</td>' +
        '<td>' + esc(p.chains.join(', ')) + '</td>' +
        '<td class="num">' + money(p.tvl_usd) + '</td>' +
        '<td class="num"><b>' + money(p.mcap_usd) + '</b></td></tr>'
      );
    })
    .join('');

  document.getElementById('rows').addEventListener('click', function (e) {
    var tr = e.target.closest('tr[data-slug]');
    if (tr) renderDetail(tr.getAttribute('data-slug'));
  });
  ['q', 'cat', 'watch', 'sort'].forEach(function (id) {
    document.getElementById(id).addEventListener('input', renderBoard);
    document.getElementById(id).addEventListener('change', renderBoard);
  });

  // Deep links for screenshots: #detail=<slug> opens a detail view,
  // #watch turns the watchlist filter on before the first paint.
  var hash = location.hash || '';
  if (hash.indexOf('#detail=') === 0) {
    renderDetail(decodeURIComponent(hash.slice(8)));
  } else {
    if (hash === '#watch') document.getElementById('watch').checked = true;
    renderBoard();
  }
})();
