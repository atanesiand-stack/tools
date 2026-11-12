// Pricing calculator. Everything runs in the browser; nothing is sent anywhere.
(function () {
  var cfg = JSON.parse(document.getElementById('calc-config').textContent);
  var minutes = cfg.rate_mode === 'minutes_per_unit';
  var money = function (n) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var money0 = function (n) { return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 }); };
  var el = function (id) { return document.getElementById(id); };
  var num = function (id) { var v = parseFloat(el(id).value); return isFinite(v) ? v : 0; };

  var body = el('lines');
  function addLine(line) {
    var tr = document.createElement('tr');
    var types = cfg.item_types.map(function (t, i) { return '<option value="' + i + '">' + t[0] + '</option>'; }).join('');
    var diffs = cfg.difficulty.map(function (d, i) { return '<option value="' + i + '">' + d[0] + '</option>'; }).join('');
    tr.innerHTML =
      '<td><select aria-label="Item type" class="type">' + types + '</select></td>' +
      '<td><input aria-label="' + cfg.qty_label + '" class="qty" type="number" min="0" step="any" inputmode="decimal"></td>' +
      '<td><input aria-label="' + cfg.rate_label + '" class="rate" type="number" min="0" step="any" inputmode="decimal"></td>' +
      '<td><select aria-label="Difficulty" class="diff">' + diffs + '</select></td>' +
      '<td class="num hours">0.00</td>' +
      '<td class="num"><button type="button" class="remove" aria-label="Remove this line" title="Remove this line">&times;</button></td>';
    body.appendChild(tr);
    var type = tr.querySelector('.type'), rate = tr.querySelector('.rate');
    type.value = line ? line[0] : 0;
    tr.querySelector('.qty').value = line ? line[1] : '';
    tr.querySelector('.diff').value = line ? line[2] : 0;
    rate.value = cfg.item_types[type.value][1];
    type.addEventListener('change', function () { rate.value = cfg.item_types[type.value][1]; calc(); });
    tr.querySelector('.remove').addEventListener('click', function () { tr.remove(); calc(); });
  }

  function calc() {
    var work = 0, qty = 0;
    Array.prototype.forEach.call(body.querySelectorAll('tr'), function (tr) {
      var q = parseFloat(tr.querySelector('.qty').value), r = parseFloat(tr.querySelector('.rate').value);
      var m = cfg.difficulty[tr.querySelector('.diff').value][1], h = 0;
      if (isFinite(q) && q > 0 && isFinite(r) && r > 0) { h = (minutes ? q * r / 60 : q / r) * m; qty += q; }
      tr.querySelector('.hours').textContent = h.toFixed(2);
      work += h;
    });
    var hours = work > 0 ? work + num('travel') : 0;
    var wages = hours * num('wage');
    var direct = wages * (1 + num('burden') / 100 + num('supplies') / 100);
    var breakeven = direct * (1 + num('overhead') / 100);
    var margin = Math.min(num('margin'), 95) / 100;
    var target = breakeven / (1 - margin);
    var price = work > 0 ? Math.round(Math.max(target, num('minimum')) / 5) * 5 : 0;
    var visits = Math.max(num('visits'), 0);
    el('r-hours').textContent = hours.toFixed(2);
    el('r-breakeven').textContent = money(breakeven);
    el('r-price').textContent = money0(price);
    el('r-profit').textContent = money(price - breakeven);
    var unit = qty > 0 ? price / qty : 0;
    el('r-unit').textContent = qty > 0 ? (unit < 1 ? '$' + unit.toFixed(3) : money(unit)) : '-';
    el('r-hour').textContent = hours > 0 ? money(price / hours) : '-';
    el('r-month').textContent = money0(price * visits / 12);
    el('r-year').textContent = money0(price * visits);
    el('r-min').hidden = !(work > 0 && target < num('minimum'));
  }

  cfg.example_lines.forEach(addLine);
  el('add-line').addEventListener('click', function () { addLine(null); });
  document.querySelector('form').addEventListener('input', calc);
  document.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); });
  calc();
})();
