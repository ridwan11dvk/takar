import 'fake-indexeddb/auto';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import db from '../db/db.js';
import { labels } from '../utils/labels.js';
import Settings from './Settings.jsx';

async function resetDb() {
  if (db.isOpen()) db.close();
  await db.delete();
  await db.open();
}

describe('Settings page', () => {
  beforeEach(resetDb);
  afterEach(async () => {
    await resetDb();
    db.close();
  });

  it('renders the form without going blank on a fresh database', async () => {
    render(<Settings />, { wrapper: MemoryRouter });

    // Header always renders
    expect(screen.getByRole('heading', { name: labels.settingsTitle })).toBeInTheDocument();

    // The store-name input must populate from settings. This only happens if the
    // liveQuery resolves (i.e. getSettings does NOT throw ReadOnlyError by writing
    // inside the liveQuery context).
    expect(await screen.findByDisplayValue('Latteva')).toBeInTheDocument();
  });
});
