// FR-07 to FR-09: paged catalogue, search, filters and sort.
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { readError, rupees } from '../api/client';

const CONDITIONS = ['NEW', 'LIKE_NEW', 'GOOD', 'ACCEPTABLE'];
const SORTS = { '': 'Relevance / newest', price_asc: 'Price: low to high', price_desc: 'Price: high to low', rating: 'Rating', newest: 'Newest' };

export default function Catalogue() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => { api.get('/categories').then((r) => setCategories(r.data.items)).catch(() => {}); }, []);
  useEffect(() => {
    setError(null);
    api.get('/books', { params: Object.fromEntries(params) })
      .then((r) => setData(r.data))
      .catch((e) => setError(readError(e).message));
  }, [params]);

  // Changing any filter resets to page 1 (FR-09).
  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === '' || value == null) next.delete(key); else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };
  const page = Number(params.get('page') || 1);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const active = [...params.entries()].filter(([k]) => k !== 'page');

  return (
    <main className="layout">
      <aside className="filters" aria-label="Filters">
        <label>Category
          <select value={params.get('category') || ''} onChange={(e) => update('category', e.target.value)}>
            <option value="">All</option>
            {categories.filter((c) => !c.parentId).map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
        </label>
        <label>Condition
          <select value={params.get('condition') || ''} onChange={(e) => update('condition', e.target.value)}>
            <option value="">Any</option>
            {CONDITIONS.map((c) => <option key={c} value={c}>{c.replace('_', ' ').toLowerCase()}</option>)}
          </select>
        </label>
        <label>Min price (₹)
          <input type="number" min="0" defaultValue={params.get('minPrice') ? params.get('minPrice') / 100 : ''} onBlur={(e) => update('minPrice', e.target.value ? Math.round(e.target.value * 100) : '')} />
        </label>
        <label>Max price (₹)
          <input type="number" min="0" defaultValue={params.get('maxPrice') ? params.get('maxPrice') / 100 : ''} onBlur={(e) => update('maxPrice', e.target.value ? Math.round(e.target.value * 100) : '')} />
        </label>
        <label>Minimum rating
          <select value={params.get('minRating') || ''} onChange={(e) => update('minRating', e.target.value)}>
            <option value="">Any</option>{[4, 3, 2].map((r) => <option key={r} value={r}>{r}+ stars</option>)}
          </select>
        </label>
        <label>Sort
          <select value={params.get('sort') || ''} onChange={(e) => update('sort', e.target.value)}>
            {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
      </aside>

      <section aria-live="polite">
        {active.length > 0 && (
          <div className="chips">
            {active.map(([k, v]) => <button key={k} type="button" className="chip" onClick={() => update(k, '')}>{k}: {v} ✕</button>)}
          </div>
        )}
        {error && <p className="error" role="alert">{error}</p>}
        {!data && !error && <p className="muted">Loading…</p>}
        {data && data.total === 0 && (
          <p>No books match{params.get('q') ? ` “${params.get('q')}”` : ''}.
            {data.suggestion && <> Try <button type="button" className="link" onClick={() => setParams({ category: data.suggestion.category.slug })}>{data.suggestion.category.name}</button>.</>}
          </p>
        )}
        <ul className="grid">
          {data?.items.map((b) => (
            <li key={b.id} className="card">
              <Link to={`/books/${b.id}`}>
                {b.coverUrl ? <img src={b.coverUrl} alt={`Cover of ${b.title}`} loading="lazy" /> : <div className="cover-ph" aria-hidden="true" />}
                <strong>{b.title}</strong>
              </Link>
              <span className="muted">{b.author}</span>
              <span>from {rupees(b.lowestPrice)} · ★ {b.avgRating}</span>
            </li>
          ))}
        </ul>
        {data && data.total > 0 && (
          <nav className="pager" aria-label="Pages">
            <button type="button" disabled={page <= 1} onClick={() => update('page', page - 1)}>Previous</button>
            <span>Page {page} of {pages}</span>
            <button type="button" disabled={page >= pages} onClick={() => update('page', page + 1)}>Next</button>
          </nav>
        )}
      </section>
    </main>
  );
}
