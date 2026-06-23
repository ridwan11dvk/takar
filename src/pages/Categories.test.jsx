import 'fake-indexeddb/auto';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import db from '../db/db.js';
import { labels } from '../utils/labels.js';
import Categories from './Categories.jsx';

async function resetDb() {
  if (db.isOpen()) db.close();
  await db.delete();
  await db.open();
}

describe('Categories page', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterEach(async () => {
    await resetDb();
    db.close();
  });

  it('adds a category without removing the existing category list', async () => {
    render(<Categories />, { wrapper: MemoryRouter });

    await screen.findByText('Dairy');
    fireEvent.change(screen.getAllByLabelText(labels.categoryName)[0], {
      target: { value: 'Bahan kering' },
    });
    fireEvent.click(screen.getAllByText(labels.addCategory)[0]);

    await screen.findByText('Bahan kering');
    expect(screen.getByText('Dairy')).toBeInTheDocument();
    expect(screen.getByText('Kopi')).toBeInTheDocument();
  });

  it('opens edit and delete modals instead of mutating immediately', async () => {
    render(<Categories />, { wrapper: MemoryRouter });

    await screen.findByText('Dairy');
    fireEvent.click(screen.getAllByText(labels.edit)[0]);
    expect(screen.getByText(labels.editCategory)).toBeInTheDocument();

    fireEvent.click(screen.getByText('×'));
    await waitFor(() => expect(screen.queryByText(labels.editCategory)).not.toBeInTheDocument());

    fireEvent.click(screen.getAllByText(labels.delete)[0]);
    expect(screen.getByText(labels.confirmDelete)).toBeInTheDocument();
    expect(screen.getByText(labels.deleteCategoryConfirm)).toBeInTheDocument();
  });
});
