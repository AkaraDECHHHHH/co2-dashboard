import { useEffect, useState } from 'react';
import { createStore } from '../lib/store';

export function useEmissionsData() {
  const [state, setState] = useState({ status: 'loading', store: null, error: null });

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`${import.meta.env.BASE_URL}data/emissions.json`, { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((raw) => setState({ status: 'ready', store: createStore(raw), error: null }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ status: 'error', store: null, error });
      });
    return () => ctrl.abort();
  }, []);

  return state;
}
