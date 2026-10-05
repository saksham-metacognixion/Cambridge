// Run: npm run test:sanitize   (Node 22.18+/24+ strips the TypeScript types natively)
import assert from 'node:assert/strict';
import { sanitizeHtml } from '../src/lib/sanitize.ts';

// allowed structure survives; b/i are normalised to strong/em
assert.equal(
  sanitizeHtml('<h2>Title</h2><p>Text <b>bold</b> and <i>it</i>.</p><ul><li><strong>Lead:</strong> body</li></ul>'),
  '<h2>Title</h2><p>Text <strong>bold</strong> and <em>it</em>.</p><ul><li><strong>Lead:</strong> body</li></ul>',
);
// scripts, styles, iframes vanish with their content; unknown tags keep their text only
assert.equal(sanitizeHtml('<p>a</p><script>alert(1)</script><style>p{}</style><iframe src="x"></iframe><div><span>b</span></div>'), '<p>a</p>b');
// event handlers, javascript: and data: URLs are dropped; external links get noopener
assert.equal(sanitizeHtml('<a href="javascript:alert(1)" onclick="x()">x</a>'), '<a>x</a>');
assert.equal(sanitizeHtml('<a href="https://example.com/p">x</a>'), '<a href="https://example.com/p" target="_blank" rel="noopener">x</a>');
assert.equal(sanitizeHtml('<a href="/ae/contact">x</a>'), '<a href="/ae/contact">x</a>');
assert.equal(sanitizeHtml('<img src="data:image/png;base64,AAAA" onerror="x()" alt="a">'), '<img alt="a" loading="lazy" decoding="async">');
assert.equal(sanitizeHtml('<img src="https://cdn.example.com/a.jpg" alt="a" width="800" height="600" style="x">'), '<img src="https://cdn.example.com/a.jpg" alt="a" width="800" height="600" loading="lazy" decoding="async">');
// attribute values are escaped; unclosed tags are closed; stray closers are ignored
assert.equal(sanitizeHtml('<a href="/x?a=1&b=2" title=\'He said "hi"\'>t</a>'), '<a href="/x?a=1&amp;b=2" title="He said &quot;hi&quot;">t</a>');
assert.equal(sanitizeHtml('<p>open <strong>bold</p></em>'), '<p>open <strong>bold</strong></p>');
// comments go, text entities stay as they are
assert.equal(sanitizeHtml('<!-- c --><p>&amp; &nbsp; &#169;</p>'), '<p>&amp; &nbsp; &#169;</p>');
// empty input
assert.equal(sanitizeHtml(''), '');

console.log('sanitize: ok');
