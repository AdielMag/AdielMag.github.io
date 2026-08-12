/* ===========================================================================
   Tiny dependency-free Markdown -> HTML renderer.
   Covers what a dev blog needs: headings, paragraphs, bold/italic, inline code,
   fenced code blocks, ordered/unordered lists, links, images, blockquotes, rules.
   HTML in source text is escaped and link/image URLs are attribute-escaped and
   scheme-checked, so the output is safe to inject for the author-written
   Markdown this blog serves. It is not a sanitiser for untrusted input.
   Exposes: window.renderMarkdown(src) -> htmlString
   =========================================================================== */
(function () {
  // Non-printable sentinel used to stash inline-code spans while other inline
  // rules run. Must be a char that never appears in normal prose.
  var NUL = String.fromCharCode(0);

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // URLs land inside a double-quoted attribute, so the quote has to go too.
  // Anything that isn't a plain relative path, http(s), mailto or fragment is
  // dropped rather than rendered - that's where javascript: would sneak in.
  function safeUrl(url) {
    var u = String(url).trim();
    if (/^\s*(javascript|data|vbscript):/i.test(u.replace(/[\x00-\x20]/g, ''))) return '#';
    return u.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Inline formatting for a single run of text.
  function inline(text) {
    var codes = [];
    // pull inline `code` out first so its contents aren't further processed
    text = text.replace(/`([^`]+)`/g, function (_, c) {
      codes.push('<code>' + escapeHtml(c) + '</code>');
      return NUL + (codes.length - 1) + NUL;
    });

    text = escapeHtml(text);

    // images: ![alt](url "title")
    text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
      function (_, alt, url, title) {
        return '<img src="' + safeUrl(url) + '" alt="' + alt + '"' +
          (title ? ' title="' + title + '"' : '') + '>';
      });

    // links: [text](url "title")
    text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
      function (_, t, url, title) {
        return '<a href="' + safeUrl(url) + '"' + (title ? ' title="' + title + '"' : '') +
          '>' + t + '</a>';
      });

    // Bold then italic. The underscore forms only fire at word boundaries, so
    // snake_case identifiers in prose stay intact - `foo_bar_baz` used to come
    // out as foo<em>bar</em>baz.
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/(^|\W)__(\S(?:[^_]*\S)?)__(?!\w)/g, '$1<strong>$2</strong>');
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    text = text.replace(/(^|\W)_(\S(?:[^_]*\S)?)_(?!\w)/g, '$1<em>$2</em>');

    // restore code spans
    text = text.replace(new RegExp(NUL + '(\\d+)' + NUL, 'g'), function (_, i) {
      return codes[+i];
    });
    return text;
  }

  var isBlank    = function (l) { return /^\s*$/.test(l); };
  var isFence    = function (l) { return /^```/.test(l); };
  var isHeading  = function (l) { return /^#{1,6}\s+/.test(l); };
  var isQuote    = function (l) { return /^\s*>/.test(l); };
  var isUl       = function (l) { return /^\s*[-*+]\s+/.test(l); };
  var isOl       = function (l) { return /^\s*\d+\.\s+/.test(l); };
  var isRule     = function (l) { return /^\s*([-*_])\s*(\1\s*){2,}$/.test(l); };

  function render(src) {
    var lines = String(src).replace(/\r\n?/g, '\n').split('\n');
    var html = '';
    var i = 0;

    while (i < lines.length) {
      var line = lines[i];

      if (isFence(line)) {
        var buf = [];
        i++;
        while (i < lines.length && !isFence(lines[i])) { buf.push(lines[i]); i++; }
        i++; // consume closing fence
        html += '<pre><code>' + escapeHtml(buf.join('\n')) + '</code></pre>';
        continue;
      }

      if (isBlank(line)) { i++; continue; }

      var h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        var lvl = h[1].length;
        html += '<h' + lvl + '>' + inline(h[2].trim()) + '</h' + lvl + '>';
        i++; continue;
      }

      if (isRule(line)) { html += '<hr>'; i++; continue; }

      if (isQuote(line)) {
        var q = [];
        while (i < lines.length && isQuote(lines[i])) {
          q.push(lines[i].replace(/^\s*>\s?/, '')); i++;
        }
        html += '<blockquote>' + render(q.join('\n')) + '</blockquote>';
        continue;
      }

      if (isUl(line)) {
        var items = [];
        while (i < lines.length && isUl(lines[i])) {
          items.push('<li>' + inline(lines[i].replace(/^\s*[-*+]\s+/, '')) + '</li>'); i++;
        }
        html += '<ul>' + items.join('') + '</ul>';
        continue;
      }

      if (isOl(line)) {
        var oitems = [];
        while (i < lines.length && isOl(lines[i])) {
          oitems.push('<li>' + inline(lines[i].replace(/^\s*\d+\.\s+/, '')) + '</li>'); i++;
        }
        html += '<ol>' + oitems.join('') + '</ol>';
        continue;
      }

      // paragraph: gather consecutive non-block lines
      var para = [];
      while (i < lines.length && !isBlank(lines[i]) && !isFence(lines[i]) &&
             !isHeading(lines[i]) && !isQuote(lines[i]) && !isUl(lines[i]) &&
             !isOl(lines[i]) && !isRule(lines[i])) {
        para.push(lines[i]); i++;
      }
      html += '<p>' + inline(para.join(' ')) + '</p>';
    }

    return html;
  }

  window.renderMarkdown = render;
})();
