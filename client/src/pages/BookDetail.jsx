// FR-10 and FR-12: every active offer by ascending price; related titles.
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { readError, rupees } from '../api/client';

export default function BookDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [related, setRelated] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    setData(null);
    api.get(`/books/${id}`).then((r) => setData(r.data)).catch((e) => setError(readError(e).message));
    api.get(`/books/${id}/related`).then((r) => setRelated(r.data.items)).catch(() => {});
  }, [id]);

  if (error) return <main className="page"><p className="error" role="alert">{error}</p></main>;
  if (!data) return <main className="page"><p className="muted">Loading…</p></main>;
  const { book, offers } = data;
  return (
    <main className="page">
      <h1>{book.title}</h1>
      <p className="muted">{book.author} · {book.publisher} · {book.language} · ISBN {book.isbn13}</p>
      <p>MRP {rupees(book.mrp)} · ★ {book.avgRating} ({book.reviewCount} reviews)</p>
      <h2>Offers</h2>
      {offers.length === 0 ? <p>No seller currently has this title in stock.</p> : (
        <table>
          <thead><tr><th>Condition</th><th>Price</th><th>Seller</th><th>Availability</th><th aria-label="Actions" /></tr></thead>
          <tbody>
            {offers.map((o) => (
              <tr key={o.listingId}>
                <td>{o.condition.replace('_', ' ').toLowerCase()}</td>
                <td>{rupees(o.price)}</td>
                <td>{o.seller.name}</td>
                <td>{o.inStock ? `${o.stockQty} in stock` : 'Out of stock'}</td>
                <td><button type="button" disabled title="Cart arrives in Sprint 2">Add to cart</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {related.length > 0 && (
        <>
          <h2>Related titles</h2>
          <ul className="related">{related.map((r) => <li key={r.id}><Link to={`/books/${r.id}`}>{r.title}</Link> <span className="muted">{r.author}</span></li>)}</ul>
        </>
      )}
    </main>
  );
}
